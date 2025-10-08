// Simulate exactly what happens in the app
process.env.ESCROW_ENCRYPTION_KEY = 'eb1ffe5ea937846d46855fb5740d6f33';

const getEncryptionKey = () => {
  const ENCRYPTION_KEY = process.env.ESCROW_ENCRYPTION_KEY || 'change-this-in-production-32-chars!!';
  const key = ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32);
  return Buffer.from(key, 'utf8');
};

console.log('Environment key:', process.env.ESCROW_ENCRYPTION_KEY);
console.log('Processed key (hex):', getEncryptionKey().toString('hex'));
console.log('Processed key (utf8):', getEncryptionKey().toString('utf8'));
console.log('Key length:', getEncryptionKey().length);
