import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import json
import re
import string
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.services.aws_client_helper import get_aws_session

def check_ram_shared_resources(db: Session = None, account_id: str = None):
    """
    Check for resources shared via RAM with the organization, OUs, or accounts.
    Returns only the fields needed for frontend display.
    """
    try:
        session = get_aws_session(db, account_id)
        if not session:
            raise ValueError("Failed to create AWS session. Check your credentials and configuration.")
        ram_client = session.client('ram')

        owned_shares = ram_client.get_resource_shares(resourceOwner='SELF')
        all_shares = []
        org_shares = []

        for share in owned_shares.get('resourceShares', []):
            try:
                principal_associations = ram_client.get_resource_share_associations(
                    resourceShareArns=[share['resourceShareArn']],
                    associationType='PRINCIPAL'
                ).get('resourceShareAssociations', [])

                # Get detailed resource info using list_resources
                resources = []
                paginator = ram_client.get_paginator('list_resources')
                for page in paginator.paginate(
                    resourceOwner='SELF',
                    resourceShareArns=[share['resourceShareArn']]
                ):
                    for res in page.get('resources', []):
                        resources.append({
                            'Resource_arn': res.get('arn', ''),
                            'Resource_type': res.get('type', 'Unknown'),
                        })

                share_details = {
                    'Name': share.get('name'),
                    'ARN': share.get('resourceShareArn'),
                    'Status': share.get('status'),
                    'Resources': resources
                }

                # If no principal associations, treat as self-share
                if not principal_associations:
                    all_shares.append(share_details)
                else:
                    for assoc in principal_associations:
                        principal = assoc.get('principal', '')
                        # Only add org/OUs to org_shares
                        if principal.startswith('arn:aws:organizations::'):
                            org_shares.append(share_details)
                        all_shares.append(share_details)
            except ClientError as e:
                print(f"Error checking associations for share {share.get('name')}: {e}")
                continue

        return {
            "success": True,
            "shared_resources": all_shares,
            "org_shared_resources": org_shares,
            "message": f"Found {len(all_shares)} shared resources, {len(org_shares)} with organization/OUs"
        }

    except ClientError as e:
        error_message = str(e)
        print(f"Error in RAM check: {error_message}")
        return {
             "success": False,
            "shared_resources": [],
            "org_shared_resources": [],
            "message": f"Error checking RAM shared resources: {error_message}"
        }


def check_delegated_admins(db: Session = None, account_id: str = None):
    """
    Check if services like AWS Backup, GuardDuty, and Inspector have delegated admins.
    """
    results = {}
    try:
        # Get AWS session
        session = get_aws_session(db, account_id)
        if not session:
            raise ValueError("Failed to create AWS session. Check your credentials and configuration.")
        
        guardduty = session.client('guardduty')
        guardduty_admins = guardduty.list_organization_admin_accounts()
        results['GuardDuty'] = guardduty_admins.get('AdminAccounts', [])
        print(f"GuardDuty delegated admins: {len(results['GuardDuty'])}")
    except ClientError as e:
        print(f"Error checking GuardDuty: {e}")
        results['GuardDuty'] = f"Error: {str(e)}"
    
    # Check AWS Backup delegated admin
    try:
        organizations = session.client('organizations')
        backup_admins = organizations.list_delegated_administrators(ServicePrincipal='backup.amazonaws.com')
        results['AWS Backup'] = backup_admins.get('DelegatedAdministrators', [])
        print(f"AWS Backup delegated admins: {len(results['AWS Backup'])}")
    except ClientError as e:
        print(f"Error checking AWS Backup: {e}")
        results['AWS Backup'] = f"Error: {str(e)}"
    
    # Check Inspector delegated admin
    try:
        # Get region from session
        region = session.region_name if hasattr(session, "region_name") else None
        print("Using region:", region)
        inspector2 = session.client('inspector2', region_name=region)
        inspector_admin = inspector2.list_delegated_admin_accounts()
        if inspector_admin['delegatedAdminAccounts']:
            results['Inspector'] = inspector_admin['delegatedAdminAccounts']
            print(f"Inspector delegated admin: {inspector_admin['delegatedAdminAccounts'][0]['accountId']}")
        else:
            results['Inspector'] = []
            print("No Inspector delegated admin found")
    except ClientError as e:
        print(f"Error checking Inspector: {e}")
        results['Inspector'] = []
    
    # Print detailed results
    print("\nDetailed results:")
    print(json.dumps(results, indent=2, default=str))
    
    return results


