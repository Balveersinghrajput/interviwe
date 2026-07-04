const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Question, normalizeDifficulty } = require('../db');

// Helper to escape special regex characters and prevent ReDoS vulnerabilities
function escapeRegex(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// GET /api/questions — Get all questions with optional filters
router.get('/', async (req, res) => {
  try {
    const { language, category, difficulty, search } = req.query;
    const filter = {};

    if (language) {
      if (language === 'DSA (Java)') {
        filter.language = { $regex: 'DSA.*Java|Java.*DSA|DSA \\(Java\\)', $options: 'i' };
      } else if (language === 'DSA (Python)') {
        filter.language = { $regex: 'DSA.*Python|Python.*DSA|DSA \\(Python\\)', $options: 'i' };
      } else if (language === 'DSA (JavaScript)') {
        filter.language = { $regex: 'DSA.*JavaScript|JavaScript.*DSA|DSA \\(JavaScript\\)', $options: 'i' };
      } else if (language === 'DSA (C++)') {
        filter.language = { $regex: 'DSA.*C\\+\\+|C\\+\\+.*DSA|DSA \\(C\\+\\+\\)', $options: 'i' };
      } else {
        filter.language = language;
      }
    }
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = normalizeDifficulty(difficulty);
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { question: { $regex: safeSearch, $options: 'i' } },
        { answer: { $regex: safeSearch, $options: 'i' } },
        { code_example: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const questions = await Question.find(filter).sort({ category: 1, difficulty: 1, createdAt: -1 });
    // Map _id to id for frontend compatibility
    const result = questions.map(q => ({ ...q.toObject(), id: q._id }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/questions/meta/languages
router.get('/meta/languages', async (req, res) => {
  try {
    const languages = await Question.distinct('language');
    res.json(languages.sort());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// GET /api/questions/meta/categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Question.distinct('category');
    res.json(categories.sort());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/questions/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid question ID format' });
    }
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json({ ...question.toObject(), id: question._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// POST /api/questions — Add a new question
router.post('/', async (req, res) => {
  try {
    const { language, category, difficulty, question, answer, code_example, source_file } = req.body;
    if (!language || !category || !difficulty || !question || !answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newQ = await Question.create({
      language, category, 
      difficulty: normalizeDifficulty(difficulty), 
      question, answer,
      code_example: code_example || '',
      is_user_added: true,
      source_file: source_file || null
    });
    res.status(201).json({ ...newQ.toObject(), id: newQ._id });
  } catch (err) {
    console.error('Error adding question:', err);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// POST /api/questions/generate-ai — Generate AI questions on demand for any language/category
router.post('/generate-ai', async (req, res) => {
  try {
    const { generateQuestionsByAI } = require('../services/ai');
    const { language = 'JavaScript', category = 'All', count = 10, difficulty = 'Mixed' } = req.body;

    const safeCount = Math.min(Math.max(parseInt(count) || 10, 1), 50);
    const generated = await generateQuestionsByAI(language, category, safeCount, difficulty);

    if (!generated || generated.length === 0) {
      return res.status(500).json({ error: 'AI generated zero questions' });
    }

    const docs = generated.map(q => ({
      language: q.language || language,
      category: q.category || (category !== 'All' ? category : 'Basics'),
      difficulty: normalizeDifficulty(q.difficulty || difficulty),
      question: q.question,
      answer: q.answer,
      code_example: q.codeExample || q.code_example || '',
      is_user_added: true,
      source_file: '🤖 AI Generated'
    }));

    const inserted = await Question.insertMany(docs);
    res.status(201).json(inserted.map(q => ({ ...q.toObject(), id: q._id })));
  } catch (err) {
    console.error('Error generating AI questions:', err);
    res.status(500).json({ error: err.message || 'Failed to generate AI questions' });
  }
});

// POST /api/questions/ask-ai — User inputs question, AI auto answers, categorizes & saves to database
router.post('/ask-ai', async (req, res) => {
  try {
    const { answerAndCategorizeQuestion } = require('../services/ai');
    const { question, language } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    const aiResult = await answerAndCategorizeQuestion(question, language);

    const saved = await Question.create({
      language: aiResult.language || language || 'JavaScript',
      category: aiResult.category || 'Basics',
      difficulty: normalizeDifficulty(aiResult.difficulty || 'Medium'),
      question: aiResult.question || question,
      answer: aiResult.answer || 'No answer generated.',
      code_example: aiResult.codeExample || aiResult.code_example || '',
      is_user_added: true,
      source_file: '💬 AI Answered'
    });

    res.status(201).json({ ...saved.toObject(), id: saved._id });
  } catch (err) {
    console.error('Ask AI error:', err);
    res.status(500).json({ error: err.message || 'Failed to process question with AI' });
  }
});

// POST /api/questions/batch — Add multiple questions
router.post('/batch', async (req, res) => {
  try {
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Missing or empty questions array' });
    }
    const docs = questions.map(q => ({
      language: q.language,
      category: q.category,
      difficulty: normalizeDifficulty(q.difficulty),
      question: q.question,
      answer: q.answer,
      code_example: q.codeExample || q.code_example || '',
      is_user_added: true,
      source_file: q.source_file || null
    }));
    const inserted = await Question.insertMany(docs);
    res.status(201).json(inserted.map(q => ({ ...q.toObject(), id: q._id })));
  } catch (err) {
    console.error('Error batch adding:', err);
    res.status(500).json({ error: 'Failed to add questions' });
  }
});

// PUT /api/questions/:id
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid question ID format' });
    }
    const { language, category, difficulty, question, answer, code_example } = req.body;
    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      { language, category, difficulty: normalizeDifficulty(difficulty), question, answer, code_example: code_example || '' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Question not found' });
    res.json({ ...updated.toObject(), id: updated._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /api/questions/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid question ID format' });
    }
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted', question: { ...deleted.toObject(), id: deleted._id } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

module.exports = router;

