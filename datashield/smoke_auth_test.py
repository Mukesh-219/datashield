import json
import urllib.request

url = 'http://localhost:5000/api/auth/register'
data = json.dumps({'name': 'Test User', 'email': 'testuser@example.com', 'password': 'Password123'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        print('STATUS', r.status)
        print(r.read().decode())
except Exception as e:
    print('ERROR', e)
