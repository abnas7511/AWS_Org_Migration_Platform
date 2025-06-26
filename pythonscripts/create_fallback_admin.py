import boto3
import string
import random
import json
from botocore.exceptions import ClientError

def create_fallback_admin_user(username="EmergencyAdmin"):
    """
    Create a fallback IAM admin user for login in case SSO fails.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    iam_client = session.client('iam')
    
    try:
        # Check if user already exists
        try:
            iam_client.get_user(UserName=username)
            print(f"User {username} already exists. Skipping creation.")
            return False
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchEntity':
                raise e
        
        # Create the user
        print(f"Creating fallback admin user: {username}")
        iam_client.create_user(
            UserName=username,
            Tags=[
                {
                    'Key': 'Purpose',
                    'Value': 'Emergency access in case SSO fails'
                }
            ]
        )
        
        # Generate a random password
        password_length = 16
        password_chars = string.ascii_letters + string.digits + "!@#$%^&*()_+-="
        password = ''.join(random.choice(password_chars) for i in range(password_length))
        
        # Create login profile with password
        iam_client.create_login_profile(
            UserName=username,
            Password=password,
            PasswordResetRequired=True
        )
        
        # Attach AdministratorAccess policy
        iam_client.attach_user_policy(
            UserName=username,
            PolicyArn='arn:aws:iam::aws:policy/AdministratorAccess'
        )
        
        print(f"Successfully created fallback admin user: {username}")
        print(f"Temporary password: {password}")
        print("IMPORTANT: Store this password securely and change it upon first login.")
        print("NOTE: This user has full administrative access and should only be used in emergencies.")
        
        return True
        
    except ClientError as e:
        print(f"Error creating fallback admin user: {e}")
        return False

if __name__ == "__main__":
    create_fallback_admin_user()
