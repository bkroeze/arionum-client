#! /usr/bin/env node
/*
The MIT License (MIT)
Copyright (c) 2018 Bruce Kroeze

https://www.github.com/bkroeze/arionum-client

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
OR OTHER DEALINGS IN THE SOFTWARE.
*/

var Promise = require('bluebird');
var fs = require('graceful-fs');
var Table = require('easy-table');

var prompter = require('./lib/prompter');
var AroWallet = require('./lib/wallet').AroWallet;
var utils = require('./lib/utils');
var client = require('./lib/client');

function noOverwrites(fname) {
  if (fname && fs.existsSync(fname)) {
    console.log(`I will not overwrite "${fname}", please remove it before trying again`);
    process.exit(1);
  }
}

function writeWalletFile(wallet, fname, pw) {
  return wallet.getWalletFormat(pw)
    .then(aro => {
      fs.writeFileSync(fname, aro);
      return true;
    });
}

function getWallet(args) {
  return walletFromFile(args.wallet, args.password)
    .then(wallet => {
      if (!wallet) {
        console.log('Could not load wallet', args.wallet);
        throw new Error('Wallet load error');
      }
      if (!wallet.validate().result) {
        console.log('Invalid wallet file, could not validate');
        throw new Error('Wallet validation error');
      }
      return wallet;
    });
}

function walletFromFile(fname, pw) {
  var aro = fs.readFileSync(fname).toString();
  if (utils.looksEncrypted(aro)) {
    return prompter.getPassword(pw, 'Please enter the password for this encrypted wallet')
      .then(entered => {
        return new AroWallet(aro, entered);
      });
  } else {
    return new Promise((resolve, reject) => {
      try {
        resolve(new AroWallet(aro));
      } catch (e) {
        reject(e);
      }
    });
  }
}

const USAGE = 'Query arionum account\nUsage: arionum [command]';

function balanceCommand(args) {
  getWallet(args)
    .then(wallet => {
      return client.getBalance(wallet.getAddress());
    })
    .then(res => {
      if (res.body) {
        var results = JSON.parse(res.text);
        if (results.status === 'ok') {
          console.log("Balance: ", results.data);
          process.exit(0);
        }
      }
      console.log("Error getting balance", res.text);
      process.exit(0);
    })
    .catch(e => {
      console.log(e);
      process.exit(1);
    });
}

function blockCommand(args) {
  return client.getCurrentBlock()
    .then(res => {
      if (res.body) {
        var results = JSON.parse(res.text);
        if (results.status === 'ok') {
          console.log("Block Information");
          var table = new Table();
          Object.keys(results.data).forEach(key => {
            table.cell("Field", key);
            table.cell("Value", results.data[key]);
            table.newRow();
          });
          console.log(table.toString());
          process.exit(0);
        }
      }
      console.log("Error getting block data", res.text);
      process.exit(0);
    })
    .catch(e => {
      console.log(e);
      process.exit(1);
    });
}

function createCommand(args) {
  noOverwrites(args.wallet);
  var wallet;
  if (args.encrypt) {
    var password = prompter.getConfirmedPassword(args.password)
      .then(password => {
        wallet = new AroWallet(null, password);
        writeWalletFile(wallet, args.wallet, password)
          .then(() => {
            console.log('Wrote encrypted wallet to: ', args.wallet);
            process.exit(0);
          });
      });
  } else {
    wallet = new AroWallet();
    writeWalletFile(wallet, args.wallet, null)
      .then(() => {
        console.log('Wrote wallet to: ', args.wallet);
        process.exit(0);
      });
  }
}

function decryptCommand(args) {
  noOverwrites(args.outfile);
  getWallet(args)
    .then(wallet => {
      if (args.outfile) {
        var decWallet = new AroWallet(wallet.encoded, null);
        writeWalletFile(decWallet, args.outfile, null)
          .then(() => {
            console.log('Wrote plaintext wallet to: ', args.outfile);
            process.exit(0);
          });
      } else {
        console.log(wallet.encoded);
        process.exit(0);
      }
    })
    .catch(e => {
      console.log('Could not decrypt wallet', e);
      process.exit(1);
    });
}

