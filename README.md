# 🌍 BioSentinel - Biodiversity Protection Platform

> **Real-time environmental monitoring and conservation intelligence system powered by AI and satellite data**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Project Status](#-project-status)
- [Known Issues](#-known-issues)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🎯 Overview

**BioSentinel** is an intelligent biodiversity monitoring platform that combines:
- 🛰️ **Satellite data** from NASA FIRMS (wildfire detection)
- 🤖 **AI analysis** using Google Gemini for species insights
- 📊 **Real-time alerts** for conservation zones
- 👥 **Community participation** from students, researchers, and citizen scientists
- 🗺️ **Interactive mapping** with Leaflet.js for species distribution

**Mission:** Protect endangered ecosystems through instant environmental intelligence and collaborative conservation action.

---

## ✨ Features

### 🔐 User Management
- **Role-based authentication** (Student, Researcher, Community)
- JWT-based secure login with email/password
- Profile completion workflow
- Role-specific dashboards

### 📡 Real-Time Monitoring
- 🔥 **Wildfire Detection** - NASA FIRMS satellite integration
- 📍 **Location Tracking** - GPS and geolocation services
- ⚡ **Alert System** - Instant notifications for critical events
- 🎯 **Risk Analysis** - Multi-factor risk scoring

### 🧠 AI Intelligence
- **Kara AI Assistant** - Biodiversity expert chatbot powered by Google Gemini
- **Session-based conversations** - Context-aware species discussions
- **Chat history** - MongoDB-backed conversation persistence
- **Species insights** - Climate preferences, conservation methods

### 🗺️ Species Discovery
- **Interactive map** - Real-time species location visualization
- **Species search** - Global species database integration
- **Distribution maps** - Conservation status and habitat range
- **Detail pages** - Wikipedia integration + conservation data

### 📊 Data & Analytics
- **Alert system** - Real-time and mock alerts
- **Risk level analysis** - Critical/High/At Risk/Positive classifications
- **Report submission** - Citizen science contributions
- **Data persistence** - MongoDB database storage

### 👨‍🎓 Educational Dashboards
- **Student Dashboard** - Learning modules and verification badges
- **Researcher Dashboard** - Data access and publication tracking
- **Community Dashboard** - Participation tracking and rewards

---

## 🛠️ Tech Stack

### Frontend
```
Framework       React 19.1
Build Tool      Vite 6.4
Styling         Tailwind CSS 4.1
Maps            Leaflet 1.9 + React Leaflet 5.0
Routing         React Router 7.13
HTTP Client     Axios 1.13
UI Icons        Material Symbols 0.40
```

### Backend
```
Runtime         Node.js (v18+)
Framework       Express.js 4.21
Database        MongoDB 9.2
Authentication  JWT + bcryptjs
AI/ML           Google Generative AI (Gemini)
Rate Limiting   express-rate-limit 8.2
CORS            Enabled
```

### External APIs
```
NASA FIRMS          Wildfire & hotspot detection
Google Gemini       AI-powered conversations
Nominatim           Location search & reverse geocoding
GBIF API            Species data & occurrence records
OpenStreetMap       Satellite imagery
```

---

## 📁 Project Structure

```
bio-sentinal-main/
│
├── frontend/                          # React + Vite application
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   │   ├── Landing.jsx           # Home page
│   │   │   ├── Login.jsx             # Authentication
│   │   │   ├── Dashboard.jsx         # User dashboard
│   │   │   ├── Alert.jsx             # Alert display
│   │   │   ├── Map.jsx               # Species map
│   │   │   ├── Report.jsx            # Report submission
│   │   │   ├── SpeciesDetail.jsx     # Species info
│   │   │   ├── Team.jsx              # About team
│   │   │   ├── ProfileSetup.jsx      # Profile setup
│   │   │   ├── StudentDashboard.jsx  # Student role
│   │   │   ├── ResearcherDashboard.jsx
│   │   │   └── CommunityDashboard.jsx
│   │   ├── components/
│   │   │   ├── Nav.jsx               # Navigation
│   │   │   ├── ChatInterface.jsx     # AI chat UI
│   │   │   └── (other components)
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx       # Auth state management
│   │   ├── css/                      # Stylesheets
│   │   ├── App.jsx                   # Main app component
│   │   ├── auth.js                   # Auth API functions
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── ai/                                # Express.js backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js        # Authentication endpoints
│   │   │   ├── alert.routes.js       # Alert endpoints
│   │   │   └── ai.routes.js          # Chat endpoints
│   │   ├── controllers/
│   │   │   └── ai.controller.js      # Gemini AI logic
│   │   ├── services/
│   │   │   └── alertService.js       # Alert & NASA FIRMS logic
│   │   └── models/
│   │       ├── User.js               # User schema
│   │       └── ChatHistory.js        # Chat history schema
│   ├── data/
│   │   └── alerts.json               # Alert data storage
│   ├── app.js                        # Main server file
│   ├── .env                          # Environment variables
│   ├── package.json
│   └── README.md
│
├── README.md                         # This file
└── todo.txt                          # Development tasks

```

---

## 📋 Prerequisites

### Required
- **Node.js** v18+ (download from [nodejs.org](https://nodejs.org))
- **npm** v9+ (comes with Node.js)
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Optional
- **Git** for version control
- **Postman** for API testing
- **VS Code** for development

### API Keys Required
1. **Google Gemini API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **NASA FIRMS API Key** - Get from [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/)

---

## ⚙️ Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/teambugbusters00/riverathonapp.git
cd bio-sentinal-main
```

### Step 2: Setup Backend

```bash
cd ai
npm install

# Create .env file
cat > .env << EOF
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/biosentinel

# JWT Secret for Authentication
JWT_SECRET=biosentinel-jwt-secret-key-2024

# NASA FIRMS API Key
NASA_FIRMS_API_KEY=your_nasa_firms_key_here

# Server Port
PORT=3000
EOF

# Test backend
npm run dev
```

### Step 3: Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

**Frontend will start at:** http://localhost:5173

---

## 🚀 Running the Application

### Option 1: Separate Terminals (Recommended)

**Terminal 1 - Backend:**
```bash
cd ai
npm run dev
# Output: ✅ Connected to MongoDB
# Output: Biosentinal AI API running on port 3000!
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Output: ➜ Local: http://localhost:5173
```

### Option 2: Batch Script (Windows)
```bash
# Run from project root
start_all.bat
```

### Testing the Setup
```powershell
# Test Backend
Invoke-WebRequest -Uri "http://localhost:3000/health"
# Expected: "Welcome to the BioSentinal AI API!"

# Test Frontend
Start-Process "http://localhost:5173"
```

---

## 📡 API Documentation

### Base URL
`http://localhost:3000/api`

### Authentication Endpoints

#### 1. Sign Up
```
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}

Response (201):
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

#### 2. Sign In
```
POST /auth/signin

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

#### 3. Get Current User
```
GET /auth/me
Authorization: Bearer jwt_token_here
```

#### 4. Update Profile
```
PUT /auth/profile
Authorization: Bearer jwt_token_here

{
  "role": "student",
  "country": "India",
  "college": "IIT Delhi"
}
```

### Alert Endpoints

#### Get All Alerts
```
GET /alerts
```

#### Create Alert
```
POST /alerts

{
  "type": "Wildfire",
  "level": "High",
  "title": "Fire Alert"
}
```

#### Process NASA FIRMS
```
POST /alerts/process
```

### Chat Endpoint

```
POST /chat

{
  "sessionId": "user_123",
  "question": "What are tiger conservation methods?",
  "species": { "name": "Bengal Tiger" }
}
```

---

## 🗄️ Database Schema

### User Collection
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (hashed),
  role: String (enum: ['student', 'researcher', 'community']),
  profileComplete: Boolean,
  country: String,
  bio: String,
  college: String,
  course: String
}
```

### ChatHistory Collection
```javascript
{
  sessionId: String (unique),
  speciesContext: Object,
  messages: Array,
  lastUpdated: Date
}
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_key_here
MONGODB_URI=mongodb://localhost:27017/biosentinel
JWT_SECRET=your_secret_here
NASA_FIRMS_API_KEY=your_key_here
PORT=3000
```

---

## 📊 Project Status

### ✅ Completed (70%)
- User authentication system
- MongoDB integration
- Role-based dashboards
- Gemini AI chat
- Alert system with mock data
- Interactive map
- Species search

### 🔄 In Progress (20%)
- Live data polling
- NASA FIRMS integration
- WebSocket for real-time updates
- Alert caching

### ⚠️ TODO (10%)
- Image uploads
- Push notifications
- Offline sync
- Admin dashboard

---

## ⚠️ Known Issues

1. **NASA FIRMS API** - May fail silently on rate limits → Needs better error handling
2. **No real-time updates** - Alerts only load on refresh → Implement polling
3. **File-based storage** - Not scalable → Migrate to MongoDB

---

## 🌐 Deployment

### Heroku
```bash
echo "web: node app.js" > ai/Procfile
heroku create biosentinel-api
heroku config:set GEMINI_API_KEY=your_key
git push heroku master
```

### Vercel (Frontend)
```bash
cd frontend
vercel
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 👥 Team

| Name | Role |
|------|------|
| **DR. Vijay** | Lead Developer |
| **Preeti Yadav** | Event Manager |
| **Aayush Laddha** | Full Stack Developer |

---

## 📝 License

MIT License - See LICENSE file

---

## 🔗 External Resources

- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/)
- [Google Gemini API](https://ai.google.dev/)
- [React Docs](https://react.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)

---

**Last Updated:** February 11, 2026  
**Version:** 1.0.0  
**Status:** Active Development

🌍 **Help protect our planet! Join BioSentinel today.**