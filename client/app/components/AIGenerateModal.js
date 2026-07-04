'use client';
import { useState } from 'react';
import { CATEGORIES } from './Sidebar';
import { generateAiQuestions } from '../../lib/api';

const LANGUAGES = [
  'DSA (Java)', 'DSA (Python)', 'DSA (JavaScript)', 'DSA (C++)',
  'JavaScript', 'Python', 'Java', 'C++', 'React', 'Next.js', 'Node.js', 'SQL',
  'MongoDB', 'PostgreSQL', 'TypeScript', 'Go', 'HTML/CSS', 'System Design',
  'Project: RealityEngine', 'Project: Task-Flow', 'Project: ReadHub'
];

export default function AIGenerateModal({ onClose, onQuestionsGenerated, showToast, defaultLanguage = 'JavaScript' }) {
  const [language, setLanguage] = useState(defaultLanguage || 'JavaScript');
  const [category, setCategory] = useState('All');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await generateAiQuestions({ language, category, count, difficulty });
      showToast(`✨ Generated and saved ${result.length} questions for ${language}!`, 'success');
      if (onQuestionsGenerated) onQuestionsGenerated();
      onClose();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to generate questions. Check AI_API_KEY in server/.env', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 AI Question Generator</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          Select a language and category. Google Gemini AI will instantly write detailed interview questions with comprehensive answers and code examples.
        </p>

        <form onSubmit={handleGenerate}>
          <div className="form-row">
            <div className="form-group">
              <label>Target Language / Topic</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Category Focus</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="All">All Categories (Mix)</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Number of Questions</label>
              <select value={count} onChange={e => setCount(Number(e.target.value))}>
                <option value={5}>5 Questions (Fast)</option>
                <option value={10}>10 Questions (Recommended)</option>
                <option value={15}>15 Questions (Deep Dive)</option>
                <option value={20}>20 Questions (Ultimate Pack)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Difficulty Level</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="Mixed">Mixed (Easy / Medium / Hard)</option>
                <option value="Easy">Easy Only</option>
                <option value="Medium">Medium Only</option>
                <option value="Hard">Hard Only</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner" style={{ padding: '20px 0' }}>
              <div className="spinner" />
              <div>🧠 Generating {count} AI interview questions for {language}...</div>
              <div className="drop-zone-hint">Generating detailed answers & code examples</div>
            </div>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: 14, fontSize: 15 }}
            >
              ✨ Generate & Add To Library
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
