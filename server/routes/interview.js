const express = require('express');
const router = express.Router();
const { startInterviewSession, evaluateAndNext, getInterviewHint } = require('../services/interviewAI');

// POST /api/interview/start
router.post('/start', async (req, res) => {
  let { jobRole = 'Senior Software Engineer', interviewType = 'Full Comprehensive Round', difficulty = 'Mid-Senior Level', language = 'Java / JavaScript' } = req.body || {};

  jobRole = (jobRole || 'Senior Software Engineer').trim();
  if (jobRole.length > 100) jobRole = jobRole.substring(0, 100);

  try {
    console.log(`🎙️ Starting Multi-Stage Conversational AI Interview for ${jobRole} (${interviewType}, ${difficulty})`);
    const session = await startInterviewSession({ jobRole, interviewType, difficulty, language });
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
    conversationHistory = []
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
      conversationHistory
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


