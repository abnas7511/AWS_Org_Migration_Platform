import boto3
from botocore.exceptions import ClientError

def register_ou_in_control_tower(ou_name):
    """
    Register an Organizational Unit in AWS Control Tower.
    
    Parameters:
    - ou_name: Name of the OU to register
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    org_client = session.client('organizations')
    
    # Find the Control Tower home region
    # Control Tower is typically deployed in one of these regions
    ct_regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-2']
    ct_region = None
    
    for region in ct_regions:
        try:
            ct_client = session.client('controltower', region_name=region)
            # Try a simple API call to see if Control Tower is in this region
            ct_client.get_landing_zone_status()
            ct_region = region
            print(f"Found Control Tower in region: {ct_region}")
            break
        except ClientError as e:
            if 'AccessDeniedException' not in str(e) and 'UnrecognizedClientException' not in str(e):
                print(f"Error checking Control Tower in {region}: {e}")
    
    if not ct_region:
        print("Could not find Control Tower in any region")
        return False
    
    # Create Control Tower client in the correct region
    ct_client = session.client('controltower', region_name=ct_region)
    
    # Step 1: Find the OU ID
    try:
        # Get organization root ID
        roots = org_client.list_roots()
        root_id = roots['Roots'][0]['Id']
        
        # Find the OU by name
        ou_id = None
        paginator = org_client.get_paginator('list_organizational_units_for_parent')
        
        for page in paginator.paginate(ParentId=root_id):
            for ou in page['OrganizationalUnits']:
                if ou['Name'] == ou_name:
                    ou_id = ou['Id']
                    print(f"Found OU: {ou_name} (ID: {ou_id})")
                    break
            
            if ou_id:
                break
        
        if not ou_id:
            print(f"OU '{ou_name}' not found")
            return False
        
        # Step 2: Register the OU with Control Tower
        print(f"Registering OU '{ou_name}' with Control Tower...")
        try:
            response = ct_client.register_organizational_unit(
                OrganizationalUnitId=ou_id
            )
            
            operation_id = response.get('OperationIdentifier')
            print(f"Registration initiated. Operation ID: {operation_id}")
            print("Registration may take several minutes to complete.")
            
            return True
            
        except ClientError as e:
            if 'AlreadyExistsException' in str(e):
                print(f"OU '{ou_name}' is already registered with Control Tower")
                return True
            else:
                print(f"Error registering OU: {e}")
                return False
                
    except ClientError as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Name of the OU to register
    ou_name = "Workloads"  # Replace with your actual OU name
    
    register_ou_in_control_tower(ou_name)
