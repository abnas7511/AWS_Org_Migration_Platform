from fastapi import APIRouter, HTTPException, Depends
from app.services.aws_services import check_ram_shared_resources, check_delegated_admins, check_cost_explorer_data, check_ri_and_savings_plans, check_policy_references, check_stacksets_for_org_integration, create_fallback_admin_user
from app.db.schemas import StepResponse, StepExecutionCreate
from fastapi import APIRouter, HTTPException, Depends, Query
from app.db.PG import AutomationType, StepStatus, PhaseType
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db import PG_queries
from enum import Enum
import time
import json
import datetime

router = APIRouter()

# Step ID mapping
STEP_IDS = {
    "check_ram": 1,
    "check_admin_services": 2,
    "cost_explorer_data": 3,
    "check_savings": 4,
    "check_policies": 5,
    "check_stacksets": 6,
    "create_iam_admin": 8
}

# Phase type to step IDs mapping
PHASE_STEPS = {
    "assess-existing": [1, 2, 3, 4, 5, 6, 8],
    "prepare-new": [],
    "migrate": [],
    "verify": [],
    "post-migration": []
}

# Map URL path to PhaseType enum
PHASE_TYPE_MAP = {
    "assess-existing": PhaseType.ASSESS_EXISTING,
    "prepare-new": PhaseType.PREPARE_NEW,
    "migrate": PhaseType.MIGRATION,
    "verify": PhaseType.VERIFY_NEW,
    "post-migration": PhaseType.POST_MIGRATION
}


