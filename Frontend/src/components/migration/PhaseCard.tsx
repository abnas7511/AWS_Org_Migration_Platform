import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phase } from '../../types/migration';
import { useTheme } from '../../context/ThemeContext';

interface PhaseCardProps {
  phase: Phase;
  isActive: boolean;
  onClick: () => void;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ phase, isActive, onClick }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Use phase ID as the number
  
  const getStatusColor = () => {
    switch (phase.status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return theme === 'dark' ? 'bg-blue-500' : 'bg-indigo-500';
      case 'requires-action':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return theme === 'dark' ? 'bg-slate-500' : 'bg-slate-400';
    }
  };
  
  const handleClick = () => {
    // Navigate to the phase detail page
    navigate(`/phase/${phase.type}`);
  };
  
  return (
    <motion.div
      className={`backdrop-blur-sm border rounded-xl overflow-hidden cursor-pointer ${
        theme === 'dark'
          ? `bg-slate-800/80 ${isActive ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-slate-700/50'}`
          : `bg-white ${isActive ? 'border-indigo-400/50 shadow-lg shadow-indigo-300/20' : 'border-indigo-200/50'}`
      }`}
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(70, 54, 141, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isActive 
              ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white' 
              : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-indigo-100 text-indigo-700'
          }`}>
            <span className="font-bold text-lg">
              {phase.id}
            </span>
          </div>
          <div className="ml-3">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {phase.title}
            </h3>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-2`}></div>
              <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {phase.status.charAt(0).toUpperCase() + phase.status.slice(1).replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          {phase.description}
        </p>
        
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Progress</span>
            <span className={theme === 'dark' ? 'text-white font-medium' : 'text-indigo-800 font-medium'}>
              {phase.progress}%
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-indigo-100'
          }`}>
            <motion.div
              className={`h-full ${
                phase.status === 'completed' 
                  ? 'bg-green-500' 
                  : theme === 'dark' ? 'bg-blue-500' : 'bg-indigo-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${phase.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        <div className={`flex justify-between text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>{phase.steps.length} steps</span>
          <span>
            {phase.steps.filter(step => step.status === 'completed').length} completed
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PhaseCard;