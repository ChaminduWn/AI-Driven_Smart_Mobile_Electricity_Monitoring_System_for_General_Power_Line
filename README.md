# ⚡ PowerLink – AI-Driven Smart Mobile Electricity Monitoring System for General Power Line

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/ChaminduWn/AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line.git)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Platform](https://img.shields.io/badge/platform-React%20Native%20%7C%20FastAPI-orange)

---

<img width="1536" height="1024" alt="System Architecture" src="https://github.com/user-attachments/assets/d19663aa-dfef-4d3a-baa5-b8ff148a78de" />

# 📌 Project Overview

**PowerLink** is an AI-powered Smart Mobile Electricity Monitoring and Management Platform developed to help households monitor, analyze, predict, and optimize electricity consumption in real time.

The system integrates:

- ⚡ IoT Smart Meter Hardware
- 🤖 Artificial Intelligence & Machine Learning
- 📱 React Native Mobile Application
- 🌐 Real-time Backend APIs
- ☀️ Solar Recommendation System
- 🚨 Smart Outage & Safety Management
- 🎙️ Multilingual Voice Command and Smart Assistant System
- 📍 Location-Based Electricity Service Coordination
- 🛠️ Electrician and Electricity Board Management Platform
- 📊 Real-Time Issue Monitoring and Reporting Dashboard

The project focuses on reducing electricity costs while improving electrical safety and energy efficiency for Sri Lankan households.

---

# 🎯 Main Objectives

The main goals of the system are:

- Predict future electricity bills using AI
- Detect appliance-level energy usage
- Warn users before crossing expensive tariff limits
- Provide real-time electricity monitoring
- Enable smart outage reporting and technician management
- Provide multilingual voice-command-based system interaction
- Enable real-time electricity issue reporting and tracking
- Support location-based electrician allocation and navigation
- Provide web-based dashboards for electricity board monitoring and management
- Recommend suitable solar systems
- Improve electrical safety using weather-aware alerts
- Provide a complete cyber-physical smart energy ecosystem

---

# 📱 Unified Mobile Application – PowerLink

## Application Name:
# **PowerLink – EnergyIQ Smart Energy Platform**

The entire system is integrated into a **single unified React Native mobile application**.

Location:
```text
mobile-apps/member1-mobile/EnergyAnalysisApp
```

The application combines all four member modules into one centralized platform.

---

# 🏗️ Full System Architecture

```text
AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line/
│
├── backend/
│   ├── member1-energy-analysis/
│   │   ├── smart_predictions.py
│   │   ├── nilm_engine/
│   │   ├── tariff_engine/
│   │   └── recommendation_engine/
│   │
│   ├── member2-outage-system/
│   │   ├── issue_reporting/
│   │   ├── technician_management/
│   │   ├── realtime_tracking/
│   │   ├── voice_command_system/
│   │   │   ├── speech_to_text/
│   │   │   ├── intent_classifier/
│   │   │   ├── command_mapper/
│   │   │   └── multilingual_processing/
│   │   ├── electricity_board_dashboard/
│   │   └── task_assignment/
│   │
│   ├── member3-solar-recommendation/
│   │   ├── solar_ml_models.pkl
│   │   ├── climate_database/
│   │   └── roi_calculator/
│   │
│   ├── member4-safety-assistant/
│   │   ├── weather_guard/
│   │   ├── safety_chatbot/
│   │   └── risk_assessment/
│   │
│   └── shared/
│       ├── configs/
│       ├── authentication/
│       └── utilities/
│
├── mobile-apps/
│   └── member1-mobile/
│       └── EnergyAnalysisApp/
│
├── admin-panel/
│
├── web-app/
│
├── hardware/
│   └── energyIQ_meter/
│       ├── energyIQ_meter3.ino
│       ├── wiring_diagram/
│       └── appliance_testing/
│
└── docs/
```

---

# 👥 Team Members & Contributions

| Member | IT Number | Main Contribution |
|---|---|---|
| **Chamindu W N** | IT22562388 | Energy Analysis, Bill Management, AI Prediction & IoT Integration |
| **CHANDRASEKARA N K D R** | IT22052988 | Outage Reporting & Technician Management |
| **Wijekoon W.M.M.G.K.P** | IT22575562 | Solar Power Recommendation System |
| **Gamage K.P** | IT22202390 | Safety & Disaster Management |

---

# ⚡ Member 1 – Energy Analysis & AI Prediction System

## Backend Location

```text
backend/member1-energy-analysis
```

This subsystem serves as the intelligence core of the project.

---

# 🧠 Core Features

## 📄 Smart Bill Management
- Digital bill upload system
- OCR extraction of bill details
- Historical bill tracking
- Electricity usage analytics
- Monthly comparison visualization
- Budget planning system

---

## 🤖 Self-Growing AI Prediction Engine

The backend includes advanced machine learning models designed to improve automatically over time.

### 1. Bill Spike Prediction Model
Predicts whether the next month's bill will significantly increase.

### Technologies Used
- Gradient Boosting Regressor
- Scikit-learn
- Historical usage analysis
- Seasonal pattern learning

### Capabilities
- Detects unusual consumption increases
- Predicts monthly bill spikes
- Learns from individual household behavior

---

### 2. Tariff Crossing Warning System

Sri Lankan electricity tariffs increase drastically after certain usage thresholds.

The system:
- Tracks current month usage
- Predicts end-of-month consumption
- Sends warnings before crossing expensive tariff categories

### Example
- CEB Category 2 warning at 60kWh
- Daily trend extrapolation
- Mid-month prediction analysis

---

### 3. Household Efficiency Scoring

The AI compares household usage against expected consumption patterns.

Factors analyzed:
- House size
- Number of family members
- Appliance inventory
- Daily electricity behavior
- Seasonal conditions

The system generates:
- Efficiency Score (0–100)
- Appliance optimization advice
- Energy-saving recommendations

---

## 🔌 NILM – Non-Intrusive Load Monitoring

The project uses NILM techniques to estimate appliance-level energy usage without requiring separate sensors for every device.

Detected appliances include:
- Refrigerator
- Air Conditioner
- Iron
- Rice Cooker
- Television
- Water Heater
- Fan
- Washing Machine

The AI identifies appliances based on:
- Power signatures
- Current fluctuations
- Usage duration patterns

---

# 📱 PowerLink Mobile Application Features

## 📊 Real-Time Dashboard
Displays live:
- Voltage
- Current
- Active Power
- Energy Consumption
- Frequency
- Power Factor

Data is streamed directly from the IoT smart meter using MQTT and WebSockets.

---

## 📈 Bill Analysis Module
Users can:
- Upload bills
- View historical charts
- Analyze consumption trends
- Predict future bills
- Track monthly budgets

---

## 🔍 Appliance Testing System

A dedicated appliance testing interface allows users to:
- Turn appliances on/off
- Observe power consumption
- Estimate monthly appliance costs
- Identify inefficient appliances

---

## 🔔 Smart Notification System

Notifications include:
- Tariff crossing alerts
- Predicted bill spike warnings
- Overcurrent warnings
- Relay trip alerts
- Weather safety notifications
- Technician arrival notifications

---

# 🔌 IoT Smart Meter System

## Firmware Location

```text
hardware/energyIQ_meter/energyIQ_meter3.ino
```

The hardware system is built using:
- ESP32
- PZEM-004T v3.0
- LCD1602 Display
- CT Clamp Sensor
- Relay Module
- WiFi Connectivity

---

# ⚡ PZEM-004T Features

| Parameter | Range |
|---|---|
| Voltage | 80V – 260V AC |
| Current | 0A – 100A |
| Active Power | 0 – 22kW |
| Energy | 0 – 9999 kWh |
| Frequency | 45Hz – 65Hz |
| Power Factor | 0.00 – 1.00 |

---

# 🧠 Smart Meter Capabilities

## Relay Protection System
The system can automatically disconnect power during:
- Overcurrent conditions
- Overvoltage situations
- Undervoltage conditions
- Dangerous appliance behavior

---

## 📡 Connectivity

Communication technologies:
- MQTT (HiveMQ)
- REST APIs
- WebSockets
- WiFi

The smart meter continuously streams data to:
- Backend servers
- Mobile application
- Real-time dashboards

---

## 🖥️ Local LCD Interface

The LCD1602 screen displays:
- Voltage
- Current
- Power
- Safety Status
- WiFi Status
- MQTT Connection Status

---

# 🚨 Member 2 – Smart Outage Reporting & Technician Management

## Backend Location

```text
backend/member2-outage-system
```

---

# ⚙️ Features

## ⚡ Outage Reporting
Users can:
- Report power outages
- Upload outage photos
- Share GPS location
- Notify the electricity board

---

## 👨‍🔧 Technician Marketplace

An Uber-style technician management system:
- Find nearby electricians
- Real-time technician tracking
- In-app messaging
- Job acceptance system
- Payment workflow

---

## 🌐 Technologies
- Node.js
- Express.js
- Sequelize
- Socket.io
- PostgreSQL

---

# ☀️ Member 3 – AI Solar Recommendation System

## Backend Location

```text
backend/member3-solar-recommendation
```

---

# 🌞 Features

## Climate-Aware Solar Recommendations
The system uses Sri Lankan district climate data:
- Solar Irradiance (GHI)
- Rainfall
- Temperature
- Cloud conditions

---

## 🤖 AI Solar Prediction Engine

Predicts:
- Ideal solar system size
- Expected monthly savings
- Estimated installation cost
- ROI period
- Payback duration

---

## 📊 Financial Analysis
Users receive:
- Cost-benefit analysis
- Savings estimation
- Return on Investment calculations

---

# 🛡️ Member 4 – Smart Safety Assistant & Weather Guard

## Backend Location

```text
backend/member4-safety-assistant
```

---

# 🚨 Features

## 🌧️ Weather-Aware Safety Alerts
The system integrates with weather APIs to provide:
- Lightning safety warnings
- Heavy rain electrical alerts
- Flood-related electrical risk notifications

---

## 🤖 AI Safety Chatbot
Provides:
- Electrical safety advice
- Emergency instructions
- Appliance safety guidance
- Fire prevention tips

---

## ⚠️ Risk Assessment System
Analyzes:
- Voltage instability
- Dangerous appliance usage
- Environmental risks
- Electrical overloads

---

# 📊 Unified Feature Mapping

| Feature | Screen | Backend |
|---|---|---|
| Real-Time Monitoring | LiveMeterScreen | member1-energy-analysis |
| Bill Analysis | BillAnalysisScreen | member1-energy-analysis |
| Appliance Testing | ApplianceTestingScreen | member1-energy-analysis |
| Outage Reporting | EmergencyScreen | member2-outage-system |
| Technician Tracking | TechnicianTrackingScreen | member2-outage-system |
| Solar Recommendation | SolarRecommendationScreen | member3-solar-recommendation |
| Safety Dashboard | SafetyManagementScreen | member4-safety-assistant |

---

# ⚙️ Technology Stack

# Backend
- Python 3.10+
- FastAPI
- Flask
- Node.js
- Express.js
- PostgreSQL
- Redis
- MongoDB
- MQTT
- Socket.io
- TensorFlow
- Scikit-learn

---

# 📱 Frontend
- React Native
- React.js
- Material UI
- Tailwind CSS
- Expo

---

# 🔌 Hardware
- ESP32
- PZEM-004T v3.0
- CT Clamp
- LCD1602
- Relay Module

---

# 🚀 DevOps
- Docker
- Docker Compose
- Nginx
- GitHub Actions
- CI/CD Pipelines

---

# 🚀 Getting Started

# 1️⃣ Clone Repository

```bash
git clone https://github.com/ChaminduWn/AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line.git
```

---

# 2️⃣ Backend Setup

```bash
cd backend/member1-energy-analysis

pip install -r requirements.txt

uvicorn main:app --reload
```

---

# 3️⃣ Mobile App Setup

```bash
cd mobile-apps/member1-mobile/EnergyAnalysisApp

npm install

npx expo start
```

---

# 4️⃣ ESP32 Firmware Upload

Flash:
```text
energyIQ_meter3.ino
```

to the ESP32 using Arduino IDE.

---

# 🌟 Major Innovations

- Self-growing AI prediction engine
- Real-time tariff prediction
- NILM appliance detection
- AI-powered electricity optimization
- Smart outage ecosystem
- Real-time technician tracking
- Weather-aware electrical safety
- IoT relay automation
- Cyber-Physical smart energy loop

---

# 🔄 Cyber-Physical System Workflow

```text
IoT Hardware
      ↓
Real-Time Sensor Data
      ↓
Backend APIs & AI Models
      ↓
Prediction & Analysis
      ↓
Mobile Notifications & Insights
      ↓
Relay Safety Actions & User Decisions
```

---

# 📷 System Architecture Diagram

```markdown
(Add your system architecture image here)
```

Example:

```html
<img src="docs/system-architecture.png" width="100%">
```

---

# 🤝 Contributions

This project was collaboratively developed as part of a Smart Energy Management research and development initiative integrating:

- Artificial Intelligence
- IoT Systems
- Mobile Computing
- Smart Energy Analytics
- Cloud-based APIs
- Real-Time Monitoring
- Predictive Modeling
- Safety Automation

---

# 📝 License

This project is licensed under the MIT License.

---

# 🔗 GitHub Repository

Repository Link:

```text
https://github.com/ChaminduWn/AI-Driven_Smart_Mobile_Electricity_Monitoring_System_for_General_Power_Line
```
