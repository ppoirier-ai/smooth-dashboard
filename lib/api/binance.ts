import https from 'https';
import crypto from 'crypto';
import { 
  BINANCE_API_URL, 
  BINANCE_FUTURES_API_URL,
  API_TIMEOUT 
} from '../config';
import { createSignature } from '../crypto';
import { SpotBalance, MarginBalance, FuturesBalance } from '../types/binance';

const agent = new https.Agent({
  rejectUnauthorized: false // Note: In production, you should handle this more securely
});

// Expanded interfaces
export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface MarginBalance {
  asset: string;
  borrowed: string;
  free: string;
  interest: string;
  locked: string;
  netAsset: string;
}

export interface FuturesBalance {
  asset: string;
  walletBalance: string;
  unrealizedProfit: string;
  marginBalance: string;
  maintMargin: string;
  initialMargin: string;
}

export interface CombinedAccountInfo {
  spot: {
    balances: BinanceBalance[];
    canTrade: boolean;
  };
  margin: {
    balances: MarginBalance[];
    level: string;
    totalAssetOfBtc: string;
    totalLiabilityOfBtc: string;
    totalNetAssetOfBtc: string;
    marginRatio: string;
  };
  futures: {
    balances: FuturesBalance[];
    totalWalletBalance: string;
    totalUnrealizedProfit: string;
    totalMarginBalance: string;
  };
  tradingBot: {
    balances: TradingBotBalance[];
  };
  updateTime: number;
}

