var agent = require('superagent');
var Promise = require('bluebird');
var constants = require('./constants');
var actions = constants.ACTIONS;

/* peers.txt looks like this:
http://peer1.arionum.com
http://1.2.3.4
http://4.3.2.1
 */

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
   var j, x, i;
   for (i = a.length - 1; i > 0; i--) {
     j = Math.floor(Math.random() * (i + 1));
     x = a[i];
     a[i] = a[j];
     a[j] = x;
   }
 }

var PEERS = [];

class PeerCache {
  constructor() {
    this._timer = null;
  }

  getPeers() {
    if (PEERS.length > 0) {
      return new Promise(resolve => { resolve(PEERS); });
    }
    if (this._timer) {
      clearTimeout(this._timer);
    }
    return agent.get("http://api.arionum.com/peers.txt")
      .then(res => {
        var raw = res.text;
        if (!raw) {
          throw new Error('No content in response from arionum api when requesting peers');
        }
        raw = raw.split('\n');
        var work = []
        for (var i=0; i<raw.length; i++) {
          var line = raw[i].trim();
          if (line) {
            work.push(line);
          }
        }
        shuffle(work);
        PEERS = work;

        var clear = function() {
          PEERS = [];
          this._timer = null;
        }
        this._timer = setTimeout(clear, constants.TIMEOUTS.PEER_CACHE);
        return PEERS;
      });
  }

  next() {
    return this.getPeers()
      .then(peers => {
        return peers.pop();
      });
  }

  post(action, data) {
    var payload = {
      coin: 'arionum'
    };
    if (data) {
      payload.data = JSON.stringify(data);
    }

    return this.next()
      .then(peer => {
        console.log('Calling Arionum peer:', peer);
        const ep = peer + constants.URLS.API + '?q=' + action;
        return agent.post(ep)
          .type('form')
          .send(payload)
          .timeout({
            response: constants.TIMEOUTS.RESPONSE,
            deadline: constants.TIMEOUTS.DEADLINE
          })
      });
  }
}

const peerCache = new PeerCache();

function getBalance(account) {
  return peerCache.post(actions.BALANCE, {account: account});
}

function getCurrentBlock(account) {
  return peerCache.post(actions.BLOCK);
}

function getTransaction(tx) {
  return peerCache.post(actions.TRANSACTION, {transaction: tx});
}

function getTransactions(account) {
  return peerCache.post(actions.TRANSACTIONS, {account: account});
}

function getFee(sum) {
  var fee = Math.max(constants.SEND_FEE_MIN, sum * constants.SEND_FEE_RATE);
  return Math.min(constants.SEND_FEE_MAX, fee);
}

function send(fromWallet, toAddress, amountToSend, message) {
  var sum = parseFloat(amountToSend, 10);
  return getBalance(fromWallet.getAddress())
    .then(res => {
      if (res.body) {
        var results = JSON.parse(res.text);
        if (results.status === 'ok') {
          return parseFloat(results.data, 10);
        } else {
          throw new Error('Invalid response', results);
        }
      } else {
        throw new Error('Invalid response', res);
      }
    })
    .then(balance => {
      var fee = getFee(sum);
      var total = sum+fee;
      if (balance < total) {
        console.log('Insufficient balance', {balance, sum, fee, total});
        throw new Error('Insufficient balance');
      }
      var now = new Date();
      var epochSeconds = Math.round(now.getTime() / 1000);
      var info = [
        sum.toFixed(8),
        fee.toFixed(8),
        toAddress,
        message,
        constants.VERSION,
        fromWallet.publicKey,
        epochSeconds
      ].join('-');
      console.log(info);
      var signature = fromWallet.sign(info);
      console.log('sig', signature);
      return peerCache.post(actions.SEND, {
        dst: toAddress,
        val: sum,
        signature: signature,
        public_key: fromWallet.publicKey,
        version: constants.VERSION,
        message: message || '',
        date: epochSeconds
      });
    });
}

module.exports = {
  getBalance: getBalance,
  getFee: getFee,
  getCurrentBlock: getCurrentBlock,
  getTransactions: getTransactions,
  getTransaction: getTransaction,
  peerCache: peerCache,
  send: send,
}
