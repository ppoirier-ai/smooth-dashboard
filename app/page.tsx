import { FC } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const HomePage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark">
      <h1 className="text-4xl font-bold text-text-primary mb-8">
        Welcome to Smooth's Treasury Management Dashboard
      </h1>
      <Link href="/dashboard">
        <Button variant="green" size="lg" className="text-lg">
          Enter Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default HomePage; 