import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMigration } from '../context/MigrationContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import PhaseCard from '../components/migration/PhaseCard';
import AccountSelector from '../components/AccountSelector';

const MigrationJourney: React.FC = () => {
  const { migrationProcess, goToPhase } = useMigration();
  const { theme } = useTheme();
  const { setActiveItem } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Set active sidebar item on component mount
  useEffect(() => {
    setActiveItem('/migration-journey');
  }, [setActiveItem]);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isDropdownOpen && !target.closest('.account-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
            <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              Your Migration Journey Starts Here
            </h1>
            <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
              Analytics for your Migration Journey, Includes Statistics, Progress. Select Specific Account.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <AccountSelector />
          </div>
        </div>
      </motion.div>

      <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
        Migration Phases
      </h2>
      
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {migrationProcess.phases.map((phase) => (
          <motion.div key={phase.id} variants={item}>
            <PhaseCard
              phase={phase}
              isActive={migrationProcess.currentPhase === phase.type}
              onClick={() => {
                setActiveItem(`/phase/${phase.type}`);
                goToPhase(phase.type);
              }}
            />
          </motion.div>
        ))}
        

      </motion.div>
      
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
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          Migration Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-lg p-4 border ${
            theme === 'dark'
              ? 'bg-slate-800/60 border-slate-700/50'
              : 'bg-indigo-50/60 border-indigo-200/50'
          }`}>
            <p className={theme === 'dark' ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>
              Total Steps
            </p>
            <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-indigo-800'}`}>
              37
            </p>
          </div>
          
          <div className={`rounded-lg p-4 border ${
            theme === 'dark'
              ? 'bg-slate-800/60 border-slate-700/50'
              : 'bg-indigo-50/60 border-indigo-200/50'
          }`}>
            <p className={theme === 'dark' ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>
              Completed
            </p>
            <p className="text-2xl font-bold text-green-500 mt-1">
              {migrationProcess.phases.flatMap(phase => phase.steps).filter(step => step.status === 'completed').length}
            </p>
          </div>
          
          <div className={`rounded-lg p-4 border ${
            theme === 'dark'
              ? 'bg-slate-800/60 border-slate-700/50'
              : 'bg-indigo-50/60 border-indigo-200/50'
          }`}>
            <p className={theme === 'dark' ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>
              In Progress
            </p>
            <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-blue-500' : 'text-indigo-500'}`}>
              {migrationProcess.phases.flatMap(phase => phase.steps).filter(step => step.status === 'in-progress').length}
            </p>
          </div>
          
          <div className={`rounded-lg p-4 border ${
            theme === 'dark'
              ? 'bg-slate-800/60 border-slate-700/50'
              : 'bg-indigo-50/60 border-indigo-200/50'
          }`}>
            <p className={theme === 'dark' ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>
              Requires Action
            </p>
            <p className="text-2xl font-bold text-yellow-500 mt-1">
              {migrationProcess.phases.flatMap(phase => phase.steps).filter(step => step.status === 'requires-action').length}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MigrationJourney;