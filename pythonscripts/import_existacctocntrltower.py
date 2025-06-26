import boto3
import time
from botocore.exceptions import ClientError

def import_accounts_to_control_tower(accounts_to_import, target_ou_name="Imported"):
    """
    Import existing accounts into Control Tower.
    
    Parameters:
    - accounts_to_import: List of account IDs to import
    - target_ou_name: Name of the OU to place imported accounts in
    """
    # Find Control Tower home region
    ct_regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-2']
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    
    # Find Control Tower region
    ct_region = None
    for region in ct_regions:
        try:
            ct_client = session.client('controltower', region_name=region)
            ct_client.get_landing_zone_status()
            ct_region = region
            print(f"Found Control Tower in region: {ct_region}")
            break
        except ClientError:
            continue
    
    if not ct_region:
        print("Control Tower not found in any region")
        return False
    
    # Create clients
    ct_client = session.client('controltower', region_name=ct_region)
    org_client = session.client('organizations')
    
    # Get organization root ID
    roots = org_client.list_roots()
    root_id = roots['Roots'][0]['Id']
    
    # Find or create target OU
    target_ou_id = None
    ous = org_client.list_organizational_units_for_parent(ParentId=root_id)
    
    for ou in ous['OrganizationalUnits']:
        if ou['Name'] == target_ou_name:
            target_ou_id = ou['Id']
            print(f"Found existing OU: {target_ou_name} ({target_ou_id})")
            break
    
    if not target_ou_id:
        # Create the OU
        response = org_client.create_organizational_unit(
            ParentId=root_id,
            Name=target_ou_name
        )
        target_ou_id = response['OrganizationalUnit']['Id']
        print(f"Created new OU: {target_ou_name} ({target_ou_id})")
        
        # Register the OU with Control Tower
        try:
            ct_client.register_organizational_unit(
                OrganizationalUnitId=target_ou_id
            )
            print(f"Registered OU with Control Tower: {target_ou_name}")
        except ClientError as e:
            print(f"Error registering OU with Control Tower: {e}")
    
    # Import each account
    for account_id in accounts_to_import:
        try:
            # Get account details
            account = org_client.describe_account(AccountId=account_id)
            account_name = account['Account']['Name']
            account_email = account['Account']['Email']
            
            print(f"\nImporting account: {account_name} ({account_id})")
            
            # Move account to target OU if needed
            try:
                parents = org_client.list_parents(ChildId=account_id)
                current_parent_id = parents['Parents'][0]['Id']
                
                if current_parent_id != target_ou_id:
                    print(f"Moving account from {current_parent_id} to {target_ou_id}...")
                    org_client.move_account(
                        AccountId=account_id,
                        SourceParentId=current_parent_id,
                        DestinationParentId=target_ou_id
                    )
                    print(f"Account moved to {target_ou_name} OU")
            except ClientError as e:
                print(f"Error moving account: {e}")
                continue
            
            # Import account into Control Tower
            try:
                print("Importing account into Control Tower...")
                response = ct_client.enroll_account(
                    AccountId=account_id,
                    OrganizationalUnitId=target_ou_id
                )
                
                operation_id = response.get('OperationIdentifier')
                print(f"Import initiated. Operation ID: {operation_id}")
                
                # Wait for import to complete
                print("Waiting for import to complete (checking every 30 seconds)...")
                max_checks = 10
                for i in range(max_checks):
                    time.sleep(30)
                    try:
                        status = ct_client.get_account_enrollment_status(
                            AccountId=account_id
                        )
                        print(f"Import status: {status.get('Status')}")
                        
                        if status.get('Status') == 'SUCCEEDED':
                            print(f"Account {account_id} successfully imported into Control Tower")
                            break
                        elif status.get('Status') in ['FAILED', 'REJECTED']:
                            print(f"Import failed: {status.get('StatusReason', 'Unknown reason')}")
                            break
                    except ClientError as e:
                        print(f"Error checking import status: {e}")
                
                if i == max_checks - 1:
                    print("Timed out waiting for import to complete")
            except ClientError as e:
                if 'AlreadyExistsException' in str(e):
                    print(f"Account {account_id} is already managed by Control Tower")
                else:
                    print(f"Error importing account: {e}")
        except ClientError as e:
            print(f"Error processing account {account_id}: {e}")
    
    print("\nAccount import process completed")
    return True

if __name__ == "__main__":
    # List of account IDs to import
    accounts_to_import = [
        "889453232070",  # Your dummy account
        # Add more account IDs as needed
    ]
    
    # Target OU name
    target_ou_name = "Imported"
    
    import_accounts_to_control_tower(accounts_to_import, target_ou_name)
