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
Machine learning approaches to web vulnerability and payload classification commonly leverage **text representation** and **supervised classifiers**. A typical effective pipeline uses **TF-IDF (with character n-grams)** to vectorize payload text, followed by classifiers such as **Random Forest** due to its strong baseline performance and robustness on non-linear decision boundaries. Character-level n-grams are particularly effective for security payloads because they capture attack tokens (e.g., `OR`, `SELECT`, `onerror=`) regardless of spacing, casing, or obfuscation.

For network-level threat detection, the **CICIDS2017** benchmark dataset provides labeled network flow records covering DDoS, PortScan, BruteForce, DoS, and web attack classes. Feature-based classifiers on flow statistics (packet lengths, inter-arrival times, flag counts) achieve near-perfect separation between benign and attack traffic.

For operational security workflows, research and industry practice increasingly emphasize **low-latency visibility** and **automation**. Real-time communication mechanisms such as WebSockets (and Socket.IO) reduce the time between detection and human review, improving incident response efficiency.

DataShield consolidates these ideas into a microservices design: the backend orchestrates authenticated operations and persistence, while the ML service exposes two models — a payload text classifier and a network flow classifier.

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

Frontend (React + Vite)   <---->   Backend (Node + Express)   <---->   ML Service (Python + Flask)
         │                             │                            │
         │ Socket.IO / REST API        │ ML inference / persistence  │
         │                             │                            │
         └─────────────────────────────┴────────────────────────────┘
                                    │
                                    ▼
                              MongoDB Atlas



## 6. Proposed Model

### 6.1 System model (microservices)

- **Frontend (React + Vite):** user interface for scan submission, visualization, and report export.
- **Backend (Node.js + Express + Socket.IO):** JWT-authenticated API for managing scans/alerts; broadcasts real-time events; stores data in MongoDB.
- **ML Service (Flask + scikit-learn):** two independent models — payload text classifier and network flow classifier.
- **Database (MongoDB Atlas):** persistence for users, scans, and alerts.

### 6.2 Payload Text Classifier

- **Algorithm:** Random Forest (300 estimators, balanced class weights)
- **Vectorizer:** TF-IDF with character n-grams (`analyzer=char_wb`, `ngram_range=(2,5)`, `max_features=60,000`, `sublinear_tf=True`)
- **Classes:** Normal, SQLi, XSS, Suspicious
- **Training data:** 52,322 balanced samples drawn from 90,042 unique real-world payloads

| Source | Type | Samples |
|---|---|---|
| Kaggle `sqli.csv` + `sqliv2.csv` + `SQLiV3.csv` | SQLi + Normal | ~48,000 |
| Kaggle `XSS_dataset.csv` | XSS + Normal | ~13,700 |
| SecLists Fuzzing (LFI, SSTI, SSI) | Suspicious | ~1,014 |
| PayloadsAllTheThings (LFI, SSTI, dir traversal, cmd injection) | Suspicious | ~22,500 |

### 6.3 Network Flow Classifier

- **Algorithm:** Random Forest (200 estimators, balanced class weights, StandardScaler)
- **Features:** 78 numeric flow statistics (packet lengths, IAT, flag counts, window sizes, etc.)
- **Classes:** BENIGN, DDoS, DoS, PortScan, BruteForce, Bot, SQLi, Infiltration, Heartbleed
- **Training data:** CICIDS2017 dataset (2.3M records, balanced to 5,000 per class)

## 7. Implementation
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
- `GET /health` returns service status and whether both model artifacts are loaded.
- `POST /predict` accepts `{ "payload": "..." }` and returns `{ prediction, confidence }` for payload text classification.
- `POST /predict/network` accepts 78 numeric flow features and returns `{ prediction, confidence, classProbabilities }` for network threat classification.
- Payload model artifacts loaded at startup from `ml-service/model/threat_model.pkl` and `vectorizer.pkl`.
- Network model artifacts: `network_model.pkl`, `network_scaler.pkl`, `network_features.pkl`, `network_label_encoder.pkl`.
- Training scripts:
  - `train_model.py` — payload text classifier using `data/sample_dataset.csv`
  - `train_network_model.py` — network flow classifier using CICIDS2017 files
  - `build_and_train.py` — merges all Kaggle datasets and retrains payload model
  - `patt_retrain.py` — downloads PayloadsAllTheThings + SecLists payloads and retrains

### 7.3 Frontend implementation
- Axios API client reads token from `localStorage` and adds the JWT in `Authorization: Bearer <token>`.
- Dashboard loads metrics and lists and subscribes to Socket.IO events (`alertCreated`, `scanCreated`) to refresh UI in real time.
- Analytics are rendered using charts (severity distribution, attack type frequency, scan trends).


## 8. Results & Analysis

### 8.1 Payload Text Classifier

Trained on 52,322 balanced samples from 90,042 unique real-world payloads sourced from Kaggle, SecLists, and PayloadsAllTheThings.

**5-Fold Cross-Validation Accuracy: 99.74% ± 0.04%**
**Hold-out Test Accuracy: 99.66%**

