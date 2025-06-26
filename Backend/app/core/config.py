import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    AWS_PROFILE = os.getenv("AWS_PROFILE", "default")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    
    # Direct AWS credentials
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN", "")
    
    # Flag to use direct credentials instead of profile
    USE_DIRECT_CREDENTIALS = os.getenv("USE_DIRECT_CREDENTIALS", "false").lower() == "true"

settings = Settings()