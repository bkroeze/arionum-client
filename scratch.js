var EC = require('elliptic').ec
var ec = new EC('secp256k1');
var km = require('./lib/keymaster');
var baseX = require('base-x');
var BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var Base58 = baseX(BASE58);

var w = new km.AroWallet();
console.log(w);
console.log('----\n\n');
var w2 = new km.AroWallet(w.encoded);
console.log(w2);
console.log('eq', w.equals(w2));
// var sig = w.sign('test');
// console.log(sig);
// console.log(w.verify('test', sig));
// console.log(w.validate());
// var key = ec.genKeyPair();
// console.log(key.validate());
// console.log(key);
// console.log('----\n\n');
//

//var hex = key.getPrivate().toJSON();
// console.log('hex', hex);
// // var k2 = ec.keyFromPrivate(hex);
// // console.log(k2.validate());
// // console.log(k2);
// // console.log('----\n\n');
//
//
// var enc = km.encodeKeypair(key);
// console.log(enc);
// console.log('----\n\n');
// var dec = km.decodeKeypair(enc.encoded);
// console.log(dec);
// console.log('----\n\n');
// console.log(dec.key.validate());
// console.log(dec.key);



// var w = new km.AroWallet();
// var priv64 = km.coin2base64(w.privateKey);
// var priKey = ec.keyFromPrivate(priv64, 'base64');
// console.log(priKey);
//
// var start = "round-trip!";
//
// var buf = Buffer.from(start);
// var b64 = Base64.encode(buf);
//
// console.log(`b64: ${b64}`);
//
// buf = Buffer.from(Base64.atob(b64));
// console.log(buf.toString());
//
// var b58 = Base58.encode(buf);
// console.log('b58', b58);
//
// buf = Base58.decode(b58);
// console.log(buf.toString());

// var w = new km.AroWallet();
// var priv64 = km.coin2base64(w.privateKey);
// var priKey = ec.keyFromPrivate(priv64, 'base64');
// console.log(priKey);
//console.log('pk\n', w.privateKey, '\nencoded\n', w.encoded);
//console.log('PEM\n', w.pem);
//console.log('coin2pem\n', km.coin2pem(w.privateKey, true));


//console.log('decode\n', km.decodeKeypair(w.encoded));
//
//
// var buf = Buffer.from(Base58.decode(w.privateKey));
// var key64 = Base64.encode(buf.toString());
// console.log(key64);
// console.log(km.coin2pem(w.privateKey));

// var pem = `-----BEGIN EC PRIVATE KEY-----
// MHQCAQEEIG5ld15zpQsgRLrO5j704H1j1pxJy3NCvnEYQpi8ZzIAoAcGBSuBBAAK
// oUQDQgAEz3h2msrl2qrAojZjjyPNQW0G1WwQDg0ZtTuBscBQSmhh02K9hwx5GGNF
// 5Kx7A3ZSupfrCVi69Uz0aPh4Bygcug==
// -----END EC PRIVATE KEY-----
// `;
//
// var key64 = pem.replace(/^-.*\n?/mg, '').replace(/\n/mg, '');
// var buf = Buffer.from(Base64.decode(key64), 'utf-8');
// var coin = Base58.encode(buf);
//
// var buf2 = Buffer.from(Base58.decode(coin));
// var key64 = Base64.encode(buf2.toString());
//
// console.log([pem,key64,buf,coin,buf2,key64].join('\n\n'));
