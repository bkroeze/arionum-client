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
var prompter = require('./lib/prompter');
var AroWallet = require('./lib/wallet').AroWallet;
var utils = require('./lib/utils');

function writeWalletFile(wallet, fname) {
  fs.writeFileSync(fname, wallet.getWalletFormat());
}

function walletFromFile(fname, pw) {
  return new Promise((resolve, reject) => {
    var aro = fs.readFileSync(fname).toString();
    if (utils.looksEncrypted(aro) && !pw) {
      console.log('need pass')
      prompter.getPassword().then(entered => {
        try {
          var wallet = new AroWallet(aro, entered);
          resolve(wallet);
        } catch (e) {
          reject(e);
        }
      });
    } else {
      try {
        var wallet = new AroWallet(aro, pw);
        resolve(wallet);
      } catch (e) {
        reject(e);
      }
    }
  });
}

const USAGE = 'Query arionum account\nUsage: arionum [command]';

function balanceCommand(args) {
  console.log('Not yet implemented');
}

function createCommand(args) {
  if (fs.existsSync(args.file)) {
    console.log('I will not overwrite ' + args.file + ' please move or rename');
    process.exit(1);
  }
  var wallet;
  if (args.encrypt) {
    var password = args.password;
    if (!password) {
      prompter.getConfirmedPassword()
        .then(confirmed => {
          password = confirmed;
          return password;
        });
    }
    wallet = new AroWallet(null, password);
  } else {
    wallet = new AroWallet();
  }
  writeWalletFile(wallet, args.file);
  console.log('Wrote wallet to: ', args.file);
  process.exit(0);
}

function infoCommand(args) {
  walletFromFile(args.file, args.password)
    .then(wallet => {
      if (!wallet) {
        console.log('Could not load wallet', args.file);
        process.exit(1);
      }
      if (!wallet.validate().result) {
        console.log('Invalid wallet file, could not validate');
        process.exit(1);
      }
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

function accountOptions(yargs) {
  return yargs
    .option('account', {alias: 'a', type: 'string'});
}

function createOptions(yargs) {
  return yargs
    .option('encrypt', {type: 'boolean', default: true})
    .option('password', {type: 'string', desc: 'Password for encrypted wallet, you will be prompted for it if needed and not given.'})
    .option('file', {type: 'string', default: 'wallet.aro'});
}

function infoOptions(yargs) {
  return yargs
    .option('password', {type: 'string', desc: 'Password for encrypted wallet, you will be prompted for it if needed and not given.'})
    .option('file', {type: 'string', default: 'wallet.aro'});
}

var args = require('yargs')
  .usage(USAGE)
  .command({
    command: 'balance',
    desc: 'Get balance for Arionum account',
    builder: accountOptions,
    handler: balanceCommand
  })
  .command({
    command: 'create',
    desc: 'Create a new Arionum wallet',
    builder: createOptions,
    handler: createCommand
  })
  .command({
    command: 'info',
    desc: 'Get wallet information',
    builder: infoOptions,
    handler: infoCommand
  })
  .showHelpOnFail(false, 'Specify --help for available options')
  .demandCommand(1, USAGE + '\n\nI need at least one command, such as "balance"')
  .help()
  .parse();
