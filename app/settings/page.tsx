import { FC } from 'react';
import { UserProfile } from '@/components/settings/UserProfile';
import { BinanceAccounts } from '@/components/settings/BinanceAccounts';
import { SessionManagement } from '@/components/settings/SessionManagement';

const SettingsPage: FC = () => {
  return (
    <div className="space-y-6">
      <UserProfile />
      <SessionManagement />
      <BinanceAccounts />
    </div>
  );
};

export default SettingsPage; 