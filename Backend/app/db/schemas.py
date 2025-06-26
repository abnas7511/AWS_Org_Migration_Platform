from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

# Step Execution Schemas
class StepExecutionBase(BaseModel):
    step_id: int
    status: str
    result_data: Optional[Dict[str, Any]] = None
    logs: Optional[List[str]] = None
    execution_time: Optional[int] = None

class StepExecutionCreate(StepExecutionBase):
    pass

class StepExecution(StepExecutionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Step Response Schema for API
class StepResponse(BaseModel):
    step_id: int
    title: str
    status: str
    result: Dict[str, Any]
    logs: List[str]
    execution_time: Optional[int] = None

class AccountBase(BaseModel):
    account_name: str
    account_id: str
    region: str
    accesskey: str
    secretkey: str
    updated_by: str
    session_token: Optional[str] = None

class AccountCreate(AccountBase):
    pass

class AccountUpdate(AccountBase):
    pass

class AccountResponse(BaseModel):
    id: int
    account_name: str
    account_id: str
    region: str
    accesskey: str
    session_token: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_by: str
    updated_at: datetime

    class Config:
        from_attributes = True

class AccountListResponse(BaseModel):
    id: int
    account_name: str
    account_id: str
    region: str
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True