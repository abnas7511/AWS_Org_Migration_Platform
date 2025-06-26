import boto3
import json
from botocore.exceptions import ClientError

def check_delegated_admins():
    """
    Check if services like AWS Backup, GuardDuty, and Inspector have delegated admins.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    results = {}
    
    # Check GuardDuty delegated admin
    try:
        guardduty = session.client('guardduty')
        guardduty_admins = guardduty.list_organization_admin_accounts()
        results['GuardDuty'] = guardduty_admins.get('AdminAccounts', [])
        print(f"GuardDuty delegated admins: {len(results['GuardDuty'])}")
    except ClientError as e:
        print(f"Error checking GuardDuty: {e}")
        results['GuardDuty'] = f"Error: {str(e)}"
    
    # Check AWS Backup delegated admin
    try:
        organizations = session.client('organizations')
        backup_admins = organizations.list_delegated_administrators(ServicePrincipal='backup.amazonaws.com')
        results['AWS Backup'] = backup_admins.get('DelegatedAdministrators', [])
        print(f"AWS Backup delegated admins: {len(results['AWS Backup'])}")
    except ClientError as e:
        print(f"Error checking AWS Backup: {e}")
        results['AWS Backup'] = f"Error: {str(e)}"
    
    # Check Inspector delegated admin
    try:
        inspector2 = session.client('inspector2')
        inspector_admin = inspector2.get_delegated_admin_account()
        if 'delegatedAdminAccountId' in inspector_admin:
            results['Inspector'] = [inspector_admin]
            print(f"Inspector delegated admin: {inspector_admin['delegatedAdminAccountId']}")
        else:
            results['Inspector'] = []
            print("No Inspector delegated admin found")
    except ClientError as e:
        print(f"Error checking Inspector: {e}")
        results['Inspector'] = f"Error: {str(e)}"
    
    # Print detailed results
    print("\nDetailed results:")
    print(json.dumps(results, indent=2, default=str))
    
    return results

if __name__ == "__main__":
    print("Checking for delegated administrators in AWS services...")
    check_delegated_admins()
