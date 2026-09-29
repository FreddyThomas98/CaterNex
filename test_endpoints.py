import urllib.request
import json

endpoints = [
    '/api/settings',
    '/api/categories',
    '/api/menu-items?active_only=true',
    '/api/clients',
    '/api/events',
    '/api/quotations'
]

for ep in endpoints:
    res = urllib.request.urlopen('http://127.0.0.1:8000' + ep)
    data = json.loads(res.read().decode('utf-8'))
    print(f"{ep}: status {res.code} (count: {len(data) if isinstance(data, list) else 'dict'})")

print("ALL API ENDPOINTS FUNCTIONING WITH 200 OK!")
