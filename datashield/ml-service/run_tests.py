import urllib.request
import urllib.error
import json
import random

BASE = "http://localhost:5000/api"
ML   = "http://localhost:8000"

def get(url, headers={}):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

def post(url, body, headers={}):
    data = json.dumps(body).encode()
    h = {"Content-Type": "application/json"}
    h.update(headers)
    req = urllib.request.Request(url, data=data, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

def ok(label, code, resp, check=None):
    passed = (200 <= code < 300)
    if check:
        passed = passed and check(resp)
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {label} (HTTP {code})")
    if not passed:
        print(f"         => {resp}")
    return passed

print("=" * 55)
print("  DataShield Full Stack Test")
print("=" * 55)

# ── ML Service ─────────────────────────────────────────────
print("\n[ML Service - http://localhost:8000]")
r, c = get(ML + "/health")
ok("GET /health", c, r, lambda x: x.get("success"))
print(f"         modelLoaded={r.get('modelLoaded')}  networkModelLoaded={r.get('networkModelLoaded')}")

r, c = post(ML + "/predict", {"payload": "' OR 1=1 --"})
ok("POST /predict  (SQLi payload)", c, r, lambda x: x.get("prediction") is not None)
if r.get("success"):
    print(f"         prediction={r['prediction']}  confidence={r['confidence']}")

r, c = post(ML + "/predict", {"payload": "<script>alert(1)</script>"})
ok("POST /predict  (XSS payload)", c, r, lambda x: x.get("prediction") is not None)
if r.get("success"):
    print(f"         prediction={r['prediction']}  confidence={r['confidence']}")

r, c = post(ML + "/predict", {"payload": "hello world"})
ok("POST /predict  (Normal payload)", c, r, lambda x: x.get("prediction") is not None)
if r.get("success"):
    print(f"         prediction={r['prediction']}  confidence={r['confidence']}")

# Network model - simulate a DDoS-like flow (high packet rate, short duration)
ddos_flow = {
    "Destination Port": 80,
    "Flow Duration": 500,
    "Total Fwd Packets": 5000,
    "Total Backward Packets": 0,
    "Total Length of Fwd Packets": 250000,
    "Total Length of Bwd Packets": 0,
    "Fwd Packet Length Max": 50,
    "Fwd Packet Length Min": 50,
    "Fwd Packet Length Mean": 50,
    "Fwd Packet Length Std": 0,
    "Bwd Packet Length Max": 0,
    "Bwd Packet Length Min": 0,
    "Bwd Packet Length Mean": 0,
    "Bwd Packet Length Std": 0,
    "Flow Bytes/s": 500000,
    "Flow Packets/s": 10000,
    "SYN Flag Count": 1,
    "ACK Flag Count": 0,
    "Init_Win_bytes_forward": 0,
    "Init_Win_bytes_backward": 0,
}
r, c = post(ML + "/predict/network", ddos_flow)
ok("POST /predict/network (DDoS flow)", c, r, lambda x: x.get("prediction") is not None)
if r.get("success"):
    print(f"         prediction={r['prediction']}  confidence={r['confidence']}")

# Benign flow
benign_flow = {
    "Destination Port": 443,
    "Flow Duration": 100000,
    "Total Fwd Packets": 10,
    "Total Backward Packets": 8,
    "Total Length of Fwd Packets": 1200,
    "Total Length of Bwd Packets": 800,
    "Flow Bytes/s": 200,
    "Flow Packets/s": 1.5,
    "Init_Win_bytes_forward": 65535,
    "Init_Win_bytes_backward": 65535,
}
r, c = post(ML + "/predict/network", benign_flow)
ok("POST /predict/network (Benign flow)", c, r, lambda x: x.get("prediction") is not None)
if r.get("success"):
    print(f"         prediction={r['prediction']}  confidence={r['confidence']}")

# ── Backend API ────────────────────────────────────────────
print("\n[Backend API - http://localhost:5000]")
r, c = get(BASE + "/health")
ok("GET /api/health", c, r, lambda x: x.get("success"))

# Register
email = "testrun_" + str(random.randint(10000,99999)) + "@datashield.test"
r, c = post(BASE + "/auth/register", {"name": "Test Runner", "email": email, "password": "Password1!"})
ok("POST /api/auth/register", c, r, lambda x: x.get("success"))
token = r.get("token", "")

# Login
r, c = post(BASE + "/auth/login", {"email": email, "password": "Password1!"})
ok("POST /api/auth/login", c, r, lambda x: x.get("success"))
token = r.get("token", token)
auth = {"Authorization": "Bearer " + token}

# Me
r, c = get(BASE + "/auth/me", auth)
ok("GET /api/auth/me", c, r, lambda x: x.get("success"))

# Create scans with different payloads
scan_id = None
for label, payload in [("SQLi", "' OR 1=1 --"), ("XSS", "<script>alert(1)</script>"), ("Normal", "hello world")]:
    r, c = post(BASE + "/scans", {"targetUrl": "http://example.com", "payload": payload, "endpoint": "/login"}, auth)
    ok(f"POST /api/scans ({label})", c, r, lambda x: x.get("success"))
    if r.get("success"):
        ml = r.get("mlAnalysis") or {}
        print(f"         mlPrediction={r['scan'].get('mlPrediction')}  mlConfidence={r['scan'].get('mlConfidence')}  alertCount={r['scan'].get('alertCount')}")
        if not scan_id:
            scan_id = r["scan"]["_id"]

# Get all scans
r, c = get(BASE + "/scans", auth)
ok("GET /api/scans", c, r, lambda x: x.get("success"))
if r.get("success"):
    print(f"         total scans returned: {len(r.get('scans', []))}")

# Get scan by ID
if scan_id:
    r, c = get(BASE + "/scans/" + scan_id, auth)
    ok("GET /api/scans/:id", c, r, lambda x: x.get("success"))

# Get all alerts
r, c = get(BASE + "/alerts", auth)
ok("GET /api/alerts", c, r, lambda x: x.get("success"))
if r.get("success"):
    print(f"         total alerts returned: {len(r.get('alerts', []))}")

# Get alerts by scan
if scan_id:
    r, c = get(BASE + "/alerts/scan/" + scan_id, auth)
    ok("GET /api/alerts/scan/:id", c, r, lambda x: x.get("success"))

print("\n" + "=" * 55)
print("  Done")
print("=" * 55)
