import React, { createContext, useState, useContext, useEffect } from 'react';
import { accountApi, AwsAccount } from '../services/accountApi';

export interface AWSAccount {
  accountName: string;
  accountId: string;
  region: string;
}

interface AccountContextType {
  accounts: AWSAccount[];
  selectedAccount: AWSAccount | null;
  setSelectedAccount: (account: AWSAccount) => void;
  loading: boolean;
  error: string | null;
  hasConfiguredAccounts: boolean;
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  selectedAccount: null,
  setSelectedAccount: () => {},
  loading: true,
  error: null,
  hasConfiguredAccounts: false
});

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<AWSAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AWSAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountApi.getAccounts();
      
      // Map API response to AWSAccount format
      const mappedAccounts = data.map((account: AwsAccount) => ({
        accountName: account.account_name,
        accountId: account.account_id,
        region: account.region
      }));
      
      setAccounts(mappedAccounts);
      
      // Set the first account as selected if available
      if (mappedAccounts.length > 0) {
        setSelectedAccount(mappedAccounts[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load AWS accounts:', err);
      setError('Failed to load AWS accounts');
      
      // Set fallback mock accounts if API fails
      const fallbackAccounts = [
        { accountName: 'Sandbox', accountId: '123456789012', region: 'us-east-1' },
        { accountName: 'Administrator', accountId: '234567890123', region: 'us-west-2' }
      ];
      setAccounts(fallbackAccounts);
      setSelectedAccount(fallbackAccounts[0]);
    } finally {
      setLoading(false);
    }
  };

  // Determine if there are any configured accounts
  const hasConfiguredAccounts = accounts.length > 0;

  return (
    <AccountContext.Provider value={{ 
      accounts, 
      selectedAccount, 
      setSelectedAccount, 
      loading, 
      error,
      hasConfiguredAccounts
    }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => useContext(AccountContext);