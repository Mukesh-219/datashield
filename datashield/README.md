# DataShield – AI Powered Cybersecurity System 🛡️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/Mukesh-219/datashield/actions/workflows/ci.yml/badge.svg)](https://github.com/Mukesh-219/datashield/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)](https://www.python.org/)

> An intelligent cybersecurity platform that leverages machine learning to detect and classify web vulnerabilities in real-time.
>
> **Built and maintained by Mukesh-219 and Jigisha-Diksha.**
>
> Designed for security teams, developers, and analysts who need fast, accurate threat insights.

## 🚀 Features

- **Advanced Threat Detection**: AI-powered detection of SQL Injection, XSS, and other web attacks
- **Real-time Scanning**: Continuous monitoring and vulnerability assessment
- **Risk Scoring**: Machine learning-based risk evaluation for identified threats
- **Interactive Dashboard**: Modern React-based UI with data visualizations
- **Alert Management**: Comprehensive alert system with severity levels
- **RESTful API**: Well-documented API for integration
- **Scalable Architecture**: Microservices design with separate ML service

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   ML Service    │
│   (React)       │◄──►│  (Node/Express) │◄──►│   (Python)      │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - Auth          │    │ - Classification│
│ - Charts        │    │ - API Routes    │    │ - Risk Scoring  │
│ - Real-time     │    │ - WebSocket     │    │ - Model Training│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │  (MongoDB)      │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend:
- ⚛️ **React.js** (Vite) - Modern UI framework
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧭 **React Router** - Client-side routing
- 📊 **Chart.js** - Data visualization
- 🔄 **Axios** - HTTP client

### Backend:
- 🟢 **Node.js** - Runtime environment
- 🚀 **Express.js** - Web framework
- 🔐 **JWT** - Authentication
- 🍃 **Mongoose** - MongoDB ODM
- 🌐 **Socket.io** - Real-time communication

### ML Service:
- 🐍 **Python Flask** - REST API
- 🤖 **Scikit-learn** - Machine learning
- 🌳 **Random Forest** - Classification algorithm
- 💾 **Joblib** - Model serialization

### Database:
- 🍃 **MongoDB Atlas** - Cloud database

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB Atlas account
- Git

### Clone the Repository
```bash
git clone https://github.com/Mukesh-219/datashield.git
cd datashield
```

### Backend Setup
```bash
cd backend
npm install
# Configure environment variables in .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### ML Service Setup
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

## 🚀 Usage

1. **Start the Backend**: `cd backend && npm run dev`
2. **Start the Frontend**: `cd frontend && npm run dev`
3. **Start ML Service**: `cd ml-service && python app.py`
4. **Access Dashboard**: Open http://localhost:5173

### API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/scans` - Initiate security scan
- `GET /api/alerts` - Retrieve security alerts
- `POST /api/ml/classify` - ML-based threat classification

## 📊 Dashboard Features

- **Real-time Metrics**: Live security statistics
- **Attack Visualizations**: Charts for threat patterns
- **Alert Management**: View and manage security alerts
- **Scan History**: Track past security assessments
- **Risk Analysis**: ML-powered risk scoring

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Contributing Guide](CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

For details on workflow, code style, and PR expectations, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## � Contributors

- **Mukesh-219**
- **Jigisha-Diksha**

## 📞 Contact

- **Authors**: Mukesh, Jigisha-Diksha
- **GitHub**: [@Mukesh-219](https://github.com/Mukesh-219)
- **Project Link**: [https://github.com/Mukesh-219/datashield](https://github.com/Mukesh-219/datashield)

---

⭐ **Star this repo** if you find it useful!
```

## Getting Started

1. Clone the repository
2. Install dependencies for each service
3. Set up environment variables
4. Run the services

## License

This project is for educational purposes.