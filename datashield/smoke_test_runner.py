import json
import random
import urllib.request
import urllib.error


def req(url, method='GET', data=None, headers=None):
    headers = headers or {}
    request_headers = headers.copy()

    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')
        request_headers['Content-Type'] = 'application/json'

    request = urllib.request.Request(url, data=body, method=method, headers=request_headers)
    try:
        with urllib.request.urlopen(request, timeout=10) as resp:
            body = resp.read().decode('utf-8')
            return json.loads(body), resp.getcode()
    except urllib.error.HTTPError as exc:
        try:
            return json.loads(exc.read().decode('utf-8')), exc.code
        except Exception:
            return {'error': str(exc)}, exc.code
    except Exception as exc:
        return {'error': str(exc)}, None


def add(report, name, passed, details):
    report.append({'test': name, 'result': 'PASS' if passed else 'FAIL', 'details': details})


def main():
    base = 'http://localhost:5000/api'
    ml = 'http://localhost:8000'
    frontend = 'http://localhost:5173'
    report = []

    print('Starting smoke test...')

    resp, code = req(f'{base}/health')
    add(report, 'Backend GET /api/health', resp.get('success') is True and code == 200, {'code': code, 'response': resp})

    resp, code = req(f'{ml}/health')
    add(report, 'ML GET /health', resp.get('success') is True and code == 200, {'code': code, 'response': resp})

    email = f"smokeuser_{int(random.random() * 1e9)}@example.com"
    password = 'Password1!'
    name = 'Smoke Tester'

    resp, code = req(f'{base}/auth/register', 'POST', {'name': name, 'email': email, 'password': password})
    register_ok = resp.get('success') is True and code == 201
    token = resp.get('token') if register_ok else None
    add(report, 'Register test user', register_ok, {'code': code, 'response': resp})

    resp, code = req(f'{base}/auth/login', 'POST', {'email': email, 'password': password})
    login_ok = resp.get('success') is True and code == 200
    if not token:
        token = resp.get('token')
    add(report, 'Login test user', login_ok, {'code': code, 'response': resp})

    headers = {'Authorization': f'Bearer {token}'} if token else {}
    resp, code = req(f'{base}/auth/me', 'GET', None, headers)
    add(report, 'GET /api/auth/me', resp.get('success') is True and code == 200, {'code': code, 'response': resp})

    payloads = {
        'SQLi': "' OR '1'='1",
        'XSS': '<script>alert("xss")</script>',
        'Normal': 'Hello, world!',
    }

    for label, payload in payloads.items():
        resp, code = req(
            f'{base}/scans',
            'POST',
            {'targetUrl': 'http://example.com', 'payload': payload, 'endpoint': '/login'},
            headers,
        )
        ok = resp.get('success') is True and code == 201
        add(report, f'Create scan payload {label}', ok, {'code': code, 'response': resp})
        if ok and isinstance(resp.get('scan'), dict) and resp['scan'].get('_id'):
            add(report, f'ML integration for {label}', bool(resp.get('mlAnalysis')), {'mlAnalysis': resp.get('mlAnalysis')})

    resp, code = req(f'{base}/scans', 'GET', None, headers)
    scans_ok = resp.get('success') is True and code == 200
    first_scan_id = resp.get('scans')[0].get('_id') if scans_ok and resp.get('scans') else None
    add(report, 'Get all scans', scans_ok, {'code': code, 'response': resp})

    if first_scan_id:
        resp, code = req(f'{base}/scans/{first_scan_id}', 'GET', None, headers)
        add(report, 'Get scan by ID', resp.get('success') is True and code == 200, {'code': code, 'response': resp})
    else:
        add(report, 'Get scan by ID', False, {'error': 'No scan ID from get all scans'})

    resp, code = req(f'{base}/alerts', 'GET', None, headers)
    add(report, 'Get all alerts', resp.get('success') is True and code == 200, {'code': code, 'response': resp})

    if first_scan_id:
        resp, code = req(f'{base}/alerts/scan/{first_scan_id}', 'GET', None, headers)
        add(report, 'Get alerts by scan', resp.get('success') is True and code == 200, {'code': code, 'response': resp})
    else:
        add(report, 'Get alerts by scan', False, {'error': 'No scan ID available'})

    try:
        html = urllib.request.urlopen(frontend, timeout=10).read().decode('utf-8')
        add(report, 'Frontend app loads', ('<div id="root">' in html or 'Vite' in html), {'snippet': html[:300]})
    except Exception as exc:
        add(report, 'Frontend app loads', False, {'error': str(exc)})

    try:
        html = urllib.request.urlopen(f'{frontend}/login', timeout=10).read().decode('utf-8')
        add(report, 'Frontend login page', ('Login' in html and 'Email' in html), {'snippet': html[:300]})
    except Exception as exc:
        add(report, 'Frontend login page', False, {'error': str(exc)})

    try:
        html = urllib.request.urlopen(f'{frontend}/dashboard', timeout=10).read().decode('utf-8')
        add(report, 'Frontend dashboard page', ('Dashboard' in html or 'Loading' in html), {'snippet': html[:300]})
        add(report, 'Frontend scan submission form', ('Start New Scan' in html or 'Start Scan' in html), {'snippet': html[:300]})
    except Exception as exc:
        add(report, 'Frontend dashboard page', False, {'error': str(exc)})
        add(report, 'Frontend scan submission form', False, {'error': str(exc)})

    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
