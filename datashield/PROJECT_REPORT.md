# DataShield Project Report

## 1. Introduction
DataShield is an AI-powered web application security platform designed to detect, classify, and prioritize common web threats such as SQL Injection (SQLi) and Cross-Site Scripting (XSS). The platform combines a React dashboard for analyst visibility, a Node.js/Express backend for authenticated orchestration and persistence, a separate Flask-based machine learning (ML) service for payload classification, and MongoDB Atlas for storing scans and alerts. It also supports real-time updates through Socket.IO and provides analytics and PDF report export.

## 2. Objectives
- Build an interactive cybersecurity dashboard to visualize scans, alerts, and risk metrics.
- Provide an authenticated workflow to submit scan requests (target URL, endpoint, and payload).
- Integrate machine learning to classify incoming payloads and return prediction confidence.
- Convert ML outputs into operational security signals using risk scoring and severity levels.
- Persist scans and alerts securely using MongoDB Atlas.
- Deliver real-time notifications for newly created scans and alerts using Socket.IO.
- Support report generation via client-side PDF export.

## 3. Literature Survey (Consolidated)
Machine learning approaches to web vulnerability and payload classification commonly leverage **text representation** and **supervised classifiers**. A typical effective pipeline uses **TF-IDF (with n-grams)** to vectorize payload text, followed by classifiers such as **Random Forest** due to its strong baseline performance and robustness on non-linear decision boundaries. 

For operational security workflows, research and industry practice increasingly emphasize **low-latency visibility** and **automation**. Real-time communication mechanisms such as WebSockets (and Socket.IO) reduce the time between detection and human review, improving incident response efficiency.

DataShield consolidates these ideas into a microservices design: the backend orchestrates authenticated operations and persistence, while the ML service performs TF-IDF + Random Forest inference.

## 4. Research Challenges
- **Model readiness at runtime:** the ML service must load model artifacts (model + vectorizer) before serving predictions.
- **Service-to-service reliability:** the backend depends on ML inference availability and network reachability via `ML_API_URL`.
- **Generalization and noise:** payload patterns vary widely; limited datasets can lead to false positives/negatives.
- **Consistency of preprocessing:** payload cleaning must match training-time preprocessing to keep predictions stable.
- **Security and access control:** backend routes require JWT-based authentication to protect scan and alert data.
- **Deployment complexity:** coordinating multiple services (frontend, backend, ML) with correct environment variables.

## 5. Problem Statement
Security analysts need to rapidly identify malicious payloads, triage true threats, and prioritize remediation without excessive manual effort. Traditional vulnerability scanners are often slow, noisy, and difficult to integrate into modern dashboards and workflows. A robust solution must combine (1) **authenticated scan orchestration**, (2) **ML-based payload classification**, (3) **risk/severity scoring**, (4) **persistent storage**, and (5) **real-time alert delivery**.

DataShield addresses this by providing an end-to-end platform where scans are submitted from a dashboard, payloads are classified by a dedicated ML service, alerts are scored and persisted, and analysts receive immediate updates.

### Figure 5.1: Overall System Architecture of DataShield AI
**Architecture:** Frontend (React) —(REST APIs / WebSocket)→ Backend (Node.js/Express.js) —(ML Prediction API)→ Python/Flask ML Service; Backend ↔ MongoDB Atlas; Backend —(Socket.IO)→ Frontend

### Figure 5.2: Frontend Architecture
**Structure:** Central Router <-> (Dashboard, Scan Module, Alert Module, Analytics Module) -> Backend API

### Figure 5.3: Backend Architecture
**Express Server:** API Routing | Authentication | Scan Management -> (MongoDB Atlas, Flask ML Service)

### Figure 5.4: Machine Learning Pipeline
**Flow:** Raw Payload Input -> Text Preprocessing -> TF-IDF Vectorization -> Random Forest Classifier -> Prediction + Confidence Score Output

### Figure 5.5: Database Design (MongoDB Atlas Collections)
**Schema:** Users(userId, name, email) | Scans(scanId, targetURL, findings[]) | Alerts(alertId, severity, riskScore)

### Figure 5.6: System Workflow
**Workflow:** User Login -> Scan Submission -> Scanner Injection -> ML Classification -> Risk Score Calculation -> DB Persistence -> Socket.IO Broadcast -> Dashboard Update

### Figure 5.7: Use Case Diagram
**Use Cases:** Actors(Security Analyst, Admin) -> (Login, Create Scan, View Alerts, View Analytics, Generate Reports, Manage Users)

### Figure 5.8: Data Flow Diagram
**Level 1 DFD:** User Interaction/Orchestration <-> Scanning <-> ML Classification <-> Reporting/Persistence

