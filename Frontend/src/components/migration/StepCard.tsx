import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { MigrationStep, StepStatus, AutomationType } from '../../types/migration';
import Button from '../ui/Button';

interface StepCardProps {
  step: MigrationStep;
  isActive: boolean;
  onStart: () => void;
  onComplete: () => void;
}

const StepCard: React.FC<StepCardProps> = ({ 
  step, 
  isActive, 
  onStart, 
  onComplete 
}) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case StepStatus.COMPLETED:
        return <CheckCircle2 className="text-green-500" size={20} />;
      case StepStatus.IN_PROGRESS:
        return <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Clock className="text-blue-500" size={20} />
        </motion.div>;
      case StepStatus.FAILED:
        return <XCircle className="text-red-500" size={20} />;
      case StepStatus.REQUIRES_ACTION:
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <HelpCircle className="text-slate-400" size={20} />;
    }
  };

  const getAutomationBadge = () => {
    switch (step.automationType) {
      case AutomationType.FULLY_AUTOMATED:
        return (
          <span className="px-2 py-1 bg-green-900/40 text-green-400 text-xs rounded-full border border-green-600/30">
            Fully Automated
          </span>
        );
      case AutomationType.SEMI_AUTOMATED:
        return (
          <span className="px-2 py-1 bg-blue-900/40 text-blue-400 text-xs rounded-full border border-blue-600/30">
            Semi-Automated
          </span>
        );
      case AutomationType.MANUAL:
        return (
          <span className="px-2 py-1 bg-orange-900/40 text-orange-400 text-xs rounded-full border border-orange-600/30">
            Manual
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`border rounded-xl p-4 ${
        isActive
          ? 'border-blue-500/50 bg-gradient-to-br from-blue-900/30 to-indigo-900/30'
          : 'border-slate-700/50 bg-slate-800/30'
      } mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start">
        <div className="mr-3 mt-1">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-medium text-lg">{step.title}</h3>
              <p className="text-slate-300 text-sm mt-1">{step.description}</p>
            </div>
            <div>
              {getAutomationBadge()}
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 items-center text-xs text-slate-400">
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>Est. {step.estimatedTime} min</span>
            </div>
            
            {step.apiAvailable && (
              <div className="px-2 py-0.5 bg-slate-700/50 rounded-full">
                API Available
              </div>
            )}
            
            {step.requiresConfirmation && (
              <div className="px-2 py-0.5 bg-yellow-900/30 text-yellow-400 rounded-full border border-yellow-700/30">
                Requires Confirmation
              </div>
            )}
          </div>
          
          {isActive && (
            <div className="mt-4 flex space-x-3">
              {step.status === StepStatus.PENDING && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onStart}
                  icon={<Play size={16} />}
                >
                  Start Step
                </Button>
              )}
              
              {step.status === StepStatus.IN_PROGRESS && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onComplete}
                  icon={<CheckCircle size={16} />}
                >
                  Mark Complete
                </Button>
              )}
              
              {step.status === StepStatus.REQUIRES_ACTION && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onComplete}
                  icon={<CheckCircle size={16} />}
                >
                  Confirm Action
                </Button>
              )}
            </div>
          )}
          
          {step.notes && (
            <div className="mt-3 text-xs text-slate-400 italic">
              Note: {step.notes}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StepCard;