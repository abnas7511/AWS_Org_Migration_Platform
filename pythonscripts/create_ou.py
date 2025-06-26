import boto3
from botocore.exceptions import ClientError

def create_two_ous():
    """
    Create two basic Organizational Units in AWS Organizations.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    org_client = session.client('organizations')
    
    # Define the two OUs to create
    ou_names = ["Workloads"]
    
    try:
        # Get the organization's root ID
        roots = org_client.list_roots()
        root_id = roots['Roots'][0]['Id']
        print(f"Organization root ID: {root_id}")
        
        # Create each OU
        for name in ou_names:
            try:
                print(f"Creating OU: {name}")
                response = org_client.create_organizational_unit(
                    ParentId=root_id,
                    Name=name
                )
                
                ou_id = response['OrganizationalUnit']['Id']
                print(f"Successfully created OU: {name} (ID: {ou_id})")
                
            except ClientError as e:
                if 'DuplicateOrganizationalUnitException' in str(e):
                    print(f"OU already exists: {name}")
                else:
                    print(f"Error creating OU {name}: {e}")
        
    except ClientError as e:
        print(f"Error accessing AWS Organizations: {e}")

if __name__ == "__main__":
    create_two_ous()
