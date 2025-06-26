import boto3
from botocore.exceptions import ClientError

def disable_account_trail_and_verify_org_trail(account_id, trail_name):
    """
    Disable a specific trail in the dummy account and verify org trail.
    
    Parameters:
    - account_id: ID of the dummy account
    - trail_name: Name of the trail to disable
    """
    # Create session for management account
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    
    # Step 1: Verify organization CloudTrail
    print("Checking organization CloudTrail...")
    org_trail_name = "aws-controltower-BaselineCloudTrail"
    org_trail_found = False
    
    # Check in common regions
    regions = ['ap-south-1']
    
    for region in regions:
        try:
            cloudtrail = session.client('cloudtrail', region_name=region)
            trails = cloudtrail.describe_trails()
            
            for trail in trails['trailList']:
                if trail['Name'] == org_trail_name and trail.get('IsOrganizationTrail', False):
                    org_trail_found = True
                    print(f"Found organization trail: {org_trail_name} in {region}")
                    
                    # Check if trail is logging
                    status = cloudtrail.get_trail_status(Name=trail['TrailARN'])
                    is_logging = status.get('IsLogging', False)
                    
                    print(f"Organization trail logging: {'Yes' if is_logging else 'No'}")
                    break
            
            if org_trail_found:
                break
                
        except ClientError as e:
            print(f"Error checking CloudTrail in {region}: {e}")
    
    if not org_trail_found:
        print(f"WARNING: Organization trail not found!")
    
    # Step 2: Disable trail in dummy account
    print(f"\nDisabling trail '{trail_name}' in account {account_id}...")
    
    # Assume role in dummy account
    sts_client = session.client('sts')
    assumed_role = sts_client.assume_role(
        RoleArn=f"arn:aws:iam::{account_id}:role/OrganizationAccountAccessRole",
        RoleSessionName="DisableTrailSession"
    )
    
    dummy_session = boto3.Session(
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
    )
    
    # Try to find and disable the trail in all regions
    for region in regions:
        try:
            dummy_cloudtrail = dummy_session.client('cloudtrail', region_name=region)
            trails = dummy_cloudtrail.describe_trails()
            
            for trail in trails['trailList']:
                if trail['Name'] == trail_name:
                    print(f"Found trail '{trail_name}' in {region}")
                    
                    # Check if trail is logging
                    status = dummy_cloudtrail.get_trail_status(Name=trail['TrailARN'])
                    is_logging = status.get('IsLogging', False)
                    
                    if is_logging:
                        print(f"Stopping logging for trail '{trail_name}'...")
                        dummy_cloudtrail.stop_logging(Name=trail['TrailARN'])
                        print(f"Successfully disabled trail '{trail_name}'")
                    else:
                        print(f"Trail '{trail_name}' is already disabled")
                    
                    return True
                    
        except ClientError as e:
            print(f"Error in region {region}: {e}")
    
    print(f"Trail '{trail_name}' not found in any region")
    return False

if __name__ == "__main__":
    # Your dummy account ID
    account_id = "889453232070"
    
    # Name of the trail you created in the dummy account
    trail_name = "test_trail_dummy"  # Replace with your actual trail name
    
    disable_account_trail_and_verify_org_trail(account_id, trail_name)
