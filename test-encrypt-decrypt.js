const { encryptSeed, decryptSeed } = require('./src/utils/escrow.js');

process.env.ESCROW_ENCRYPTION_KEY = 'eb1ffe5ea937846d46855fb5740d6f33';

const originalSeed = 'shoot nest corn gym heart monster sad excuse actress auto end copy';

console.log('Original seed:', originalSeed);

const encrypted = encryptSeed(originalSeed);
console.log('\nEncrypted:', encrypted);

try {
  const decrypted = decryptSeed(encrypted);
  console.log('\nDecrypted:', decrypted);
  
  if (decrypted === originalSeed) {
    console.log('\n✅ Encryption/Decryption works!');
  } else {
    console.log('\n❌ Mismatch!');
  }
} catch (error) {
  console.error('\n❌ Decryption failed:', error.message);
}

// Now test with the actual encrypted value from database
const dbEncrypted = 'ffaf7d30676b47cd153b7eacf723be5e:18749c6aef28f1dd6a1efa7373e8a2d36326b27cb3e47e34e0cb378243c9095746e18051055624bd80ff890368387532b4dbc67e1fd90a06ecf5aa323530acd29f2f03cc36748461456b69e7394bbf80';

console.log('\n\nTesting database value...');
console.log('DB Encrypted:', dbEncrypted);

try {
  const decrypted = decryptSeed(dbEncrypted);
  console.log('DB Decrypted:', decrypted);
  
  if (decrypted === originalSeed) {
    console.log('\n✅ Database value decrypts correctly!');
  } else {
    console.log('\n❌ Database value gives wrong seed!');
    console.log('Expected:', originalSeed);
    console.log('Got:', decrypted);
  }
} catch (error) {
  console.error('\n❌ Database decryption failed:', error.message);
}
