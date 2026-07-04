'use client';

export default function Header({
  searchQuery,
  onSearchChange,
  onAddClick,
  onAnalyzeClick,
  onAiGenerateClick,
  onAskAiClick,
  onLiveInterviewClick,
  onToggleSidebar
}) {
  return (
    <header className="header">
      <div className="header-left">
        <button
          className="mobile-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar Menu"
        >
          ☰
        </button>
        <div className="header-logo">
          <div className="logo-icon">⟨⟩</div>
          <h1>InterviewHub</h1>
        </div>
      </div>

      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="header-actions">
        <button
          className="btn btn-primary"
          onClick={onLiveInterviewClick}
          style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)', color: '#fff', fontWeight: 600 }}
          title="Start Live Voice & Coding AI Mock Interview"
        >
          🎙️ <span className="btn-label">Live Interview</span>
        </button>
        <button
          className="btn btn-secondary action-btn-ask"
          onClick={onAskAiClick}
          style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
          title="Ask AI any coding question"
        >
          💬 <span className="btn-label">Ask AI</span>
        </button>
        <button
          className="btn btn-secondary action-btn-gen"
          onClick={onAiGenerateClick}
          style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}
          title="Generate AI Questions"
        >
          ✨ <span className="btn-label">AI Generate</span>
        </button>
        <button className="btn btn-secondary action-btn-file" onClick={onAnalyzeClick} title="Analyze File, Image, PDF or Link">
          📁 <span className="btn-label">Analyze</span>
        </button>
        <button className="btn btn-secondary action-btn-add" onClick={onAddClick} title="Add New Question">
          ＋ <span className="btn-label">Add Question</span>
        </button>
      </div>
    </header>
  );
}
