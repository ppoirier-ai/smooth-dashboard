import { FC } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ size = 24, className = '' }) => {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}; 