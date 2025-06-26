import boto3
from botocore.exceptions import ClientError
import time

def duplicate_sso_config_for_dummy_account(dummy_account_id="889453232070"):
    """
    Duplicate SSO configuration and assign to dummy account in Workloads OU.
    
    Parameters:
    - dummy_account_id: ID of the dummy account
    """
    # Create a boto3 session with the specified profile
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    sso_admin = session.client('sso-admin')
    
    # Step 1: Get SSO instance
    print("Getting IAM Identity Center instance...")
    try:
        instances = sso_admin.list_instances()
        if not instances.get('Instances'):
            print("No IAM Identity Center instance found")
            return False
        
        # Get the first instance ARN and IdentityStoreId
        instance_arn = instances['Instances'][0]['InstanceArn']
        instance_id = instances['Instances'][0]['IdentityStoreId']
        print(f"Found IAM Identity Center instance: {instance_arn}")
        
    except ClientError as e:
        print(f"Error getting IAM Identity Center instance: {e}")
        return False
    
    # Step 2: List existing permission sets
    print("\nListing existing permission sets...")
    try:
        permission_sets = sso_admin.list_permission_sets(InstanceArn=instance_arn)
        if not permission_sets.get('PermissionSets'):
            print("No permission sets found")
            return False
        
        print(f"Found {len(permission_sets['PermissionSets'])} permission sets")
        
        # Get details of each permission set to find a suitable one to duplicate
        source_ps_arn = None
        for ps_arn in permission_sets['PermissionSets']:
            ps = sso_admin.describe_permission_set(
                InstanceArn=instance_arn,
                PermissionSetArn=ps_arn
            )
            print(f"- {ps['PermissionSet']['Name']}")
            
            # Prefer to use ReadOnlyAccess or similar if available
            if 'ReadOnly' in ps['PermissionSet']['Name'] or 'ViewOnly' in ps['PermissionSet']['Name']:
                source_ps_arn = ps_arn
                print(f"  (Selected as source)")
        
        # If no ReadOnly found, use the first one
        if not source_ps_arn:
            source_ps_arn = permission_sets['PermissionSets'][0]
            
    except ClientError as e:
        print(f"Error listing permission sets: {e}")
        return False
    
    # Step 3: Create a duplicate permission set for the dummy account
    try:
        # Get source permission set details
        ps_details = sso_admin.describe_permission_set(
            InstanceArn=instance_arn,
            PermissionSetArn=source_ps_arn
        )
        
        source_name = ps_details['PermissionSet']['Name']
        source_description = ps_details['PermissionSet'].get('Description', '')
        session_duration = ps_details['PermissionSet'].get('SessionDuration', 'PT1H')
        
        print(f"\nDuplicating permission set: {source_name}")
        
        # Create duplicate permission set with "-DummyTest" suffix
        test_ps_name = f"{source_name}-DummyTest"
        
        # Check if test permission set already exists
        existing_test_ps = None
        for ps_arn in permission_sets['PermissionSets']:
            try:
                ps = sso_admin.describe_permission_set(
                    InstanceArn=instance_arn,
                    PermissionSetArn=ps_arn
                )
                if ps['PermissionSet']['Name'] == test_ps_name:
                    existing_test_ps = ps_arn
                    break
            except ClientError:
                continue
        
        if existing_test_ps:
            print(f"Test permission set {test_ps_name} already exists")
            test_ps_arn = existing_test_ps
        else:
            # Create new test permission set
            response = sso_admin.create_permission_set(
                InstanceArn=instance_arn,
                Name=test_ps_name,
                Description=f"Test duplicate for dummy account",
                SessionDuration=session_duration
            )
            
            test_ps_arn = response['PermissionSet']['PermissionSetArn']
            print(f"Created test permission set: {test_ps_name}")
            
            # Copy inline policy if exists
            try:
                inline_policy = sso_admin.get_inline_policy_for_permission_set(
                    InstanceArn=instance_arn,
                    PermissionSetArn=source_ps_arn
                ).get('InlinePolicy')
                
                if inline_policy:
                    sso_admin.put_inline_policy_to_permission_set(
                        InstanceArn=instance_arn,
                        PermissionSetArn=test_ps_arn,
                        InlinePolicy=inline_policy
                    )
                    print("Copied inline policy")
            except ClientError as e:
                print(f"Error copying inline policy: {e}")
            
            # Copy managed policies
            try:
                managed_policies = sso_admin.list_managed_policies_in_permission_set(
                    InstanceArn=instance_arn,
                    PermissionSetArn=source_ps_arn
                ).get('AttachedManagedPolicies', [])
                
                for policy in managed_policies:
                    sso_admin.attach_managed_policy_to_permission_set(
                        InstanceArn=instance_arn,
                        PermissionSetArn=test_ps_arn,
                        ManagedPolicyArn=policy['Arn']
                    )
                
                print(f"Copied {len(managed_policies)} managed policies")
            except ClientError as e:
                print(f"Error copying managed policies: {e}")
        
        # Step 4: Get a test user
        identitystore = session.client('identitystore', region_name=sso_admin.meta.region_name)
        
        # Try to get a user
        test_user = None
        try:
            users = identitystore.list_users(
                IdentityStoreId=instance_id,
                MaxResults=1
            )
            
            if users.get('Users'):
                test_user = users['Users'][0]
                print(f"\nUsing user {test_user['UserName']} for testing")
            else:
                print("\nNo users found in identity store")
                return False
        except ClientError as e:
            print(f"Error listing users: {e}")
            return False
        
        # Step 5: Assign permission set to dummy account
        print(f"\nAssigning permission set to dummy account {dummy_account_id}...")
        
        try:
            response = sso_admin.create_account_assignment(
                InstanceArn=instance_arn,
                TargetId=dummy_account_id,
                TargetType='AWS_ACCOUNT',
                PermissionSetArn=test_ps_arn,
                PrincipalType='USER',
                PrincipalId=test_user['UserId']
            )
            
            request_id = response['AccountAssignmentCreationStatus']['RequestId']
            print(f"Assignment initiated. Request ID: {request_id}")
            
            # Wait for provisioning to complete
            print("Waiting for provisioning to complete...")
            max_attempts = 10
            for i in range(max_attempts):
                time.sleep(3)  # Wait between checks
                status = sso_admin.describe_account_assignment_creation_status(
                    InstanceArn=instance_arn,
                    AccountAssignmentCreationRequestId=request_id
                )
                
                current_status = status['AccountAssignmentCreationStatus']['Status']
                print(f"Status: {current_status}")
                
                if current_status == 'SUCCEEDED':
                    print("\nPermission set successfully assigned to dummy account!")
                    print(f"\nTest access instructions:")
                    print(f"1. Go to the AWS SSO user portal")
                    print(f"2. Sign in as {test_user['UserName']}")
                    print(f"3. You should see the dummy account (889453232070)")
                    print(f"4. Click on the account and select the {test_ps_name} role")
                    print(f"5. You should be able to access the dummy account with the assigned permissions")
                    break
                elif current_status == 'FAILED':
                    print(f"Assignment failed: {status['AccountAssignmentCreationStatus'].get('FailureReason', 'Unknown reason')}")
                    break
                
                if i == max_attempts - 1:
                    print("Timed out waiting for provisioning to complete")
            
        except ClientError as e:
            if 'ConflictException' in str(e):
                print("Assignment already exists")
                print("\nTest access instructions:")
                print(f"1. Go to the AWS SSO user portal")
                print(f"2. Sign in as {test_user['UserName']}")
                print(f"3. You should see the dummy account (889453232070)")
                print(f"4. Click on the account and select the {test_ps_name} role")
            else:
                print(f"Error creating account assignment: {e}")
        
        return True
        
    except ClientError as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Your dummy account ID
    dummy_account_id = "889453232070"
    
    # Call the function to duplicate SSO config for the dummy account
    duplicate_sso_config_for_dummy_account(dummy_account_id)

# This script:
# - Gets the IAM Identity Center instance
# - Lists existing permission sets and selects one to duplicate (preferring ReadOnly if available)
# - Creates a duplicate permission set with "-DummyTest" suffix
# - Copies inline policies and managed policies from the source permission set
# - Gets a test user from the identity store
# - Assigns the permission set to dummy account (889453232070)
# - Waits for the provisioning to complete
# - Provides instructions for testing the access