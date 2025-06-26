import boto3
from botocore.exceptions import ClientError

def create_symmetric_kms_key(alias_name="alias/migration-key", description="Key for AWS account migration"):
    """
    Create a symmetric KMS key for AWS account migration.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    kms_client = session.client('kms')
    
    try:
        print(f"Creating symmetric KMS key: {description}")
        
        # Create the KMS key
        response = kms_client.create_key(
            Description=description,
            KeyUsage='ENCRYPT_DECRYPT',
            Origin='AWS_KMS',
            BypassPolicyLockoutSafetyCheck=False,
            Tags=[
                {
                    'TagKey': 'Purpose',
                    'TagValue': 'AccountMigration'
                }
            ]
        )
        
        key_id = response['KeyMetadata']['KeyId']
        print(f"Successfully created KMS key: {key_id}")
        
        # Create an alias for the key
        kms_client.create_alias(
            AliasName=alias_name,
            TargetKeyId=key_id
        )
        print(f"Created alias: {alias_name}")
        
        # Print key details
        print("\nKey details:")
        print(f"Key ID: {key_id}")
        print(f"Key ARN: {response['KeyMetadata']['Arn']}")
        print(f"Alias: {alias_name}")
        
        return key_id
        
    except ClientError as e:
        print(f"Error creating KMS key: {e}")
        return None

if __name__ == "__main__":
    create_symmetric_kms_key()
