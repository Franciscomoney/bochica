const { decodeAddress, encodeAddress } = require('@polkadot/util-crypto');
const { u8aToHex } = require('@polkadot/util');

// User's addresses
const assetHubAddr = '5EvxAXBfCK5LGmp7ragjwGSvwmba5bchd3c7ZPLjLpXCdFDx';
const paseoAddr = '13sFJrSj46LoiJpdpDjk5RH5oPbDmuAqhYLbigL5tuYiok8n';
const derivedAddr = '5GVwsWnw3gQwjbyN98ASKThjinaBocTQjiUVKWVkfxZv8LrX';

console.log('Asset Hub address:', assetHubAddr);
console.log('Public key:', u8aToHex(decodeAddress(assetHubAddr)));
console.log('');

console.log('Paseo address:', paseoAddr);
console.log('Public key:', u8aToHex(decodeAddress(paseoAddr)));
console.log('');

console.log('Derived //1 address:', derivedAddr);
console.log('Public key:', u8aToHex(decodeAddress(derivedAddr)));
console.log('');

// Check if Paseo address encodes to Asset Hub
const paseoAsAssetHub = encodeAddress(decodeAddress(paseoAddr), 0);
console.log('Paseo addr re-encoded to Asset Hub (SS58=0):', paseoAsAssetHub);
console.log('Matches Asset Hub addr?', paseoAsAssetHub === assetHubAddr);

