"use client";

import { FC, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { BinanceAccountForm } from './BinanceAccountForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast } from '@/components/ui/Toast';
import { useBinanceAccounts } from '@/hooks/useBinanceAccounts';
import { BinanceAccount } from '@prisma/client';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

const BinanceAccounts: FC = () => {
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<BinanceAccount | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const { accounts, isLoading, deleteAccount } = useBinanceAccounts();

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;

    try {
      await deleteAccount(deletingAccount.id);
      setToast({
        message: 'Account deleted successfully',
        type: 'success',
      });
    } catch (error) {
      setToast({
        message: 'Failed to delete account',
        type: 'error',
      });
    } finally {
      setDeletingAccount(null);
    }
  };

  const handleSuccess = (action: 'add' | 'update') => {
    setToast({
      message: `Account ${action === 'add' ? 'added' : 'updated'} successfully`,
      type: 'success',
    });
    setIsAddingAccount(false);
    setEditingAccountId(null);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading accounts...</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-text-primary">Binance Accounts</h2>
          <button
            onClick={() => setIsAddingAccount(true)}
            className="flex items-center gap-2 bg-accent-green text-background-dark px-4 py-2 rounded-lg"
          >
            <Plus size={20} />
            <span>Add Account</span>
          </button>
        </div>

        {isAddingAccount && (
          <BinanceAccountForm
            onClose={() => setIsAddingAccount(false)}
            onSuccess={() => setIsAddingAccount(false)}
          />
        )}

        <div className="grid gap-4">
          {accounts?.map((account) => (
            <Card key={account.id} className="p-6">
              {editingAccountId === account.id ? (
                <BinanceAccountForm
                  account={account}
                  onClose={() => setEditingAccountId(null)}
                  onSuccess={() => setEditingAccountId(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-text-primary">
                      {account.accountName}
                    </h3>
                    <p className="text-text-secondary">{account.accountType}</p>
                    {account.subAccountEmail && (
                      <p className="text-text-secondary">{account.subAccountEmail}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAccountId(account.id)}
                      className="p-2 rounded-lg hover:bg-background-dark text-text-secondary hover:text-accent-green"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => setDeletingAccount(account)}
                      className="p-2 rounded-lg hover:bg-background-dark text-text-secondary hover:text-red-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        isDangerous
        confirmText="Delete"
      >
        Are you sure you want to delete the account "{deletingAccount?.accountName}"? This action
        cannot be undone.
      </ConfirmDialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export { BinanceAccounts }; 