# AI-Driven Smart Mobile Electricity Monitoring System for General Power Line

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/ChaminduWn/AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line.git)

## 🎯 Project Overview
Comprehensive electricity management platform with AI-powered energy analysis, real-time outage reporting, solar recommendation system, and safety assistant.

## 👥 Team Members & Components

### Member 1: Energy Analysis & Bill Management
- Predicts bills using ML models
- Bill upload & OCR extraction & identify appliances via AI image recognition
- Disaggregates energy usage to individual appliances (NILM)
- Creates budgets and tracks progress daily
- Calculates tariffs using official Sri Lankan CEB rates
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
AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line/
├── backend/
│   ├── member1-energy-analysis/    (Python/FastAPI)
│   ├── member2-outage-system/      (Node.js/Express)
│   ├── member3-solar-recommendation/ (Python/FastAPI)
│   ├── member4-safety-assistant/   (Python/FastAPI + Node.js)
│   └── shared/                     (Common utilities)
├── admin-panel/                    (React - Integrated)
├── web-app/                       (Individual React app)
└── mobile-app/                    (React Native app)
```

## 🖼️ System Architecture (Optional)
<img width="1536" height="1024" alt="system architechture" src="https://github.com/user-attachments/assets/d81ff58c-9109-499e-b828-dac709d47e2d" />


## 🚀 Quick Start

See [SETUP.md](./docs/SETUP.md) for detailed setup instructions.


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


## 🤝 Contributions & Collaboration

---

| Name | IT Number | Contribution |
|-----|-----|-----|
| **Chamindu W N** | IT22562388 | Energy Analysis & Bill Management |
| **CHANDRASEKARA N K D R** | IT22052988 | Outage Reporting & Technician Management  |
| **Wijekoon  W.M.M.G.K.P** | IT22575562  | Solar Power Recommendation  |
| **Gamage K.P** | IT22202390 | Safety & Disaster Management  |
