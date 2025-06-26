import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAccount } from '../context/AccountContext';
import { ChevronDown, Loader2 } from 'lucide-react';

const AccountSelector: React.FC = () => {
  const { theme } = useTheme();
  const { accounts, selectedAccount, setSelectedAccount, loading } = useAccount();

  return (
    <div className="relative">
      <div className="flex flex-col">
        <span className={`text-xs mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-indigo-500'}`}>
          Active Account
        </span>
        <div className="relative">
          {loading ? (
            <div className={`w-64 px-4 py-2.5 rounded-lg flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-slate-800/70 text-white border border-blue-500/30' 
                : 'bg-white/90 text-slate-800 border border-indigo-300/50'
            }`}>
              <Loader2 size={16} className="animate-spin mr-2" />
              <span>Loading accounts...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className={`w-64 px-4 py-2.5 rounded-lg flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-slate-800/70 text-white border border-red-500/30' 
                : 'bg-white/90 text-slate-800 border border-red-300/50'
            }`}>
              No accounts configured
            </div>
          ) : (
            <select
              value={selectedAccount?.accountId || ''}
              onChange={(e) => {
                const selected = accounts.find(acc => acc.accountId === e.target.value);
                if (selected) setSelectedAccount(selected);
              }}
              className={`w-64 px-4 py-2.5 rounded-lg appearance-none focus:outline-none transition-all duration-200 backdrop-blur-sm ${
                theme === 'dark' 
                  ? 'bg-slate-800/70 text-white border border-blue-500/30 hover:border-blue-400/50 focus:ring-2 focus:ring-blue-500/40 shadow-lg shadow-blue-900/20' 
                  : 'bg-white/90 text-slate-800 border border-indigo-300/50 hover:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/30 shadow-md shadow-indigo-200/20'
              }`}
            >
              {accounts.map((account) => (
                <option 
                  key={account.accountId} 
                  value={account.accountId} 
                  className={theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}
                >
                  {account.accountName} ({account.accountId})
                </option>
              ))}
            </select>
          )}
          {!loading && accounts.length > 0 && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-indigo-500'
                }`} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSelector;