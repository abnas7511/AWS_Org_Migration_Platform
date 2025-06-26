export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REQUIRES_ACTION = 'requires-action'
}

export enum PhaseType {
  ASSESS_EXISTING = 'assess-existing',
  PREPARE_NEW = 'prepare-new',
  VERIFY_NEW = 'verify-new',
  AWS_ATTACH_DETACH = 'aws-attach-detach',
  MIGRATION = 'migration',
  POST_MIGRATION = 'post-migration'
}

export enum AutomationType {
  FULLY_AUTOMATED = 'fully-automated',
  SEMI_AUTOMATED = 'semi-automated',
  MANUAL = 'manual'
}

export interface MigrationStep {
  id: number;
  title: string;
  description: string;
  phase: PhaseType;
  status: StepStatus;
  automationType: AutomationType;
  apiAvailable: boolean;
  estimatedTime: number; // in minutes
  requiresConfirmation: boolean;
  completedAt?: Date;
  notes?: string;
  slug?: string; 
}

export interface Phase {
  id: number;
  type: PhaseType;
  title: string;
  description: string;
  steps: MigrationStep[];
  status: StepStatus;
  progress: number; // 0-100
  icon: string;
}

export interface MigrationProcess {
  id: string;
  title: string;
  phases: Phase[];
  currentPhase: PhaseType;
  currentStep: number;
  status: StepStatus;
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
}

export interface AgentMessage {
  id: string;
  content: string;
  type: 'agent' | 'user' | 'system';
  timestamp: Date;
  status?: 'typing' | 'complete' | 'error';
  relatedStepId?: number;
}