def check_cost_explorer_data(db: Session = None, account_id: str = None):
    """
    Check Cost Explorer data availability to confirm historical data access.
    This helps verify that after migration, historical data from Payer1 won't be available in Payer2.
    """
    results = {
        "billing_periods": [],
        "success": True
    }

    try:
        # Get AWS session
        session = get_aws_session(db, account_id)
        if not session:
            raise ValueError("Failed to create AWS session. Check your credentials and configuration.")

        ce_client = session.client('ce')
        
        # Get current date and calculate dates for last 3 months
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
        
        # Check if cost data is available
        response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='MONTHLY',
            Metrics=['UnblendedCost']
        )
        
        # Format cost explorer data
        for period in response.get('ResultsByTime', []):
            start = period.get('TimePeriod', {}).get('Start')
            end = period.get('TimePeriod', {}).get('End')
            amount = period.get('Total', {}).get('UnblendedCost', {}).get('Amount', '0')
            unit = period.get('Total', {}).get('UnblendedCost', {}).get('Unit', 'USD')
            estimated = period.get('Estimated', False)
            
            results["billing_periods"].append({
                "Period": f"{start} to {end}",
                "Amount": amount,
                "Unit": unit,
                "Estimated": "Yes" if estimated else "No"
            })
        
    except ClientError as e:
        results["error"] = str(e)
        results["success"] = False
    
    # Try to check CUR in a separate try block
    try:
        cur_client = session.client('cur', region_name='us-east-1')  # CUR is only available in us-east-1
        reports = cur_client.describe_report_definitions()
        
        # Keep the original CUR reports structure
        results["cur_reports"] = reports.get('ReportDefinitions', [])
        
    except ClientError as e:
        if "error" not in results:
            results["error"] = str(e)
    
    return results


def check_ri_and_savings_plans(db: Session = None, account_id: str = None):
    """
    Check if any Reserved Instances or Savings Plans are purchased and in use.
    """
    results = {
        "reserved_instances": [],
        "savings_plans": [],
        "success": True
    }
    # Check Reserved Instances
    try:
        # Get AWS session
        session = get_aws_session(db, account_id)
        if not session:
            raise ValueError("Failed to create AWS session. Check your credentials and configuration.")

        ec2_client = session.client('ec2')
        ri_response = ec2_client.describe_reserved_instances(
            Filters=[{'Name': 'state', 'Values': ['active']}]
        )
        
        active_ris = ri_response.get('ReservedInstances', [])
        
        # Format RI data
        for ri in active_ris:
            results["reserved_instances"].append({
                "Id": ri.get('ReservedInstancesId', ''),
                "Type": ri.get('InstanceType', ''),
                "Count": ri.get('InstanceCount', 0),
                "End_date": ri.get('End', '').strftime('%Y-%m-%d') if isinstance(ri.get('End'), datetime) else str(ri.get('End', '')),
                "Offering_class": ri.get('OfferingClass', ''),
                "Offering_type": ri.get('OfferingType', ''),
                "Scope": ri.get('Scope', ''),
                "Zone": ri.get('AvailabilityZone', '')
            })
        
    except ClientError as e:
        results["error"] = str(e)
        results["success"] = False
    
    # Check Savings Plans
    try:
        sp_client = session.client('savingsplans')
        
        # Check for active Savings Plans
        sp_response = sp_client.describe_savings_plans(
            states=['active']
        )
        
        active_sps = sp_response.get('savingsPlans', [])
        
        # Format Savings Plans data
        for sp in active_sps:
            results["savings_plans"].append({
                "Id": sp.get('savingsPlanId', ''),
                "Type": sp.get('savingsPlanType', ''),
                "Commitment": sp.get('commitment', ''),
                "End_date": sp.get('term', {}).get('end', ''),
                "Payment_option": sp.get('paymentOption', ''),
                "Region": sp.get('region', '')
            })
        
        # Only check utilization if there are active savings plans
        if active_sps:
            try:
                # Check Savings Plan utilization
                ce_client = session.client('ce')
                end_date = datetime.now().strftime('%Y-%m-%d')
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
                
                utilization = ce_client.get_savings_plans_utilization(
                    TimePeriod={
                        'Start': start_date,
                        'End': end_date
                    }
                )
                
                # Add utilization data
                if utilization.get('SavingsPlansUtilizationsByTime'):
                    util_data = utilization.get('SavingsPlansUtilizationsByTime', [{}])[0]
                    results["utilization"] = {
                        "Percentage": util_data.get('Utilization', {}).get('Utilization', 'N/A'),
                        "Net_savings": util_data.get('Savings', {}).get('NetSavings', 'N/A')
                    }
                
            except ClientError as e:
                results["utilization_error"] = str(e)
        
    except ClientError as e:
        if "error" not in results:
            results["error"] = str(e)
    
    # Add summary information
    results["summary"] = {
        "has_reserved_instances": len(results["reserved_instances"]) > 0,
        "has_savings_plans": len(results["savings_plans"]) > 0,
        "note": "If migrating to a new payer account, any RIs and SPs will need to be transferred or recreated."
    }
    
    return results


