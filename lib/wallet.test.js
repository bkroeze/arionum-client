import test from 'ava';
import {AroWallet} from './wallet'

test('Wallet builds with no args', t => {
	const w = new AroWallet();
  t.is(w.validate().result, true);
});

test('Wallet builds with an unencrypted wallet string', t => {
	const w = new AroWallet();
	const aro = w.encoded;
	const w2 = new AroWallet(aro);
	t.is(w2.validate().result, true);
	t.is(w.equals(w2), true);
	t.is(w.getAddress().length > 1, true);
	t.is(w.getAddress(), w2.getAddress());
});

test('Wallet signs and validates', t => {
	const w = new AroWallet();
	const sig = w.sign('testy');
	t.truthy(w);
	t.is(w.verify('testy', sig), true);
});

test('Wallet can export an unencrypted ARO format', async t => {
	const w = new AroWallet();
	const aro = await w.getWalletFormat();
	t.truthy(aro);
	t.is(aro.substr(0,8), 'arionum:');
});

test('Wallet errors if encrypted and no pw given when exporting aro', t => {
	const w = new AroWallet(null, 'test');
	t.throws(w.getWalletFormat, TypeError);
});

test('Encrypted Wallet gets encrypted aro', async t => {
	const w = new AroWallet(null, 'test');
	const aro = await w.getWalletFormat('test');
	t.truthy(aro);
	t.is(aro.substr(0, 8) === 'arionum:', false);
});
