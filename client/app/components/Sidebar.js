import { useEffect, useState } from 'react';

const DEFAULT_LANGUAGES = [
  'All',
  'DSA (Java)',
  'DSA (Python)',
  'DSA (JavaScript)',
  'DSA (C++)',
  'Project: RealityEngine',
  'Project: Task-Flow',
  'Project: ReadHub',
  'Java',
  'JavaScript',
  'React',
  'Next.js',
  'Node.js',
  'SQL',
  'MongoDB',
  'Python',
  'C++',
  'TypeScript',
  'Go',
  'HTML/CSS'
];

const CATEGORIES = [
  'Basics', 'OOP', 'Data Structures', 'Algorithms',
  'Design Patterns', 'Framework-Specific', 'Database', 'System Design'
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function Sidebar({
  activeLanguage, onLanguageChange,
  activeCategories, onCategoryToggle,
  activeDifficulty, onDifficultyChange,
  questionCounts,
  isOpen, onClose
}) {
  const [languages, setLanguages] = useState(DEFAULT_LANGUAGES);

  useEffect(() => {
    fetch('http://localhost:5000/api/questions/meta/languages')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const countsKeys = questionCounts ? Object.keys(questionCounts).filter(k => k !== 'All') : [];
          const merged = Array.from(new Set(['All', ...data, ...countsKeys, ...DEFAULT_LANGUAGES.slice(1)]));
          setLanguages(merged);
        }
      })
      .catch(() => {});
  }, [questionCounts]);

  const handleSelectLang = (lang) => {
    onLanguageChange(lang);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div className="sidebar-mobile-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header-mobile">
          <h3>📌 Topic Filters</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Languages & Projects</div>
          <div className="language-list">
            {languages.map(name => {
              const isAll = name === 'All';
              const isActive = activeLanguage === (isAll ? '' : name);
              const isProject = name.startsWith('Project:');
              
              return (
                <button
                  key={name}
                  className={`language-pill ${isActive ? 'active' : ''}`}
                  style={isProject ? { borderColor: 'var(--accent-purple)', color: isActive ? '#fff' : 'var(--accent-purple)' } : {}}
                  onClick={() => handleSelectLang(isAll ? '' : name)}
                >
                  <span style={{ width: 8 }}>{isProject ? '⚡' : '●'}</span>
                  {name}
                  {questionCounts && questionCounts[name] !== undefined && (
                    <span className="language-count">{questionCounts[name]}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Categories</div>
          <div className="category-list">
            {CATEGORIES.map(cat => (
              <div
                key={cat}
                className={`category-item ${activeCategories.includes(cat) ? 'active' : ''}`}
                onClick={() => onCategoryToggle(cat)}
              >
                <div className="category-checkbox">
                  {activeCategories.includes(cat) && '✓'}
                </div>
                {cat}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Difficulty</div>
          <div className="difficulty-pills">
            {DIFFICULTIES.map(diff => (
              <button
                key={diff}
                className={`diff-pill ${activeDifficulty === diff ? `active-${diff.toLowerCase()}` : ''}`}
                onClick={() => onDifficultyChange(activeDifficulty === diff ? '' : diff)}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

export { DEFAULT_LANGUAGES as LANGUAGES, CATEGORIES, DIFFICULTIES };
