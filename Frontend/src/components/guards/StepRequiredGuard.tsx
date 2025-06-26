import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMigration } from '../../context/MigrationContext';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';
import { motion } from 'framer-motion';
import { StepStatus, PhaseType } from '../../types/migration';

interface StepRequiredGuardProps {
  children: React.ReactNode;
  stepId: number;
  phaseType: string;
}

const StepRequiredGuard: React.FC<StepRequiredGuardProps> = ({ children, stepId, phaseType }) => {
  const { migrationProcess } = useMigration();
  const { theme } = useTheme();
  const { setActiveItem } = useSidebar();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // Find the current phase
  const currentPhase = migrationProcess.phases.find(p => p.type === phaseType);
  
  if (!currentPhase) {
    return <>{children}</>; // If phase not found, just render children
  }
  
  // Get all phases in order
  const sortedPhases = [...migrationProcess.phases].sort((a, b) => a.id - b.id);
  
  // Find the current phase's index
  const currentPhaseIndex = sortedPhases.findIndex(p => p.type === phaseType);
  
  // Check if this is the first step in a phase after the first phase
  const isFirstStepInLaterPhase = currentPhaseIndex > 0 && 
    currentPhase.steps.find(s => s.id === stepId) === 
    currentPhase.steps.sort((a, b) => a.id - b.id)[0];
  
  // If this is the first step in a phase after the first phase,
  // check if all steps in previous phases are completed
  if (isFirstStepInLaterPhase) {
    // Get all previous phases
    const previousPhases = sortedPhases.slice(0, currentPhaseIndex);
    
    // Check if all steps in all previous phases are completed
    const allPreviousPhasesCompleted = previousPhases.every(phase => 
      phase.steps.every(step => step.status === StepStatus.COMPLETED)
    );
    
    // If not all previous phases are completed, show modal with link to previous phase
    if (!allPreviousPhasesCompleted) {
      // Find the first incomplete phase
      const incompletePhase = previousPhases.find(phase => 
        !phase.steps.every(step => step.status === StepStatus.COMPLETED)
      );
      
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
                    Previous Phase Required
                  </h2>
                </div>
                
                <p className={`mb-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  You need to complete all steps in the previous phase before starting this one.
                  Please go back to the {incompletePhase?.title || 'previous phase'} and complete all required steps.
                </p>
                
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (incompletePhase) {
                        setActiveItem(`/phase/${incompletePhase.type}`);
                        navigate(`/phase/${incompletePhase.type}`);
                      } else {
                        navigate('/migration-journey');
                      }
                    }}
                    icon={<ArrowLeft size={16} />}
                  >
                    Go to Previous Phase
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }
  }
  
  // For steps within the same phase, check if previous steps are completed
  // Sort steps by ID to determine sequence
  const sortedSteps = [...currentPhase.steps].sort((a, b) => a.id - b.id);
  
  // Find the current step's index in the sorted array
  const currentStepIndex = sortedSteps.findIndex(s => s.id === stepId);
  
  // If this is the first step or we can't find the step, allow access
  if (currentStepIndex <= 0) {
    return <>{children}</>;
  }
  
  // Check if all previous steps in this phase are completed
  const previousStepsCompleted = sortedSteps
    .slice(0, currentStepIndex)
    .every(step => step.status === StepStatus.COMPLETED);
  
  // If all previous steps are completed, allow access
  if (previousStepsCompleted) {
    return <>{children}</>;
  }
  
  // Otherwise, show the modal for incomplete steps in current phase
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
                Previous Steps Required
              </h2>
            </div>
            
            <p className={`mb-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              You need to complete all previous steps before accessing this one.
              Please go back to the phase details and complete the required steps in order.
            </p>
            
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setActiveItem(`/phase/${phaseType}`);
                  navigate(`/phase/${phaseType}`);
                }}
                icon={<ArrowLeft size={16} />}
              >
                Back to Phase
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StepRequiredGuard;