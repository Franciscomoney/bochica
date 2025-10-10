const { decodeAddress, encodeAddress } = require('@polkadot/util-crypto');

const paseoAddr = '13sFJrSj46LoiJpdpDjk5RH5oPbDmuAqhYLbigL5tuYiok8n';
const publicKey = decodeAddress(paseoAddr);

console.log('Testing which SS58 format produces 13s... prefix:\n');

// Test various SS58 formats
for (let i = 0; i < 100; i++) {
  const encoded = encodeAddress(publicKey, i);
  if (encoded === paseoAddr) {
    console.log(`✅ FOUND! SS58 format ${i} produces: ${encoded}`);
    break;
  }
  if (encoded.startsWith('13')) {
    console.log(`SS58 format ${i}: ${encoded}`);
  }
}

