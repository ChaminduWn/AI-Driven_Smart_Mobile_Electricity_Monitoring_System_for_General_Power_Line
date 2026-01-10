# AI-Driven Smart Mobile Electricity Monitoring System for General Power Line

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/ChaminduWn/AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line.git)

## 🎯 Project Overview
Comprehensive electricity management platform with AI-powered energy analysis, real-time outage reporting, solar recommendation system, and safety assistant.

## 👥 Team Members & Components

### Member 1: Energy Analysis & Bill Management
- User onboarding & appliance profiling
- Bill upload & OCR extraction
- NILM (Appliance disaggregation)
- Real-time cost monitoring
- Anomaly detection
- AI recommendation engine

### Member 2: Outage Reporting & Technician Management
- Real-time power outage reporting
- GPS location tracking
- Technician matching system
- Multilingual support (Si/En/Ta)
- Voice command processing
- Push notifications

### Member 3: Solar Power Recommendation
- Climate trend visualization
- Weather-based feasibility analysis
- Solar cost estimation
- System sizing recommendations
- ROI calculations

### Member 4: Safety & Disaster Management
- Real-time weather integration
- AI safety assistant (NLP)
- Emergency disaster protocols
- Dynamic safety notifications
- Electrical risk mitigation

## 🏗️ Architecture
```
monorepo/
├── backend/
│   ├── member1-energy-analysis/    (Python/FastAPI)
│   ├── member2-outage-system/      (Node.js/Express)
│   ├── member3-solar-recommendation/ (Python/FastAPI)
│   ├── member4-safety-assistant/   (Python/FastAPI + Node.js)
│   └── shared/                     (Common utilities)
├── admin-panel/                    (React - Integrated)
├── web-apps/                       (Individual React apps)
└── mobile-apps/                    (React Native apps)
```

## 🚀 Quick Start

See [SETUP.md](./docs/SETUP.md) for detailed setup instructions.

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Development Guidelines](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🔧 Technology Stack

**Backend:**
- Python 3.10+ (FastAPI, TensorFlow, scikit-learn)
- Node.js 18+ (Express, Socket.io)
- PostgreSQL (Primary database)
- Redis (Caching & real-time)
- MongoDB (Optional - for logs)

**Frontend:**
- React 18+ (Web apps)
- React Native (Mobile apps)
- Material-UI / Tailwind CSS

**DevOps:**
- Docker & Docker Compose
- Nginx (Reverse proxy)
- GitHub Actions (CI/CD)

## 📝 License
[Your License]

## 🤝 Contributing
See [CONTRIBUTING.md](./docs/CONTRIBUTING.md)
EOF
