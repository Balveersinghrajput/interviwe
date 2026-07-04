const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDatabase } = require('./db');
const questionsRouter = require('./routes/questions');
const analyzeRouter = require('./routes/analyze');
const interviewRouter = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 5000;

// Simple memory rate limiter middleware (60 requests per minute per IP)
const rateLimitMap = new Map();
function rateLimiter(maxRequests = 60, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, startTime: now };

    if (now - record.startTime > windowMs) {
      record.count = 1;
      record.startTime = now;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(ip, record);

    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute before trying again.' });
    }

    next();
  };
}

// Middleware
app.use(cors({
  origin: '*', // Flexible CORS configuration for development & deployment
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter(100, 60000)); // Apply rate limiter across API routes

// Routes
app.use('/api/questions', questionsRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/interview', interviewRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds 5MB limit' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  try {
    await connectDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 InterviewHub API running at http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
