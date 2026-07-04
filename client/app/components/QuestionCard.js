'use client';
import { useState } from 'react';

export default function QuestionCard({ question, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const diffClass = question.difficulty === 'Easy' ? 'badge-easy' :
                    question.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard';

  return (
    <div className="question-card" onClick={() => setExpanded(!expanded)}>
      <div className="question-card-header">
        <div>
          <div className="question-text">{question.question}</div>
          <div className="question-meta">
            <span className={`badge ${diffClass}`}>{question.difficulty}</span>
            <span className="badge badge-category">{question.category}</span>
            <span className="badge badge-language">{question.language}</span>
            {question.source_file && (
              <span className="badge" style={{background:'rgba(56,189,248,0.12)',color:'#38bdf8',border:'1px solid rgba(56,189,248,0.25)'}}>
                📁 {question.source_file}
              </span>
            )}
          </div>
        </div>
        {question.is_user_added && onDelete && (
          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(question.id); }} title="Delete">
            🗑
          </button>
        )}
      </div>

      {!expanded && (
        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
          ▼ Show Answer
        </button>
      )}

      {expanded && (
        <div className="question-answer">
          <div className="answer-label">💡 Best Answer</div>
          <div className="answer-text">{question.answer}</div>

          {question.code_example && (
            <>
              <div className="code-label">📝 Code Example</div>
              <div className="code-block">
                <pre>{question.code_example}</pre>
              </div>
            </>
          )}

          <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setExpanded(false); }}>
            ▲ Hide Answer
          </button>
        </div>
      )}
    </div>
  );
}
