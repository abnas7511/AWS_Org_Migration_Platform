import boto3
from app.core.config import settings
from app.db import PG_queries
from sqlalchemy.orm import Session

def get_aws_session(db: Session = None, account_id: str = None):
    """
    Get AWS session based on account_id from frontend or fallback to settings
    
    Args:
        db: Database session
        account_id: AWS account ID from frontend
        
    Returns:
        boto3.Session: AWS session
    """
    # If account_id is provided, try to get credentials from database
    if db and account_id:
        account = PG_queries.get_account_by_id(db, account_id)
        if account:
            return boto3.Session(
                aws_access_key_id=account.accesskey,
                aws_secret_access_key=account.secretkey,
                aws_session_token=account.session_token,
                region_name=account.region
            )
    
    # Fallback to settings
    if settings.USE_DIRECT_CREDENTIALS and settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return boto3.Session(
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            aws_session_token=settings.AWS_SESSION_TOKEN,
            region_name=settings.AWS_REGION
        )
    else:
        return boto3.Session(profile_name=settings.AWS_PROFILE, region_name=settings.AWS_REGION)