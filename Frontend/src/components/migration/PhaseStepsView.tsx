import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import { MigrationStep, StepStatus, AutomationType } from '../../types/migration';
import Button from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';

interface PhaseStepsViewProps {
  steps: MigrationStep[];
  onStepClick: (stepId: number) => void;
  onStartStep: (stepId: number) => void;
  onCompleteStep: (stepId: number) => void;
}

const PhaseStepsView: React.FC<PhaseStepsViewProps> = ({
  steps,
  onStepClick,
  onStartStep,
  onCompleteStep
}) => {
  const { theme } = useTheme();
  
  const getStatusIcon = (status: StepStatus, automationType: AutomationType) => {
    switch (status) {
      case StepStatus.COMPLETED:
        return <Check className="text-green-500" size={18} />;
      case StepStatus.IN_PROGRESS:
        return <motion.div 
          className="w-4 h-4 rounded-full bg-blue-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />;
      case StepStatus.REQUIRES_ACTION:
        return <AlertTriangle className="text-yellow-500" size={18} />;
      case StepStatus.FAILED:
        return <AlertTriangle className="text-red-500" size={18} />;
      default:
        return <Clock className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} size={18} />;
    }
  };

  const getAutomationBadge = (automationType: AutomationType) => {
    switch (automationType) {
      case AutomationType.FULLY_AUTOMATED:
        return (
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            theme === 'dark'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            Automated
          </span>
        );
      case AutomationType.SEMI_AUTOMATED:
        return (
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            theme === 'dark'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-purple-100 text-purple-700 border border-purple-200'
          }`}>
            Semi-Automated
          </span>
        );
      case AutomationType.MANUAL:
        return (
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            theme === 'dark'
              ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              : 'bg-slate-200 text-slate-700 border border-slate-300'
          }`}>
            Manual
          </span>
        );
    }
  };

  return (
    <div className={`backdrop-blur-sm border rounded-xl overflow-hidden ${
      theme === 'dark'
        ? 'bg-slate-900/80 border-slate-700/50'
        : 'bg-white/80 border-slate-200/50'
    }`}>
      <div className={`grid grid-cols-12 px-4 py-3 border-b text-sm font-medium ${
        theme === 'dark'
          ? 'bg-slate-800/80 border-slate-700/50 text-slate-300'
          : 'bg-slate-100/80 border-slate-200/50 text-slate-700'
      }`}>
        <div className="col-span-1">Status</div>
        <div className="col-span-5">Step</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Est. Time</div>
        <div className="col-span-2">Actions</div>
      </div>
      
      <div className={`divide-y ${
        theme === 'dark' ? 'divide-slate-700/30' : 'divide-slate-200/70'
      }`}>
        {steps.map((step) => (
          <motion.div 
            key={step.id}
            className={`grid grid-cols-12 px-4 py-3 items-center cursor-pointer ${
              step.status === StepStatus.IN_PROGRESS 
                ? theme === 'dark' ? 'bg-blue-900/10' : 'bg-blue-50/50' 
                : ''
            } ${
              theme === 'dark'
                ? 'hover:bg-slate-800/40'
                : 'hover:bg-slate-100/40'
            }`}
            onClick={() => onStepClick(step.id)}
            whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.5)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="col-span-1 flex justify-center">
              {getStatusIcon(step.status, step.automationType)}
            </div>
            
            <div className="col-span-5">
              <h3 className={theme === 'dark' ? 'text-white font-medium' : 'text-slate-800 font-medium'}>
                {step.title}
              </h3>
              <p className={theme === 'dark' ? 'text-slate-400 text-sm mt-1' : 'text-slate-600 text-sm mt-1'}>
                {step.description}
              </p>
            </div>
            
            <div className="col-span-2">
              {getAutomationBadge(step.automationType)}
            </div>
            
            <div className={`col-span-2 text-sm ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {step.estimatedTime} sec
            </div>
            
            <div className="col-span-2 flex space-x-2">              
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onStepClick(step.id);
                }}
                icon={<ArrowRight size={14} />}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PhaseStepsView;