function encryptCommand(args) {
  noOverwrites(args.outfile);
  var currWallet;
  getWallet(args)
    .then(wallet => {
      currWallet = wallet;
      return prompter.getConfirmedPassword(args.newpassword, 'Please enter the new password for the wallet');
    })
    .then(password => {
      var encWallet = new AroWallet(currWallet.encoded, password);
      if (args.outfile) {
        writeWalletFile(encWallet, args.outfile, password)
          .then(() => {
            console.log('Wrote encrypted wallet to: ', args.outfile);
            process.exit(0);
          });
      } else {
        encWallet.getWalletFormat(password)
          .then(aro => {
            console.log(aro);
            process.exit(0);
          });
      }
    })
    .catch(e => {
      console.log('Could not decrypt wallet', e);
      process.exit(1);
    });
}

function infoCommand(args) {
  getWallet(args)
    .then(wallet => {
      console.log('Address:', wallet.getAddress());
      console.log('Public Key:', wallet.publicKey);
      console.log('Private Key:', wallet.privateKey);
      process.exit(0);
    })
    .catch(e => {
      console.log('Could not decrypt wallet');
      process.exit(1);
    });
}

function sendCommand(args) {
  return getWallet(args)
    .then(wallet => {
      return client.send(wallet, args.to, args.amount, args.message);
    })
    .then(res => {
      if (res.body) {
        var results = JSON.parse(res.text);
        if (results.status === 'ok') {
          console.log("Transaction sent with id:", results.data);
          process.exit(0);
        }
      }
      console.log("Error sending", res.text);
      process.exit(0);
    })
    .catch(e => {
      console.log(e);
      process.exit(1);
    });
}

function signCommand(args) {
  getWallet(args)
    .then(wallet => {
      console.log(wallet.sign(args.text));
      process.exit(0);
    })
    .catch(e => {
      console.log('Could not decrypt wallet');
      process.exit(1);
    });
}

function transactionCommand(args) {
  return client.getTransaction(args.tx)
    .then(res => {
      if (res.body) {
        var results = JSON.parse(res.text);
        if (results.status === 'ok') {
          console.log("Transaction Details");
          var table = new Table();
          Object.keys(results.data).forEach(key => {
            table.cell("Field", key);
            table.cell("Value", results.data[key]);
            table.newRow();
          });
          console.log(table.toString());
          process.exit(0);
        }
      }
      console.log("Error getting transactions", res.text);
      process.exit(0);
    })
    .catch(e => {
      console.log(e);
      process.exit(1);
    });
}


