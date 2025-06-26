import boto3
from botocore.exceptions import ClientError

def check_sso_config_for_okta():
    """
    Check IAM Identity Center configuration and prepare for Okta integration.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    sso_admin = session.client('sso-admin')
    
    # Get IAM Identity Center instance
    instances = sso_admin.list_instances()
    instance_arn = instances['Instances'][0]['InstanceArn']
    instance_id = instances['Instances'][0]['IdentityStoreId']
    
    print(f"IAM Identity Center instance ARN: {instance_arn}")
    print(f"Identity Store ID: {instance_id}")
    
    # Check for existing SAML providers
    try:
        # Check if trust store providers exist (SAML providers)
        try:
            providers = sso_admin.list_trust_store_providers(InstanceArn=instance_arn)
            if providers.get('Providers'):
                print("\nExisting SAML providers:")
                for provider in providers['Providers']:
                    print(f"- Provider: {provider['Name']} ({provider['Type']})")
                    if 'okta' in provider['Name'].lower():
                        print("  Okta integration appears to be already set up.")
            else:
                print("\nNo SAML providers found. You can integrate with Okta.")
        except ClientError as e:
            if 'AccessDeniedException' in str(e):
                print("\nYou don't have permission to list trust store providers.")
            else:
                print(f"\nError checking providers: {e}")
        
        # List permission sets to check configuration
        try:
            permission_sets = sso_admin.list_permission_sets(InstanceArn=instance_arn)
            print(f"\nFound {len(permission_sets.get('PermissionSets', []))} permission sets configured.")
        except ClientError as e:
            print(f"Error listing permission sets: {e}")
        
        print("\nTo integrate with Okta, you would need to:")
        print("1. Create a SAML application in Okta")
        print("2. Download the SAML metadata XML")
        print("3. Create a trust store provider in IAM Identity Center")
        print("4. Configure attribute mappings")
        
        # Show sample code for creating provider (without executing)
        print("\nSample code to create Okta provider (requires SAML metadata):")
        print("""
sso_admin.create_trust_store_provider(
    InstanceArn=instance_arn,
    Name="Okta",
    Type='SAML',
    AutomaticUserProvisioningConfiguration={'Status': 'DISABLED'},
    SamlOptions={
        'MetadataXml': saml_metadata_xml,
        'RelayStateParameterName': 'RelayState'
    }
)
        """)
        
    except ClientError as e:
        print(f"Error checking IAM Identity Center configuration: {e}")
    
    return True

if __name__ == "__main__":
    check_sso_config_for_okta()
