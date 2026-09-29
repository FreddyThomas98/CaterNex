import urllib.request
import urllib.error

# 1. Test Salesperson Role
req_sales = urllib.request.Request(
    'http://127.0.0.1:8000/api/costing/overview',
    headers={'Authorization': 'Bearer 3:SALESPERSON:token'}
)
try:
    urllib.request.urlopen(req_sales)
    print("FAILED: Salesperson should be forbidden")
except urllib.error.HTTPError as e:
    print(f"SUCCESS: Salesperson blocked with HTTP {e.code} ({e.reason})")

# 2. Test Admin Role
req_admin = urllib.request.Request(
    'http://127.0.0.1:8000/api/costing/overview',
    headers={'Authorization': 'Bearer 1:ADMIN:token'}
)
try:
    res = urllib.request.urlopen(req_admin)
    print(f"SUCCESS: Admin access granted with HTTP {res.code}")
except urllib.error.HTTPError as e:
    print(f"FAILED: Admin was blocked with HTTP {e.code}")
