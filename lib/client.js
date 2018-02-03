'use strict'
var agent = require('superagent');
var Promise = require('bluebird');

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
      return new Promise(resolve => { resolve(this._peers); });
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
        this._timer = setTimeout(clear, 1000*60*5); // check every five minutes
        return PEERS;
      });
  }

  next() {
    return this.getPeers()
      .then(peers => {
        return peers.pop();
      });
  }

  post(url, data) {
    var payload = {
      coin: 'arionum'
    };
    if (data) {
      payload.data = JSON.stringify(data);
    }

    return this.next()
      .then(peer => {
        console.log('Calling Arionum peer:', peer);
        const ep = peer + url;
        return agent.post(ep)
          .type('form')
          .send(payload)
          .timeout({
            response: 1000 * 15,  // Wait 15 seconds for the server to start sending,
            deadline: 5 * 60 * 1000, // but allow 5 minutes for the file to finish loading.
          })
      });
  }
}

const peerCache = new PeerCache();

function getBalance(account) {
  return peerCache.post('/api.php?q=getPendingBalance', {account: account});
}

function getCurrentBlock(account) {
  return peerCache.post('/api.php?q=currentBlock');
}

function getTransactions(account) {
  return peerCache.post('/api.php?q=getTransactions', {account: account});
}

module.exports = {
  getBalance: getBalance,
  getCurrentBlock: getCurrentBlock,
  getTransactions: getTransactions,
  peerCache: peerCache
}
