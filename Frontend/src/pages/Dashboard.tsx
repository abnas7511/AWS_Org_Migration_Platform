import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { ArrowRight, BarChart2, Cloud, Trash2, History, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import AWSAuthForm from '../components/AWSAuthForm';
import { accountApi, AwsAccount } from '../services/accountApi';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const { setActiveItem } = useSidebar();
  const navigate = useNavigate();
  const [showAwsModal, setShowAwsModal] = useState(false);
  const [accounts, setAccounts] = useState<AwsAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set active sidebar item on component mount
  useEffect(() => {
    setActiveItem('/dashboard');
  }, [setActiveItem]);
  
  // Fetch accounts when component mounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountApi.getAccounts();
      setAccounts(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load AWS accounts:', err);
      setError('Failed to load AWS accounts');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Migration Journey',
      description: 'Start or continue your AWS account migration process',
      icon: <ArrowRight size={24} />,
      path: '/migration-journey',
      color: theme === 'dark' ? 'from-blue-600/20 to-blue-800/20' : 'from-blue-100 to-blue-200'
    },
    {
      title: 'Recent Migrations',
      description: 'View recent migrations on your account',
      icon: <History size={24} />,
      path: '#',
      color: theme === 'dark' ? 'from-purple-600/20 to-purple-800/20' : 'from-purple-100 to-purple-200'
    }
  ];

  const handleAddAccount = async (account: {
    accountName: string;
    accountId: string;
    region: string;
    accessKey: string;
    secretKey: string;
    sessionToken?: string;
  }) => {
    try {
      // Map form data to API format
      const newAccount: AwsAccount = {
        account_name: account.accountName,
        account_id: account.accountId,
        region: account.region,
        accesskey: account.accessKey,
        secretkey: account.secretKey,
        session_token: account.sessionToken,
        updated_by: 'current-user' // Replace with actual user info when available
      };

      await accountApi.saveAccount(newAccount);
      fetchAccounts(); // Refresh the list
    } catch (err) {
      console.error('Failed to add account:', err);
      setError('Failed to add account');
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await accountApi.deleteAccount(accountId);
        fetchAccounts(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete account:', err);
        setError('Failed to delete account');
      }
    }
  };
  
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`backdrop-blur-sm border rounded-xl p-6 mb-6 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50'
            : 'bg-white border-indigo-200/50 shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              Welcome to AWS Migration App
            </h1>
            <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
              Manage and monitor your AWS account migrations
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowAwsModal(true)}
              icon={<Cloud size={18} />}
            >
              Configure Accounts
            </Button>
          </div>
        </div>
      </motion.div>

      <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
        Quick Actions
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            className={`backdrop-blur-sm border rounded-xl overflow-hidden cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-700/50 hover:border-blue-500/50'
                : 'bg-white border-indigo-200/50 hover:border-indigo-400/50'
            }`}
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(70, 54, 141, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveItem(card.path);
              navigate(card.path);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={`h-2 bg-gradient-to-r ${card.color}`}></div>
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {card.icon}
                </div>
                <h3 className={`ml-3 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {card.title}
                </h3>
              </div>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                {card.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        className={`mt-8 backdrop-blur-sm border rounded-xl p-6 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50'
            : 'bg-white border-indigo-200/50 shadow-md'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Configured Accounts
          </h2>
          <Cloud className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} size={20} />
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin text-indigo-500" size={24} />
            <span className="ml-2 text-sm text-slate-500">Loading accounts...</span>
          </div>
        ) : error ? (
          <div className={`rounded-lg p-4 border bg-red-50 border-red-200 text-red-600`}>
            <p className="text-center py-2">{error}</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className={`rounded-lg p-4 border ${
            theme === 'dark'
              ? 'bg-slate-800/60 border-slate-700/50'
              : 'bg-slate-50 border-slate-200/50'
          }`}>
            <p className={`text-center py-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              No AWS accounts configured. Click "Configure AWS Accounts" to add one.
            </p>
          </div>
        ) : (
          <div className={`rounded-lg border overflow-hidden ${
            theme === 'dark'
              ? 'bg-slate-800/60 border-slate-700/50'
              : 'bg-white border-slate-200/50'
          }`}>
            <table className="w-full">
              <thead className={theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>Account Name</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>Account ID</th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>Region</th>
                  <th className={`px-4 py-3 text-right text-sm font-medium ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {accounts.map((account) => (
                  <tr key={account.id} className={theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}>
                    <td className={`px-4 py-3 text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}>{account.account_name}</td>
                    <td className={`px-4 py-3 text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}>{account.account_id}</td>
                    <td className={`px-4 py-3 text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}>{account.region}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveAccount(account.account_id)}
                        className={`p-1 rounded-full ${
                          theme === 'dark' 
                            ? 'text-red-400 hover:bg-red-500/20' 
                            : 'text-red-500 hover:bg-red-100'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
      
      <motion.div
        className={`mt-8 backdrop-blur-sm border rounded-xl p-6 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50'
            : 'bg-white border-indigo-200/50 shadow-md'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Recent Activity
          </h2>
          <BarChart2 className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} size={20} />
        </div>
        
        <div className={`rounded-lg p-4 border ${
          theme === 'dark'
            ? 'bg-slate-800/60 border-slate-700/50'
            : 'bg-slate-50 border-slate-200/50'
        }`}>
          <p className={`text-center py-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            No recent activity to display. Start your migration journey to see activity here.
          </p>
        </div>
      </motion.div>
      
      {showAwsModal && (
        <AWSAuthForm 
          onClose={() => setShowAwsModal(false)} 
          onAddAccount={handleAddAccount} 
        />
      )}
    </div>
  );
};

export default Dashboard;