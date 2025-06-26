import React from 'react';
import { motion } from 'framer-motion';
import { PhaseType, StepStatus } from '../../types/migration';
import { useMigration } from '../../context/MigrationContext';
import { useTheme } from '../../context/ThemeContext';

interface MigrationProgressProps {
  className?: string;
}

const MigrationProgress: React.FC<MigrationProgressProps> = ({ className = '' }) => {
  const { migrationProcess } = useMigration();
  const { theme } = useTheme();
  
  const getStatusColor = (status: StepStatus): string => {
    switch (status) {
      case StepStatus.COMPLETED:
        return 'bg-green-500';
      case StepStatus.IN_PROGRESS:
        return theme === 'dark' ? 'bg-blue-500' : 'bg-indigo-500';
      case StepStatus.FAILED:
        return 'bg-red-500';
      case StepStatus.REQUIRES_ACTION:
        return 'bg-yellow-500';
      default:
        return theme === 'dark' ? 'bg-slate-600' : 'bg-indigo-200';
    }
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={theme === 'dark' ? 'text-white font-medium' : 'text-slate-800 font-medium'}>
          Migration Progress
        </h3>
        <span className={theme === 'dark' ? 'text-slate-300 text-sm' : 'text-slate-600 text-sm'}>
          {migrationProcess.progress}% Complete
        </span>
      </div>
      
      <div className={`relative h-2 rounded-full overflow-hidden ${
        theme === 'dark' ? 'bg-slate-700' : 'bg-indigo-100'
      }`}>
        <motion.div
          className={`h-full ${theme === 'dark' ? 'bg-blue-500' : 'bg-indigo-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${migrationProcess.progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      
      <div className="flex justify-between mt-6 relative">
        {/* Continuous background line */}
        <div className={`absolute top-[10px] left-[10px] right-[10px] h-[2px] ${
          theme === 'dark' ? 'bg-slate-700' : 'bg-indigo-200'
        } -z-10`}></div>
        
        {/* Continuous progress line */}
        <motion.div 
          className="absolute top-[10px] left-[10px] h-[2px] bg-green-500 -z-10"
          initial={{ width: 0 }}
          animate={{ 
            width: `calc((100% - 20px) * ${Math.min(migrationProcess.progress, 100) / 100})`
          }}
          transition={{ duration: 0.5 }}
        />
        
        {migrationProcess.phases.map((phase, index) => {
          const isCurrentPhase = migrationProcess.currentPhase === phase.type;
          const phaseColor = getStatusColor(phase.status);
          
          return (
            <div key={phase.id} className="flex flex-col items-center relative z-10">
              <motion.div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${phaseColor} ${
                  isCurrentPhase 
                    ? theme === 'dark'
                      ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                      : 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white'
                    : ''
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrentPhase ? 1.2 : 1 }}
                transition={{ duration: 0.3 }}
              >
                {phase.status === StepStatus.COMPLETED && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </motion.div>
              
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium ${
                  isCurrentPhase 
                    ? theme === 'dark' ? 'text-blue-400' : 'text-indigo-700'
                    : theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {phase.type}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MigrationProgress;