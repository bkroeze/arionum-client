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
var wallet = require('./lib/wallet');

// var openssl = require('openssl-wrapper');
// const opensslAsync = Promise.promisify(openssl.exec);

function logit(result) {
  console.log(result.toString());
  return result;
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
  var pw;
  var pk;
  prompter.getConfirmedPassword()
    .then(confirmed => {
      pw = confirmed;
      return wallet.createKeys(pw);
    .then(pem => {
      console.log(pem);
    });
}

function accountOptions(yargs) {
  return yargs
    .option('account', {alias: 'a', type: 'string', default: '0xC249736C5e126d604490F22d569F4EC453432902'})
    .demandOption('account', 'Please provide account');
}

function createOptions(yargs) {
  return yargs
    .option('encrypt', {type: 'boolean', default: true})
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
  .showHelpOnFail(false, 'Specify --help for available options')
  .demandCommand(1, USAGE + '\n\nI need at least one command, such as "balance"')
  .help()
  .parse();
