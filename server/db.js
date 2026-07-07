const mongoose = require('mongoose');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewhub';

let mongodProcess = null;

function isPortOpen(port = 27017, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function startLocalMongod() {
  const dbPath = '/tmp/interviewhub_data';
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  console.log(`⚡ Auto-starting local MongoDB instance on port 27017 (dbpath: ${dbPath})...`);
  
  try {
    mongodProcess = spawn('mongod', ['--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', '27017'], {
      detached: true,
      stdio: 'ignore'
    });
    mongodProcess.unref();
  } catch (err) {
    console.error('⚠️ Could not spawn mongod automatically:', err.message);
  }

  // Poll TCP port 27017 for up to 8 seconds
  for (let attempt = 1; attempt <= 16; attempt++) {
    await new Promise(res => setTimeout(res, 500));
    const open = await isPortOpen(27017, '127.0.0.1');
    if (open) {
      return true;
    }
  }
  return false;
}

let isSeeding = false;
async function autoSeedIfEmpty() {
  if (isSeeding) return;
  try {
    isSeeding = true;
    const count = await Question.countDocuments();
    if (count === 0) {
      console.log('🌱 Database is empty. Auto-seeding initial questions...');
      const { seed } = require('./seed');
      const { seedJavaDsa } = require('./seed_java_dsa');
      await seed();
      await seedJavaDsa();
    }
  } catch (err) {
    console.error('Auto-seed check note:', err.message);
  } finally {
    isSeeding = false;
  }
}

async function connectDatabase() {
  const isLocal = MONGODB_URI.includes('127.0.0.1') || MONGODB_URI.includes('localhost');
  const isSrv = MONGODB_URI.startsWith('mongodb+srv://');

  const connectOptions = {
    serverSelectionTimeoutMS: isSrv ? 10000 : 5000,
  };

  if (isLocal && !isSrv) {
    connectOptions.directConnection = true;
  }

  try {
    await mongoose.connect(MONGODB_URI, connectOptions);
    console.log('✅ Connected to MongoDB');
    await autoSeedIfEmpty();
  } catch (err) {
    if (isLocal && (err.message.includes('ECONNREFUSED') || err.name === 'MongooseServerSelectionError')) {
      console.log('⚠️ Local MongoDB not running on 127.0.0.1:27017. Attempting to start mongod automatically...');
      const started = await startLocalMongod();
      if (started) {
        await mongoose.connect(MONGODB_URI, connectOptions);
        console.log('✅ Auto-started local MongoDB and connected successfully!');
        await autoSeedIfEmpty();
        return;
      }
    }
    console.error('❌ MongoDB connection error:', err.message);
    if (isLocal) {
      console.error('💡 Please start MongoDB manually: mongod --dbpath /tmp/interviewhub_data --bind_ip 127.0.0.1');
    } else {
      console.error('💡 Check your MONGODB_URI credentials, IP whitelist in MongoDB Atlas, and network connectivity.');
    }
    throw err;
  }
}

// Normalize difficulty strings safely
function normalizeDifficulty(val) {
  if (!val || typeof val !== 'string') return 'Medium';
  const clean = val.trim().toLowerCase();
  if (clean.includes('easy') || clean.includes('junior') || clean.includes('basic')) return 'Easy';
  if (clean.includes('hard') || clean.includes('faang') || clean.includes('staff') || clean.includes('advanced')) return 'Hard';
  return 'Medium';
}

// Question Schema
const questionSchema = new mongoose.Schema({
  language:     { type: String, required: true, index: true },
  category:     { type: String, required: true, index: true },
  difficulty:   { 
    type: String, 
    required: true, 
    enum: ['Easy', 'Medium', 'Hard'],
    set: normalizeDifficulty
  },
  question:     { type: String, required: true },
  answer:       { type: String, required: true },
  code_example: { type: String, default: '' },
  youtube_link: { type: String, default: '' },
  is_user_added:{ type: Boolean, default: true },
  source_file:  { type: String, default: null },
}, { timestamps: true });

// File Analysis Schema
const fileAnalysisSchema = new mongoose.Schema({
  file_name:    { type: String, required: true },
  file_type:    { type: String },
  file_summary: { type: String, required: true },
  technologies: [String],
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
const FileAnalysis = mongoose.model('FileAnalysis', fileAnalysisSchema);

module.exports = { connectDatabase, Question, FileAnalysis, normalizeDifficulty };

