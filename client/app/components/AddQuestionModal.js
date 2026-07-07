'use client';
import { useState } from 'react';
import { CATEGORIES } from './Sidebar';

const LANGUAGES = ['JavaScript','Python','Java','C++','React','Node.js','SQL','TypeScript','Go','HTML/CSS','Ruby','PHP','Swift','C#','Rust'];

export default function AddQuestionModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    language: 'JavaScript',
    category: 'Basics',
    difficulty: 'Medium',
    question: '',
    answer: '',
    code_example: '',
    youtube_link: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Add New Question</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Language</label>
              <select value={form.language} onChange={e => handleChange('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Difficulty</label>
            <select value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="form-group">
            <label>Question *</label>
            <textarea
              value={form.question}
              onChange={e => handleChange('question', e.target.value)}
              placeholder="Enter your interview question..."
              rows={3}
              required
            />
          </div>
          <div className="form-group">
            <label>Best Answer *</label>
            <textarea
              value={form.answer}
              onChange={e => handleChange('answer', e.target.value)}
              placeholder="Write the best answer..."
              rows={4}
              required
            />
          </div>
          <div className="form-group">
            <label>Code Example (optional)</label>
            <textarea
              value={form.code_example}
              onChange={e => handleChange('code_example', e.target.value)}
              placeholder="// Add code example here..."
              rows={4}
              style={{fontFamily: "'JetBrains Mono', monospace"}}
            />
          </div>
          <div className="form-group">
            <label>YouTube Video Tutorial Link (optional)</label>
            <input
              type="url"
              value={form.youtube_link}
              onChange={e => handleChange('youtube_link', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
            {loading ? 'Adding...' : '✨ Add Question'}
          </button>
        </form>
      </div>
    </div>
  );
}
