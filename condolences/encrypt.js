const fs = require('fs');
const crypto = require('crypto');

const PASSWORD = 'Alesc00l#';
const CARD_DIR = '/home/solari/.gemini/antigravity/scratch/condolences-card';

// PBKDF2 + AES-GCM encryption compatible with Web Crypto API
function encrypt(plaintext, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12); // 12 bytes for AES-GCM
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Combine: salt (16) + iv (12) + tag (16) + encrypted
  const result = Buffer.concat([salt, iv, tag, encrypted]);
  return result.toString('base64');
}

// 1. Create passcheck.enc
const passcheckEnc = encrypt('PASSCHECK_OK', PASSWORD);
fs.writeFileSync(`${CARD_DIR}/passcheck.enc`, passcheckEnc);
console.log(`passcheck.enc created: ${passcheckEnc.length} chars`);

// 2. Read admin_template.html (or original admin.html) and encrypt
const adminPath = `${CARD_DIR}/admin.html`;
if (fs.existsSync(adminPath)) {
  const adminHtml = fs.readFileSync(adminPath, 'utf8');
  const adminEnc = encrypt(adminHtml, PASSWORD);
  fs.writeFileSync(`${CARD_DIR}/admin.enc`, adminEnc);
  console.log(`admin.enc created: ${adminEnc.length} chars (${Math.round(adminEnc.length/1024)} KB)`);
}
