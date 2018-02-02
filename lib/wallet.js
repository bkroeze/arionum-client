var utils = require('./utils');

class AroWallet {
  constructor(key) {
		var data;
    if (key) {
			data = utils.decodeKeypair(key);
    } else {
			data = utils.encodeKeypair(key);
    }

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
