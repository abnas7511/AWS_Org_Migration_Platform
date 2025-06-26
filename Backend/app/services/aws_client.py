import boto3
from botocore.exceptions import ClientError

class AWSClient:
    def __init__(self, service_name, region_name=None, access_key=None, secret_key=None, session_token=None, role_arn=None):
        """
        Initialize AWS client with provided credentials.
        
        Args:
            service_name: AWS service to connect to (e.g., 'ec2', 's3')
            region_name: AWS region (e.g., 'us-east-1')
            access_key: AWS access key ID
            secret_key: AWS secret access key
            session_token: AWS session token (required for temporary credentials)
            role_arn: Optional role ARN to assume
        """
        try:
            if access_key and secret_key:
                # Use provided access key and secret key
                kwargs = {
                    'aws_access_key_id': access_key,
                    'aws_secret_access_key': secret_key
                }
                
                # Add session token if provided (for temporary credentials)
                if session_token:
                    kwargs['aws_session_token'] = session_token
                    
                self.client = boto3.client(
                    service_name,
                    region_name=region_name,
                    **kwargs
                )
            elif role_arn:
                # Assume role using STS
                sts_client = boto3.client('sts')
                assumed_role = sts_client.assume_role(
                    RoleArn=role_arn,
                    RoleSessionName='AssumedRoleSession'
                )
                credentials = assumed_role['Credentials']
                self.client = boto3.client(
                    service_name,
                    region_name=region_name,
                    aws_access_key_id=credentials['AccessKeyId'],
                    aws_secret_access_key=credentials['SecretAccessKey'],
                    aws_session_token=credentials['SessionToken']
                )
            else:
                # Use default credentials from environment or instance profile
                self.client = boto3.client(
                    service_name,
                    region_name=region_name
                )
        except Exception as e:
            raise Exception(f"AWS {service_name} client initialization failed: {e}")
            
    def test_connection(self):
        """Test if the AWS client connection is working properly"""
        try:
            # For STS service, directly call get_caller_identity
            if hasattr(self.client, 'get_caller_identity'):
                self.client.get_caller_identity()
            # For EC2, call describe_regions
            elif hasattr(self.client, 'describe_regions'):
                self.client.describe_regions()
            # For S3, call list_buckets
            elif hasattr(self.client, 'list_buckets'):
                self.client.list_buckets()
            # For other services, create a new STS client with the same credentials
            else:
                # Get credentials from the client
                credentials = self.client._request_signer._credentials
                
                # Create STS client using the same credentials
                sts_client = boto3.client(
                    'sts',
                    region_name=self.client.meta.region_name,
                    aws_access_key_id=credentials.access_key,
                    aws_secret_access_key=credentials.secret_key,
                    aws_session_token=getattr(credentials, 'token', None)  # Get token if it exists
                )
                sts_client.get_caller_identity()
                
            return True
        except Exception as e:
            raise Exception(f"AWS connection test failed: {e}")