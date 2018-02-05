var EC = require('elliptic').ec
var ec = new EC('secp256k1');
var baseX = require('base-x');
var KeyEncoder = require('key-encoder');
var sha512 = require('sha512');
var crypto = require('crypto');
var randomBytes = require('random-bytes');
var BigInteger = require('bigi');
var bitcoin = require('bitcoinjs-lib');

var BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var Base58 = baseX(BASE58);
var keyEncoder = new KeyEncoder('secp256k1');

function sha256(msg, format) {
	var enc = format ? format : 'base64';
	if (enc === 'raw') {
		enc = null;
	}
	return crypto.createHash('sha256').update(msg).digest(enc);
}

function encryptWithIv(text, password, iv) {
  var pw = sha256(password, 'raw');
  var cipher = crypto.createCipheriv('aes-256-cbc', pw, iv)
  var crypted = cipher.update(text, 'utf8', 'base64')
  crypted += cipher.final('base64');
  var combined = Buffer.concat([iv, Buffer.from(crypted)]);
  return combined.toString('base64');
}

function decryptWithIv(text, password) {
  var raw = Buffer(text, 'base64');
  var iv = raw.slice(0,16);
  var remain = raw.slice(16);
  var text = raw.slice(16).toString('utf8');
  var pw = sha256(password, 'raw');
  var decipher = crypto.createDecipheriv('aes-256-cbc', pw, iv)
  var dec = decipher.update(text, 'base64', 'utf8')
  dec += decipher.final('utf8');
  return dec;
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

function looksEncrypted(work) {
	return work.substr(0,8) !== 'arionum:';
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

function decodeKeypair(encoded, pw) {
	if (looksEncrypted(encoded)) {
		if (!pw) {
			throw new Error('Cannot decrypt without valid password');
		}
		try {
			var work = decryptWithIv(encoded, pw);
			return decodeKeypair(work, null);
		}	catch (e) {
			throw new Error('Cannot decrypt without valid password');
		}
	}
  var parts = encoded.split(':');
  if (parts.length !== 3 || parts[0] !== 'arionum') {
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
	var keypair = key ? key : ec.genKeyPair();

  var priKey = keypair.getPrivate();
  var pubKey = keypair.getPublic();
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
		key: keypair
  }
}

function encryptAro(aro, pw) {
	return randomBytes(16)
		.then(iv => {
			return encryptWithIv(aro, pw, iv);
		});
}


function getAddress(hash) {
  var work = hash;
  for(var i=0; i<9; i++) {
    work=sha512(work);
  }
	return Base58.encode(work);
}

function getSigningKeyFromEC(key) {
	var pkBuf = key.getPrivate().toBuffer();
	var pkBufI = BigInteger.fromBuffer(pkBuf);
	return new bitcoin.ECPair(pkBufI);
}

function sign(key, msg) {
	var ecKey = getSigningKeyFromEC(key);
	var hash = crypto.createHash('sha256').update(msg).digest();
	var sig = ecKey.sign(hash);
	return Base58.encode(sig.toDER());
}

function verify(key, msg, rawsig) {
	var ecKey = getSigningKeyFromEC(key);
	var sigDER = Base58.decode(rawsig);
	var sig = bitcoin.ECSignature.fromDER(sigDER);
	var hash = crypto.createHash('sha256').update(msg).digest();
	return ecKey.verify(hash, sig);
}

module.exports = {
	looksEncrypted,
	encryptWithIv,
	decryptWithIv,
	encryptAro,
	sha256,
	splitString,
	pem2coin,
	coin2pem,
	decodeKeypair,
	encodeKeypair,
	getAddress,
	sign,
	verify
};