def check_policy_references(db: Session = None, account_id: str = None):
    """
    Check policy documents across various AWS services for Organization/OU references.
    This helps identify policies that may need to be updated during migration.
    """
    results = {
        "iam_policies": [],
        "s3_policies": [],
        "kms_policies": [],
        "sqs_policies": [],
        "sns_policies": [],
        "lambda_policies": [],
        "secretsmanager_policies": [],
        "summary": {
            "total_policies_checked": 0,
            "total_with_references": 0
        },
        "success": True
    }
    
    # Pattern to search for org/OU references in policies
    org_patterns = [
        r'aws:PrincipalOrgID',
        r'aws:PrincipalOrgPaths',
        r'arn:aws:organizations',
        r'arn:aws:iam::[0-9]+:role/aws-service-role/organizations',
        r'organizations',
        r'org-'
    ]
    
    try:
        # Get AWS session
        session = get_aws_session(db, account_id)
        if not session:
            raise ValueError("Failed to create AWS session. Check your credentials and configuration.")

        # Check IAM policies
        iam_client = session.client('iam')
        
        # Check customer managed policies
        paginator = iam_client.get_paginator('list_policies')
        policy_iterator = paginator.paginate(Scope='Local')
        
        for page in policy_iterator:
            print(f"Found {len(page['Policies'])} customer managed policies")
            for policy in page['Policies']:
                print(f"Checking policy: {policy['PolicyName']}")
                results["summary"]["total_policies_checked"] += 1
                try:
                    policy_version = iam_client.get_policy_version(
                        PolicyArn=policy['Arn'],
                        VersionId=policy['DefaultVersionId']
                    )
                    
                    policy_doc = json.dumps(policy_version['PolicyVersion']['Document'])
                    print(f"Policy document: {policy_doc[:100]}...")  # Print first 100 chars
                    
                    # Check if policy contains org references
                    matches = []
                    for pattern in org_patterns:
                        if re.search(pattern, policy_doc, re.IGNORECASE):
                            print(f"Found match with pattern: {pattern}")
                            matches.append(pattern)
                    
                    if matches:
                        print(f"*** FOUND ORGANIZATION REFERENCE IN POLICY: {policy['PolicyName']} ***")
                        results["iam_policies"].append({
                            "Name": policy['PolicyName'],
                            "Arn": policy['Arn'],
                            "Type": "Customer Managed",
                            "References": matches
                        })
                except Exception as e:
                    print(f"Error processing policy {policy['PolicyName']}: {str(e)}")
                    continue
    except Exception as e:
        print(f"Error in IAM policy check: {str(e)}")
        results["iam_error"] = str(e)
        
    # Also check AWS managed policies with "organization" in the name
    try:
        print("\nChecking AWS managed policies with 'organization' in the name...")
        aws_policy_iterator = paginator.paginate(Scope='AWS')
        
        for page in aws_policy_iterator:
            for policy in page['Policies']:
                if 'organization' in policy['PolicyName'].lower():
                    print(f"Checking AWS managed policy: {policy['PolicyName']}")
                    results["summary"]["total_policies_checked"] += 1
                    try:
                        policy_version = iam_client.get_policy_version(
                            PolicyArn=policy['Arn'],
                            VersionId=policy['DefaultVersionId']
                        )
                        
                        policy_doc = json.dumps(policy_version['PolicyVersion']['Document'])
                        print(f"AWS policy document: {policy_doc[:100]}...")
                        
                        # Check if policy contains org references
                        matches = []
                        for pattern in org_patterns:
                            if re.search(pattern, policy_doc, re.IGNORECASE):
                                print(f"Found match with pattern: {pattern}")
                                matches.append(pattern)
                        
                        if matches:
                            print(f"*** FOUND ORGANIZATION REFERENCE IN AWS POLICY: {policy['PolicyName']} ***")
                            results["iam_policies"].append({
                                "Name": policy['PolicyName'],
                                "Arn": policy['Arn'],
                                "Type": "AWS Managed",
                                "References": matches
                            })
                    except Exception as e:
                        print(f"Error processing AWS policy {policy['PolicyName']}: {str(e)}")
                        continue
    except Exception as e:
        print(f"Error in AWS managed policy check: {str(e)}")
        results["aws_policy_error"] = str(e)
    
    # Check S3 bucket policies with error handling for SSL issues
    try:
        # Use us-east-1 region for S3 to avoid regional endpoint issues
        s3_client = session.client('s3', region_name='us-east-1')
        
        # List all buckets
        buckets = s3_client.list_buckets()['Buckets']
        
        for bucket in buckets:
            bucket_name = bucket['Name']
            results["summary"]["total_policies_checked"] += 1
            try:
                policy = s3_client.get_bucket_policy(Bucket=bucket_name)
                policy_doc = policy['Policy']
                
                # Check if policy contains org references
                matches = [pattern for pattern in org_patterns if re.search(pattern, policy_doc, re.IGNORECASE)]
                if matches:
                    results["s3_policies"].append({
                        "Bucket": bucket_name,
                        "References": matches
                    })
            except Exception:
                continue
    except Exception as e:
        results["s3_error"] = str(e)
    
    # Check KMS key policies
    try:
        kms_client = session.client('kms')
        
        paginator = kms_client.get_paginator('list_keys')
        
        for page in paginator.paginate():
            for key in page['Keys']:
                results["summary"]["total_policies_checked"] += 1
                key_id = key['KeyId']
                
                try:
                    # Get key policy
                    key_policy = kms_client.get_key_policy(
                        KeyId=key_id,
                        PolicyName='default'
                    )
                    
                    policy_doc = key_policy['Policy']
                    
                    # Check if policy contains org references
                    matches = [pattern for pattern in org_patterns if re.search(pattern, policy_doc, re.IGNORECASE)]
                    if matches:
                        # Try to get alias
                        key_alias = "Unknown"
                        try:
                            aliases = kms_client.list_aliases(KeyId=key_id)
                            if aliases['Aliases']:
                                key_alias = aliases['Aliases'][0]['AliasName']
                        except:
                            pass
                        
                        results["kms_policies"].append({
                            "Key_id": key_id,
                            "Alias": key_alias,
                            "References": matches
                        })
                except Exception:
                    continue
    except Exception as e:
        results["kms_error"] = str(e)
    
    # Check SQS queue policies
    try:
        sqs_client = session.client('sqs')
        
        # List all queues
        queues_response = sqs_client.list_queues()
        queue_urls = queues_response.get('QueueUrls', [])
        
        for queue_url in queue_urls:
            results["summary"]["total_policies_checked"] += 1
            try:
                # Get queue attributes including policy
                attributes = sqs_client.get_queue_attributes(
                    QueueUrl=queue_url,
                    AttributeNames=['Policy']
                )
                
                if 'Policy' in attributes['Attributes']:
                    policy_doc = attributes['Attributes']['Policy']
                    
                    # Check if policy contains org references
                    matches = [pattern for pattern in org_patterns if re.search(pattern, policy_doc, re.IGNORECASE)]
                    if matches:
                        # Extract queue name from URL
                        queue_name = queue_url.split('/')[-1]
                        results["sqs_policies"].append({
                            "Queue_name": queue_name,
                            "Queue_url": queue_url,
                            "References": matches
                        })
            except Exception as e:
                print(f"Error checking SQS policy for {queue_url}: {str(e)}")
                continue
    except Exception as e:
        results["sqs_error"] = str(e)
    
    # Check SNS topic policies
    try:
        sns_client = session.client('sns')
        
        # List all topics
        paginator = sns_client.get_paginator('list_topics')
        
        for page in paginator.paginate():
            for topic in page['Topics']:
                topic_arn = topic['TopicArn']
                results["summary"]["total_policies_checked"] += 1
                try:
                    # Get topic attributes including policy
                    attributes = sns_client.get_topic_attributes(
                        TopicArn=topic_arn
                    )
                    
                    if 'Policy' in attributes['Attributes']:
                        policy_doc = attributes['Attributes']['Policy']
                        
                        # Check if policy contains org references
                        matches = [pattern for pattern in org_patterns if re.search(pattern, policy_doc, re.IGNORECASE)]
                        if matches:
                            # Extract topic name from ARN
                            topic_name = topic_arn.split(':')[-1]
                            results["sns_policies"].append({
                                "Topic_name": topic_name,
                                "Topic_arn": topic_arn,
                                "References": matches
                            })
                except Exception as e:
                    print(f"Error checking SNS policy for {topic_arn}: {str(e)}")
                    continue
    except Exception as e:
        results["sns_error"] = str(e)
    
    # Check Lambda function policies
    try:
        lambda_client = session.client('lambda')
        
        # List all functions
        paginator = lambda_client.get_paginator('list_functions')
        
        for page in paginator.paginate():
            for function in page['Functions']:
                function_name = function['FunctionName']
                results["summary"]["total_policies_checked"] += 1
                try:
                    # Get policy
                    policy_response = lambda_client.get_policy(
                        FunctionName=function_name
                    )
                    
                    if 'Policy' in policy_response:
                        policy_doc = policy_response['Policy']
                        
                        # Check if policy contains org references
                        matches = [pattern for pattern in org_patterns if re.search(pattern, policy_doc, re.IGNORECASE)]
                        if matches:
                            results["lambda_policies"].append({
                                "Function_name": function_name,
                                "Function_arn": function['FunctionArn'],
                                "References": matches
                            })
                except Exception as e:
                    # ResourceNotFoundException is expected for functions without policies
                    if 'ResourceNotFoundException' not in str(e):
                        print(f"Error checking Lambda policy for {function_name}: {str(e)}")
                    continue
    except Exception as e:
        results["lambda_error"] = str(e)
    
    # Check Secrets Manager policies
    try:
        secretsmanager_client = session.client('secretsmanager')
        
        # List all secrets
        paginator = secretsmanager_client.get_paginator('list_secrets')
        
        for page in paginator.paginate():
            for secret in page['SecretList']:
                secret_name = secret['Name']
                results["summary"]["total_policies_checked"] += 1
                try:
                    # Get resource policy
                    policy_response = secretsmanager_client.get_resource_policy(
                        SecretId=secret_name
                    )
                    
                    if 'ResourcePolicy' in policy_response and policy_response['ResourcePolicy']:
                        policy_doc = policy_response['ResourcePolicy']
                        
                        # Check if policy contains org references
                        matches = [pattern for pattern in org_patterns if re.search(pattern, policy_doc, re.IGNORECASE)]
                        if matches:
                            results["secretsmanager_policies"].append({
                                "Secret_name": secret_name,
                                "Secret_arn": secret['ARN'],
                                "References": matches
                            })
                except Exception as e:
                    print(f"Error checking Secrets Manager policy for {secret_name}: {str(e)}")
                    continue
    except Exception as e:
        results["secretsmanager_error"] = str(e)
    
    # Update summary
    results["summary"]["total_with_references"] = (
        len(results["iam_policies"]) + 
        len(results["s3_policies"]) + 
        len(results["kms_policies"]) +
        len(results["sqs_policies"]) +
        len(results["sns_policies"]) +
        len(results["lambda_policies"]) +
        len(results["secretsmanager_policies"])
    )
    
    results["message"] = f"Found {results['summary']['total_with_references']} policies with organization references"
    
    return results

