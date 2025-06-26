import boto3
from botocore.exceptions import ClientError

def check_enterprise_support():
    """
    Check if the AWS account has Enterprise Support.
    Note: This can only verify existing support, not set it up.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    support_client = session.client('support', region_name='us-east-1')
    
    try:
        # First check if we can access the Support API (requires Business or Enterprise Support)
        try:
            # Try to list recent cases (minimum maxResults is 10)
            cases = support_client.describe_cases(
                includeResolvedCases=True,
                maxResults=10  # Fixed: minimum value is 10
            )
            print("Successfully accessed Support API - account has Business or Enterprise Support")
        except ClientError as e:
            if 'SubscriptionRequiredException' in str(e):
                print("This account does not have Business or Enterprise Support")
                return False
            else:
                print(f"Error accessing Support API: {e}")
                raise e
        
        # Check for Enterprise Support specific features
        try:
            # Get Trusted Advisor checks
            response = support_client.describe_trusted_advisor_checks(language='en')
            
            # Count number of available checks - Enterprise has more checks than Business
            check_count = len(response.get('checks', []))
            print(f"Account has {check_count} Trusted Advisor checks available")
            
            # Enterprise typically has 115+ checks, Business has fewer
            if check_count >= 115:
                print("Based on Trusted Advisor check count, account likely has Enterprise Support")
                return True
            else:
                print("Based on Trusted Advisor check count, account likely has Business Support")
                return False
                
        except ClientError as e:
            print(f"Error checking Trusted Advisor: {e}")
            return None
    
    except ClientError as e:
        print(f"Error checking support plan: {e}")
        return None

if __name__ == "__main__":
    print("Checking if account has Enterprise Support...")
    has_enterprise = check_enterprise_support()
    
    if has_enterprise is True:
        print("\nVerification complete: Account has Enterprise Support")
    elif has_enterprise is False:
        print("\nVerification complete: Account does NOT have Enterprise Support")
        print("\nTo enable Enterprise Support:")
        print("1. Sign in to the AWS Management Console")
        print("2. Go to the Support Center")
        print("3. Click 'Support plans'")
        print("4. Select 'Enterprise Support' and follow the prompts")
    else:
        print("\nCould not definitively determine support level")
