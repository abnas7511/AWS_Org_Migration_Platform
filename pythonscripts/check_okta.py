import boto3
from botocore.exceptions import ClientError

def configure_sso_with_okta(saml_metadata_file, instance_arn=None):
    """
    Configure AWS IAM Identity Center with Okta as external IdP.
    
    Parameters:
    - saml_metadata_file: Path to the SAML metadata XML file from Okta
    - instance_arn: IAM Identity Center instance ARN (optional)
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    sso_admin = session.client('sso-admin')
    
    try:
        # Get IAM Identity Center instance if not provided
        if not instance_arn:
            instances = sso_admin.list_instances()
            if not instances.get('Instances'):
                print("IAM Identity Center is not enabled.")
                return False
            instance_arn = instances['Instances'][0]['InstanceArn']
            print(f"Using IAM Identity Center instance: {instance_arn}")
        
        # Read SAML metadata from file
        try:
            with open(saml_metadata_file, 'r') as file:
                saml_metadata = file.read()
        except Exception as e:
            print(f"Error reading SAML metadata file: {e}")
            return False
        
        # Create SAML provider
        print("Creating SAML provider for Okta...")
        response = sso_admin.create_application_provider(
            ApplicationProviderType='SAML',
            DisplayName='Okta',
            SamlMetadata=saml_metadata
        )
        provider_arn = response['ApplicationProviderArn']
        print(f"Successfully created SAML provider: {provider_arn}")
        
        print("\nNext steps:")
        print("1. Create permission sets in IAM Identity Center")
        print("2. Assign users and groups to AWS accounts")
        print("3. Test the integration")
        
        return provider_arn
        
    except ClientError as e:
        print(f"Error configuring SSO with Okta: {e}")
        return False

if __name__ == "__main__":
    # Replace with path to your SAML metadata file from Okta
    saml_metadata_file = "okta_metadata.xml"
    configure_sso_with_okta(saml_metadata_file)