def check_stacksets_for_org_integration(db: Session = None, account_id: str = None):
    """
    Check if CloudFormation StackSets use AWS Organizations.
    This helps identify StackSets that may need to be recreated after migration.
    """

    stacksets= []
    results = {
        "org_integrated_stacksets": [],
        "summary": {
            "total_stacksets": 0,
            "org_integrated_count": 0
        },
        "success": True
    }
    
    try:
        # Get AWS session
        session = get_aws_session(db, account_id)
        if not session:
            raise ValueError("Failed to create AWS session. Check your credentials and configuration.")

        # CloudFormation client
        cfn_client = session.client('cloudformation')
        
        # List all StackSets
        paginator = cfn_client.get_paginator('list_stack_sets')
        
        for page in paginator.paginate():
            for stackset_summary in page['Summaries']:
                stackset_name = stackset_summary['StackSetName']
                results["summary"]["total_stacksets"] += 1
                
                try:
                    # Get StackSet details
                    stackset = cfn_client.describe_stack_set(
                        StackSetName=stackset_name
                    )
                    
                    # Check if StackSet uses service-managed permissions (Organizations integration)
                    permission_model = stackset['StackSet'].get('PermissionModel', '')
                    auto_deployment = stackset['StackSet'].get('AutoDeployment', {})
                    
                    # Format auto_deployment as a string to avoid [object Object] in frontend
                    auto_deployment_str = "Enabled" if auto_deployment.get('Enabled', False) else "Disabled"
                    if 'RetainStacksOnAccountRemoval' in auto_deployment:
                        auto_deployment_str += f", Retain stacks on account removal: {'Yes' if auto_deployment.get('RetainStacksOnAccountRemoval') else 'No'}"
                    
                    stackset_info = {
                        "name": stackset_name,
                        "permission_model": permission_model if permission_model else "Self-managed",
                        "auto_deployment": auto_deployment_str,
                        "uses_organizations": permission_model == 'SERVICE_MANAGED'
                    }
                    
                    stacksets.append(stackset_info)
                    
                    # If it uses Organizations, add to the org integrated list
                    if permission_model == 'SERVICE_MANAGED':
                        results["org_integrated_stacksets"].append(stackset_info)
                        results["summary"]["org_integrated_count"] += 1
                        print(f"Found StackSet using Organizations: {stackset_name}")
                    
                except Exception as e:
                    print(f"Error getting details for StackSet {stackset_name}: {str(e)}")
                    continue
        
        # Get organization details if any StackSets use Organizations
        if results["org_integrated_stacksets"]:
            try:
                org_client = session.client('organizations')
                org_details = org_client.describe_organization()
                
                results["organization"] = {
                    "id": org_details['Organization']['Id'],
                    "arn": org_details['Organization']['Arn'],
                    "feature_set": org_details['Organization']['FeatureSet']
                }
                
                # Get deployment targets (OUs)
                for stackset_info in results["org_integrated_stacksets"]:
                    try:
                        targets = cfn_client.list_stack_instances(
                            StackSetName=stackset_info["name"]
                        )
                        
                        # Extract unique OUs and accounts
                        ous = set()
                        accounts = set()
                        
                        for instance in targets.get('Summaries', []):
                            if 'OrganizationalUnitId' in instance:
                                ous.add(instance['OrganizationalUnitId'])
                            if 'Account' in instance:
                                accounts.add(instance['Account'])
                        
                        # Convert sets to comma-separated strings to avoid array display issues
                        stackset_info["deployment_ous"] = ", ".join(ous) if ous else ""
                        stackset_info["deployment_accounts"] = ", ".join(accounts) if accounts else ""
                        
                    except Exception as e:
                        print(f"Error getting instances for StackSet {stackset_info['name']}: {str(e)}")
            
            except Exception as e:
                results["org_error"] = str(e)
    
    except Exception as e:
        results["error"] = str(e)
        results["success"] = False
    
    results["message"] = f"Found {results['summary']['org_integrated_count']} StackSets using AWS Organizations out of {results['summary']['total_stacksets']} total StackSets"
    
    return results