function transactionsCommand(args) {
  getWallet(args)
    .then(wallet => {
      return client.getTransactions(wallet.getAddress());
    })
    .then(res => {
      if (res.body) {
        var results = JSON.parse(res.text);
        if (results.status === 'ok') {
          var table = new Table();
          console.log(results.data[0]);
          results.data.forEach(line => {
            var date = new Date(line.date * 1000);
            table.cell('Date', date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
            table.cell('ID', line.id);
            table.cell('To', line.dst);
            table.cell('Type', line.type);
            table.cell('Amount', line.val);
            table.cell('Fee', line.fee);
            table.newRow();
          });
          console.log(table.toString());
          process.exit(0);
        }
      }
      console.log("Error getting transactions", res.text);
      process.exit(0);
    })
    .catch(e => {
      console.log(e);
      process.exit(1);
    });
}

function verifyCommand(args) {
  getWallet(args)
    .then(wallet => {
      if (wallet.verify(args.text, args.signature)) {
        console.log('Signature valid');
      } else {
        console.log('Bad Signature');
      }
      process.exit(0);
    })
    .catch(e => {
      console.log('Could not decrypt wallet');
      process.exit(1);
    });
}

function createOptions(yargs) {
  return yargs
    .option('encrypt', {type: 'boolean', default: true})
    .option('password', {type: 'string', desc: 'Password for encrypted wallet, you will be prompted for it if needed and not given.'})
    .option('wallet', {type: 'string', default: 'wallet.aro'});
}

function decryptOptions(yargs) {
  return walletOptions(yargs)
    .option('outfile', {type: 'string', desc: 'Destination file, defaulting to stdout if not given'});
}

function encryptOptions(yargs) {
  return walletOptions(yargs)
    .option('newpassword', {type: 'string', desc: 'Password for newly encrypted wallet, you will be prompted for it if not given.'})
    .option('outfile', {type: 'string', desc: 'Destination file, defaulting to stdout if not given'});
}

function sendOptions(yargs) {
  return walletOptions(yargs)
    .positional('amount', {type: 'number', desc: 'Amount to send'})
    .positional('to', {type: 'string', desc: 'Destination address for funds'})
    .option('message', {type: 'string', desc: 'Optional message to send', default: ''})
    .demandOption(['to', 'amount'], 'Please enter the destination and amount of funds to send');
}

function signOptions(yargs) {
  return walletOptions(yargs)
    .positional('text', {desc: 'Text to sign'})
    .demandOption(['text'], 'Please provide text to sign');
}

function transactionOptions(yargs) {
  return yargs
    .positional('tx', {desc: 'Transaction id'})
    .demandOption(['tx'], 'Please provide a transaction id');
}

function verifyOptions(yargs) {
  return walletOptions(yargs)
    .positional('text', {desc: 'Text to sign'})
    .positional('signature', {desc: 'Signature to verify'})
    .demandOption(['text', 'signature'], 'Please provide both text to verify and a signature');
}

function walletOptions(yargs) {
  return yargs
    .option('password', {type: 'string', desc: 'Password for encrypted wallet, you will be prompted for it if needed and not given.'})
    .option('wallet', {type: 'string', desc: 'wallet filename', default: 'wallet.aro'});
}

var args = require('yargs')
  .usage(USAGE)
  .command({
    command: 'balance',
    desc: 'Get balance for Arionum account',
    builder: walletOptions,
    handler: balanceCommand
  })
  .command({
    command: 'block',
    desc: 'Get current block data',
    handler: blockCommand
  })
  .command({
    command: 'create',
    desc: 'Create a new Arionum wallet',
    builder: createOptions,
    handler: createCommand
  })
  .command({
    command: 'decrypt',
    desc: 'Decrypt the wallet and optionally write unencrypted wallet file',
    builder: decryptOptions,
    handler: decryptCommand
  })
  .command({
    command: 'encrypt',
    desc: 'Encrypt the wallet with a password and optionally write to new wallet file',
    builder: encryptOptions,
    handler: encryptCommand
  })
  .command({
    command: 'info',
    desc: 'Get wallet information',
    builder: walletOptions,
    handler: infoCommand
  })
  .command({
    command: 'send <amount> <to>',
    desc: 'Send funds',
    builder: sendOptions,
    handler: sendCommand
  })
  .command({
    command: 'sign <text>',
    desc: 'Sign text',
    builder: signOptions,
    handler: signCommand
  })
  .command({
    command: 'transaction <tx>',
    desc: 'Get details for a transaction',
    builder: transactionOptions,
    handler: transactionCommand
  })
  .command({
    command: 'transactions',
    desc: 'Get transactions for Arionum account',
    builder: walletOptions,
    handler: transactionsCommand
  })
  .command({
    command: 'verify <text> <signature>',
    desc: 'Verify a signature',
    builder: verifyOptions,
    handler: verifyCommand
  })
  .showHelpOnFail(false, 'Specify --help for available options')
  .demandCommand(1, USAGE + '\n\nI need at least one command, such as "balance"')
  .help()
  .parse();
