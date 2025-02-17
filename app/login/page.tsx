"use client";

import { FC, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { WalletError } from '@/components/ui/WalletError';
import { SigninMessage } from '@/lib/auth/SigninMessage';
import bs58 from 'bs58';

const LoginPage: FC = () => {
  const wallet = useWallet();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!wallet.publicKey || !wallet.signMessage) {
        throw new Error("Please connect your wallet first");
      }

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: wallet.publicKey.toBase58(),
        statement: "Sign in to Smooth's Treasury Management Dashboard",
        nonce: crypto.randomUUID(),
      });

      const messageStr = message.prepare();
      const messageBytes = new TextEncoder().encode(messageStr);

      let signature;
      try {
        signature = await wallet.signMessage(messageBytes);
      } catch (e) {
        if (e instanceof Error) {
          if (e.message.includes('User rejected')) {
            throw new Error('You declined to sign the message. Please try again.');
          }
        }
        throw e;
      }

      const signatureStr = bs58.encode(signature);

      const result = await signIn("credentials", {
        message: JSON.stringify(message),
        signature: signatureStr,
        publicKey: wallet.publicKey.toBase58(),
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        console.error("Sign in error:", result.error);
        throw new Error('Authentication failed. Please try again.');
      }

      if (result?.url) {
        router.push(result.url);
      }
    } catch (e) {
      console.error("Login error:", e);
      setError(e instanceof Error ? e : new Error('An unexpected error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark">
      <div className="bg-card-background p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold text-text-primary mb-6 text-center">
          Welcome to Smooth's Treasury
        </h1>
        
        <WalletError error={error} onDismiss={handleDismissError} />

        <div className="space-y-4">
          <WalletMultiButton className="w-full" />
          {wallet.connected && (
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-accent-green text-background-dark px-4 py-3 rounded-lg hover:bg-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size={20} />
              ) : (
                "Sign in with Phantom"
              )}
            </button>
          )}
        </div>
        
        <p className="mt-4 text-text-secondary text-center text-sm">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 