const TIMEOUT_MS = 10000; // 10 seconds timeout

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number }) {
  const { timeout = TIMEOUT_MS } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function signRequest(apiSecret: string, queryString: string): Promise<string> {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
}

let serverTimeOffset = 0;

async function getServerTimeOffset() {
  try {
    const response = await fetch(`${BINANCE_API_URL}/api/v3/time`);
    const data = await response.json();
    const serverTime = data.serverTime;
    const localTime = Date.now();
    const offset = serverTime - localTime;
    console.log('Server time offset:', {
      serverTime,
      localTime,
      offset,
      absoluteOffset: Math.abs(offset)
    });
    return offset;
  } catch (error) {
    console.error('Error fetching server time:', error);
    return 0;
  }
}

async function getTimestamp() {
  if (serverTimeOffset === 0) {
    serverTimeOffset = await getServerTimeOffset();
  }
  return Date.now() + serverTimeOffset;
}

// Constants for asset filtering
const RELEVANT_ASSETS = ['BTC', 'SOL', 'AAVE', 'USDT'];

// Helper function to extract base asset from symbol
function getBaseAsset(symbol: string): string {
  // Remove either USDT or USD suffix
  return symbol.replace(/USD[T]?$/, '');
}

// Spot Account
export async function getSpotAccount(apiKey: string, apiSecret: string) {
  try {
    const data = await makeSignedRequest('/api/v3/account', apiKey, apiSecret);
    
    console.log('Spot account data:', {
      balancesCount: data.balances?.length,
      nonZeroBalances: data.balances?.filter((b: any) => 
        parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
      ).length
    });

    return {
      balances: data.balances || [],
      canTrade: data.canTrade,
    };
  } catch (error) {
    console.error('Spot account error:', error);
    throw error;
  }
}

// Margin Account
export async function getMarginAccount(apiKey: string, apiSecret: string) {
  try {
    const data = await makeSignedRequest('/sapi/v1/margin/account', apiKey, apiSecret);
    
    console.log('Margin account data:', {
      assetsCount: data.userAssets?.length,
      nonZeroBalances: data.userAssets?.filter((b: any) => 
        parseFloat(b.free) > 0 || parseFloat(b.locked) > 0 || parseFloat(b.borrowed) > 0
      ).length,
      totalAssetOfBtc: data.totalAssetOfBtc,
      totalLiabilityOfBtc: data.totalLiabilityOfBtc
    });

    return {
      balances: data.userAssets || [],
      totalAssetOfBtc: data.totalAssetOfBtc,
      totalLiabilityOfBtc: data.totalLiabilityOfBtc,
      totalNetAssetOfBtc: data.totalNetAssetOfBtc,
      marginLevel: data.marginLevel,
      marginRatio: data.marginRatio,
    };
  } catch (error) {
    console.error('Margin account error:', error);
    throw error;
  }
}

// Futures Account
export async function getFuturesAccount(apiKey: string, apiSecret: string) {
  try {
    const data = await makeSignedRequest('/fapi/v2/account', apiKey, apiSecret, BINANCE_FUTURES_API_URL);
    
    // Filter positions to only include relevant assets
    const relevantPositions = (data.positions || []).filter((position: any) => {
      const baseAsset = getBaseAsset(position.symbol);
      return RELEVANT_ASSETS.includes(baseAsset);
    });

    console.log('Futures account data:', {
      totalPositions: data.positions?.length,
      relevantPositions: relevantPositions.length,
      relevantAssets: relevantPositions.map((p: any) => ({
        symbol: p.symbol,
        baseAsset: getBaseAsset(p.symbol)
      }))
    });

    return {
      balances: relevantPositions,
      totalWalletBalance: data.totalWalletBalance || "0",
      totalUnrealizedProfit: data.totalUnrealizedProfit || "0",
      totalMarginBalance: data.totalMarginBalance || "0",
    };
  } catch (error) {
    console.error('Futures account error:', error);
    return {
      balances: [],
      totalWalletBalance: "0",
      totalUnrealizedProfit: "0",
      totalMarginBalance: "0",
    };
  }
}

// Trading Bot Account Types
interface TradingBotBalance {
  strategyId: string;
  strategyName: string;
  asset: string;
  free: string;
  locked: string;
  total: string;
  pnl: string;
  roi: string;
}

// Trading Bot Account
export async function getTradingBotAccounts(apiKey: string, apiSecret: string) {
  const timestamp = await getTimestamp();
  const queryString = `timestamp=${timestamp}&recvWindow=60000`;
  const signature = createSignature(queryString, apiSecret);

  console.log('Fetching trading bot accounts...');

  try {
    // Fetch both USDT-M and COIN-M bot accounts
    const [usdtBots, coinBots] = await Promise.all([
      fetch(
        `${BINANCE_API_URL}/sapi/v1/trading-bot/spot/accounts?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': apiKey,
          },
        }
      ),
      fetch(
        `${BINANCE_API_URL}/sapi/v1/trading-bot/futures/positions?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': apiKey,
          },
        }
      )
    ]);

    const usdtBotsData = await usdtBots.json().catch(() => []);
    const coinBotsData = await coinBots.json().catch(() => []);

    console.log('Raw trading bot data:', {
      usdtBots: {
        status: usdtBots.status,
        data: usdtBotsData
      },
      coinBots: {
        status: coinBots.status,
        data: coinBotsData
      }
    });

    // Combine and format both types of bots
    const allBots = [
      ...(Array.isArray(usdtBotsData) ? usdtBotsData : []),
      ...(Array.isArray(coinBotsData) ? coinBotsData : [])
    ]
    .filter(account => {
      const baseAsset = getBaseAsset(account.symbol);
      console.log('Checking bot account:', {
        symbol: account.symbol,
        baseAsset,
        isRelevant: RELEVANT_ASSETS.includes(baseAsset),
        rawAccount: JSON.stringify(account)
      });
      return RELEVANT_ASSETS.includes(baseAsset);
    })
    .map(account => ({
      strategyId: account.strategyId,
      strategyName: account.strategyName,
      asset: getBaseAsset(account.symbol),
      free: account.free || "0",
      locked: account.locked || "0",
      total: account.total || "0",
      pnl: account.unrealizedPnl || "0",
      roi: account.totalPnl || "0",
      type: account.type || 'spot',
      symbol: account.symbol
    }));

    console.log('Combined trading bots:', {
      totalBots: allBots.length,
      activeBots: allBots.filter(bot => parseFloat(bot.total) > 0).length,
      assets: allBots.map(bot => ({
        asset: bot.asset,
        symbol: bot.symbol,
        total: bot.total,
        strategyName: bot.strategyName,
        type: bot.type
      }))
    });

    return {
      balances: allBots
    };
  } catch (error) {
    console.error('Error fetching trading bot accounts:', error);
    return {
      balances: []
    };
  }
}

