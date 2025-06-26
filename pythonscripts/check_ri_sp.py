import boto3
import json
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

def check_ri_and_savings_plans():
    """
    Check if any Reserved Instances or Savings Plans are purchased and in use.
    """
    session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
    results = {}
    
    # Check Reserved Instances
    try:
        ec2_client = session.client('ec2')
        ri_response = ec2_client.describe_reserved_instances(
            Filters=[{'Name': 'state', 'Values': ['active']}]
        )
        
        active_ris = ri_response.get('ReservedInstances', [])
        print(f"Active Reserved Instances: {len(active_ris)}")
        
        if active_ris:
            print("\nReserved Instance details:")
            for ri in active_ris:
                print(f"- ID: {ri.get('ReservedInstancesId')}, Type: {ri.get('InstanceType')}, " +
                      f"Count: {ri.get('InstanceCount')}, End: {ri.get('End')}")
        
        results['reserved_instances'] = active_ris
    except ClientError as e:
        print(f"Error checking Reserved Instances: {e}")
        results['ri_error'] = str(e)
    
    # Check Savings Plans
    try:
        sp_client = session.client('savingsplans')
        
        # Check for active Savings Plans
        sp_response = sp_client.describe_savings_plans(
            states=['active']
        )
        
        active_sps = sp_response.get('savingsPlans', [])
        print(f"\nActive Savings Plans: {len(active_sps)}")
        
        if active_sps:
            print("\nSavings Plan details:")
            for sp in active_sps:
                print(f"- ID: {sp.get('savingsPlanId')}, Type: {sp.get('savingsPlanType')}, " +
                      f"Commitment: {sp.get('commitment')}, End: {sp.get('term', {}).get('end')}")
        
        results['savings_plans'] = active_sps
        
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
                
                print(f"\nSavings Plans Utilization (last 30 days):")
                print(f"- Utilization: {utilization.get('SavingsPlansUtilizationsByTime', [{}])[0].get('Utilization', {}).get('Utilization', 'N/A')}%")
                print(f"- Net Savings: ${utilization.get('SavingsPlansUtilizationsByTime', [{}])[0].get('Savings', {}).get('NetSavings', 'N/A')}")
                
                results['savings_plans_utilization'] = utilization.get('SavingsPlansUtilizationsByTime', [])
            except ClientError as e:
                print(f"Error checking Savings Plans utilization: {e}")
                results['sp_utilization_error'] = str(e)
        
    except ClientError as e:
        print(f"Error checking Savings Plans: {e}")
        results['sp_error'] = str(e)
    
    # Summary
    print("\nSummary:")
    print(f"- Reserved Instances: {'Yes' if active_ris else 'No'}")
    print(f"- Savings Plans: {'Yes' if active_sps else 'No'}")
    print("\nNote: If migrating to a new payer account, any RIs and SPs will need to be transferred or recreated.")
    
    return results

if __name__ == "__main__":
    print("Checking for Reserved Instances and Savings Plans...")
    check_ri_and_savings_plans()
