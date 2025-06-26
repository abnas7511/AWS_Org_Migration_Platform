from sqlalchemy.orm import Session
from app.db.PG import StepExecution, MigrationProcess, Phase, Step, PhaseType, StepStatus, AutomationType, SessionLocal, AccountManagement
from app.db.schemas import StepExecutionCreate
from datetime import datetime

# Phase sequence definition
PHASE_SEQUENCE = [
    PhaseType.ASSESS_EXISTING,
    PhaseType.PREPARE_NEW,
    PhaseType.MIGRATION,
    PhaseType.VERIFY_NEW,
    PhaseType.POST_MIGRATION
]

# Phase templates with metadata
PHASE_TEMPLATES = {
    PhaseType.ASSESS_EXISTING: {
        "title": "Assess Existing Environment",
        "description": "Evaluate current AWS environment and identify migration requirements",
        "icon": "Search"
    },
    PhaseType.PREPARE_NEW: {
        "title": "Prepare New Environment",
        "description": "Set up and configure the new AWS environment for migration",
        "icon": "Settings"
    },
    PhaseType.MIGRATION: {
        "title": "Migration",
        "description": "Execute the migration of resources from existing to new environment",
        "icon": "ArrowRight"
    },
    PhaseType.VERIFY_NEW: {
        "title": "Verify New Environment",
        "description": "Validate the migrated resources and ensure everything is working correctly",
        "icon": "CheckCircle"
    },
    PhaseType.POST_MIGRATION: {
        "title": "Post Migration",
        "description": "Perform cleanup and finalize the migration process",
        "icon": "Flag"
    }
}

def create_step_execution(db: Session, step_execution: StepExecutionCreate):
    """
    Create a new step execution record in the database and update step status
    """
    db_step_execution = StepExecution(
        step_id=step_execution.step_id,
        status=step_execution.status,
        result_data=step_execution.result_data,
        logs=step_execution.logs,
        execution_time=step_execution.execution_time
    )
    db.add(db_step_execution)
    db.commit()
    db.refresh(db_step_execution)
    
    # Update step and phase status
    update_step_status(db, db_step_execution.step_id, db_step_execution.status)
    
    return db_step_execution

def get_step_executions(db: Session, step_id: int, skip: int = 0, limit: int = 100):
    """
    Get all executions for a specific step
    """
    return db.query(StepExecution).filter(
        StepExecution.step_id == step_id
    ).order_by(StepExecution.created_at.desc()).offset(skip).limit(limit).all()

def get_latest_step_execution(db: Session, step_id: int):
    """
    Get the most recent execution for a specific step
    """
    return db.query(StepExecution).filter(
        StepExecution.step_id == step_id
    ).order_by(StepExecution.created_at.desc()).first()

def get_step(db: Session, step_id: int):
    """
    Get a step by its ID
    """
    return db.query(Step).filter(Step.id == step_id).first()

def update_step_execution(db: Session, execution_id: int, status: str, result_data: dict = None):
    """
    Update an existing step execution record and update step status
    """
    db_execution = db.query(StepExecution).filter(StepExecution.id == execution_id).first()
    if db_execution:
        db_execution.status = status
        if result_data:
            db_execution.result_data = result_data
        db_execution.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_execution)
        
        # Update step and phase status
        update_step_status(db, db_execution.step_id, status)
        
    return db_execution

def create_or_update_step(db: Session, step_id: int, title: str, description: str, 
                         automation_type: AutomationType, api_available: bool = True,
                         estimated_time: int = 5, requires_confirmation: bool = False,
                         notes: str = None, phase_type: PhaseType=None):
    """
    Create a new step or update an existing one
    """
    # Determine which phase this step belongs to
    if phase_type is None:
        # Default to ASSESS_EXISTING if not specified
        phase_type = PhaseType.ASSESS_EXISTING
    
    # Get the phase (or create if it doesn't exist)
    phase = db.query(Phase).filter(Phase.type == phase_type).first()
    
    if not phase:
        # Create migration process if it doesn't exist
        if db.query(MigrationProcess).count() == 0:
            migration = MigrationProcess(
                title="AWS Account Migration",
                status=StepStatus.PENDING,
                progress=0
            )
            db.add(migration)
            db.flush()
        else:
            migration = db.query(MigrationProcess).first()
        
        # Get template for this phase
        template = PHASE_TEMPLATES.get(phase_type, {
            "title": f"Phase {phase_type}",
            "description": "Migration phase",
            "icon": "Circle"
        })
        
        # Create the phase
        phase = Phase(
            migration_process_id=migration.id,
            type=phase_type,
            title=template["title"],
            description=template["description"],
            status=StepStatus.PENDING,
            progress=0,
            icon=template["icon"]
        )
        db.add(phase)
        db.flush()
    
    # Check if step already exists
    existing_step = db.query(Step).filter(Step.id == step_id).first()
    
    if existing_step:
        # Update existing step
        existing_step.title = title
        existing_step.description = description
        existing_step.automation_type = automation_type
        existing_step.api_available = api_available
        existing_step.estimated_time = estimated_time
        existing_step.requires_confirmation = requires_confirmation
        existing_step.notes = notes
        db.commit()
        db.refresh(existing_step)
        return existing_step
    else:
        # Create new step
        new_step = Step(
            id=step_id,  # Use the provided step_id
            phase_id=phase.id,
            title=title,
            description=description,
            status=StepStatus.PENDING,
            automation_type=automation_type,
            api_available=api_available,
            estimated_time=estimated_time,
            requires_confirmation=requires_confirmation,
            notes=notes
        )
        db.add(new_step)
        db.commit()
        db.refresh(new_step)
        return new_step

