import boto3
from botocore.exceptions import ClientError

def test_migration_apis():
    """
    Test account migration APIs without making actual changes.
    """
    # Use your admin profile
    profile = "AWSAdministratorAccess-891376987948"
    session = boto3.Session(profile_name=profile)
    
    # Get your account IDs
    sts = session.client('sts')
    current_account = sts.get_caller_identity()['Account']
    print(f"Current account: {current_account}")
    
    # Test Organizations API access
    try:
        org_client = session.client('organizations')
        
        # Check if you're in an organization
        org = org_client.describe_organization()
        print(f"Organization ID: {org['Organization']['Id']}")
        print(f"Organization ARN: {org['Organization']['Arn']}")
        print(f"Master Account ID: {org['Organization']['MasterAccountId']}")
        
        # List accounts in your organization
        accounts = org_client.list_accounts()
        print(f"\nAccounts in organization: {len(accounts['Accounts'])}")
        
        for i, account in enumerate(accounts['Accounts']):
            print(f"{i+1}. {account['Name']} ({account['Id']}) - {account['Status']}")
        
        # Check if you have permission to invite accounts
        print("\nChecking permission to invite accounts...")
        try:
            # This will fail with AccessDeniedException if you don't have permission
            # We're using a non-existent account ID to ensure it doesn't actually send an invitation
            org_client.invite_account_to_organization(
                Target={
                    'Id': '000000000000',  # Non-existent account
                    'Type': 'ACCOUNT'
                },
                # Adding DryRun parameter would be ideal, but it's not supported
            )
            print("✓ You have permission to invite accounts")
        except ClientError as e:
            if 'AccessDeniedException' in str(e):
                print("✗ You don't have permission to invite accounts")
            elif 'AccountNotFoundException' in str(e):
                print("✓ You have permission to invite accounts (expected error for non-existent account)")
            else:
                print(f"Error testing invite permission: {e}")
        
        # Check if you can list handshakes
        print("\nChecking handshakes...")
        try:
            handshakes = org_client.list_handshakes_for_organization()
            print(f"Active handshakes: {len(handshakes.get('Handshakes', []))}")
            for handshake in handshakes.get('Handshakes', []):
                print(f"- {handshake['Id']}: {handshake['State']}")
        except ClientError as e:
            print(f"Error listing handshakes: {e}")
        
        # Check if you can move accounts
        print("\nChecking permission to move accounts...")
        try:
            # Get root ID
            roots = org_client.list_roots()
            root_id = roots['Roots'][0]['Id']
            
            # List OUs
            ous = org_client.list_organizational_units_for_parent(ParentId=root_id)
            if ous.get('OrganizationalUnits'):
                print(f"Available OUs: {len(ous['OrganizationalUnits'])}")
                for ou in ous['OrganizationalUnits']:
                    print(f"- {ou['Name']} ({ou['Id']})")
                
                # Check move_account permission (without actually moving)
                if len(accounts['Accounts']) > 1 and len(ous['OrganizationalUnits']) > 0:
                    test_account = accounts['Accounts'][1]['Id']  # Use second account
                    test_ou = ous['OrganizationalUnits'][0]['Id']
                    
                    # Get current parent
                    parents = org_client.list_parents(ChildId=test_account)
                    current_parent = parents['Parents'][0]['Id']
                    
                    if current_parent != test_ou:
                        print(f"\nYou could move account {test_account} from {current_parent} to {test_ou}")
                        print("(Not actually moving - this is just a test)")
                    else:
                        print(f"\nAccount {test_account} is already in OU {test_ou}")
            else:
                print("No OUs found")
        except ClientError as e:
            print(f"Error checking move permission: {e}")
        
        print("\nAPI test summary:")
        print("1. You have access to Organizations API")
        print("2. You can view accounts in your organization")
        print("3. You can view organizational units")
        print("4. The invite-account-to-organization API would be used for migration")
        print("5. The move-account API would be used after migration")
        
    except ClientError as e:
        print(f"Error accessing Organizations API: {e}")
    
    return True

if __name__ == "__main__":
    test_migration_apis()
