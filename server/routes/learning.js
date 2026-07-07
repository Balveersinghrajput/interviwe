const express = require('express');
const router = express.Router();
const { explainTopicWithVisuals } = require('../services/ai');

// POST /api/learning/explain
router.post('/explain', async (req, res) => {
  const { topic } = req.body || {};
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic parameter is required' });
  }

  try {
    console.log(`🧠 AI Visual Learning Lab: Generating explanation for "${topic}"`);
    const explanation = await explainTopicWithVisuals(topic.trim());
    res.json(explanation);
  } catch (err) {
    console.error('Error generating visual learning response:', err);
    res.status(500).json({ error: err.message || 'Failed to generate visual explanation' });
  }
});

module.exports = router;