def create_fallback_admin_user( db: Session = None, account_id: str = None):
    """
    Create a fallback IAM admin user for login in case SSO fails.
    This helps ensure there's always a way to access the account if SSO has issues.
    
    """
    username="EmergencyAdmin"
    results = {
        "success": True,
        "user_created": False,
        "username": username,
        "password": None,
        "message": ""
    }
    try:
        # Get AWS session
        session = get_aws_session(db, account_id)
        if not session:
            raise ValueError("Failed to create AWS session. Check your credentials and configuration.")

        # Check if user already exists
        try:
            iam_client = session.client('iam')
            iam_client.get_user(UserName=username)
            results["message"] = f"User {username} already exists. Skipping creation."
            return results
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchEntity':
                raise e
        
        # Create the user
        iam_client.create_user(
            UserName=username,
            Tags=[
                {
                    'Key': 'Purpose',
                    'Value': 'Emergency access in case SSO fails'
                }
            ]
        )
        
        # Generate a random password
        password_length = 16
        password_chars = string.ascii_letters + string.digits + "!@#$%^&*()_+-="
        password = ''.join(random.choice(password_chars) for i in range(password_length))
        
        # Create login profile with password
        iam_client.create_login_profile(
            UserName=username,
            Password=password,
            PasswordResetRequired=True
        )
        
        # Attach AdministratorAccess policy
        iam_client.attach_user_policy(
            UserName=username,
            PolicyArn='arn:aws:iam::aws:policy/AdministratorAccess'
        )
        
        results["user_created"] = True
        results["password"] = password
        results["message"] = f"Successfully created fallback admin user: {username}. Password reset will be required on first login."
        
    except ClientError as e:
        results["success"] = False
        results["message"] = f"Error creating fallback admin user: {str(e)}"
    
    return results
