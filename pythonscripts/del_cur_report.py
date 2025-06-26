import boto3
from botocore.exceptions import ClientError

def delete_cur_reports_and_buckets(old_payer_profile):
    """
    Delete Cost and Usage Report (CUR) definitions and their S3 buckets in the old payer account.
    
    Parameters:
    - old_payer_profile: AWS CLI profile for the old payer account
    """
    session = boto3.Session(profile_name=old_payer_profile)
    cur_client = session.client('cur')
    s3_client = session.client('s3')
    
    print("Starting cleanup of CUR reports and S3 buckets in old payer account...")
    
    # Step 1: List and delete CUR report definitions
    try:
        print("\nListing Cost and Usage Reports...")
        reports = cur_client.describe_report_definitions()
        
        if not reports.get('ReportDefinitions'):
            print("No CUR reports found.")
        else:
            print(f"Found {len(reports['ReportDefinitions'])} CUR reports:")
            
            for report in reports['ReportDefinitions']:
                report_name = report['ReportName']
                s3_bucket = report['S3Bucket']
                s3_prefix = report.get('S3Prefix', '')
                s3_region = report.get('S3Region', 'us-east-1')
                
                print(f"\nReport: {report_name}")
                print(f"- S3 Bucket: {s3_bucket}")
                print(f"- S3 Prefix: {s3_prefix}")
                print(f"- S3 Region: {s3_region}")
                
                # Delete the report definition
                print(f"Deleting report definition: {report_name}")
                try:
                    cur_client.delete_report_definition(
                        ReportName=report_name
                    )
                    print(f"Successfully deleted report definition: {report_name}")
                except ClientError as e:
                    print(f"Error deleting report definition {report_name}: {e}")
                
                # Step 2: Empty and delete the associated S3 bucket
                print(f"\nPreparing to delete S3 bucket: {s3_bucket}")
                
                # Check if bucket exists and is accessible
                try:
                    s3_client.head_bucket(Bucket=s3_bucket)
                    
                    # Empty the bucket first (required before deletion)
                    print(f"Emptying bucket {s3_bucket}...")
                    
                    # List all object versions (if versioning is enabled)
                    try:
                        versions = s3_client.list_object_versions(Bucket=s3_bucket)
                        if 'Versions' in versions:
                            for version in versions['Versions']:
                                s3_client.delete_object(
                                    Bucket=s3_bucket,
                                    Key=version['Key'],
                                    VersionId=version['VersionId']
                                )
                                print(f"  Deleted object: {version['Key']} (version {version['VersionId']})")
                        
                        if 'DeleteMarkers' in versions:
                            for marker in versions['DeleteMarkers']:
                                s3_client.delete_object(
                                    Bucket=s3_bucket,
                                    Key=marker['Key'],
                                    VersionId=marker['VersionId']
                                )
                                print(f"  Deleted marker: {marker['Key']} (version {marker['VersionId']})")
                    except ClientError as e:
                        print(f"  Error listing versions: {e}")
                    
                    # List and delete regular objects
                    try:
                        objects = s3_client.list_objects_v2(Bucket=s3_bucket)
                        if 'Contents' in objects:
                            for obj in objects['Contents']:
                                s3_client.delete_object(
                                    Bucket=s3_bucket,
                                    Key=obj['Key']
                                )
                                print(f"  Deleted object: {obj['Key']}")
                    except ClientError as e:
                        print(f"  Error listing objects: {e}")
                    
                    # Delete the bucket
                    print(f"Deleting bucket {s3_bucket}...")
                    s3_client.delete_bucket(Bucket=s3_bucket)
                    print(f"Successfully deleted bucket: {s3_bucket}")
                    
                except ClientError as e:
                    if e.response['Error']['Code'] == '404':
                        print(f"Bucket {s3_bucket} does not exist or you don't have access to it.")
                    else:
                        print(f"Error accessing bucket {s3_bucket}: {e}")
    
    except ClientError as e:
        print(f"Error listing CUR reports: {e}")
    
    print("\nCUR cleanup process completed.")
    print("Note: If any errors occurred, some resources may need manual cleanup.")
    
    return True

if __name__ == "__main__":
    # Replace with your old payer account profile
    old_payer_profile = "OldPayerAccount"  # Replace with actual profile name
    
    delete_cur_reports_and_buckets(old_payer_profile)
