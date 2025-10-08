require('dotenv').config({ path: '.env.local' });
const encryptionKey = process.env.ESCROW_ENCRYPTION_KEY;

console.log('🔑 Encryption Key Test:');
console.log('Key present:', encryptionKey ? '✅ YES' : '❌ NO');
if (encryptionKey) {
  console.log('Key length:', encryptionKey.length, 'characters');
  console.log('Key value (first 10 chars):', encryptionKey.substring(0, 10) + '...');
  console.log('Matches expected:', encryptionKey === 'eb1ffe5ea937846d46855fb5740d6f33' ? '✅ YES' : '❌ NO');
}