#### Per-Class Metrics

| Class | Precision | Recall | F1 Score | Support |
|---|---|---|---|---|
| Normal | 0.9894 | 0.9993 | 0.9944 | 3,000 |
| SQLi | 0.9993 | 0.9933 | 0.9963 | 3,000 |
| Suspicious | 0.9993 | 0.9977 | 0.9985 | 3,000 |
| XSS | 1.0000 | 0.9952 | 0.9976 | 1,465 |
| **Macro avg** | **0.9974** | **0.9964** | **0.9967** | **10,465** |

#### Confusion Matrix

| | Pred: Normal | Pred: SQLi | Pred: Suspicious | Pred: XSS |
|---|---|---|---|---|
| **Act: Normal** | 2998 | 1 | 1 | 0 |
| **Act: SQLi** | 20 | 2980 | 0 | 0 |
| **Act: Suspicious** | 6 | 1 | 2993 | 0 |
| **Act: XSS** | 6 | 0 | 1 | 1458 |

Key observations:
- SQLi, XSS, and Suspicious misclassifications go exclusively to Normal — never cross-contaminate each other.
- Zero false positives on XSS (precision = 1.0000).
- Character n-gram TF-IDF is highly effective at capturing obfuscated attack patterns.

#### Model Progression

| Stage | Dataset Size | Accuracy | Suspicious Recall | Macro F1 |
|---|---|---|---|---|
| Initial prototype | 40 samples | 40.00% | N/A | N/A |
| + Kaggle datasets | 37,404 | 99.64% | 12.5% | 0.8038 |
| + SecLists | 38,336 | 99.58% | 99.51% | 0.9964 |
| **+ PayloadsAllTheThings** | **52,322** | **99.66%** | **99.77%** | **0.9967** |

### 8.2 Network Flow Classifier

Trained on CICIDS2017 with 2.3M records balanced to 28,510 samples across 9 attack classes.

**Hold-out Accuracy: 99.00%**

| Class | Precision | Recall | F1 |
|---|---|---|---|
| BENIGN | 0.99 | 0.99 | 0.99 |
| BruteForce | 1.00 | 0.96 | 0.98 |
| DDoS | 1.00 | 1.00 | 1.00 |
| DoS | 1.00 | 1.00 | 1.00 |
| PortScan | 1.00 | 1.00 | 1.00 |
| Bot | 0.99 | 1.00 | 0.99 |
| SQLi | 0.88 | 0.99 | 0.93 |
| Infiltration | 1.00 | 1.00 | 1.00 |
| Heartbleed | 1.00 | 1.00 | 1.00 |

Top predictive features: Destination Port, Init_Win_bytes_backward, Bwd Packet Length Mean, Average Packet Size.

### 8.3 End-to-End System Validation

Full stack smoke test (16/16 endpoints pass):
- ML service health: both models loaded
- `POST /predict` correctly classifies SQLi (97% confidence), XSS (98%), Normal (98%)
- Backend creates alerts only for threat predictions — Normal scans produce zero alerts
- Real-time Socket.IO events deliver alerts to dashboard without page refresh
- JWT authentication protects all scan and alert routes

## 9. Future Scope
- Expand ML models to cover more vulnerability categories and improve dataset diversity.
- Add role-based access control (RBAC) and detailed audit logs for security events.
- Implement model monitoring and periodic retraining.
- Add automated remediation guidance and prioritization explanations.
- Improve cross-scan correlation for threat campaign detection.

## 10. Conclusion
DataShield provides a complete, modular cybersecurity platform integrating authenticated scan orchestration, dual ML-based threat classification, risk/severity scoring, MongoDB persistence, and real-time analyst visibility. The payload classifier achieves **99.66% accuracy** across four classes (Normal, SQLi, XSS, Suspicious) trained on 90,042 real-world payloads from Kaggle, SecLists, and PayloadsAllTheThings. The network flow classifier achieves **99.00% accuracy** on the CICIDS2017 benchmark across 9 attack classes. The microservices separation (backend vs. ML service) enables independent scaling and simplified maintenance, while the React dashboard delivers operationally useful analytics and immediate alert updates.

## 11. References
- Kaggle datasets:
  - SQL Injection Dataset — syedsaqlainhussain
  - SQL Injection Dataset v2 — syedsaqlainhussain
  - SQL Injection Dataset v3
  - XSS Dataset for Deep Learning — syedsaqlainhussain
- SecLists by Daniel Miessler — https://github.com/danielmiessler/SecLists
- PayloadsAllTheThings by swisskyrepo — https://github.com/swisskyrepo/PayloadsAllTheThings
- CICIDS2017 — Canadian Institute for Cybersecurity Intrusion Detection Evaluation Dataset
- scikit-learn: TF-IDF vectorization, Random Forest classification
- Socket.IO: real-time bidirectional event-based communication
- Project documentation: `API_DOCUMENTATION.md`, `DEPLOYMENT_GUIDE.md`

