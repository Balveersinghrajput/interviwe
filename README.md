# InterviewHub 🔮

A modern, premium interview preparation platform with AI-powered file analysis.

## Features
- 📚 **30+ pre-loaded questions** across 10 languages
- ➕ **Add your own questions** with auto-categorization
- 📁 **AI File Analyzer** — upload code/resume → get interview questions
- 🔍 **Search & Filter** by language, category, difficulty
- 🎨 **Premium dark UI** with glassmorphism effects

## Tech Stack
- **Frontend**: Next.js 14, React 18, Vanilla CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **AI**: Google Gemini API (free tier)

## Setup

### 1. PostgreSQL
```bash
# Make sure PostgreSQL is running
sudo service postgresql start

# Create database
createdb interviewhub
```

### 2. Backend
```bash
cd server
npm install

# Edit .env with your credentials
# Add your Gemini API key (get free from https://aistudio.google.com/apikey)

# Seed the database
node seed.js

# Start server
node index.js
# or: npm run dev (uses nodemon)
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
```

### 4. Open
Visit **http://localhost:3000**

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/questions | Get all questions (with filters) |
| POST | /api/questions | Add question |
| POST | /api/questions/batch | Add multiple questions |
| DELETE | /api/questions/:id | Delete question |
| POST | /api/analyze | Upload & analyze file |
| GET | /api/health | Health check |
