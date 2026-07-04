'use client';
import { useState } from 'react';
import { askAiQuestion } from '../../lib/api';

export default function AskAIModal({ onClose, onQuestionSaved, showToast, defaultLanguage = 'JavaScript' }) {
  const [questionText, setQuestionText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setLoading(true);
    try {
      const saved = await askAiQuestion({ question: questionText, language: defaultLanguage });
      showToast(`✨ Saved under ${saved.language} → ${saved.category} (${saved.difficulty})!`, 'success');
      if (onQuestionSaved) onQuestionSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to analyze question', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💬 Ask AI Anything (Auto-Categorize & Save)</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          Type any technical question (e.g., <i>"Explain indexing in PostgreSQL"</i> or <i>"How does virtual DOM work in React?"</i>).
          AI will automatically write an expert answer, generate code, detect the language/category/difficulty, and save it in your library!
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Interview Question</label>
            <textarea
              rows={4}
              required
              placeholder="e.g. What is the difference between process.nextTick() and setImmediate() in Node.js?"
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-spinner" style={{ padding: '20px 0' }}>
              <div className="spinner" />
              <div>🧠 Analyzing question, generating answer & auto-sorting into category...</div>
            </div>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: 14, fontSize: 15 }}
            >
              🚀 Generate Answer & Auto-Save
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
