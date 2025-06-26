import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useMigration } from '../context/MigrationContext';
import { useTheme } from '../context/ThemeContext';
import { PhaseType, StepStatus } from '../types/migration';
import PhaseStepsView from '../components/migration/PhaseStepsView';
import Button from '../components/ui/Button';
import { ArrowLeft, Bot } from 'lucide-react';
import AccountSelector from '../components/AccountSelector';

interface PhaseDetailProps {}

const PhaseDetail: React.FC<PhaseDetailProps> = () => {
  const { phaseType } = useParams<{ phaseType: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { 
    migrationProcess, 
    currentPhase, 
    startStep, 
    completeStep, 
    goToStep,
    isLoading 
  } = useMigration();
  
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<number | null>(null);
  
  // Find the phase based on the URL parameter
  const phase = migrationProcess.phases.find(
    p => p.type === phaseType as PhaseType
  );
  
  if (!phase) {
    return <div className={`p-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Phase not found</div>;
  }
  
  const handleStepClick = (stepId: number) => {
    setCurrentStepId(stepId);
    goToStep(stepId);
    
    const step = phase.steps.find(s => s.id === stepId);
    if (step && !step.apiAvailable) {
      setShowAgentModal(true);
    } else {
      // Navigate to step detail page using slug instead of ID
      const stepSlug = step?.slug || stepId.toString();
      navigate(`/phase/${phaseType}/${stepSlug}`);
    }
  };
  
  const handleStartStep = (stepId: number) => {
    startStep(stepId);
  };
  
  const handleCompleteStep = (stepId: number) => {
    completeStep(stepId);
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
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/migration-journey')}
              icon={<ArrowLeft size={18} />}
              className="mr-3"
            />
            <div>
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {phase.title}
              </h1>
              <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                {phase.description}
              </p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <AccountSelector />
          </div>
        </div>
      </motion.div>
      
      <div>
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          Phase Steps
        </h2>
        <PhaseStepsView 
          steps={phase.steps}
          onStepClick={handleStepClick}
          onStartStep={handleStartStep}
          onCompleteStep={handleCompleteStep}
        />
      </div>
      
      {/* Agent Modal for Manual Steps */}
      {showAgentModal && (
        <motion.div
          className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 ${
            theme === 'dark' ? 'bg-slate-900/80' : 'bg-slate-500/50'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`rounded-xl p-6 max-w-md w-full border ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-indigo-200 shadow-lg'
            }`}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-indigo-600'
              }`}>
                <Bot size={20} className="text-white" />
              </div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Manual Step Required
              </h3>
            </div>
            
            <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              This step requires manual intervention. Agent can guide you through the process, but you'll need to perform some actions yourself.
            </p>
            
            <div className={`rounded-lg p-4 mb-4 ${
              theme === 'dark' ? 'bg-slate-700/50' : 'bg-indigo-50'
            }`}>
              <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {phase.steps.find(s => s.id === currentStepId)?.title}
              </h4>
              <p className={theme === 'dark' ? 'text-slate-400 text-sm' : 'text-slate-600 text-sm'}>
                {phase.steps.find(s => s.id === currentStepId)?.description}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAgentModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowAgentModal(false);
                  const step = phase.steps.find(s => s.id === currentStepId);
                  const stepSlug = step?.slug || currentStepId?.toString() || "";
                  navigate(`/phase/${phaseType}/${stepSlug}`);
                }}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PhaseDetail;