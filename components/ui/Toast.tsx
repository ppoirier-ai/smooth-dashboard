"use client";

import { FC, useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-accent-green/10' : 'bg-red-500/10'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="text-accent-green" size={20} />
      ) : (
        <XCircle className="text-red-500" size={20} />
      )}
      <span className={type === 'success' ? 'text-accent-green' : 'text-red-500'}>
        {message}
      </span>
      <button
        onClick={onClose}
        className={`p-1 rounded-full hover:bg-black/10 ${
          type === 'success' ? 'text-accent-green' : 'text-red-500'
        }`}
      >
        <X size={16} />
      </button>
    </div>
  );
}; 