import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../context/AccountContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import { motion } from 'framer-motion';

interface AccountRequiredGuardProps {
  children: React.ReactNode;
}

const AccountRequiredGuard: React.FC<AccountRequiredGuardProps> = ({ children }) => {
  const { hasConfiguredAccounts, loading } = useAccount();
  const { theme } = useTheme();
  const { setActiveItem } = useSidebar();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // If still loading, show a loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no accounts are configured, show the children with a modal overlay
  if (!hasConfiguredAccounts) {
    return (
      <div className="relative">
        {/* Blurred background with children */}
        <div className="filter blur-sm pointer-events-none">
          {children}
        </div>
        
        {/* Modal popup */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-md w-full rounded-xl shadow-lg ${
              isDark 
                ? 'bg-slate-900 border border-slate-700' 
                : 'bg-white border border-slate-200'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-full mr-3 ${
                  isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
                }`}>
                  <AlertTriangle className={isDark ? 'text-yellow-500' : 'text-yellow-600'} size={20} />
                </div>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Account Configuration Required
                </h2>
              </div>
              
              <p className={`mb-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Please configure at least one AWS account before proceeding with the migration process.
              </p>
              
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    setActiveItem('/dashboard');
                    navigate('/dashboard');
                  }}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // If accounts are configured, render the children
  return <>{children}</>;
};

export default AccountRequiredGuard;