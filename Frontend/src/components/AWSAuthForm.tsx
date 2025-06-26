import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Cloud, Loader2 } from 'lucide-react';
import Button from './ui/Button';
import { useTheme } from '../context/ThemeContext';
import { accountApi } from '../services/accountApi';

interface AWSAuthFormProps {
  onClose: () => void;
  onAddAccount: (account: {
    accountName: string;
    accountId: string;
    region: string;
    accessKey: string;
    secretKey: string;
    sessionToken?: string;
  }) => void;
}

const AWSAuthForm: React.FC<AWSAuthFormProps> = ({ onClose, onAddAccount }) => {
  const { theme } = useTheme();
  const [credentials, setCredentials] = useState({
    accountName: '',
    accountId: '',
    region: 'us-east-1',
    accessKey: '',
    secretKey: '',
    sessionToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Test the connection before saving
      await accountApi.testConnection({
        account_name: credentials.accountName,
        account_id: credentials.accountId,
        region: credentials.region,
        accesskey: credentials.accessKey,
        secretkey: credentials.secretKey,
        session_token: credentials.sessionToken || undefined,
        updated_by: 'current-user' // Replace with actual user when available
      });
      
      // If test is successful, add the account
      onAddAccount(credentials);
      onClose();
    } catch (err) {
      console.error('Connection test failed:', err);
      setError('Failed to validate AWS credentials. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md">
        <div className={`backdrop-blur-xl border rounded-xl p-8 relative ${
          theme === 'dark'
            ? 'bg-slate-900/80 border-slate-700/50'
            : 'bg-white/90 border-indigo-200/50'
        }`}>
          <button 
            className={`absolute top-4 right-4 p-1.5 rounded-full ${
              theme === 'dark' ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={onClose}
          >
            <X size={18} />
          </button>
          
          <h2 className={`text-2xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>AWS Configuration</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Account Name
                </label>
                <input
                  type="text"
                  value={credentials.accountName}
                  onChange={(e) => setCredentials({...credentials, accountName: e.target.value})}
                  className={`w-full rounded-lg px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border border-slate-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-800'
                  }`}
                  placeholder="My AWS Account"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Account ID
                </label>
                <input
                  type="text"
                  value={credentials.accountId}
                  onChange={(e) => setCredentials({...credentials, accountId: e.target.value})}
                  className={`w-full rounded-lg px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border border-slate-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-800'
                  }`}
                  placeholder="123456789012"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Region
                </label>
                <input
                  type="text"
                  value={credentials.region}
                  onChange={(e) => setCredentials({...credentials, region: e.target.value})}
                  className={`w-full rounded-lg px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border border-slate-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-800'
                  }`}
                  placeholder="us-east-1"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Access Key
                </label>
                <input
                  type="text"
                  value={credentials.accessKey}
                  onChange={(e) => setCredentials({...credentials, accessKey: e.target.value})}
                  className={`w-full rounded-lg px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border border-slate-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-800'
                  }`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Secret Key
                </label>
                <input
                  type="password"
                  value={credentials.secretKey}
                  onChange={(e) => setCredentials({...credentials, secretKey: e.target.value})}
                  className={`w-full rounded-lg px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border border-slate-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-800'
                  }`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Session Token (optional)
                </label>
                <input
                  type="password"
                  value={credentials.sessionToken}
                  onChange={(e) => setCredentials({...credentials, sessionToken: e.target.value})}
                  className={`w-full rounded-lg px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border border-slate-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-800'
                  }`}
                  placeholder="For temporary credentials only"
                />
              </div>
            </div>
            
            {error && (
              <div className={`mt-4 p-3 rounded-md ${
                theme === 'dark' ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-600'
              }`}>
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              icon={loading ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
              disabled={loading}
            >
              {loading ? 'Validating...' : 'Add AWS Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AWSAuthForm;