import boto3
import time
from botocore.exceptions import ClientError

def test_cloudtrail_deletion():
    """
    Create a test CloudTrail trail and then delete it to test the delete_trail API.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    cloudtrail = session.client('cloudtrail')
    s3 = session.client('s3')
    
    # Generate unique names for testing
    timestamp = int(time.time())
    test_trail_name = f"test-trail-{timestamp}"
    test_bucket_name = f"test-cloudtrail-bucket-{timestamp}"
    
    try:
        # Step 1: Create a test S3 bucket for CloudTrail logs
        print(f"Creating test S3 bucket: {test_bucket_name}")
        s3.create_bucket(
            Bucket=test_bucket_name,
            CreateBucketConfiguration={'LocationConstraint': 'ap-south-1'}
        )
        
        # Add bucket policy to allow CloudTrail to write logs
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AWSCloudTrailAclCheck",
                    "Effect": "Allow",
                    "Principal": {"Service": "cloudtrail.amazonaws.com"},
                    "Action": "s3:GetBucketAcl",
                    "Resource": f"arn:aws:s3:::{test_bucket_name}"
                },
                {
                    "Sid": "AWSCloudTrailWrite",
                    "Effect": "Allow",
                    "Principal": {"Service": "cloudtrail.amazonaws.com"},
                    "Action": "s3:PutObject",
                    "Resource": f"arn:aws:s3:::{test_bucket_name}/AWSLogs/*",
                    "Condition": {"StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}}
                }
            ]
        }
        
        s3.put_bucket_policy(
            Bucket=test_bucket_name,
            Policy=json.dumps(bucket_policy)
        )
        
        # Step 2: Create a test CloudTrail trail
        print(f"Creating test CloudTrail trail: {test_trail_name}")
        cloudtrail.create_trail(
            Name=test_trail_name,
            S3BucketName=test_bucket_name,
            IsMultiRegionTrail=False,
            EnableLogFileValidation=True,
            IncludeGlobalServiceEvents=True
        )
        
        # Start logging for the trail
        cloudtrail.start_logging(Name=test_trail_name)
        print(f"Started logging for trail: {test_trail_name}")
        
        # Wait a moment to ensure trail is active
        print("Waiting for trail to be fully active...")
        time.sleep(5)
        
        # Step 3: Test the delete_trail API
        print(f"\nTesting delete_trail API...")
        
        # First stop logging
        print(f"Stopping logging for trail: {test_trail_name}")
        cloudtrail.stop_logging(Name=test_trail_name)
        
        # Then delete the trail
        print(f"Deleting trail: {test_trail_name}")
        cloudtrail.delete_trail(Name=test_trail_name)
        print(f"Successfully deleted trail: {test_trail_name}")
        
        # Step 4: Clean up the test bucket
        print(f"\nCleaning up test bucket: {test_bucket_name}")
        
        # Delete all objects in the bucket
        objects = s3.list_objects_v2(Bucket=test_bucket_name)
        if 'Contents' in objects:
            for obj in objects['Contents']:
                s3.delete_object(Bucket=test_bucket_name, Key=obj['Key'])
        
        # Delete the bucket
        s3.delete_bucket(Bucket=test_bucket_name)
        print(f"Deleted test bucket: {test_bucket_name}")
        
        print("\nTest completed successfully!")
        return True
        
    except ClientError as e:
        print(f"Error during test: {e}")
        return False

if __name__ == "__main__":
    import json  # Import here for the bucket policy
    test_cloudtrail_deletion()
