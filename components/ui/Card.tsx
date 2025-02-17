"use client";

import { FC, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-card-background rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
};

// Add a default export as well for flexibility
export default Card; 