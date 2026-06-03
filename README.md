# DataShield — AI-Powered Cybersecurity Platform 🛡️

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen)](https://opensource.org/licenses/MIT) [![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/) [![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/) [![Python](https://img.shields.io/badge/Python-3.8+-yellow)](https://www.python.org/)

> DataShield detects, classifies, and visualizes web application threats in real-time using AI, real-time alerts, and rich dashboard analytics.

---

## ✨ Why DataShield?

DataShield delivers a modern cybersecurity experience by combining: 

- **AI-powered threat detection** for SQL Injection, XSS, and suspicious payloads
- **Real-time alerting** with live updates via Socket.IO
- **Risk scoring** that prioritizes triage and remediation
- **Interactive dashboard analytics** to visualize attack patterns
- **Automated PDF reporting** for executive-ready security summaries

---

## 🚀 Core Features

- Real-time scan ingestion and alert generation
- Machine learning classification for payloads
- Severity and risk-based alert scoring
- Interactive charts for attack trends and distribution
- Scan history, alert management, and drill-down details
- Secure JWT authentication and protected API routes
- Frontend report export with `jsPDF` and `html2canvas`

---

## 🧱 Architecture

```
  Frontend (React + Vite)   <---->   Backend (Node + Express)   <---->   ML Service (Python + Flask)
           │                             │                            │
           │ Socket.IO / REST API        │ ML inference / persistence  │
           │                             │                            │
           └─────────────────────────────┴────────────────────────────┘
                                      │
                                      ▼
                                MongoDB Atlas
```

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Recharts
- Socket.IO Client
- Axios

### Backend
- Node.js
- Express.js
- Mongoose
- JWT Authentication
- Socket.IO

### ML Service
- Flask
- scikit-learn
- Random Forest
- TF-IDF

### Database
- MongoDB Atlas

---

## ⚡ Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/Mukesh-219/datashield.git
cd datashield
```

### 2. Start the backend
```bash
cd backend
npm install
copy .env.example .env
# Update .env with your MongoDB Atlas and JWT settings
npm run dev
```

### 3. Start the frontend
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Start the ML service
```bash
cd ../ml-service
pip install -r requirements.txt
python app.py
```

### 5. Open the dashboard
- Visit: `http://localhost:5173`

---

## 🔧 Environment Variables

### Backend
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — JWT signing secret
- `PORT` — backend port (default: `5000`)
- `ML_API_URL` — ML service endpoint (default: `http://127.0.0.1:8000/predict`)

### Frontend
- `VITE_API_URL` — backend API base URL

### ML Service
- `PORT` — ML service port (default: `8000`)

---

## 📚 Documentation

- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Project Report](PROJECT_REPORT.md)
- [Contributing Guide](CONTRIBUTING.md)

---

## 🧾 API Highlights

- `POST /api/auth/login` — authenticate users
- `POST /api/scans` — create new vulnerability scans
- `GET /api/alerts` — list generated alerts
- `POST /predict` — ML payload classification

---

## 🌟 What You’ll See

- Dashboard metrics for scans, alerts, and risk levels
- Real-time alert cards and notifications
- Attack type distribution charts
- Scan trend and severity breakdown visualizations
- Downloadable PDF security reports

---

## 🎯 Future Enhancements

- Role-based access control
- Expanded vulnerability classification models
- Email and Slack alert integrations
- Audit history and advanced remediation workflows

---

## 🤝 Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) and open a pull request.

---

## 📞 Contact

- **Authors**: Mukesh, Jigisha-Diksha
- **GitHub**: [@Mukesh-219](https://github.com/Mukesh-219)
- **Project**: [https://github.com/Mukesh-219/datashield](https://github.com/Mukesh-219/datashield)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
