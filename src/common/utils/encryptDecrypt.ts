import * as crypto from 'crypto';

export const encrypt = (text: string, key: string) => {
  // Generate a random 12 bytes IV
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Return IV + Auth Tag + Encrypted data
  return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]).toString(
    'base64',
  );
};

export const decrypt = (encryptedData: string, key: string) => {
  // Convert base64 to buffer
  const buffer = Buffer.from(encryptedData, 'base64');

  // Extract IV, auth tag and encrypted text
  const iv = buffer.subarray(0, 12);
  const authTag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28).toString('hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

  // Set auth tag
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
