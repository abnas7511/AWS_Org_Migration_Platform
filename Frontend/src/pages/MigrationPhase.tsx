import React from 'react';
import { motion } from 'framer-motion';
import { useMigration } from '../context/MigrationContext';
import StepCard from '../components/migration/StepCard';
import MigrationProgress from '../components/migration/MigrationProgress';
import Button from '../components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const MigrationPhase: React.FC = () => {
  const { 
    currentPhase, 
    currentStep,
    startStep,
    completeStep,
    goToPhase,
    migrationProcess,
    isLoading
  } = useMigration();
  
  if (!currentPhase) {
    return <div>Loading...</div>;
  }
  
  // Get the previous and next phase
  const currentPhaseIndex = migrationProcess.phases.findIndex(
    phase => phase.type === currentPhase.type
  );
  
  const previousPhase = currentPhaseIndex > 0
    ? migrationProcess.phases[currentPhaseIndex - 1]
    : null;
    
  const nextPhase = currentPhaseIndex < migrationProcess.phases.length - 1
    ? migrationProcess.phases[currentPhaseIndex + 1]
    : null;
  
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
        className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{currentPhase.title}</h1>
            <p className="text-slate-300">{currentPhase.description}</p>
          </div>
          
          <div className="flex mt-4 md:mt-0 space-x-3">
            {previousPhase && (
              <Button
                variant="outline"
                size="md"
                onClick={() => goToPhase(previousPhase.type)}
                icon={<ArrowLeft size={16} />}
                disabled={isLoading}
              >
                Previous Phase
              </Button>
            )}
            
            {nextPhase && (
              <Button
                variant="primary"
                size="md"
                onClick={() => goToPhase(nextPhase.type)}
                disabled={isLoading || currentPhase.progress < 100}
                icon={<ArrowRight size={16} />}
              >
                Next Phase
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <MigrationProgress />
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Steps</h2>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {currentPhase.steps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                isActive={currentStep?.id === step.id}
                onStart={() => handleStartStep(step.id)}
                onComplete={() => handleCompleteStep(step.id)}
              />
            ))}
          </motion.div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Phase Progress</h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
          >
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 text-sm">Progress</span>
                <span className="text-white font-medium">{currentPhase.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentPhase.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">Total Steps</span>
                <span className="text-white font-medium">{currentPhase.steps.length}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">Completed</span>
                <span className="text-green-400 font-medium">
                  {currentPhase.steps.filter(step => step.status === 'completed').length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">In Progress</span>
                <span className="text-blue-400 font-medium">
                  {currentPhase.steps.filter(step => step.status === 'in-progress').length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">Pending</span>
                <span className="text-slate-400 font-medium">
                  {currentPhase.steps.filter(step => step.status === 'pending').length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-300 text-sm">Requires Action</span>
                <span className="text-yellow-400 font-medium">
                  {currentPhase.steps.filter(step => step.status === 'requires-action').length}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <h3 className="text-white font-medium mb-2">Phase Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Automated Steps</span>
                  <span className="text-white">
                    {currentPhase.steps.filter(step => step.apiAvailable).length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-300">Manual Steps</span>
                  <span className="text-white">
                    {currentPhase.steps.filter(step => !step.apiAvailable).length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-300">Est. Completion Time</span>
                  <span className="text-white">
                    {currentPhase.steps.reduce((acc, step) => acc + step.estimatedTime, 0)} min
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MigrationPhase;