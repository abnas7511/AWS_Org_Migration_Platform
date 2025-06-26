from sqlalchemy import create_engine, inspect, MetaData, Table, Column, Integer, String, DateTime
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Get database connection details from environment variables
username = os.getenv("POSTGRES_USER", "postgres")
password = os.getenv("POSTGRES_PASSWORD", "password")
host = os.getenv("POSTGRES_HOST", "localhost")
port = os.getenv("POSTGRES_PORT", "5432")
db = os.getenv("POSTGRES_DB", "aws_migration")

SQLALCHEMY_DATABASE_URL = f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{db}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def run_migrations():
    """Run database migrations"""
    inspector = inspect(engine)
    
    # Check if account_management table exists
    if not inspector.has_table('account_management'):
        print("Creating account_management table...")
        # Create the table
        metadata = MetaData()
        account_management = Table(
            'account_management',
            metadata,
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('account_id', String(20), nullable=False, unique=True),
            Column('account_name', String(100), nullable=False),
            Column('region', String(20), nullable=False),
            Column('accesskey', String(100), nullable=False),
            Column('secretkey', String(100), nullable=False),
            Column('session_token', String(2048), nullable=True),  # Session tokens can be quite long
            Column('created_by', String(100), nullable=False),
            Column('created_at', DateTime, nullable=False, default=datetime.now),
            Column('updated_by', String(100), nullable=False),
            Column('updated_at', DateTime, nullable=False, default=datetime.now)
        )
        metadata.create_all(engine, tables=[account_management])
        print("account_management table created successfully")
    else:
        print("account_management table already exists")

if __name__ == "__main__":
    print("Running database migrations...")
    run_migrations()
    print("Migrations completed successfully!")