### Figure 5.9: Sequence Diagram
**Sequence:** User -> Frontend -> Backend -> ML Service -> Database -> Backend -> Frontend (Socket.IO)



## 6. Proposed Model

### Figure 6.2: ML Data Transformation Workflow
**Pipeline:** Raw Payload -> Preprocessing -> TF-IDF Vectorization -> Random Forest Classifier -> Prediction + Confidence Score


### 6.1 System model (microservices)

- **Frontend (React + Vite):** user interface for scan submission, visualization, and report export.
- **Backend (Node.js + Express + Socket.IO):** JWT-authenticated API for managing scans/alerts; broadcasts real-time events; stores data in MongoDB.
- **ML Service (Flask + scikit-learn):** TF-IDF vectorization + Random Forest inference.
- **Database (MongoDB Atlas):** persistence for users, scans, and alerts.

### 6.2 ML model (payload classification)
- Input: raw payload string.
- Preprocessing: cleans payload text using a shared preprocessing function.
- Feature extraction: TF-IDF vectorization using a trained vectorizer.
- Classifier: `RandomForestClassifier` predicts a label (attack type class) and provides class probabilities.
- Output: prediction label + confidence score (max probability).

### Figure 6.4: Real-Time Dashboard Interface
**Layout:** Header | Summary Cards | Pie Chart (Severity) | Real-time Alert Feed

## 7. Implementation
### Figure 7.3: System Latency Distribution
**Real-Time Update:** Backend Trigger -> Socket.IO Broadcast -> Frontend UI (Instant Alert Display)

### Figure 7.4: Scanning Throughput vs. Depth
**Database Diagram:** Users, Scans, Alerts Collections with Findings Nested in Scans

### 7.1 Backend implementation

- Express app mounts routes under `/api`:
  - `/api/auth/*` for register/login/me
  - `/api/scans/*` for scan creation and retrieval
  - `/api/alerts/*` for alert creation/listing
  - `/api/health` for backend health checks
- MongoDB connection is established via `MONGODB_URI` (or `MONGO_URI`) in `backend/config/db.js`.
- ML inference is invoked from `backend/services/mlService.js` using `ML_API_URL` (default: `http://127.0.0.1:8000/predict`).
- Real-time events are supported via Socket.IO on the same HTTP server created in `backend/server.js`.

### 7.2 ML service implementation
- `GET /health` returns service status and whether model artifacts are loaded.
- `POST /predict` accepts `{ "payload": "..." }` and returns `{ prediction, confidence }`.
- Model artifacts are loaded at startup from `ml-service/model/`.
- Training is performed by `train_model.py`, which saves:
  - `threat_model.pkl`
  - `vectorizer.pkl`

### 7.3 Frontend implementation
- Axios API client reads token from `localStorage` and adds the JWT in `Authorization: Bearer <token>`.
- Dashboard loads metrics and lists and subscribes to Socket.IO events (`alertCreated`, `scanCreated`) to refresh UI in real time.
- Analytics are rendered using charts (severity distribution, attack type frequency, scan trends).

### Figure 7.5: Risk Score Heatmap
**Report Structure:** Header/Summary -> Risk Assessment Chart -> Findings Table (Payload, Prediction, Risk)

## 8. Results & Analysis

Once the services are running (frontend, backend, and ML service), DataShield supports an end-to-end workflow:
- Users authenticate using JWT.
- Users submit scan requests through the dashboard.
- Backend persists scan details and calls the ML service for payload classification.
- Backend generates alerts from predictions and computes severity/risk signals.
- The dashboard updates automatically via Socket.IO without manual refresh.

The practical outcome is improved operator efficiency: high-severity alerts and risk metrics are visible immediately, and analytics help analysts understand attack patterns.

## 9. Future Scope
- Expand ML models to cover more vulnerability categories and improve dataset diversity.
- Add role-based access control (RBAC) and detailed audit logs for security events.
- Implement model monitoring and periodic retraining.
- Add automated remediation guidance and prioritization explanations.
- Improve cross-scan correlation for threat campaign detection.

## 10. Conclusion
DataShield provides a complete, modular cybersecurity platform integrating authenticated scan orchestration, ML-based payload classification, risk/severity scoring, MongoDB persistence, and real-time analyst visibility. The microservices separation (backend vs. ML service) enables independent scaling and simplified maintenance, while the React dashboard delivers operationally useful analytics and immediate alert updates.

## 11. References
- Project documentation within repository:
  - `API_DOCUMENTATION.md`
  - `DEPLOYMENT_GUIDE.md`
- scikit-learn model pipeline concepts:
  - TF-IDF vectorization
  - Random Forest classification
- Socket.IO concept for real-time web applications

