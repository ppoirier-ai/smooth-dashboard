"use client";

import { FC, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card-background rounded-xl p-6 w-full max-w-md">
        <div className="flex items-start gap-4">
          {isDangerous && (
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
            <div className="text-text-secondary">{children}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg ${
              isDangerous
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-accent-green hover:bg-accent-green/90'
            } text-background-dark`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}; 