def convert_datetime(obj):
    if isinstance(obj, dict):
        return {k: convert_datetime(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetime(i) for i in obj]
    elif isinstance(obj, datetime.datetime):
        return obj.isoformat()
    else:
        return obj
    

@router.get("/assess-existing/check_ram", response_model=StepResponse)
async def execute_check_ram(account_id: str = Query(None), db: Session = Depends(get_db)):
    """
    Execute the RAM shared resources check step
    """
    step_id = STEP_IDS["check_ram"]
    
    # Ensure step exists in database
    PG_queries.create_or_update_step(
        db=db,
        step_id=step_id,
        title="Check for resources shared via RAM",
        description="Check for resources shared via RAM with the rest of the Org or OUs",
        automation_type=AutomationType.FULLY_AUTOMATED,
        api_available=True,
        estimated_time=5,
        requires_confirmation=False,
        notes="Agent will automatically scan for shared resources",
        phase_type=PHASE_TYPE_MAP["assess-existing"]
    )
    
    start_time = time.time()
    
    # Step 1: Check for resources shared via RAM
    result = check_ram_shared_resources(db, account_id)
    
    logs = [
        "Initializing AWS SDK...",
        "Connecting to AWS account...",
        "Checking for resources shared via RAM...",
        f"Analysis complete: {result ['message'] if 'message' in result else 'No message provided.'}"
    ]
    
    status = StepStatus.COMPLETED if result["success"] else StepStatus.FAILED
    execution_time = int(time.time() - start_time)
    
    # Save result to database
    step_execution = StepExecutionCreate(
        step_id=step_id,
        status=status,
        result_data=result,
        logs=logs,
        execution_time=execution_time
    )
    PG_queries.create_step_execution(db, step_execution)
    
    # Format the response for the frontend
    return {
        "step_id": step_id,
        "title": "Check for resources shared via RAM",
        "status": status,
        "result": result,
        "logs": logs,
        "execution_time": execution_time
    }

@router.get("/assess-existing/check_admin_services", response_model=StepResponse)
async def execute_check_admin_services(account_id: str = Query(None), db: Session = Depends(get_db)):
    """
    Execute the delegated admin services check step
    """
    step_id = STEP_IDS["check_admin_services"]
    
    # Ensure step exists in database
    PG_queries.create_or_update_step(
        db=db,
        step_id=step_id,
        title="Check for delegated admin services",
        description="Check if services like AWS Backups, GuardDuty, Inspector have delegated admin in old org",
        automation_type=AutomationType.FULLY_AUTOMATED,
        api_available=True,
        estimated_time=8,
        requires_confirmation=False,
        notes="Agent will identify all delegated admin services",
        phase_type=PHASE_TYPE_MAP["assess-existing"]
    )

    # Step 2: Check for delegated admin accounts
    start_time = time.time()
    result = check_delegated_admins(db, account_id)
    # Placeholder for delegated admin check logic
    logs = [
        "Initializing AWS SDK...",
        "Connecting to AWS account...",
        "Checking for delegated admin accounts...",
        f"Analysis complete: {result ['message'] if 'message' in result else 'Delegated Admins Found'}"
    ]

    # Convert datetime objects to strings before saving
    result = convert_datetime(result)
    logs = convert_datetime(logs)
    

    status = StepStatus.COMPLETED
    execution_time = int(time.time() - start_time)
    step_execution = StepExecutionCreate(
        step_id=step_id,
        status=status,
        result_data=result,
        logs=logs,
        execution_time=execution_time
    )

    PG_queries.create_step_execution(db, step_execution)
    return {
        "step_id": step_id,
        "title": "Check for delegated admin services",
        "status": status,
        "result": result,
        "logs": logs,
        "execution_time": execution_time
    }

@router.get("/assess-existing/cost_explorer_data", response_model=StepResponse)
async def execute_cost_explorer_data(account_id: str = Query(None), db: Session = Depends(get_db)):
    """
    Execute the cost explorer data check step
    """
    step_id = STEP_IDS["cost_explorer_data"]
    
    # Ensure step exists in database
    PG_queries.create_or_update_step(
        db=db,
        step_id=step_id,
        title="Check Cost Explorer Data",
        description="Cost explorer data in Payer2 will NOT have historical data from Payer1.",
        automation_type=AutomationType.FULLY_AUTOMATED,
        api_available=True,
        estimated_time=5,
        requires_confirmation=False,
        notes="Agent will automatically check Cost Explorer data",
        phase_type=PHASE_TYPE_MAP["assess-existing"]
    )

    
    # Placeholder for cost explorer data check logic
    start_time = time.time()
    result = check_cost_explorer_data(db, account_id)
    
    # Create more informative logs with actual cost data
    logs = [
        "Initializing AWS SDK...",
        "Connecting to AWS account...",
        "Checking Cost Explorer data...",
        f"Analysis complete: Found {len(result.get('billing_periods', []))} billing periods and {len(result.get('cur_reports', []))} Cost and Usage Reports"
    ]
    
    status = StepStatus.COMPLETED if result["success"] else StepStatus.FAILED
    execution_time = int(time.time() - start_time)
    
    # Save result to database
    step_execution = StepExecutionCreate(
        step_id=step_id,
        status=status,
        result_data=result,
        logs=logs,
        execution_time=execution_time
    )
    PG_queries.create_step_execution(db, step_execution)
    
    return {
        "step_id": step_id,
        "title": "Check Cost Explorer Data",
        "status": status,
        "result": result,
        "logs": logs,
        "execution_time": execution_time
    }

# Check RI and Saving Plans
@router.get("/assess-existing/check_savings", response_model=StepResponse)
async def check_savings(account_id: str = Query(None), db: Session = Depends(get_db)):
    """
    Execute the RI and Savings Plans check step
    """
    step_id = STEP_IDS["check_savings"]

    # Ensure step exists in database
    PG_queries.create_or_update_step(
        db=db,
        step_id=step_id,
        title="Check RI and Savings Plans",
        description="Check RI and Savings Plans",
        automation_type=AutomationType.FULLY_AUTOMATED,
        api_available=True,
        estimated_time=5,
        requires_confirmation=False,
        notes="Agent will automatically check RI and Savings Plans",
        phase_type=PHASE_TYPE_MAP["assess-existing"]
    )

    # Placeholder for RI and Savings Plans check logic
    start_time = time.time()
    result = check_ri_and_savings_plans(db, account_id)

    # Create more informative logs with actual cost data
    logs = [
        "Initializing AWS SDK...",
        "Connecting to AWS account...",
        "Checking RI and Savings Plans...",
        f"Analysis complete: {result ['message'] if 'message' in result else 'No message provided.'}"
    ]

    status = StepStatus.COMPLETED if result["success"] else StepStatus.FAILED
    execution_time = int(time.time() - start_time)

    # Save result to database
    step_execution = StepExecutionCreate(
        step_id=step_id,
        status=status,
        result_data=result,
        logs=logs,
        execution_time=execution_time
    )
    PG_queries.create_step_execution(db, step_execution)

    return {
        "step_id": step_id,
        "title": "Check RI and Savings Plans",
        "status": status,
        "result": result,
        "logs": logs,
        "execution_time": execution_time
    }


@router.get("/assess-existing/check_policies", response_model=StepResponse)
async def check_policies(account_id: str = Query(None), db: Session = Depends(get_db)):
    """
    Execute the policy references check step
    """
    step_id = STEP_IDS["check_policies"]

    # Ensure step exists in database
    PG_queries.create_or_update_step(
        db=db,
        step_id=step_id,
        title="Check for policy references",
        description="Check for policy documents across various AWS services for Organization/OU references",
        automation_type=AutomationType.FULLY_AUTOMATED,
        api_available=True,
        estimated_time=5,
        requires_confirmation=False,
        notes="Agent will automatically check for policy references",
        phase_type=PHASE_TYPE_MAP["assess-existing"]
    )

    # Placeholder for policy references check logic
    start_time = time.time()
    result = check_policy_references(db, account_id)

    # Create more informative logs with actual cost data
    logs = [
        "Initializing AWS SDK...",
        "Connecting to AWS account...",
        "Checking for policy references...",
        f"Analysis complete: {result ['message'] if 'message' in result else 'No message provided.'}"
    ]

    status = StepStatus.COMPLETED if result["success"] else StepStatus.FAILED
    execution_time = int(time.time() - start_time)

    # Save result to database
    step_execution = StepExecutionCreate(
        step_id=step_id,
        status=status,
        result_data=result,
        logs=logs,
        execution_time=execution_time
    )
    PG_queries.create_step_execution(db, step_execution)

    return {
        "step_id": step_id,
        "title": "Check for policy references",
        "status": status,
        "result": result,
        "logs": logs,
        "execution_time": execution_time
    }


@router.get("/assess-existing/check_stacksets", response_model=StepResponse)
async def check_stacksets(account_id: str = Query(None), db: Session = Depends(get_db)):
    """
    Execute the stacksets check step
    """
    step_id = STEP_IDS["check_stacksets"]

    # Ensure step exists in database
    PG_queries.create_or_update_step(
        db=db,
        step_id=step_id,
        title="Check for stacksets",
        description="Check if CloudFormation StackSets use AWS Organizations",
        automation_type=AutomationType.FULLY_AUTOMATED,
        api_available=True,
        estimated_time=5,
        requires_confirmation=False,
        notes="Agent will automatically check for stacksets",
        phase_type=PHASE_TYPE_MAP["assess-existing"]
    )

    # Execute the stacksets check
    start_time = time.time()
    result = check_stacksets_for_org_integration(db, account_id)

    # Create logs
    logs = [
        "Initializing AWS SDK...",
        "Connecting to AWS account...",
        "Checking for stacksets using Organizations...",
        f"Analysis complete: {result['message'] if 'message' in result else 'No message provided.'}"
    ]

    status = StepStatus.COMPLETED if result["success"] else StepStatus.FAILED
    execution_time = int(time.time() - start_time)

    # Save result to database
    step_execution = StepExecutionCreate(
        step_id=step_id,
        status=status,
        result_data=result,
        logs=logs,
        execution_time=execution_time
    )
    PG_queries.create_step_execution(db, step_execution)

    return {
        "step_id": step_id,
        "title": "Check for stacksets",
        "status": status,
        "result": result,
        "logs": logs,
        "execution_time": execution_time
    }

@router.get("/assess-existing/create_iam_admin", response_model=StepResponse)
async def create_iam_admin(account_id: str = Query(None), db: Session = Depends(get_db)):
    """
    fallback Iam Admin for sso, In case of sso fails
    """
    step_id = STEP_IDS["create_iam_admin"]

    # Ensure step exists in database
    PG_queries.create_or_update_step(
        db=db,
        step_id=step_id,
        title="Create Fallback IAM Admin",
        description="Create Admin for sso if fails",
        automation_type=AutomationType.FULLY_AUTOMATED,
        api_available=True,
        estimated_time=5,
        requires_confirmation=False,
        notes="Agent will automatically create IAM Admin",
        phase_type=PHASE_TYPE_MAP["assess-existing"]
    )

    # Placeholder for IAM admin creation logic
    start_time = time.time()
    result = create_fallback_admin_user(db, account_id)

    # Create more informative logs with actual cost data
    logs = [
        "Initializing AWS SDK...",
        "Connecting to AWS account...",
        "Creating IAM Admin...",
        f"Analysis complete: {result ['message'] if 'message' in result else 'No message provided.'}"
    ]

    status = StepStatus.COMPLETED if result["success"] else StepStatus.FAILED
    execution_time = int(time.time() - start_time)

    # Save result to database
    step_execution = StepExecutionCreate(
        step_id=step_id,
        status=status,
        result_data=result,
        logs=logs,
        execution_time=execution_time
    )
    PG_queries.create_step_execution(db, step_execution)

    return {
        "step_id": step_id,
        "title": "Create Fallback IAM Admin",
        "status": status,
        "result": result,
        "logs": logs,
        "execution_time": execution_time
    }

# Prepare New env
@router.get("/")

@router.get("/{phase_type}/{step_slug}/latest", response_model=StepResponse)
async def get_latest_step_execution_by_slug(phase_type: str, step_slug: str, db: Session = Depends(get_db)):
    """
    Get the latest execution result for a specific step without executing it again
    """
    # Validate phase type
    if phase_type not in PHASE_STEPS:
        raise HTTPException(status_code=404, detail=f"Phase {phase_type} not found")
    
    # Convert hyphenated slug to underscore format if needed
    step_slug_normalized = step_slug.replace("-", "_")
    
    # Validate step slug and get step ID
    if step_slug_normalized not in STEP_IDS:
        raise HTTPException(status_code=404, detail=f"Step {step_slug} not found")
    
    step_id = STEP_IDS[step_slug_normalized]
    
    # Check if step belongs to the specified phase
    if step_id not in PHASE_STEPS[phase_type]:
        raise HTTPException(status_code=404, detail=f"Step {step_slug} not found in phase {phase_type}")
    
    # Get the step information
    step = PG_queries.get_step(db, step_id)
    if not step:
        raise HTTPException(status_code=404, detail=f"Step {step_id} not found")
    
    # Get the latest execution for this step
    latest_execution = PG_queries.get_latest_step_execution(db, step_id)
    
    if not latest_execution:
        raise HTTPException(status_code=404, detail=f"No execution found for step {step_id}")
    
    return {
        "step_id": latest_execution.step_id,
        "title": step.title,
        "status": latest_execution.status,
        "result": latest_execution.result_data,
        "logs": latest_execution.logs,
        "execution_time": latest_execution.execution_time,
        "slug": step_slug
    }

@router.get("/{phase_type}/{step_slug}/history", response_model=list[StepResponse])
async def get_step_history_by_slug(phase_type: str, step_slug: str, db: Session = Depends(get_db)):
    """
    Get the execution history for a specific step
    """
    # Validate phase type
    if phase_type not in PHASE_STEPS:
        raise HTTPException(status_code=404, detail=f"Phase {phase_type} not found")
    
    # Convert hyphenated slug to underscore format if needed
    step_slug_normalized = step_slug.replace("-", "_")
    
    # Validate step slug and get step ID
    if step_slug_normalized not in STEP_IDS:
        raise HTTPException(status_code=404, detail=f"Step {step_slug} not found")
    
    step_id = STEP_IDS[step_slug_normalized]
    
    # Check if step belongs to the specified phase
    if step_id not in PHASE_STEPS[phase_type]:
        raise HTTPException(status_code=404, detail=f"Step {step_slug} not found in phase {phase_type}")
    
    executions = PG_queries.get_step_executions(db, step_id)
    
    if not executions:
        raise HTTPException(status_code=404, detail=f"No history found for step {step_id}")
    
    # Get step title
    step = PG_queries.get_step(db, step_id)
    title = step.title if step else "Unknown Step"
    
    return [
        {
            "step_id": execution.step_id,
            "title": title,
            "status": execution.status,
            "result": execution.result_data,
            "logs": execution.logs,
            "execution_time": execution.execution_time,
            "slug": step_slug
        }
        for execution in executions
    ]

