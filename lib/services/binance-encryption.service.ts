import crypto from 'crypto';

export class BinanceEncryptionService {
  private static algorithm = 'aes-256-gcm';
  private static key = process.env.CREDENTIALS_ENCRYPTION_KEY!;

  static encryptCredentials(apiKey: string, apiSecret: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key, 'hex'), iv);
    
    // Encrypt API key
    let encryptedKey = cipher.update(apiKey, 'utf8', 'hex');
    encryptedKey += cipher.final('hex');
    const keyTag = cipher.getAuthTag();

    // Create new cipher for API secret
    const cipher2 = crypto.createCipheriv(this.algorithm, Buffer.from(this.key, 'hex'), iv);
    let encryptedSecret = cipher2.update(apiSecret, 'utf8', 'hex');
    encryptedSecret += cipher2.final('hex');
    const secretTag = cipher2.getAuthTag();
    
    return {
      apiKey: {
        encrypted: encryptedKey,
        tag: keyTag.toString('hex')
      },
      apiSecret: {
        encrypted: encryptedSecret,
        tag: secretTag.toString('hex')
      },
      iv: iv.toString('hex')
    };
  }

  static decryptCredentials(
    encryptedKey: string,
    encryptedSecret: string,
    iv: string,
    keyTag: string,
    secretTag: string
  ) {
    // Decrypt API key
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.key, 'hex'),
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(keyTag, 'hex'));
    let decryptedKey = decipher.update(encryptedKey, 'hex', 'utf8');
    decryptedKey += decipher.final('utf8');

    // Decrypt API secret
    const decipher2 = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.key, 'hex'),
      Buffer.from(iv, 'hex')
    );
    decipher2.setAuthTag(Buffer.from(secretTag, 'hex'));
    let decryptedSecret = decipher2.update(encryptedSecret, 'hex', 'utf8');
    decryptedSecret += decipher2.final('utf8');

    return {
      apiKey: decryptedKey,
      apiSecret: decryptedSecret
    };
  }
} 