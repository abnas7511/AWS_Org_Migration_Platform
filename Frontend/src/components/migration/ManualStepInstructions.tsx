import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, FileText, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { MigrationStep } from '../../types/migration';
import Button from '../ui/Button';

interface ManualStepInstructionsProps {
  step: MigrationStep;
  onComplete: () => void;
  isCompleting: boolean;
  completed?: boolean; 
}

const ManualStepInstructions: React.FC<ManualStepInstructionsProps> = ({ 
  step, 
  onComplete,
  isCompleting,
  completed = false
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Instructions based on step ID or slug
  const getInstructions = () => {
    // You can customize instructions based on step ID or slug
    switch (step.slug) {
      case 'enable-mfa':
        return [
          'Log in to the AWS Management Console with root user credentials',
          'Navigate to IAM dashboard',
          'Select "Security credentials" from the dropdown menu',
          'Under "Multi-factor authentication (MFA)", click "Activate MFA"',
          'Choose your MFA device type (virtual or hardware)',
          'Follow the prompts to register your device',
          'Verify the MFA setup by entering two consecutive authentication codes',
          'Return here and click "Complete Step" when finished'
        ];
      case 'setup-invoicing':
        return [
          'Log in to the AWS Management Console',
          'Navigate to Billing dashboard',
          'Select "Payment preferences" from the menu',
          'Under "Payment method", click "Add payment method"',
          'Select "Invoice" as the payment method',
          'Fill in the required billing information',
          'Submit the form and wait for AWS approval',
          'Return here and click "Complete Step" when finished'
        ];
      default:
        return [
          'Log in to the AWS Management Console',
          'Navigate to the appropriate service',
          'Follow the AWS documentation for this specific task',
          'Verify your changes have been applied correctly',
          'Return here and click "Complete Step" when finished'
        ];
    }
  };

  // Documentation URL based on step ID or slug
  const getDocumentationUrl = () => {
    switch (step.slug) {
      case 'enable-mfa':
        return 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_enable_virtual.html';
      case 'setup-invoicing':
        return 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/manage-account-payment.html';
      default:
        return 'https://docs.aws.amazon.com/';
    }
  };

  // AWS Console URL based on step ID or slug
  const getConsoleUrl = () => {
    switch (step.slug) {
      case 'enable-mfa':
        return 'https://console.aws.amazon.com/iam/home#/security_credentials';
      case 'setup-invoicing':
        return 'https://console.aws.amazon.com/billing/home#/paymentpreferences';
      default:
        return 'https://console.aws.amazon.com/';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-xl p-6 ${
          isDark 
            ? 'bg-slate-800/50 border-slate-700/50' 
            : 'bg-white border-indigo-200/50 shadow-sm'
        }`}
      >
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Manual Step Instructions
        </h2>
        
        <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
          <ol className={`list-decimal list-inside space-y-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {getInstructions().map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.open(getConsoleUrl(), '_blank')}
              icon={<ExternalLink size={16} />}
            >
              Open AWS Console
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(getDocumentationUrl(), '_blank')}
              icon={<FileText size={16} />}
            >
              View Documentation
            </Button>
          </div>
          
          <Button
            variant="primary"
            onClick={onComplete}
            isLoading={isCompleting}
            icon={<CheckCircle size={16} />}
            disabled={completed}
          >
            {completed ? "Completed" : "Complete Step"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ManualStepInstructions;