export async function getCombinedAccountInfo(apiKey: string, apiSecret: string): Promise<CombinedAccountInfo> {
  console.log('Starting combined account info fetch...');
  console.log('All relevant assets:', RELEVANT_ASSETS);
  
  // Get server time offset once at the start
  if (serverTimeOffset === 0) {
    serverTimeOffset = await getServerTimeOffset();
  }
  
  const timestamp = await getTimestamp();
  
  try {
    console.log('Fetching all account types...');
    const [spotAccount, marginAccount, futuresAccount, tradingBotAccount] = await Promise.all([
      getSpotAccount(apiKey, apiSecret).catch(error => {
        console.error('Error fetching spot account:', error);
        return {
          balances: [],
          canTrade: false
        };
      }),
      getMarginAccount(apiKey, apiSecret).catch(error => {
        console.error('Error fetching margin account:', error);
        return {
          balances: [],
          totalAssetOfBtc: "0",
          totalLiabilityOfBtc: "0",
          totalNetAssetOfBtc: "0",
          marginLevel: "0",
          marginRatio: "0"
        };
      }),
      getFuturesAccount(apiKey, apiSecret).catch(error => {
        console.error('Error fetching futures account:', error);
        return {
          balances: [],
          totalWalletBalance: "0",
          totalUnrealizedProfit: "0",
          totalMarginBalance: "0"
        };
      }),
      getTradingBotAccounts(apiKey, apiSecret).catch(error => {
        console.error('Error fetching trading bot accounts:', error);
        return {
          balances: []
        };
      })
    ]);

    // Add type for balance filter callbacks
    const filterSpotBalance = (balance: SpotBalance) => 
      RELEVANT_ASSETS.includes(balance.asset) &&
      (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0);

    const filterMarginBalance = (balance: MarginBalance) =>
      RELEVANT_ASSETS.includes(balance.asset) &&
      (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0 || parseFloat(balance.borrowed) > 0);

    const filterFuturesBalance = (balance: FuturesBalance) =>
      RELEVANT_ASSETS.includes(balance.asset) &&
      parseFloat(balance.walletBalance) > 0;

    // Update the filter calls
    const filteredSpotBalances = spotAccount.balances.filter(filterSpotBalance);
    const filteredMarginBalances = marginAccount.balances.filter(filterMarginBalance);
    const filteredFuturesBalances = futuresAccount.balances.filter(filterFuturesBalance);

    // Update the map callbacks
    const getAsset = (b: { asset: string }) => b.asset;

    console.log('Filtered balances:', {
      spot: {
        total: filteredSpotBalances.length,
        assets: filteredSpotBalances.map(getAsset)
      },
      margin: {
        total: filteredMarginBalances.length,
        assets: filteredMarginBalances.map(getAsset)
      },
      futures: {
        total: filteredFuturesBalances.length,
        assets: filteredFuturesBalances.map(getAsset)
      },
      tradingBot: {
        total: tradingBotAccount.balances.length,
        assets: tradingBotAccount.balances.map(getAsset)
      }
    });

    // Check if we have any assets at all
    const hasAssets = filteredSpotBalances.length > 0 || 
                     filteredMarginBalances.length > 0 || 
                     filteredFuturesBalances.length > 0 ||
                     tradingBotAccount.balances.length > 0;

    if (!hasAssets) {
      console.log('No assets found in any account');
    }

    return {
      spot: {
        balances: filteredSpotBalances,
        canTrade: spotAccount.canTrade,
      },
      margin: {
        balances: filteredMarginBalances,
        level: marginAccount.marginLevel,
        totalAssetOfBtc: marginAccount.totalAssetOfBtc,
        totalLiabilityOfBtc: marginAccount.totalLiabilityOfBtc,
        totalNetAssetOfBtc: marginAccount.totalNetAssetOfBtc,
        marginRatio: marginAccount.marginRatio,
      },
      futures: {
        balances: filteredFuturesBalances,
        totalWalletBalance: futuresAccount.totalWalletBalance,
        totalUnrealizedProfit: futuresAccount.totalUnrealizedProfit,
        totalMarginBalance: futuresAccount.totalMarginBalance,
      },
      tradingBot: {
        balances: tradingBotAccount.balances
      },
      updateTime: timestamp,
    };
  } catch (error) {
    console.error('Error in getCombinedAccountInfo:', error);
    throw error;
  }
}

// Update makeSignedRequest to support different base URLs
async function makeSignedRequest(endpoint: string, apiKey: string, apiSecret: string, baseUrl = BINANCE_API_URL) {
  const timestamp = await getTimestamp();
  const queryString = `timestamp=${timestamp}&recvWindow=60000`; // Add 60 second window
  const signature = createSignature(queryString, apiSecret);

  console.log('Making signed request:', {
    endpoint,
    baseUrl,
    timestamp,
    offset: serverTimeOffset,
    queryString
  });

  const response = await fetch(
    `${baseUrl}${endpoint}?${queryString}&signature=${signature}`,
    {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`${endpoint} error:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Failed to fetch ${endpoint}: ${errorData.msg || response.statusText}`);
  }

  return response.json();
} 