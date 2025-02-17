import { decrypt } from '@/lib/crypto';

interface BinanceTestResponse {
  success: boolean;
  error?: string;
}

export async function testBinanceApiKey(
  encryptedApiKey: string,
  encryptedSecretKey: string,
  iv: string,
  tag: string
): Promise<BinanceTestResponse> {
  try {
    const apiKey = decrypt(encryptedApiKey, iv, tag);
    const secretKey = decrypt(encryptedSecretKey, iv, tag);

    // Test endpoint that doesn't require additional parameters
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('hex');

    const response = await fetch('https://api.binance.com/api/v3/account', {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Failed to validate API key');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate API key'
    };
  }
} 