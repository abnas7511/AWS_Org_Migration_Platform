import boto3
from botocore.exceptions import ClientError

def remove_secops_cloudtrail(secops_trail_name="SecOps-CloudTrail", org_trail_name="aws-controltower-BaselineCloudTrail"):
    """
    Remove SecOps CloudTrail and verify the organization is using the Control Tower baseline CloudTrail.
    
    Parameters:
    - secops_trail_name: Name of the SecOps CloudTrail to remove
    - org_trail_name: Name of the organization CloudTrail to verify
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    
    # Check all regions for CloudTrail trails
    ec2_client = session.client('ec2')
    regions = [region['RegionName'] for region in ec2_client.describe_regions()['Regions']]
    
    # Step 1: Verify organization CloudTrail exists and is logging
    print("Verifying organization CloudTrail...")
    org_trail_found = False
    org_trail_logging = False
    org_trail_region = None
    
    for region in regions:
        try:
            cloudtrail = session.client('cloudtrail', region_name=region)
            trails = cloudtrail.describe_trails()
            
            for trail in trails['trailList']:
                if trail['Name'] == org_trail_name and trail.get('IsOrganizationTrail', False):
                    org_trail_found = True
                    org_trail_region = region
                    print(f"Found organization trail: {org_trail_name} in {region}")
                    
                    # Check if trail is logging
                    status = cloudtrail.get_trail_status(Name=trail['TrailARN'])
                    org_trail_logging = status.get('IsLogging', False)
                    
                    if org_trail_logging:
                        print(f"Organization trail is actively logging")
                    else:
                        print(f"Organization trail is NOT logging - enabling...")
                        cloudtrail.start_logging(Name=trail['TrailARN'])
                        print(f"Logging enabled for organization trail")
                        org_trail_logging = True
                    
                    break
            
            if org_trail_found:
                break
                
        except ClientError as e:
            print(f"Error checking CloudTrail in {region}: {e}")
    
    if not org_trail_found:
        print(f"WARNING: Organization trail '{org_trail_name}' not found!")
        print("Cannot proceed without organization trail")
        return False
    
    # Step 2: Find and remove SecOps CloudTrail
    print(f"\nSearching for SecOps CloudTrail '{secops_trail_name}'...")
    secops_trail_found = False
    
    for region in regions:
        try:
            cloudtrail = session.client('cloudtrail', region_name=region)
            trails = cloudtrail.describe_trails()
            
            for trail in trails['trailList']:
                if trail['Name'] == secops_trail_name:
                    secops_trail_found = True
                    print(f"Found SecOps CloudTrail in {region}")
                    
                    # First stop logging
                    try:
                        status = cloudtrail.get_trail_status(Name=trail['TrailARN'])
                        if status.get('IsLogging', False):
                            print(f"Stopping logging for SecOps CloudTrail...")
                            cloudtrail.stop_logging(Name=trail['TrailARN'])
                            print(f"Logging stopped")
                    except ClientError as e:
                        print(f"Error stopping logging: {e}")
                    
                    # Then delete the trail
                    try:
                        print(f"Deleting SecOps CloudTrail...")
                        cloudtrail.delete_trail(Name=trail['TrailARN'])
                        print(f"Successfully deleted SecOps CloudTrail")
                    except ClientError as e:
                        print(f"Error deleting trail: {e}")
                        
                    break
            
            if secops_trail_found:
                break
                
        except ClientError as e:
            print(f"Error checking CloudTrail in {region}: {e}")
    
    if not secops_trail_found:
        print(f"SecOps CloudTrail '{secops_trail_name}' not found")
    
    # Summary
    print("\nSummary:")
    print(f"- Organization CloudTrail found: {'Yes' if org_trail_found else 'No'}")
    print(f"- Organization CloudTrail logging: {'Yes' if org_trail_logging else 'No'}")
    print(f"- SecOps CloudTrail found and removed: {'Yes' if secops_trail_found else 'No'}")
    
    return org_trail_found and org_trail_logging

if __name__ == "__main__":
    # You can customize the trail names if needed
    secops_trail_name = "SecOps-CloudTrail"  # Replace with actual SecOps trail name
    org_trail_name = "aws-controltower-BaselineCloudTrail"
    
    remove_secops_cloudtrail(secops_trail_name, org_trail_name)
