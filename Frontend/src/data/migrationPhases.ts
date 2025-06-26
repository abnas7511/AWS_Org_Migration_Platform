import { Phase, PhaseType, StepStatus } from '../types/migration';
import { getStepsByPhase } from './migrationSteps';

export const migrationPhases: Phase[] = [
  {
    id: 1,
    type: PhaseType.ASSESS_EXISTING,
    title: 'Assess Existing Environment',
    description: 'Evaluate current AWS environment and identify migration requirements',
    steps: getStepsByPhase(PhaseType.ASSESS_EXISTING),
    status: StepStatus.PENDING,
    progress: 0,
    icon: 'Search'
  },
  {
    id: 2,
    type: PhaseType.PREPARE_NEW,
    title: 'Prepare New Environment',
    description: 'Set up and configure the target AWS environment for migration',
    steps: getStepsByPhase(PhaseType.PREPARE_NEW),
    status: StepStatus.PENDING,
    progress: 0,
    icon: 'Settings'
  },
  {
    id: 3,
    type: PhaseType.VERIFY_NEW,
    title: 'Verify New Environment',
    description: 'Validate the new environment configuration before migration',
    steps: getStepsByPhase(PhaseType.VERIFY_NEW),
    status: StepStatus.PENDING,
    progress: 0,
    icon: 'CheckCircle'
  },
  {
    id: 4,
    type: PhaseType.AWS_ATTACH_DETACH,
    title: 'Attach/Detach',
    description: 'Manually attach or detach AWS accounts as needed for the migration process',
    steps: getStepsByPhase(PhaseType.AWS_ATTACH_DETACH),
    status: StepStatus.PENDING,
    progress: 0,
    icon: 'FileCode'
  },
  {
    id: 5,
    type: PhaseType.MIGRATION,
    title: 'Migration',
    description: 'Execute the migration of AWS accounts to the new organization',
    steps: getStepsByPhase(PhaseType.MIGRATION),
    status: StepStatus.PENDING,
    progress: 0,
    icon: 'MoveRight'
  },
  {
    id: 6,
    type: PhaseType.POST_MIGRATION,
    title: 'Post Migration',
    description: 'Complete final tasks and validate the migration was successful',
    steps: getStepsByPhase(PhaseType.POST_MIGRATION),
    status: StepStatus.PENDING,
    progress: 0,
    icon: 'CheckSquare'
  }
];