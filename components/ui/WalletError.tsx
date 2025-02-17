'use client';

import { FC } from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

interface WalletErrorProps {
  error: Error | null;
  onDismiss: () => void;
}

export const WalletError: FC<WalletErrorProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  const errorMessage = (() => {
    switch (error.name) {
      case 'WalletNotFoundError':
        return 'Phantom wallet not installed. Please install Phantom to continue.';
      case 'WalletConnectionError':
        return 'Failed to connect to your wallet. Please try again.';
      case 'WalletDisconnectedError':
        return 'Wallet disconnected. Please reconnect to continue.';
      case 'WalletSignTransactionError':
        return 'Failed to sign the message. Please try again.';
      case 'WalletTimeoutError':
        return 'Connection timed out. Please try again.';
      case 'WalletWindowBlockedError':
        return 'Popup blocked. Please allow popups for this site.';
      case 'WalletWindowClosedError':
        return 'You closed the popup. Please try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  })();

  return (
    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2 text-red-500">
        <AlertCircle size={16} />
        <span>{errorMessage}</span>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-500 hover:text-red-600 transition-colors"
      >
        <XCircle size={16} />
      </button>
    </div>
  );
}; 