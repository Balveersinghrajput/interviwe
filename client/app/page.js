'use client';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CategorySection from './components/CategorySection';
import AddQuestionModal from './components/AddQuestionModal';
import FileAnalyzer from './components/FileAnalyzer';
import AIGenerateModal from './components/AIGenerateModal';
import AskAIModal from './components/AskAIModal';
import LiveInterviewStudio from './components/LiveInterviewStudio';
const AILearningLab = lazy(() => import('./components/AILearningLab'));
import Toast from './components/Toast';
import { fetchQuestions, addQuestion, deleteQuestion } from '../lib/api';

export default function Home() {
  const [questions, setQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);
  const [activeDifficulty, setActiveDifficulty] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAskAiModal, setShowAskAiModal] = useState(false);
  const [showLiveInterview, setShowLiveInterview] = useState(false);
  const [showLearningLab, setShowLearningLab] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      const filters = {};
      if (activeLanguage) filters.language = activeLanguage;
      if (activeDifficulty) filters.difficulty = activeDifficulty;
      if (searchQuery) filters.search = searchQuery;
      const data = await fetchQuestions(filters);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
      showToast('Failed to load questions. Is the server running?', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeLanguage, activeDifficulty, searchQuery, showToast]);

  useEffect(() => {
    const debounce = setTimeout(loadQuestions, 300);
    return () => clearTimeout(debounce);
  }, [loadQuestions]);

  const handleAddQuestion = async (formData) => {
    await addQuestion(formData);
    showToast('Question added successfully!');
    loadQuestions();
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await deleteQuestion(id);
      showToast('Question deleted');
      loadQuestions();
    } catch (err) {
      showToast('Failed to delete question', 'error');
    }
  };

  const handleCategoryToggle = (cat) => {
    setActiveCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Filter questions by selected categories (client-side)
  const filteredQuestions = activeCategories.length > 0
    ? questions.filter(q => activeCategories.includes(q.category))
    : questions;

  // Group by category
  const grouped = {};
  filteredQuestions.forEach(q => {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  });

  // Count questions per language
  const langCounts = {};
  questions.forEach(q => {
    langCounts[q.language] = (langCounts[q.language] || 0) + 1;
  });
  langCounts['All'] = questions.length;

  const categoryOrder = ['Basics', 'OOP', 'Data Structures', 'Algorithms', 'Design Patterns', 'Framework-Specific', 'Database', 'System Design'];
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ia = categoryOrder.indexOf(a);
    const ib = categoryOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="app-layout">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={() => setShowAddModal(true)}
        onAnalyzeClick={() => setShowAnalyzer(true)}
        onAiGenerateClick={() => setShowAiModal(true)}
        onAskAiClick={() => setShowAskAiModal(true)}
        onLiveInterviewClick={() => setShowLiveInterview(true)}
        onLearnClick={() => setShowLearningLab(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      <Sidebar
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
        activeCategories={activeCategories}
        onCategoryToggle={handleCategoryToggle}
        activeDifficulty={activeDifficulty}
        onDifficultyChange={setActiveDifficulty}
        questionCounts={langCounts}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="main-content">
        <div className="content-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' }}>
                🛣️ STRUCTURED ROADMAP PATTERN
              </span>
            </div>
            <h2>{activeLanguage || 'All Technical Topics'}</h2>
            <span className="question-count">{filteredQuestions.length} roadmap questions structured step-by-step</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary btn-small"
              onClick={() => setShowLiveInterview(true)}
              style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)', color: '#fff' }}
            >
              🎙️ Start Live AI Interview
            </button>
            <button
              className="btn btn-secondary btn-small"
              style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}
              onClick={() => setShowAiModal(true)}
            >
              ✨ Generate AI Questions
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <div>Loading roadmap questions...</div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧠</div>
            <h3>No questions found for {activeLanguage || 'this filter'}</h3>
            <p style={{ marginBottom: 20 }}>Use AI to generate a step-by-step 10+ question roadmap instantly!</p>
            <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => setShowAiModal(true)}>
              ✨ Generate AI Roadmap Now
            </button>
          </div>
        ) : (
          sortedCategories.map((cat, idx) => (
            <CategorySection
              key={cat}
              category={cat}
              questions={grouped[cat]}
              onDelete={handleDeleteQuestion}
              stepIndex={categoryOrder.indexOf(cat) !== -1 ? categoryOrder.indexOf(cat) + 1 : idx + 1}
            />
          ))
        )}
      </main>

      {showAddModal && (
        <AddQuestionModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddQuestion}
        />
      )}

      {showAnalyzer && (
        <FileAnalyzer
          onClose={() => setShowAnalyzer(false)}
          onQuestionsAdded={loadQuestions}
          showToast={showToast}
        />
      )}

      {showAiModal && (
        <AIGenerateModal
          onClose={() => setShowAiModal(false)}
          onQuestionsGenerated={loadQuestions}
          showToast={showToast}
          defaultLanguage={activeLanguage || 'JavaScript'}
        />
      )}

      {showAskAiModal && (
        <AskAIModal
          onClose={() => setShowAskAiModal(false)}
          onQuestionSaved={loadQuestions}
          showToast={showToast}
          defaultLanguage={activeLanguage || 'JavaScript'}
        />
      )}

      <LiveInterviewStudio
        isOpen={showLiveInterview}
        onClose={() => setShowLiveInterview(false)}
        onSaveQuestions={loadQuestions}
      />

      {showLearningLab && (
        <Suspense fallback={null}>
          <AILearningLab
            onClose={() => setShowLearningLab(false)}
          />
        </Suspense>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
