import boto3
import json
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

def check_cost_explorer_data():
    """
    Check Cost Explorer data availability to confirm historical data access.
    This helps verify that after migration, historical data from Payer1 won't be available in Payer2.
    """
    results = {}
    try:
        session = boto3.Session(profile_name='AWSAdministratorAccess-891376987948')
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
        
        # Print results
        print(f"Cost Explorer data available from {start_date} to {end_date}")
        print(f"Number of result periods: {len(response.get('ResultsByTime', []))}")
        results["cost_explorer_data"] = response.get('ResultsByTime', [])
        
        # Print sample of cost data
        if response.get('ResultsByTime'):
            print("\nSample of available cost data:")
            for period in response.get('ResultsByTime')[:2]:  # Show first 2 periods
                start = period.get('TimePeriod', {}).get('Start')
                end = period.get('TimePeriod', {}).get('End')
                amount = period.get('Total', {}).get('UnblendedCost', {}).get('Amount', '0')
                unit = period.get('Total', {}).get('UnblendedCost', {}).get('Unit', 'USD')
                print(f"- Period {start} to {end}: {amount} {unit}")
        
    except ClientError as e:
        print(f"Error checking Cost Explorer data: {e}")
        results["cost_explorer_error"] = str(e)
    
    # Try to check CUR in a separate try block
    try:
        print("\nChecking Cost and Usage Reports...")
        cur_client = session.client('cur', region_name='us-east-1')  # CUR is only available in us-east-1
        reports = cur_client.describe_report_definitions()
        
        print(f"Cost and Usage Reports configured: {len(reports.get('ReportDefinitions', []))}")
        if reports.get('ReportDefinitions'):
            for report in reports.get('ReportDefinitions'):
                print(f"- Report name: {report.get('ReportName')}")
        else:
            print("No Cost and Usage Reports configured")
        
        results["cur_reports"] = reports.get('ReportDefinitions', [])
        
    except ClientError as e:
        print(f"Error checking Cost and Usage Reports: {e}")
        results["cur_error"] = str(e)
    
    return results

if __name__ == "__main__":
    print("Checking Cost Explorer and CUR data availability...")
    check_cost_explorer_data()
