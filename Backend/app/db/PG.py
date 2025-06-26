from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy_utils import database_exists, create_database
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine, MetaData
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv
from enum import Enum

load_dotenv()

Base = declarative_base()
metadata = MetaData()

# Get database connection details from environment variables
username = os.getenv("POSTGRES_USER", "postgres")
password = os.getenv("POSTGRES_PASSWORD", "password")
host = os.getenv("POSTGRES_HOST", "localhost")
port = os.getenv("POSTGRES_PORT", "5432")
db = os.getenv("POSTGRES_DB", "aws_migration")

db_url = f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{db}"
engine = create_engine(db_url, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Enums
class PhaseType(str, Enum):
    ASSESS_EXISTING = 'Assess Existing Env'
    PREPARE_NEW = 'Prepare New Env'
    VERIFY_NEW = 'Verify New Env'
    MIGRATION = 'Migration'
    POST_MIGRATION = 'Post Migration'

class AutomationType(str, Enum):
    FULLY_AUTOMATED = 'fully-automated'
    SEMI_AUTOMATED = 'semi-automated'
    MANUAL = 'manual'

class StepStatus(str, Enum):
    PENDING = 'pending'
    IN_PROGRESS = 'in-progress'
    COMPLETED = 'completed'
    FAILED = 'failed'
    REQUIRES_ACTION = 'requires-action'

# Define models
class MigrationProcess(Base):
    __tablename__ = 'migration_process'
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False)
    progress = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

class Phase(Base):
    __tablename__ = 'phase'
    id = Column(Integer, primary_key=True, autoincrement=True)
    migration_process_id = Column(Integer, ForeignKey('migration_process.id'))
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False)
    progress = Column(Integer, default=0)
    icon = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

class Step(Base):
    __tablename__ = 'step'
    id = Column(Integer, primary_key=True, autoincrement=True)
    phase_id = Column(Integer, ForeignKey('phase.id'))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False)
    automation_type = Column(String, nullable=False)
    api_available = Column(Boolean, default=False)
    estimated_time = Column(Integer)  # in minutes
    requires_confirmation = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

class StepExecution(Base):
    __tablename__ = 'step_execution'
    id = Column(Integer, primary_key=True, autoincrement=True)
    step_id = Column(Integer, ForeignKey('step.id'))
    status = Column(String, nullable=False)
    result_data = Column(JSONB, nullable=True)
    logs = Column(JSONB, nullable=True)  # Store logs as JSON array
    execution_time = Column(Integer, nullable=True)  # in seconds
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)

class AccountManagement(Base):
    __tablename__ = 'account_management'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(String(20), nullable=False, unique=True)
    account_name = Column(String(100), nullable=False)
    region = Column(String(20), nullable=False)
    accesskey = Column(String(100), nullable=False)
    secretkey = Column(String(100), nullable=False)
    session_token = Column(String(2048), nullable=True)
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_by = Column(String(100), nullable=False)
    updated_at = Column(DateTime, nullable=False, default=datetime.now)


# Initialize database
def init_db():
    # Create database if it doesn't exist
    if not database_exists(engine.url):
        create_database(engine.url)
    
    # Create tables
    Base.metadata.create_all(bind=engine)



if __name__ == "__main__":
    init_db()
