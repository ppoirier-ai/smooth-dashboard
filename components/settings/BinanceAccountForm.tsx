"use client";

import { FC, useState } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { BinanceAccount } from '@prisma/client';
import { useBinanceAccounts } from '@/hooks/useBinanceAccounts';
import { BinanceApiService } from '@/lib/services/binance-api.service';

interface BinanceAccountFormProps {
  account?: BinanceAccount;
  onClose: () => void;
  onSuccess: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'spot', label: 'Spot Account' },
  { value: 'margin', label: 'Margin Account' },
  { value: 'futures', label: 'Futures Account' },
  { value: 'bot', label: 'Trading Bot' },
];

interface FormError {
  field: string;
  message: string;
}

export const BinanceAccountForm: FC<BinanceAccountFormProps> = ({
  account,
  onClose,
  onSuccess,
}) => {
  const { addAccount, updateAccount } = useBinanceAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [formData, setFormData] = useState({
    accountName: account?.accountName || '',
    accountType: account?.accountType || 'spot',
    apiKey: '',
    apiSecret: '',
    subAccountId: account?.subAccountId || '',
    subAccountEmail: account?.subAccountEmail || '',
  });

  const validateForm = () => {
    const newErrors: FormError[] = [];

    if (!formData.accountName.trim()) {
      newErrors.push({ field: 'accountName', message: 'Account name is required' });
    }

    if (!account) { // Only validate API credentials for new accounts
      if (!formData.apiKey.trim()) {
        newErrors.push({ field: 'apiKey', message: 'API key is required' });
      }
      if (!formData.apiSecret.trim()) {
        newErrors.push({ field: 'apiSecret', message: 'API secret is required' });
      }
    }

    if (formData.subAccountEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.subAccountEmail)) {
      newErrors.push({ field: 'subAccountEmail', message: 'Invalid email format' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey || !formData.apiSecret) {
      setErrors([{ field: 'apiKey', message: 'API credentials are required for testing' }]);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/binance/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Failed to connect to Binance';
        
        switch (data.code) {
          case 'RATE_LIMIT_EXCEEDED':
            errorMessage = data.error;
            break;
          case 'INVALID_API_KEY':
            errorMessage = 'Invalid API key format';
            break;
          case 'UNAUTHORIZED':
            errorMessage = 'Invalid API key or insufficient permissions';
            break;
          case 'INVALID_SIGNATURE':
            errorMessage = 'Invalid API secret';
            break;
        }

        setErrors([{ field: 'apiKey', message: errorMessage }]);
        setTestResult('error');
        return;
      }

      setTestResult('success');
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult('error');
      setErrors([{ field: 'apiKey', message: 'Network error. Please try again.' }]);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (account) {
        await updateAccount(account.id, formData);
      } else {
        await addAccount(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors([{ field: 'form', message: 'Failed to save account' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card-background rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-text-primary">
          {account ? 'Edit Account' : 'Add New Account'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-background-dark text-text-secondary"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid gap-4">
        {errors.some(e => e.field === 'form') && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{getFieldError('form')}</span>
          </div>
        )}

        <div>
          <label className="block text-sm text-text-secondary mb-1">
            Account Name
          </label>
          <input
            type="text"
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
            className={`w-full bg-background-dark text-text-primary p-2 rounded-lg border ${
              getFieldError('accountName') ? 'border-red-500' : 'border-gray-800'
            } focus:border-accent-green focus:outline-none`}
            required
          />
          {getFieldError('accountName') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('accountName')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">
            Account Type
          </label>
          <select
            value={formData.accountType}
            onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
            className="w-full bg-background-dark text-text-primary p-2 rounded-lg border border-gray-800 focus:border-accent-green focus:outline-none"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-text-primary font-medium">API Credentials</h4>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-green"
            >
              {isTesting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : testResult === 'success' ? (
                <CheckCircle2 className="text-accent-green" size={16} />
              ) : testResult === 'error' ? (
                <AlertCircle className="text-red-500" size={16} />
              ) : null}
              Test Connection
            </button>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              API Key
            </label>
            <input
              type="text"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full bg-background-dark text-text-primary p-2 rounded-lg border border-gray-800 focus:border-accent-green focus:outline-none"
              required={!account}
              placeholder={account ? '••••••••' : ''}
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              API Secret
            </label>
            <input
              type="password"
              value={formData.apiSecret}
              onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              className="w-full bg-background-dark text-text-primary p-2 rounded-lg border border-gray-800 focus:border-accent-green focus:outline-none"
              required={!account}
              placeholder={account ? '••••••••' : ''}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">
            Sub-Account ID (Optional)
          </label>
          <input
            type="text"
            value={formData.subAccountId}
            onChange={(e) => setFormData({ ...formData, subAccountId: e.target.value })}
            className="w-full bg-background-dark text-text-primary p-2 rounded-lg border border-gray-800 focus:border-accent-green focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">
            Sub-Account Email (Optional)
          </label>
          <input
            type="email"
            value={formData.subAccountEmail}
            onChange={(e) => setFormData({ ...formData, subAccountEmail: e.target.value })}
            className="w-full bg-background-dark text-text-primary p-2 rounded-lg border border-gray-800 focus:border-accent-green focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-accent-green text-background-dark px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="animate-spin" size={16} />}
          {account ? 'Update' : 'Add'} Account
        </button>
      </div>
    </form>
  );
}; 