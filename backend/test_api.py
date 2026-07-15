import urllib.request
import json

def test_endpoint(url):
    print(f"Testing URL: {url}")
    try:
        response = urllib.request.urlopen(url)
        status_code = response.getcode()
        print(f"Status Code: {status_code}")
        data = response.read().decode('utf-8')
        json_data = json.loads(data)
        return json_data
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # Test root
    root_data = test_endpoint("http://localhost:8000/")
    print(f"Root response: {root_data}\n")

    # Test dashboard stats
    stats_data = test_endpoint("http://localhost:8000/api/dashboard/stats")
    if stats_data:
        print("KPIs:")
        print(json.dumps(stats_data.get("kpis"), indent=2, ensure_ascii=False))
        print("Charts (trend sample):")
        print(json.dumps(stats_data.get("charts", {}).get("trend_by_day")[:2], indent=2, ensure_ascii=False))
        print()

    # Test cases
    cases_data = test_endpoint("http://localhost:8000/api/dashboard/cases")
    if cases_data:
        print(f"Total Fraud Cases: {len(cases_data)}")
        if len(cases_data) > 0:
            print("First Case Details:")
            first_case = cases_data[0]
            print(f"ID: {first_case.get('transaction_id')}")
            print(f"Status: {first_case.get('status')}")
            print(f"Patient: {first_case.get('patient', {}).get('name')}")
            print(f"Clinic: {first_case.get('clinic', {}).get('name')}")
            print(f"Rules Triggered: {[r.get('rule_id') for r in first_case.get('rules_triggered', [])]}")
            print("Breadcrumbs Timeline:")
            for b in first_case.get("breadcrumbs", []):
                print(f"  [{b.get('timestamp')}] {b.get('message')}")
