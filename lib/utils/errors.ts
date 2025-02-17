export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const ErrorCodes = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  INVALID_SECRET: 'INVALID_SECRET',
  DUPLICATE_LABEL: 'DUPLICATE_LABEL',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  MISSING_FIELDS: 'MISSING_FIELDS',
} as const;

export const ErrorMessages = {
  [ErrorCodes.INVALID_API_KEY]: 'The provided API key appears to be invalid',
  [ErrorCodes.INVALID_SECRET]: 'The provided secret key appears to be invalid',
  [ErrorCodes.DUPLICATE_LABEL]: 'A key with this label already exists',
  [ErrorCodes.UNAUTHORIZED]: 'You are not authorized to perform this action',
  [ErrorCodes.DATABASE_ERROR]: 'Failed to save to database',
  [ErrorCodes.ENCRYPTION_ERROR]: 'Failed to encrypt sensitive data',
  [ErrorCodes.MISSING_FIELDS]: 'Please fill in all required fields',
} as const; 