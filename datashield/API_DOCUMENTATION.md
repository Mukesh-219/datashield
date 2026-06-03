# API Documentation

## Overview

The DataShield API exposes authentication, scan management, alert management, and ML inference endpoints. All backend routes are prefixed with `/api` unless noted otherwise.

---

## Auth

### POST /api/auth/register

Register a new user.

#### Request
- Headers:
  - `Content-Type: application/json`
- Body:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

#### Response
- `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "<jwt-token>",
  "user": {
    "id": "<userId>",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "developer"
  }
}
```

### POST /api/auth/login

Authenticate an existing user.

#### Request
- Headers:
  - `Content-Type: application/json`
- Body:
```json
{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

#### Response
- `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt-token>",
  "user": {
    "id": "<userId>",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "developer"
  }
}
```

### GET /api/auth/me

Retrieve the authenticated user profile.

#### Request
- Headers:
  - `Authorization: Bearer <jwt-token>`

#### Response
- `200 OK`
```json
{
  "success": true,
  "user": {
    "_id": "<userId>",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "developer"
  }
}
```

---

## Scans

### POST /api/scans

Create a new scan request.

#### Request
- Headers:
  - `Authorization: Bearer <jwt-token>`
  - `Content-Type: application/json`
- Body:
```json
{
  "targetUrl": "https://example.com",
  "endpoint": "/login",
  "payload": "<script>alert('xss')</script>"
}
```

#### Response
- `201 Created`
```json
{
  "success": true,
  "scan": {
    "_id": "<scanId>",
    "targetUrl": "https://example.com",
    "endpoint": "/login",
    "payload": "<script>alert('xss')</script>",
    "status": "completed",
    "alertCount": 1,
    "maxRiskScore": 0.92,
    "createdAt": "2026-06-03T12:00:00.000Z"
  },
  "mlAnalysis": {
    "prediction": "XSS",
    "confidence": 0.83
  }
}
```

### GET /api/scans

Retrieve all scans for the authenticated user.

#### Request
- Headers:
  - `Authorization: Bearer <jwt-token>`

#### Response
- `200 OK`
```json
{
  "success": true,
  "scans": [
    {
      "_id": "<scanId>",
      "targetUrl": "https://example.com",
      "endpoint": "/login",
      "payload": "<script>alert('xss')</script>",
      "status": "completed",
      "alertCount": 1,
      "maxRiskScore": 0.92,
      "createdAt": "2026-06-03T12:00:00.000Z"
    }
  ]
}
```

### GET /api/scans/:id

Retrieve scan details by ID.

#### Request
- Headers:
  - `Authorization: Bearer <jwt-token>`

#### Response
- `200 OK`
```json
{
  "success": true,
  "scan": {
    "_id": "<scanId>",
    "targetUrl": "https://example.com",
    "endpoint": "/login",
    "payload": "<script>alert('xss')</script>",
    "status": "completed",
    "alertCount": 1,
    "maxRiskScore": 0.92,
    "createdAt": "2026-06-03T12:00:00.000Z"
  }
}
```

---

## Alerts

### POST /api/alerts

Create a manual alert for an existing scan.

#### Request
- Headers:
  - `Authorization: Bearer <jwt-token>`
  - `Content-Type: application/json`
- Body:
```json
{
  "scan": "<scanId>",
  "attackType": "SQLi",
  "payload": "' OR '1'='1",
  "endpoint": "/search",
  "mlConfidence": 0.87
}
```

#### Response
- `201 Created`
```json
{
  "success": true,
  "alert": {
    "_id": "<alertId>",
    "scan": "<scanId>",
    "attackType": "SQLi",
    "payload": "' OR '1'='1",
    "endpoint": "/search",
    "mlConfidence": 0.87,
    "riskScore": 0.93,
    "severity": "high",
    "createdAt": "2026-06-03T12:05:00.000Z"
  }
}
```

### GET /api/alerts

Retrieve all alerts for the authenticated user.

#### Request
- Headers:
  - `Authorization: Bearer <jwt-token>`

#### Response
- `200 OK`
```json
{
  "success": true,
  "alerts": [
    {
      "_id": "<alertId>",
      "scan": "<scanId>",
      "attackType": "XSS",
      "severity": "high",
      "riskScore": 0.83,
      "createdAt": "2026-06-03T12:05:00.000Z"
    }
  ]
}
```

### GET /api/alerts/scan/:id

Retrieve alerts for a specific scan.

#### Request
- Headers:
  - `Authorization: Bearer <jwt-token>`

#### Response
- `200 OK`
```json
{
  "success": true,
  "alerts": [
    {
      "_id": "<alertId>",
      "scan": "<scanId>",
      "attackType": "XSS",
      "severity": "high",
      "riskScore": 0.83,
      "createdAt": "2026-06-03T12:05:00.000Z"
    }
  ]
}
```

---

## ML Service

### POST /predict

Predict attack type and confidence for a target payload.

#### Request
- Headers:
  - `Content-Type: application/json`
- Body:
```json
{
  "payload": "<script>alert('xss')</script>"
}
```

#### Response
- `200 OK`
```json
{
  "success": true,
  "prediction": "XSS",
  "confidence": 0.83
}
```

### GET /health

Check ML service health.

#### Response
- `200 OK`
```json
{
  "success": true,
  "message": "ML service is running"
}
```

---

## Notes

- All authenticated endpoints require a valid JWT token.
- The ML service can be hosted separately from the backend.
- Use HTTPS for secure production deployments.
