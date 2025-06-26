import boto3
from botocore.exceptions import ClientError

def request_organizations_limit_increase(desired_accounts=50):
    """
    Create an AWS Support case to request an increase in the number of accounts
    allowed in AWS Organizations.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    support_client = session.client('support', region_name='us-east-1')
    
    # Get current account ID
    account_id = boto3.client('sts').get_caller_identity()['Account']
    
    try:
        # Create a support case
        case_subject = f"AWS Organizations Service Limit Increase - Number of Accounts"
        case_body = f"""
We are requesting an increase to our AWS Organizations account limit.

Current limit: 10 accounts (default)
Requested limit: {desired_accounts} accounts

Business justification:
- We are migrating our AWS environment to a new organization
- We need to accommodate our existing accounts plus room for growth
- This is part of our account migration project

Thank you for your assistance.
"""
        
        response = support_client.create_case(
            subject=case_subject,
            serviceCode='organizations',
            severityCode='normal',
            categoryCode='general-guidance',
            communicationBody=case_body,
            ccEmailAddresses=[],
            language='en',
            issueType='service-limit-increase'
        )
        
        case_id = response['caseId']
        print(f"Successfully created support case: {case_id}")
        print(f"Request submitted to increase account limit to {desired_accounts}")
        print("\nYou can check the status of your case in the AWS Support Center:")
        print("https://console.aws.amazon.com/support/home#/case/details/" + case_id)
        
        return case_id
        
    except ClientError as e:
        print(f"Error creating support case: {e}")
        if 'SubscriptionRequiredException' in str(e):
            print("\nError: This operation requires a Business or Enterprise Support plan.")
            print("Please upgrade your support plan to request service limit increases.")
        return None

if __name__ == "__main__":
    # Specify the desired number of accounts
    desired_accounts = 50
    request_organizations_limit_increase(desired_accounts)
