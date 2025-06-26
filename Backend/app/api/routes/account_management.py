from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.db import schemas
from app.db import PG_queries
from app.services.aws_client import AWSClient

router = APIRouter()

@router.post("/account-management", response_model=schemas.AccountResponse)
async def create_account(account: schemas.AccountCreate, db: Session = Depends(get_db)):
    """Create or update AWS account credentials"""
    # Check if account already exists
    existing_account = PG_queries.get_account_by_id(db, account.account_id)
    
    # Test AWS credentials before saving
    try:
        aws_client = AWSClient(
            service_name='sts',
            region_name=account.region,
            access_key=account.accesskey,
            secret_key=account.secretkey,
            session_token=getattr(account, 'session_token', None)  # Get session_token if it exists
        )
        aws_client.test_connection()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid AWS credentials: {str(e)}")
    
    if existing_account:
        # Update existing account
        updated_account = PG_queries.update_account(
            db, account.account_id, account
        )
        return updated_account
    else:
        # Create new account
        return PG_queries.create_account(db, account)

@router.get("/account-management", response_model=List[schemas.AccountListResponse])
async def get_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all configured AWS accounts"""
    accounts = PG_queries.get_all_accounts(db, skip, limit)
    return accounts

@router.get("/account-management/{account_id}", response_model=schemas.AccountResponse)
async def get_account(account_id: str, db: Session = Depends(get_db)):
    """Get AWS account by ID"""
    account = PG_queries.get_account_by_id(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@router.delete("/account-management/{account_id}")
async def delete_account(account_id: str, db: Session = Depends(get_db)):
    """Delete AWS account configuration"""
    success = PG_queries.delete_account(db, account_id)
    if not success:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"status": "success", "message": "Account deleted successfully"}

@router.post("/account-management/test-connection")
async def test_connection(account: schemas.AccountBase):
    """Test AWS credentials without saving them"""
    try:
        aws_client = AWSClient(
            service_name='sts',
            region_name=account.region,
            access_key=account.accesskey,
            secret_key=account.secretkey,
            session_token=getattr(account, 'session_token', None)  # Get session_token if it exists
        )
        aws_client.test_connection()
        return {"status": "success", "message": "AWS credentials are valid"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid AWS credentials: {str(e)}")