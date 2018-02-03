var Promise = require('bluebird');
var utils = require('./utils');

class AroWallet {
  constructor(key, pw) {
		var data;
    if (key) {
			data = utils.decodeKeypair(key, pw);
    } else {
			data = utils.encodeKeypair(key);
    }

    this.encrypted = !!pw;
		this.keypair = data.key;
		this.pem = data.pem;
    this.publicKey = data.publicCoin;
    this.privateKey = data.privateCoin;
    this.encoded = data.encoded;
    this._address = null;
  }

	equals(other) {
		return other && other.privateKey === this.privateKey;
	}

  getAddress() {
    if (!this._address) {
      this._address = utils.getAddress(this.publicKey);
    }
    return this._address;
  }

  getWalletFormat(pw) {
    if (this.encrypted) {
      if (!pw) {
        throw new TypeError('Password required for encryption of wallet');
      }
      return utils.encryptAro(this.encoded, pw);
    }
    return new Promise(resolve => resolve(this.encoded));
  }

	sign(msg) {
    return utils.sign(this.keypair, msg);
	}

	validate() {
		return this.keypair.validate();
	}

	verify(msg, rawsig) {
    return utils.verify(this.keypair, msg, rawsig);
	}
}

module.exports = {
  AroWallet: AroWallet
}
