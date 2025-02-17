import { ReactNode } from 'react';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { WalletProvider } from '@/components/providers/WalletProvider';
import { authOptions } from '@/lib/auth/auth';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smooth Treasury',
  description: 'Track your crypto portfolio across multiple Binance accounts',
};

interface RootLayoutProps {
  children: ReactNode;
}

async function RootLayout({ children }: RootLayoutProps) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <SessionProvider>
            <div className="min-h-screen bg-background-dark">
              <Header />
              <main className="p-8">
                {children}
              </main>
            </div>
          </SessionProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

export default RootLayout; 