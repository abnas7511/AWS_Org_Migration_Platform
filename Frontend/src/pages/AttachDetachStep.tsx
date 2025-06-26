import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMigration } from '../context/MigrationContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, ExternalLink, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const AttachDetachStep: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { completeStep } = useMigration();
  const [isCompleting, setIsCompleting] = useState(false);
  
  const isDark = theme === 'dark';
  
  const handleComplete = () => {
    setIsCompleting(true);
    // Complete step ID 38 (AWS Attach/Detach step)
    setTimeout(() => {
      completeStep(38);
      navigate('/migration-journey');
    }, 1000);
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`backdrop-blur-sm border rounded-xl p-6 mb-6 ${
          isDark
            ? 'bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50'
            : 'bg-white border-indigo-200/50 shadow-md'
        }`}
      >
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/migration-journey')}
            icon={<ArrowLeft size={18} />}
            className="mr-3"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                AWS Account Attach/Detach
              </h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isDark
                  ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                Manual Step
              </span>
            </div>
            <p className={isDark ? 'text-slate-300 mt-1' : 'text-slate-600 mt-1'}>
              Manually attach or detach AWS accounts as needed for the migration process
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className={`backdrop-blur-sm border rounded-xl p-6 mb-6 ${
            isDark
              ? 'bg-slate-900/80 border-slate-700/50'
              : 'bg-white border-indigo-200/50 shadow-md'
          }`}>
            <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Manual Action Required
            </h2>
            
            <div className={`mb-6 p-6 rounded-lg ${isDark ? 'bg-slate-800/80' : 'bg-slate-50/80'}`}>
              <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                This step requires manual intervention in the AWS Console. Please follow these steps:
              </p>
              
              <ol className={`list-decimal list-inside space-y-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <li>Log in to the AWS Management Console</li>
                <li>Navigate to the Organizations service</li>
                <li>Select the account you wish to attach/detach</li>
                <li>Follow the AWS documentation to complete the process</li>
                <li>Verify the changes have been applied correctly</li>
                <li>Return here and click "Complete Step" when finished</li>
              </ol>
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => window.open('https://console.aws.amazon.com/organizations', '_blank')}
                icon={<ExternalLink size={16} />}
              >
                Open AWS Console
              </Button>
              
              <Button
                variant="primary"
                onClick={handleComplete}
                isLoading={isCompleting}
                icon={<CheckCircle size={16} />}
              >
                Complete Step
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <div className={`backdrop-blur-sm border rounded-xl p-6 ${
            isDark
              ? 'bg-slate-900/80 border-slate-700/50'
              : 'bg-white border-indigo-200/50 shadow-md'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Important Notes
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Required Permissions
                </h3>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  You need administrative access to perform this action
                </p>
              </div>
              
              <div>
                <h3 className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Estimated Time
                </h3>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  30 minutes
                </p>
              </div>
              
              <div>
                <h3 className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Documentation
                </h3>
                <a 
                  href="https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`font-medium ${isDark ? 'text-blue-400' : 'text-indigo-600'} hover:underline`}
                >
                  AWS Organizations Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachDetachStep;