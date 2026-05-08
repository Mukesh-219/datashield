# DataShield API Documentation

## Base URLs
- Backend API: `http://localhost:5000/api`
- ML Service: `http://localhost:8000`

> All backend API routes under `/api` require a valid JWT bearer token, except authentication routes.

---

## Authentication

### Register User
- `POST /api/auth/register`
- Public endpoint

Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

Success response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGci..."
  }
}
```

### Login User
- `POST /api/auth/login`
- Public endpoint

Request body:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

Success response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGci..."
  }
}
```

### Get Current User
- `GET /api/auth/me`
- Requires authorization
- Header: `Authorization: Bearer <token>`

Success response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Scans

### Create Scan
- `POST /api/scans`
- Requires authorization

Request body example:
```json
{
  "targetUrl": "https://example.com",
  "payload": "<script>alert(1)</script>",
  "scanType": "web-application"
}
```

Success response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "targetUrl": "https://example.com",
    "payload": "<script>alert(1)</script>",
    "scanType": "web-application",
    "status": "completed",
    "createdAt": "..."
  }
}
```

### Get All Scans
- `GET /api/scans`
- Requires authorization

Success response:
```json
{
  "success": true,
  "data": [
    { "_id": "...", "targetUrl": "...", "status": "completed", ... }
  ]
}
```

### Get Scan by ID
- `GET /api/scans/:id`
- Requires authorization

Success response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "targetUrl": "...",
    "scanType": "...",
    "results": [...]
  }
}
```

---

## Alerts

### Create Alert
- `POST /api/alerts`
- Requires authorization

Request body example:
```json
{
  "scanId": "...",
  "message": "Suspicious SQL injection detected",
  "severity": "high"
}
```

Success response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "scan": "...",
    "message": "Suspicious SQL injection detected",
    "severity": "high"
  }
}
```

### Get All Alerts
- `GET /api/alerts`
- Requires authorization

Success response:
```json
{
  "success": true,
  "data": [
    { "_id": "...", "scan": "...", "message": "...", "severity": "..." }
  ]
}
```

### Get Alerts by Scan
- `GET /api/alerts/scan/:scanId`
- Requires authorization

Success response:
```json
{
  "success": true,
  "data": [
    { "scan": "...", "message": "...", "severity": "..." }
  ]
}
```

---

## ML Service

### Health Check
- `GET /health`
- Public endpoint

Response:
```json
{
  "success": true,
  "service": "DataShield ML Service",
  "modelLoaded": true,
  "error": null
}
```

### Predict Threat
- `POST /predict`
- Public endpoint

Request body:
```json
{
  "payload": "<script>alert('xss')</script>"
}
```

Success response:
```json
{
  "success": true,
  "prediction": "XSS",
  "confidence": 0.92
}
```

Error cases:
- `400` if `payload` is missing or invalid
- `500` if model is not loaded or prediction failed

---

## Authentication Header Example

```bash
curl -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  http://localhost:5000/api/scans
```

## Notes
- Replace `localhost:5000` with your backend server address when deployed.
- Ensure the ML service is running before invoking model prediction.
- All authenticated routes require a valid JWT token returned by `/api/auth/login`.