def update_step_status(db: Session, step_id: int, status: StepStatus):
    """
    Update a step's status and timestamps
    """
    step = db.query(Step).filter(Step.id == step_id).first()
    if step:
        step.status = status
        step.updated_at = datetime.utcnow()
        if status == StepStatus.COMPLETED:
            step.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(step)
        
        # Update the phase after updating the step
        update_phase_status(db, step.phase_id)
        
        return step
    return None

def update_phase_status(db: Session, phase_id: int):
    """
    Update a phase's status and progress based on its steps
    """
    phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if not phase:
        return None
    
    # Get all steps for this phase
    steps = db.query(Step).filter(Step.phase_id == phase_id).all()
    total_steps = len(steps)
    
    if total_steps == 0:
        return phase
    
    # Count completed steps
    completed_steps = sum(1 for step in steps if step.status == StepStatus.COMPLETED)
    
    # Calculate progress percentage
    progress = int((completed_steps / total_steps) * 100)
    
    # Determine phase status
    if all(step.status == StepStatus.COMPLETED for step in steps):
        status = StepStatus.COMPLETED
    elif any(step.status == StepStatus.FAILED for step in steps):
        status = StepStatus.FAILED
    elif any(step.status == StepStatus.IN_PROGRESS for step in steps):
        status = StepStatus.IN_PROGRESS
    else:
        status = StepStatus.PENDING
    
    # Update phase
    phase.status = status
    phase.progress = progress
    phase.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(phase)
    
    # If phase is completed, check if we need to create the next phase
    if status == StepStatus.COMPLETED:
        create_next_phase_if_needed(db, phase)
    
    return phase

def create_next_phase_if_needed(db: Session, completed_phase: Phase):
    """
    Create the next phase if the current one is completed
    """
    # Find the current phase's position in the sequence
    try:
        current_index = PHASE_SEQUENCE.index(completed_phase.type)
    except ValueError:
        # Phase not in sequence
        return None
    
    # Check if this is the last phase
    if current_index >= len(PHASE_SEQUENCE) - 1:
        return None
    
    # Get the next phase type
    next_phase_type = PHASE_SEQUENCE[current_index + 1]
    
    # Check if next phase already exists
    existing_next_phase = db.query(Phase).filter(
        Phase.migration_process_id == completed_phase.migration_process_id,
        Phase.type == next_phase_type
    ).first()
    
    if not existing_next_phase:
        # Get template for the next phase
        template = PHASE_TEMPLATES.get(next_phase_type, {
            "title": f"Phase {next_phase_type}",
            "description": "Migration phase",
            "icon": "Circle"
        })
        
        # Create next phase
        next_phase = Phase(
            migration_process_id=completed_phase.migration_process_id,
            type=next_phase_type,
            title=template["title"],
            description=template["description"],
            status=StepStatus.PENDING,
            progress=0,
            icon=template["icon"]
        )
        db.add(next_phase)
        db.commit()
        db.refresh(next_phase)
        return next_phase
    
    return None

def update_after_step_execution(db: Session, step_execution_id: int):
    """
    Update step and phase status after a step execution is created or updated
    """
    execution = db.query(StepExecution).filter(StepExecution.id == step_execution_id).first()
    if execution:
        # Update the step status based on the execution status
        update_step_status(db, execution.step_id, execution.status)
        return True
    return False

def create_account(db: Session, account_data):
    """Create a new AWS account entry"""
    db_account = AccountManagement(
        account_id=account_data.account_id,
        account_name=account_data.account_name,
        region=account_data.region,
        accesskey=account_data.accesskey,
        secretkey=account_data.secretkey,
        session_token=getattr(account_data, 'session_token', None),  # Get session_token if it exists
        created_by=account_data.updated_by,
        created_at=datetime.now(),
        updated_by=account_data.updated_by,
        updated_at=datetime.now()
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def update_account(db: Session, account_id: str, account_data):
    """Update an existing AWS account entry"""
    db_account = db.query(AccountManagement).filter(
        AccountManagement.account_id == account_id
    ).first()
    
    if db_account:
        db_account.account_name = account_data.account_name
        db_account.region = account_data.region
        db_account.accesskey = account_data.accesskey
        db_account.secretkey = account_data.secretkey
        db_account.session_token = getattr(account_data, 'session_token', None)  # Get session_token if it exists
        db_account.updated_by = account_data.updated_by
        db_account.updated_at = datetime.now()
        
        db.commit()
        db.refresh(db_account)
        return db_account
    return None

def get_account_by_id(db: Session, account_id: str):
    """Get AWS account by account ID"""
    return db.query(AccountManagement).filter(
        AccountManagement.account_id == account_id
    ).first()

def get_all_accounts(db: Session, skip: int = 0, limit: int = 100):
    """Get all AWS accounts"""
    return db.query(AccountManagement).offset(skip).limit(limit).all()

def delete_account(db: Session, account_id: str):
    """Delete an AWS account entry"""
    db_account = db.query(AccountManagement).filter(
        AccountManagement.account_id == account_id
    ).first()
    
    if db_account:
        db.delete(db_account)
        db.commit()
        return True
    return False
