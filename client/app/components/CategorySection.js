'use client';
import QuestionCard from './QuestionCard';

const ROADMAP_STEPS = {
  'Basics': { step: 'STEP 01', label: 'Core Basics & Fundamentals', icon: '🚀', color: '#38bdf8' },
  'OOP': { step: 'STEP 02', label: 'Object-Oriented Programming (OOP)', icon: '🧩', color: '#a855f7' },
  'Data Structures': { step: 'STEP 03', label: 'Data Structures & Storage', icon: '📦', color: '#818cf8' },
  'Algorithms': { step: 'STEP 04', label: 'Algorithms & Problem Solving', icon: '⚡', color: '#10b981' },
  'Design Patterns': { step: 'STEP 05', label: 'Design Patterns & Best Practices', icon: '🏛️', color: '#f59e0b' },
  'Framework-Specific': { step: 'STEP 06', label: 'Frameworks & Applied Tech', icon: '⚙️', color: '#38bdf8' },
  'Database': { step: 'STEP 07', label: 'Databases & Data Management', icon: '🗄️', color: '#14b8a6' },
  'System Design': { step: 'STEP 08', label: 'System Design & Architecture', icon: '🌐', color: '#a855f7' }
};

export default function CategorySection({ category, questions, onDelete, stepIndex }) {
  if (!questions || questions.length === 0) return null;

  const info = ROADMAP_STEPS[category] || {
    step: `STEP ${String(stepIndex || 9).padStart(2, '0')}`,
    label: category,
    icon: '📌',
    color: '#38bdf8'
  };

  // Sort questions in step: Easy -> Medium -> Hard
  const diffWeight = { Easy: 1, Medium: 2, Hard: 3 };
  const sortedQuestions = [...questions].sort((a, b) => {
    const wa = diffWeight[a.difficulty] || 2;
    const wb = diffWeight[b.difficulty] || 2;
    return wa - wb;
  });

  return (
    <div className="category-section" style={{ marginBottom: 44 }}>
      <div className="category-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingBottom: 14, marginBottom: 20, borderBottom: '2px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '1px',
            padding: '4px 10px',
            borderRadius: 6,
            background: `${info.color}22`,
            color: info.color,
            border: `1px solid ${info.color}55`
          }}>
            {info.step}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{info.icon}</span>
            <span>{info.label}</span>
          </h3>
        </div>

        <span className="category-badge" style={{ fontSize: 12, padding: '4px 12px', background: 'var(--bg-glass)', borderRadius: 20, color: 'var(--text-secondary)' }}>
          {sortedQuestions.length} Q&A Pattern Item{sortedQuestions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="questions-grid">
        {sortedQuestions.map(q => (
          <QuestionCard key={q.id} question={q} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
