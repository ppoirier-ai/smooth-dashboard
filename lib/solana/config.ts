import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

export const network = WalletAdapterNetwork.Mainnet;
export const endpoint = clusterApiUrl(network);

export const WALLET_CONNECT_TIMEOUT = 15000; // 15 seconds 