export class ApiKeyValidator {
  static readonly API_KEY_LENGTH = 64;
  static readonly API_SECRET_LENGTH = 64;
  static readonly API_KEY_PATTERN = /^[A-Za-z0-9]{64}$/;
  static readonly API_SECRET_PATTERN = /^[A-Za-z0-9]{64}$/;

  static validateApiKey(apiKey: string): { isValid: boolean; error?: string } {
    if (!apiKey) {
      return { isValid: false, error: 'API key is required' };
    }

    if (apiKey.length !== this.API_KEY_LENGTH) {
      return { 
        isValid: false, 
        error: `API key must be ${this.API_KEY_LENGTH} characters long` 
      };
    }

    if (!this.API_KEY_PATTERN.test(apiKey)) {
      return { 
        isValid: false, 
        error: 'API key must contain only letters and numbers' 
      };
    }

    return { isValid: true };
  }

  static validateApiSecret(apiSecret: string): { isValid: boolean; error?: string } {
    if (!apiSecret) {
      return { isValid: false, error: 'API secret is required' };
    }

    if (apiSecret.length !== this.API_SECRET_LENGTH) {
      return { 
        isValid: false, 
        error: `API secret must be ${this.API_SECRET_LENGTH} characters long` 
      };
    }

    if (!this.API_SECRET_PATTERN.test(apiSecret)) {
      return { 
        isValid: false, 
        error: 'API secret must contain only letters and numbers' 
      };
    }

    return { isValid: true };
  }
} 