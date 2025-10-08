const { Keyring } = require('@polkadot/api');
const { mnemonicGenerate, cryptoWaitReady } = require('@polkadot/util-crypto');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ESCROW_ENCRYPTION_KEY || 'change-this-in-production-32-chars!!';

const getEncryptionKey = () => {
  const key = ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32);
  const buffer = Buffer.from(key, 'utf8');
  console.log('[ESCROW KEY DEBUG]', {
    envKey: ENCRYPTION_KEY,
    envKeyLength: ENCRYPTION_KEY.length,
    processedKey: key,
    processedKeyLength: key.length,
    bufferHex: buffer.toString('hex'),
    bufferLength: buffer.length
  });
  return buffer;
};

function encryptSeed(seed) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  let encrypted = cipher.update(seed, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptSeed(encryptedSeed) {
  try {
    const parts = encryptedSeed.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted seed format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Seed decryption error:', error.message);
    throw new Error('Failed to decrypt seed phrase');
  }
}

async function generateEscrowWallet() {
  try {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
    const mnemonic = mnemonicGenerate();
    const account = keyring.addFromMnemonic(mnemonic);
    
    return {
      address: account.address,
      seed: mnemonic,
      seedEncrypted: encryptSeed(mnemonic)
    };
  } catch (error) {
    console.error('Wallet generation error:', error.message);
    throw new Error('Failed to generate escrow wallet');
  }
}

async function getEscrowAccount(encryptedSeed) {
  try {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
    const mnemonic = decryptSeed(encryptedSeed);
    return keyring.addFromMnemonic(mnemonic);
  } catch (error) {
    console.error('Account retrieval error:', error.message);
    throw new Error('Failed to retrieve escrow account');
  }
}

function isValidPolkadotAddress(address) {
  try {
    const keyring = new Keyring({ type: 'sr25519' });
    keyring.encodeAddress(address);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  generateEscrowWallet,
  getEscrowAccount,
  encryptSeed,
  decryptSeed,
  isValidPolkadotAddress
};
