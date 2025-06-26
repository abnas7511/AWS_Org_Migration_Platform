import boto3
import json
from botocore.exceptions import ClientError

def check_ram_shared_resources():
    """
    Check for resources shared via RAM with the organization or OUs.
    """
    try:
        # Create a session using SSO profile
        session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')  # Use your SSO profile name here
        ram_client = session.client('ram')
        
        # Get resource shares - both owned by you and shared with you
        owned_shares = ram_client.get_resource_shares(resourceOwner='SELF')
        shared_with_you = ram_client.get_resource_shares(resourceOwner='OTHER-ACCOUNTS')
        
        # Check for organization or OU level shares
        org_shares = []
        for share in owned_shares.get('resourceShares', []):
            # Check if this share is shared with the organization or OUs
            if any(principal.startswith('arn:aws:organizations::') for principal in 
                  ram_client.get_resource_share_associations(
                      resourceShareArn=share['resourceShareArn'],
                      associationType='PRINCIPAL'
                  ).get('resourceShareAssociations', [])):
                org_shares.append(share)
        
        # Print results
        print(f"Found {len(org_shares)} resources shared with organization or OUs")
        if org_shares:
            print(json.dumps(org_shares, indent=2, default=str))
            
        return len(org_shares) > 0
        
    except ClientError as e:
        print(f"Error checking RAM shared resources: {e}")
        return False

if __name__ == "__main__":
    print("Checking for resources shared via RAM with the organization or OUs...")
    has_org_shares = check_ram_shared_resources()
    print(f"Organization-level shares found: {has_org_shares}")
