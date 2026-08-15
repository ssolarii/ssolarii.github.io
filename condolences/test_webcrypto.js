const fs = require('fs');
const crypto = require('crypto');
const { webcrypto } = crypto;

const PASSWORD = 'Alesc00l#';

function encryptNode(plaintext, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = cipher.update(plaintext, 'utf8');
  const final = cipher.final();
  const tag = cipher.getAuthTag();

  // WebCrypto AES-GCM expects: data + tag
  const cipherWithTag = Buffer.concat([encrypted, final, tag]);
  const result = Buffer.concat([salt, iv, cipherWithTag]);
  return result.toString('base64');
}

async function decryptWebCrypto(base64Str, password) {
  const buf = Buffer.from(base64Str, 'base64');
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 28);
  const dataWithTag = buf.subarray(28);

  const enc = new TextEncoder();
  const pwKey = await webcrypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );

  const aesKey = await webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    dataWithTag
  );

  return new TextDecoder().decode(decrypted);
}

async function run() {
  const encStr = encryptNode('PASSCHECK_OK', PASSWORD);
  console.log('Encrypted base64:', encStr);
  const decStr = await decryptWebCrypto(encStr, PASSWORD);
  console.log('Decrypted result:', decStr);
  if (decStr === 'PASSCHECK_OK') {
    console.log('SUCCESS! WebCrypto decryption works perfectly!');
  } else {
    console.error('FAILED!');
  }
}

run();
