import boto3
from botocore.exceptions import ClientError

def move_account_to_workloads_ou(account_id):
    """
    Move a dummy account to the Workloads OU, creating the OU if needed.
    
    Parameters:
    - account_id: The ID of the account to move
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    org_client = session.client('organizations')
    
    try:
        # Get organization root ID
        roots = org_client.list_roots()
        root_id = roots['Roots'][0]['Id']
        print(f"Organization root ID: {root_id}")
        
        # Check if Workloads OU exists
        workloads_ou_id = None
        paginator = org_client.get_paginator('list_organizational_units_for_parent')
        
        for page in paginator.paginate(ParentId=root_id):
            for ou in page['OrganizationalUnits']:
                if ou['Name'] == 'Workloads':
                    workloads_ou_id = ou['Id']
                    print(f"Found existing Workloads OU: {workloads_ou_id}")
                    break
        
        # Create Workloads OU if it doesn't exist
        if not workloads_ou_id:
            print("Creating Workloads OU...")
            response = org_client.create_organizational_unit(
                ParentId=root_id,
                Name='Workloads'
            )
            workloads_ou_id = response['OrganizationalUnit']['Id']
            print(f"Created Workloads OU: {workloads_ou_id}")
        
        # Find current parent of the account
        parents = org_client.list_parents(ChildId=account_id)
        current_parent_id = parents['Parents'][0]['Id']
        
        # Move account to Workloads OU
        if current_parent_id != workloads_ou_id:
            print(f"Moving account {account_id} from {current_parent_id} to Workloads OU...")
            org_client.move_account(
                AccountId=account_id,
                SourceParentId=current_parent_id,
                DestinationParentId=workloads_ou_id
            )
            print(f"Successfully moved account to Workloads OU")
        else:
            print(f"Account {account_id} is already in Workloads OU")
        
        return True
        
    except ClientError as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Replace with your dummy account ID
    account_id = "889453232070"  # Replace with the actual account ID
    move_account_to_workloads_ou(account_id)
