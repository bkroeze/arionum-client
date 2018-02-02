import test from 'ava';
import utils from './utils';

test('looksEncrypted', t => {
  t.falsy(utils.looksEncrypted('arionum:foo:bar'));
  t.truthy(utils.looksEncrypted('asdfasdasdfa'));
});

test('Round-trip encryption', t => {
  var iv = Buffer(16);
  const crypted = utils.encryptWithIv('testing', 'foo', iv);
  t.is(utils.decryptWithIv(crypted, 'foo'), 'testing');
});
