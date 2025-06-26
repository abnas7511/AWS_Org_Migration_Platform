import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MigrationProcess, 
  Phase, 
  MigrationStep, 
  PhaseType, 
  StepStatus, 
  AgentMessage 
} from '../types/migration';
import { migrationPhases } from '../data/migrationPhases';
import { v4 as uuidv4 } from 'uuid';

interface MigrationContextType {
  migrationProcess: MigrationProcess;
  currentPhase: Phase | null;
  currentStep: MigrationStep | null;
  messages: AgentMessage[];
  addMessage: (message: Omit<AgentMessage, 'id' | 'timestamp'>) => void;
  startMigration: () => void;
  completeStep: (stepId: number) => void;
  startStep: (stepId: number) => void;
  requireAction: (stepId: number) => void;
  setStepFailed: (stepId: number) => void;
  goToPhase: (phaseType: PhaseType) => void;
  goToStep: (stepId: number) => void;
  isLoading: boolean;
}

const MigrationContext = createContext<MigrationContextType | undefined>(undefined);

export const MigrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [migrationProcess, setMigrationProcess] = useState<MigrationProcess>({
    id: uuidv4(),
    title: 'AWS Account Migration',
    phases: migrationPhases,
    currentPhase: PhaseType.ASSESS_EXISTING,
    currentStep: 1,
    status: StepStatus.PENDING,
    progress: 0,
    startedAt: new Date()
  });

  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: uuidv4(),
      content: "Welcome to AWS Migration Agent. I'm here to help you migrate your AWS accounts from one organization to another. Would you like to start the migration process?",
      type: 'agent',
      timestamp: new Date(),
      status: 'complete'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [currentStep, setCurrentStep] = useState<MigrationStep | null>(null);

  useEffect(() => {
    const phase = migrationProcess.phases.find(p => p.type === migrationProcess.currentPhase) || null;
    setCurrentPhase(phase);

    if (phase) {
      const step = phase.steps.find(s => s.id === migrationProcess.currentStep) || null;
      setCurrentStep(step);
    }
  }, [migrationProcess]);

  const calculateProgress = () => {
    const allSteps = migrationProcess.phases.flatMap(phase => phase.steps);
    const completedSteps = allSteps.filter(step => step.status === StepStatus.COMPLETED).length;
    // Ensure we return 100% when all steps are completed
    if (completedSteps === allSteps.length) {
      return 100;
    }
    // Otherwise calculate normally, but round to nearest integer
    return Math.round((completedSteps / allSteps.length) * 100);
  };

  const updatePhaseProgress = (phases: Phase[]): Phase[] => {
    return phases.map(phase => {
      const completedSteps = phase.steps.filter(step => step.status === StepStatus.COMPLETED).length;
      // Ensure we return 100% when all steps in a phase are completed
      const progress = phase.steps.length > 0 
        ? (completedSteps === phase.steps.length ? 100 : Math.round((completedSteps / phase.steps.length) * 100))
        : 0;
      
      let status = StepStatus.PENDING;
      if (progress === 100) {
        status = StepStatus.COMPLETED;
      } else if (progress > 0) {
        status = StepStatus.IN_PROGRESS;
      }
      
      return { ...phase, progress, status };
    });
  };

  const addMessage = (message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const newMessage: AgentMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startMigration = () => {
    setIsLoading(true);
    
    // Add agent message
    addMessage({
      content: "I'll guide you through the migration process. First, we'll assess your existing AWS environment. Let's start with checking for resources shared via RAM.",
      type: 'agent',
      status: 'complete'
    });
    
    // Update migration process
    setMigrationProcess(prev => ({
      ...prev,
      status: StepStatus.IN_PROGRESS,
      currentPhase: PhaseType.ASSESS_EXISTING,
      currentStep: 1
    }));
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const startStep = (stepId: number) => {
    setIsLoading(true);
    
    // Update step status
    setMigrationProcess(prev => {
      const updatedPhases = prev.phases.map(phase => {
        const updatedSteps = phase.steps.map(step => {
          if (step.id === stepId) {
            return { ...step, status: StepStatus.IN_PROGRESS };
          }
          return step;
        });
        return { ...phase, steps: updatedSteps };
      });
      
      return {
        ...prev,
        phases: updatePhaseProgress(updatedPhases),
        currentStep: stepId
      };
    });
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const completeStep = (stepId: number) => {
    setIsLoading(true);
    
    // Update step status
    setMigrationProcess(prev => {
      const updatedPhases = prev.phases.map(phase => {
        const updatedSteps = phase.steps.map(step => {
          if (step.id === stepId) {
            return { 
              ...step, 
              status: StepStatus.COMPLETED,
              completedAt: new Date()
            };
          }
          return step;
        });
        return { ...phase, steps: updatedSteps };
      });
      
      // Find next step
      let nextStep = stepId;
      let allStepsCompleted = true;
      
      const allSteps = updatedPhases.flatMap(phase => phase.steps);
      const currentStepIndex = allSteps.findIndex(step => step.id === stepId);
      
      if (currentStepIndex < allSteps.length - 1) {
        nextStep = allSteps[currentStepIndex + 1].id;
        allStepsCompleted = false;
      }
      
      // Calculate new progress
      const progress = calculateProgress();
      
      return {
        ...prev,
        phases: updatePhaseProgress(updatedPhases),
        currentStep: nextStep,
        progress,
        status: allStepsCompleted ? StepStatus.COMPLETED : StepStatus.IN_PROGRESS,
        completedAt: allStepsCompleted ? new Date() : undefined
      };
    });
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const requireAction = (stepId: number) => {
    // Update step status
    setMigrationProcess(prev => {
      const updatedPhases = prev.phases.map(phase => {
        const updatedSteps = phase.steps.map(step => {
          if (step.id === stepId) {
            return { ...step, status: StepStatus.REQUIRES_ACTION };
          }
          return step;
        });
        return { ...phase, steps: updatedSteps };
      });
      
      return {
        ...prev,
        phases: updatePhaseProgress(updatedPhases)
      };
    });
  };

  const setStepFailed = (stepId: number) => {
    // Update step status
    setMigrationProcess(prev => {
      const updatedPhases = prev.phases.map(phase => {
        const updatedSteps = phase.steps.map(step => {
          if (step.id === stepId) {
            return { ...step, status: StepStatus.FAILED };
          }
          return step;
        });
        return { ...phase, steps: updatedSteps };
      });
      
      return {
        ...prev,
        phases: updatePhaseProgress(updatedPhases)
      };
    });
  };

  const goToPhase = (phaseType: PhaseType) => {
    const phase = migrationProcess.phases.find(p => p.type === phaseType);
    if (phase && phase.steps.length > 0) {
      const firstStep = phase.steps[0];
      
      setMigrationProcess(prev => ({
        ...prev,
        currentPhase: phaseType,
        currentStep: firstStep.id
      }));
    }
  };

  const goToStep = (stepId: number) => {
    // Find the step and its phase
    let phaseType: PhaseType | null = null;
    
    migrationProcess.phases.forEach(phase => {
      const foundStep = phase.steps.find(step => step.id === stepId);
      if (foundStep) {
        phaseType = phase.type;
      }
    });
    
    if (phaseType) {
      setMigrationProcess(prev => ({
        ...prev,
        currentPhase: phaseType,
        currentStep: stepId
      }));
    }
  };

  const value = {
    migrationProcess,
    currentPhase,
    currentStep,
    messages,
    addMessage,
    startMigration,
    completeStep,
    startStep,
    requireAction,
    setStepFailed,
    goToPhase,
    goToStep,
    isLoading
  };

  return (
    <MigrationContext.Provider value={value}>
      {children}
    </MigrationContext.Provider>
  );
};

export const useMigration = () => {
  const context = useContext(MigrationContext);
  if (context === undefined) {
    throw new Error('useMigration must be used within a MigrationProvider');
  }
  return context;
};