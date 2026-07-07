const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { startInterviewSession, evaluateAndNext, getInterviewHint } = require('../services/interviewAI');

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not supported`));
  }
});

async function readResumeContent(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.pdf') {
    const buf = fs.readFileSync(filePath);
    const data = await pdfParse(buf);
    return data.text;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// POST /api/interview/upload-resume
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No resume file uploaded' });

  const filePath = req.file.path;
  const fileName = req.file.originalname;

  try {
    const content = await readResumeContent(filePath, fileName);
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Resume file appears to be empty' });
    }

    res.json({
      success: true,
      fileName,
      text: content.trim()
    });
  } catch (err) {
    console.error('Resume parse error:', err);
    res.status(500).json({ error: err.message || 'Failed to parse resume file' });
  } finally {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
  }
});

// POST /api/interview/start
router.post('/start', async (req, res) => {
  let { jobRole = 'Senior Software Engineer', interviewType = 'Full Comprehensive Round', difficulty = 'Mid-Senior Level', language = 'Java / JavaScript', resumeText = '' } = req.body || {};

  jobRole = (jobRole || 'Senior Software Engineer').trim();
  if (jobRole.length > 100) jobRole = jobRole.substring(0, 100);

  try {
    console.log(`🎙️ Starting Multi-Stage Conversational AI Interview for ${jobRole} (${interviewType}, ${difficulty})`);
    const session = await startInterviewSession({ jobRole, interviewType, difficulty, language, resumeText });
    res.json(session);
  } catch (err) {
    console.error('Error starting AI interview:', err);
    res.status(500).json({ error: err.message || 'Failed to start AI interview session' });
  }
});

// POST /api/interview/submit
router.post('/submit', async (req, res) => {
  const {
    jobRole,
    interviewType,
    difficulty,
    language,
    currentStage,
    currentQuestion,
    userCode = '',
    userExplanation = '',
    questionNumber = 1,
    stageNumber = 1,
    conversationHistory = [],
    resumeText = ''
  } = req.body || {};

  if (!userExplanation.trim() && !userCode.trim()) {
    return res.status(400).json({ error: 'Response content (text or code) is required for evaluation' });
  }

  const currentStageNum = Math.min(Math.max(Number(stageNumber || questionNumber || 1), 1), 10);

  try {
    console.log(`📝 Evaluating Candidate Response for Stage #${currentStageNum}`);
    const result = await evaluateAndNext({
      jobRole: jobRole || 'Software Engineer',
      interviewType,
      difficulty,
      language,
      currentStage: currentStage || currentQuestion,
      userCode,
      userExplanation,
      stageNumber: currentStageNum,
      conversationHistory,
      resumeText
    });
    res.json(result);
  } catch (err) {
    console.error('Error evaluating stage response:', err);
    res.status(500).json({ error: err.message || 'Failed to evaluate interview stage response' });
  }
});

// POST /api/interview/hint
router.post('/hint', async (req, res) => {
  const { question, stageTitle, userCode, language } = req.body || {};
  try {
    const hintRes = await getInterviewHint({ question, stageTitle, userCode, language });
    res.json(hintRes);
  } catch (err) {
    console.error('Error fetching hint:', err);
    res.status(500).json({ error: err.message || 'Failed to generate hint' });
  }
});

module.exports = router;


