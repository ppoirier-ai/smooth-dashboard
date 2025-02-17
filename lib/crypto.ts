import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32; // AES-256 requires a 32-byte key
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  // Convert hex string to buffer
  if (key.length === 64) { // 32 bytes in hex = 64 characters
    return Buffer.from(key, 'hex');
  }
  
  // Hash the key to get a consistent length
  return crypto.createHash('sha256').update(String(key)).digest();
}

interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
}

export function encrypt(data: string): { encryptedData: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
    iv
  );

  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData,
    iv: iv.toString('hex'),
    tag,
  };
}

export function decrypt(encryptedData: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function createSignature(queryString: string, apiSecret: string): string {
  console.log('Creating signature...', {
    queryStringLength: queryString.length,
    secretLength: apiSecret.length
  });
  
  try {
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');
      
    console.log('Signature created:', {
      signatureLength: signature.length,
      signatureStart: signature.substring(0, 8)
    });
    
    return signature;
  } catch (error) {
    console.error('Error creating signature:', error);
    throw error;
  }
}

// Add this utility function for generating random tokens
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
} 