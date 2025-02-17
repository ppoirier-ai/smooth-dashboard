import { FC } from 'react';
import { Card } from '@/components/ui/Card';
import { Mail } from 'lucide-react';

const VerifyEmailPage: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-accent-green/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-accent-green" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Check your email
          </h1>
          <p className="text-text-secondary mb-6">
            A sign in link has been sent to your email address.
          </p>
          <p className="text-sm text-text-secondary">
            If you don't see it, check your spam folder. The link will expire in 24 hours.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmailPage; 