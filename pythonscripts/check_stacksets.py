import boto3
from botocore.exceptions import ClientError

def check_stacksets_for_org_integration():
    """
    Check if CloudFormation StackSets use AWS Organizations.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    cfn_client = session.client('cloudformation')
    
    org_stacksets = []
    
    try:
        print("Checking CloudFormation StackSets for AWS Organizations integration...")
        
        # List all StackSets
        paginator = cfn_client.get_paginator('list_stack_sets')
        
        for page in paginator.paginate():
            for stack_set in page['Summaries']:
                stack_set_name = stack_set['StackSetName']
                
                try:
                    # Get StackSet details
                    details = cfn_client.describe_stack_set(StackSetName=stack_set_name)
                    
                    # Check if StackSet uses service-managed permissions (Organizations)
                    permission_model = details['StackSet'].get('PermissionModel', '')
                    
                    if permission_model == 'SERVICE_MANAGED':
                        print(f"- Found StackSet using Organizations: {stack_set_name}")
                        org_stacksets.append({
                            'name': stack_set_name,
                            'status': details['StackSet'].get('Status'),
                            'permission_model': permission_model
                        })
                        
                        # Get stack instances to see which OUs/accounts are targeted
                        try:
                            instances = cfn_client.list_stack_instances(StackSetName=stack_set_name)
                            if instances.get('Summaries'):
                                print(f"  Deployed to {len(instances['Summaries'])} accounts/OUs")
                        except ClientError as e:
                            print(f"  Error listing stack instances: {e}")
                            
                except ClientError as e:
                    print(f"  Error getting details for StackSet {stack_set_name}: {e}")
        
        # Print summary
        print(f"\nFound {len(org_stacksets)} StackSets using AWS Organizations")
        
        if org_stacksets:
            print("\nStackSets using AWS Organizations:")
            for ss in org_stacksets:
                print(f"- {ss['name']} (Status: {ss['status']})")
            
            print("\nNote: These StackSets will need to be recreated in the new organization after migration.")
        
        return org_stacksets
        
    except ClientError as e:
        print(f"Error checking CloudFormation StackSets: {e}")
        return []

if __name__ == "__main__":
    check_stacksets_for_org_integration()
