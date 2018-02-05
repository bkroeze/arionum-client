var Promise = require('bluebird');
var utils = require('./utils');

/**
 * Simple wallet, using the crypto methods defined in utils.
 * @param {string} key - Base58 Encoded ARO keypair.
 * @param {string} pw - optional password to use for decrypting the key
 */
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

  /**
   * Gets the accound address for this wallet.
   * @return {string} account address
   */
  getAddress() {
    if (!this._address) {
      this._address = utils.getAddress(this.publicKey);
    }
    return this._address;
  }

  /**
   * Gets the keyfile data for the wallet.  If this wallet is encrypted,
   * it needs a password to do this.
   * @return {Promise} resolving to a string of the keyfile data.
   */
  getWalletFormat(pw) {
    if (this.encrypted) {
      if (!pw) {
        throw new TypeError('Password required for encryption of wallet');
      }
      return utils.encryptAro(this.encoded, pw);
    }
    return new Promise(resolve => resolve(this.encoded));
  }

  /**
   * Signs the message.
   * @param {string} message to sign
   * @return {string} Signature
   */
	sign(msg) {
    return utils.sign(this.keypair, msg);
	}

  /**
   * Validates that the key is valid
   * @return {boolean} true if valid
   */
	validate() {
		return this.keypair.validate();
	}

  /**
   * Verifies that this key made the signature for the message.
   * @param  {string} msg    test that was signed
   * @param  {string} rawsig signature in Base58 format
   * @return {boolean} true if it is a valid signature
   */
	verify(msg, rawsig) {
    return utils.verify(this.keypair, msg, rawsig);
	}
}

module.exports = {
  AroWallet: AroWallet
}
