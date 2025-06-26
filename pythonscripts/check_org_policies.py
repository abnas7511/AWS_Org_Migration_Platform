import boto3
import json
import re
from botocore.exceptions import ClientError

def check_policies_for_org_references():
    """
    Check policy documents for Organization/OU references in IAM, S3, and KMS.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    results = {
        'iam_policies_with_org_refs': [],
        's3_policies_with_org_refs': [],
        'kms_policies_with_org_refs': []
    }
    
    # Pattern to search for org/OU references in policies
    org_patterns = [
        r'aws:PrincipalOrgID',
        r'aws:PrincipalOrgPaths',
        r'arn:aws:organizations',
        r'arn:aws:iam::[0-9]+:role/aws-service-role/organizations',
        r'organizations',  # More general pattern
        r'org-'  # Common prefix for organization IDs
    ]
    
    # Check IAM policies - both AWS managed and customer managed
    try:
        iam_client = session.client('iam')
        
        # Check customer managed policies
        print("Checking customer managed IAM policies for organization references...")
        paginator = iam_client.get_paginator('list_policies')
        policy_iterator = paginator.paginate(Scope='Local')
        
        for page in policy_iterator:
            for policy in page['Policies']:
                try:
                    policy_version = iam_client.get_policy_version(
                        PolicyArn=policy['Arn'],
                        VersionId=policy['DefaultVersionId']
                    )
                    
                    policy_doc = json.dumps(policy_version['PolicyVersion']['Document'])
                    
                    # Check if policy contains org references
                    if any(re.search(pattern, policy_doc, re.IGNORECASE) for pattern in org_patterns):
                        print(f"- Found org reference in customer IAM policy: {policy['PolicyName']}")
                        results['iam_policies_with_org_refs'].append({
                            'name': policy['PolicyName'],
                            'arn': policy['Arn'],
                            'type': 'Customer Managed'
                        })
                except ClientError as e:
                    print(f"  Error getting policy version for {policy['PolicyName']}: {e}")
        
        # Check AWS managed policies
        print("\nChecking AWS managed IAM policies for organization references...")
        aws_policy_iterator = paginator.paginate(Scope='AWS')
        
        for page in aws_policy_iterator:
            for policy in page['Policies']:
                # Only check policies with "organization" in the name to limit the number
                if 'organization' in policy['PolicyName'].lower():
                    try:
                        policy_version = iam_client.get_policy_version(
                            PolicyArn=policy['Arn'],
                            VersionId=policy['DefaultVersionId']
                        )
                        
                        policy_doc = json.dumps(policy_version['PolicyVersion']['Document'])
                        
                        # Check if policy contains org references
                        if any(re.search(pattern, policy_doc, re.IGNORECASE) for pattern in org_patterns):
                            print(f"- Found org reference in AWS managed IAM policy: {policy['PolicyName']}")
                            results['iam_policies_with_org_refs'].append({
                                'name': policy['PolicyName'],
                                'arn': policy['Arn'],
                                'type': 'AWS Managed'
                            })
                    except ClientError as e:
                        print(f"  Error getting policy version for {policy['PolicyName']}: {e}")
        
        print(f"Found {len(results['iam_policies_with_org_refs'])} IAM policies with org references")
    except ClientError as e:
        print(f"Error checking IAM policies: {e}")
    
    # Check specific S3 buckets
    try:
        s3_client = session.client('s3', region_name='us-east-1')
        
        print("\nChecking S3 bucket policies for organization references...")
        
        # List all buckets
        buckets = s3_client.list_buckets()['Buckets']
        print(f"Found {len(buckets)} S3 buckets")
        
        # Check each bucket
        for bucket in buckets:
            bucket_name = bucket['Name']
            try:
                policy = s3_client.get_bucket_policy(Bucket=bucket_name)
                policy_doc = policy['Policy']
                
                # Check if policy contains org references
                if any(re.search(pattern, policy_doc, re.IGNORECASE) for pattern in org_patterns):
                    print(f"- Found org reference in S3 bucket policy: {bucket_name}")
                    results['s3_policies_with_org_refs'].append({
                        'bucket': bucket_name
                    })
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchBucketPolicy':
                    print(f"  Error getting policy for bucket {bucket_name}: {e}")
        
        # Check specific bucket that we know has a policy
        specific_bucket = "vpc-flow-log-bucket-forcloudstudio"
        try:
            policy = s3_client.get_bucket_policy(Bucket=specific_bucket)
            policy_doc = policy['Policy']
            
            # Print the policy for inspection
            print(f"\nPolicy for bucket {specific_bucket}:")
            print(policy_doc)
            
            # Check if policy contains org references
            if any(re.search(pattern, policy_doc, re.IGNORECASE) for pattern in org_patterns):
                print(f"- Found org reference in specific S3 bucket policy: {specific_bucket}")
                if not any(b['bucket'] == specific_bucket for b in results['s3_policies_with_org_refs']):
                    results['s3_policies_with_org_refs'].append({
                        'bucket': specific_bucket
                    })
        except ClientError as e:
            print(f"  Error getting policy for specific bucket {specific_bucket}: {e}")
        
        print(f"Found {len(results['s3_policies_with_org_refs'])} S3 buckets with org references in policies")
    except ClientError as e:
        print(f"Error checking S3 policies: {e}")
    
    # Check KMS key policies
    try:
        kms_client = session.client('kms')
        
        print("\nChecking KMS key policies for organization references...")
        paginator = kms_client.get_paginator('list_keys')
        
        key_count = 0
        for page in paginator.paginate():
            for key in page['Keys']:
                key_count += 1
                try:
                    # Get key details
                    key_info = kms_client.describe_key(KeyId=key['KeyId'])
                    key_id = key['KeyId']
                    
                    # Skip AWS managed keys
                    if key_info['KeyMetadata'].get('KeyManager') == 'AWS':
                        continue
                    
                    # Get key policy
                    key_policy = kms_client.get_key_policy(
                        KeyId=key_id,
                        PolicyName='default'
                    )
                    
                    policy_doc = key_policy['Policy']
                    
                    # Check if policy contains org references
                    if any(re.search(pattern, policy_doc, re.IGNORECASE) for pattern in org_patterns):
                        # Try to get alias
                        key_alias = "Unknown"
                        try:
                            aliases = kms_client.list_aliases(KeyId=key_id)
                            if aliases['Aliases']:
                                key_alias = aliases['Aliases'][0]['AliasName']
                        except:
                            pass
                            
                        print(f"- Found org reference in KMS key policy: {key_alias} ({key_id})")
                        results['kms_policies_with_org_refs'].append({
                            'key_id': key_id,
                            'alias': key_alias
                        })
                except ClientError as e:
                    if 'AccessDenied' not in str(e):
                        print(f"  Error getting policy for KMS key {key['KeyId']}: {e}")
        
        print(f"Checked {key_count} KMS keys")
        print(f"Found {len(results['kms_policies_with_org_refs'])} KMS keys with org references in policies")
    except ClientError as e:
        print(f"Error checking KMS policies: {e}")
    
    # Print summary
    print("\nSummary of policies with organization references:")
    print(f"- IAM Policies: {len(results['iam_policies_with_org_refs'])}")
    print(f"- S3 Bucket Policies: {len(results['s3_policies_with_org_refs'])}")
    print(f"- KMS Key Policies: {len(results['kms_policies_with_org_refs'])}")
    
    # Print detailed results
    if results['iam_policies_with_org_refs']:
        print("\nIAM Policies with organization references:")
        for policy in results['iam_policies_with_org_refs']:
            print(f"- {policy['name']} ({policy['type']})")
    
    if results['s3_policies_with_org_refs']:
        print("\nS3 Buckets with organization references in policies:")
        for bucket in results['s3_policies_with_org_refs']:
            print(f"- {bucket['bucket']}")
    
    if results['kms_policies_with_org_refs']:
        print("\nKMS Keys with organization references in policies:")
        for key in results['kms_policies_with_org_refs']:
            print(f"- {key['alias']} ({key['key_id']})")
    
    return results

if __name__ == "__main__":
    print("Checking policies for Organization/OU references...")
    check_policies_for_org_references()
