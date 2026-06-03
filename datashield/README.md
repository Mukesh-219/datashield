# DataShield – AI Powered Cybersecurity System 🛡️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)](https://www.python.org/)

> DataShield is an AI-powered cybersecurity platform designed to detect, analyze, and visualize web application threats in real-time.

## Project Overview

DataShield unifies web application security monitoring, machine learning threat detection, and real-time alerting into a single modern platform. It combines a React dashboard with a Node.js API, a MongoDB Atlas backend, and a Python ML microservice to deliver intelligent scan analysis, prioritized alerts, and actionable security insights.

## Features

- AI-driven threat detection for SQL Injection, XSS, and suspicious activity
- Real-time scanning and alert generation with Socket.IO
- Risk scoring and severity classification for prioritized remediation
- Interactive dashboard with analytics and visualizations
- PDF report generation for security assessments
- User authentication with JWT-based access control
- Fully client-side report generation and modern cybersecurity theme

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Recharts
- Socket.IO Client

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- JWT
- Socket.IO

### ML Service
- Flask
- Scikit-learn
- Random Forest
- TF-IDF

## System Architecture

```
       ┌────────────────────┐        ┌────────────────────┐        ┌────────────────────┐
       │      Frontend      │        │      Backend       │        │      ML Service    │
       │   React + Vite     │◄──────►│  Node.js + Express │◄──────►│   Flask + scikit   │
       │  Tailwind + Recharts│       │  JWT + Socket.IO   │       │  Random Forest     │
       └────────────────────┘        └────────────────────┘        └────────────────────┘
                    ▲                             ▲                         ▲
                    │                             │                         │
                    │                             │                         │
                    │                             ▼                         │
                    │                    ┌────────────────────┐            │
                    └───────────────────►│   MongoDB Atlas      │◄───────────┘
                                         └────────────────────┘
```

## Installation Guide

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB Atlas account
- Git

### Clone the repository
```bash
git clone https://github.com/Mukesh-219/datashield.git
cd datashield
```

### Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env values with your MongoDB Atlas and JWT credentials
npm run dev
```

### Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### ML service setup
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

## Environment Variables

### Backend
- `MONGO_URI` – MongoDB Atlas connection string
- `JWT_SECRET` – Secret key for JWT token signing
- `PORT` – Backend server port (default: `5000`)
- `ML_API_URL` – ML service endpoint (default: `http://127.0.0.1:8000/predict`)

### Frontend
- `VITE_API_URL` – Base URL for backend API requests (if used)

### ML Service
- `MONGO_URI` (optional for future persistence)
- `PORT` – ML service port (default: `8000`)

## API Documentation

The project exposes a REST API with authentication, scan management, alert management, and ML inference endpoints. Full details are available in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

## Screenshots Placeholder

> Add screenshots of the dashboard, alerts page, report generation, and analytics charts here.

- Screenshot 1: Dashboard overview
- Screenshot 2: Scan creation flow
- Screenshot 3: Real-time alert notification
- Screenshot 4: PDF report generated

## Deployment Instructions

For deployment guidance, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Future Scope

- Add role-based access control
- Add more ML models for deeper vulnerability classification
- Extend support for API security scanning
- Add notification integrations (email, Slack)
- Add audit logs and export options

## Contributing

Contributions are welcome. Please review [CONTRIBUTING.md](CONTRIBUTING.md) if you plan to contribute.

## 📞 Contact

- **Authors**: Mukesh, Jigisha-Diksha
- **GitHub**: [@Mukesh-219](https://github.com/Mukesh-219) and [@Jigisha-Diksha](https://github.com/Jigisha-Diksha)
- **Project Link**: [https://github.com/Mukesh-219/datashield](https://github.com/Mukesh-219/datashield)

---

⭐ **Star this repo** if you find it useful!

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.


## Getting Started

1. Clone the repository
2. Install dependencies for each service
3. Set up environment variables
4. Run the services

## License

This project is for educational purposes.
