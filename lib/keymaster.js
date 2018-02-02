var EC = require('elliptic').ec
var ec = new EC('secp256k1');
var baseX = require('base-x');
var KeyEncoder = require('key-encoder');
var R = require('ramda');
var sha512 = require('sha512');
var crypto = require('crypto');

var BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var Base58 = baseX(BASE58);
var isString = R.is(String);
var keyEncoder = new KeyEncoder('secp256k1');


function sha256(msg) {
	return crypto.createHash('sha256').update(msg).digest('base64');
}

/**
 * Split a string into chunks of the given size
 * @param  {String} string is the String to split
 * @param  {Number} size is the size you of the cuts
 * @return {Array} an Array with the strings
 */
function splitString (string, size) {
	var re = new RegExp('.{1,' + size + '}', 'g');
	return string.match(re);
}

function pem2coin(pem) {
  var key64 = pem.replace(/^-.*\n?/mg, '').replace(/\n/mg, '');
  var buf = Buffer.from(key64, 'base64');
  return Base58.encode(buf);
}

function coin2pem(coin, private) {
	var buf = Buffer.from(Base58.decode(coin));
	var key64 = buf.toString('base64');
  var formattedKey = splitString(key64, 64).join('\n');

  if (private) {
    return `-----BEGIN EC PRIVATE KEY-----\n${formattedKey}\n-----END EC PRIVATE KEY-----\n`
  }
  return `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----\n`;
}

function decodeKeypair(encoded) {
  var parts = encoded.split(':');
  if (parts.length !== 3) {
    throw new TypeError('Invalid encoded key, expecting arionum format');
  }
  var pri58 = parts[1];
	var pub58 = parts[2];
	var priPem = coin2pem(pri58, true);
	var hex = keyEncoder.encodePrivate(priPem, 'pem', 'raw')
	var key = ec.keyFromPrivate(hex, 'hex');

  return {
		pem: priPem,
		encoded: encoded,
		privateCoin: pri58,
		publicCoin: pub58,
		key: key
	};
}

function encodeKeypair(key) {
  var priKey = key.getPrivate();
  var pubKey = key.getPublic();
	var priHex = priKey.toJSON();
  var priPem = keyEncoder.encodePrivate(priKey.toJSON(), 'raw', 'pem');
  var pubPem = keyEncoder.encodePublic(pubKey.encode('hex'), 'raw', 'pem');
	var pri58 = pem2coin(priPem);
	var pub58 = pem2coin(pubPem);

  return {
		pem: priPem,
    encoded: `arionum:${pri58}:${pub58}`,
    privateCoin: pri58,
    publicCoin: pub58,
		key: key
  }
}

function getAddress(hash) {
  var work = hash;
  for(var i=0; i<9; i++) {
    work=sha512(work);
  }
	return Base58.encode(work);
}

class AroWallet {
  constructor(key) {
		var data;
    if (isString(key)) {
			data = decodeKeypair(key);
    } else {
			var keypair = key ? key : ec.genKeyPair();
			data = encodeKeypair(keypair);
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
      this._address = getAddress(this.publicKey);
    }
    return this._address;
  }

	sign(msg) {
		var hash = sha256(msg)
		var sig = this.keypair.sign(hash)
		return Base58.encode(sig.toDER());
	}

	validate() {
		return this.keypair.validate();
	}

	verify(msg, rawsig) {
		var sig = Base58.decode(rawsig);
		var hash = sha256(msg);
		return this.keypair.verify(hash, sig);
	}
}

AroWallet.from = function from(aro) {
  var key = decodeKeypair(aro);
  return new AroWallet(key);
}

module.exports = {
  encodeKeypair: encodeKeypair,
  decodeKeypair: decodeKeypair,
  pem2coin: pem2coin,
  coin2pem: coin2pem,
  AroWallet: AroWallet
}
