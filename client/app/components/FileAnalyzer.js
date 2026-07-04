'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeFile as analyzeFileAPI, analyzeUrl as analyzeUrlAPI, analyzeText as analyzeTextAPI, addQuestionsBatch, fetchLanguages } from '../../lib/api';

const CATEGORIES = [
  'Basics', 'OOP', 'Data Structures', 'Algorithms',
  'Design Patterns', 'Framework-Specific', 'Database', 'System Design'
];

export default function FileAnalyzer({ onClose, onQuestionsAdded, showToast }) {
  const [activeTab, setActiveTab] = useState('text'); // 'text', 'file', 'url'
  const [pastedText, setPastedText] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [editableQuestions, setEditableQuestions] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const fileInputRef = useRef(null);

  // Folder / Section state
  const [existingLanguages, setExistingLanguages] = useState([]);
  const [saveMode, setSaveMode] = useState('auto'); // 'auto', 'existing', 'custom'
  const [selectedFolder, setSelectedFolder] = useState('');
  const [customFolderName, setCustomFolderName] = useState('');

  useEffect(() => {
    fetchLanguages()
      .then(langs => setExistingLanguages(langs.filter(l => l !== 'All')))
      .catch(() => {});
  }, []);

  const processFile = useCallback(async (file) => {
    setLoading(true);
    setResult(null);
    setSavedIds(new Set());
    try {
      const data = await analyzeFileAPI(file);
      setResult(data);
      setEditableQuestions(data.questions || []);
      showToast(`Analyzed "${file.name}" successfully!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to analyze file/image', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Global Clipboard Paste Handler (Ctrl+V for Images & Files)
  const handlePasteEvent = useCallback((e) => {
    const targetTag = e.target.tagName.toLowerCase();
    
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const fileName = file.name && file.name !== 'image.png' ? file.name : `Pasted_Image_${Date.now()}.png`;
            const renamedFile = new File([file], fileName, { type: file.type || 'image/png' });
            showToast(`Pasted image "${fileName}" from clipboard!`, 'success');
            setActiveTab('file');
            processFile(renamedFile);
            return;
          }
        }
      }
    }

    if (targetTag !== 'textarea' && targetTag !== 'input') {
      const text = e.clipboardData?.getData('text');
      if (text && text.trim()) {
        e.preventDefault();
        setPastedText(prev => prev ? prev + '\n\n' + text : text);
        setActiveTab('text');
        showToast('Pasted text into Questions input!', 'success');
      }
    }
  }, [processFile, showToast]);

  useEffect(() => {
    window.addEventListener('paste', handlePasteEvent);
    return () => window.removeEventListener('paste', handlePasteEvent);
  }, [handlePasteEvent]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!pastedText.trim()) {
      showToast('Please type or paste some text/questions to analyze', 'error');
      return;
    }

    setLoading(true);
    setResult(null);
    setSavedIds(new Set());
    try {
      const data = await analyzeTextAPI(pastedText.trim(), textTitle.trim());
      setResult(data);
      setEditableQuestions(data.questions || []);
      showToast('Extracted multi-section questions with AI successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to analyze text', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      showToast('Please enter a valid URL link', 'error');
      return;
    }

    setLoading(true);
    setResult(null);
    setSavedIds(new Set());
    try {
      const data = await analyzeUrlAPI(urlInput.trim());
      setResult(data);
      setEditableQuestions(data.questions || []);
      showToast('Web page analyzed successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to analyze URL link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTargetFolder = (defaultLang) => {
    if (saveMode === 'custom' && customFolderName.trim()) {
      return customFolderName.trim();
    }
    if (saveMode === 'existing' && selectedFolder) {
      return selectedFolder;
    }
    return defaultLang || 'DSA (Java)';
  };

  const handleQuestionCategoryChange = (index, newCat) => {
    setEditableQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], category: newCat };
      return copy;
    });
  };

  const saveAllQuestions = async () => {
    if (!editableQuestions || editableQuestions.length === 0) return;
    try {
      const finalQuestions = editableQuestions.map(q => ({
        ...q,
        language: getTargetFolder(q.language)
      }));

      await addQuestionsBatch(finalQuestions);
      setSavedIds(new Set(editableQuestions.map((_, i) => i)));
      const targetName = getTargetFolder(editableQuestions[0]?.language);
      showToast(`Saved all ${editableQuestions.length} questions to section "${targetName}"!`, 'success');
      if (onQuestionsAdded) onQuestionsAdded();
    } catch (err) {
      showToast('Failed to save questions', 'error');
    }
  };

  const saveSingleQuestion = async (question, index) => {
    try {
      const finalQuestion = {
        ...question,
        language: getTargetFolder(question.language)
      };

      await addQuestionsBatch([finalQuestion]);
      setSavedIds(prev => new Set([...prev, index]));
      const targetName = getTargetFolder(question.language);
      showToast(`Saved question to section "${targetName}"!`, 'success');
      if (onQuestionsAdded) onQuestionsAdded();
    } catch (err) {
      showToast('Failed to save question', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal analyzer-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 880, width: '95vw' }}>
        <div className="modal-header">
          <h2>⚡ Universal AI Multi-Section Content & File Analyzer</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Input Mode Tabs */}
        {!result && !loading && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 12, flexWrap: 'wrap' }}>
            <button
              className={`btn ${activeTab === 'text' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('text')}
            >
              📝 Paste / Type Text & Notes
            </button>
            <button
              className={`btn ${activeTab === 'file' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('file')}
            >
              🖼️ 📄 Paste or Upload Image / PDF / File
            </button>
            <button
              className={`btn ${activeTab === 'url' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('url')}
            >
              🔗 Analyze Article / Web Link
            </button>
          </div>
        )}

        {/* Tab 1: Paste or Type Text & Questions */}
        {activeTab === 'text' && !result && !loading && (
          <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: 13, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋</span>
              <span>Tip: You can paste massive notes or multi-section code files (e.g. Java/Python/JS notes). AI will split and format all questions by section!</span>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Optional Section Title / Course Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 'Java DSA Complete Roadmap', 'System Design Notes', 'Sigma Java Batch'"
                value={textTitle}
                onChange={e => setTextTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Paste your multi-section code, questions, PDF text, or notes below:
              </label>
              <textarea
                className="input-field"
                rows={11}
                placeholder={`Paste your code or notes here! AI will parse all topics (Variables, Loops, Functions, OOP, Recursion, LinkedList, Arrays, etc.) and save them to their respective sections!`}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.5, resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', justifyContent: 'center', fontSize: 15 }}>
              🚀 Analyze & Extract All Multi-Section Questions with AI
            </button>
          </form>
        )}

        {/* Tab 2: File & Image Upload Zone & Paste Listener */}
        {activeTab === 'file' && !result && !loading && (
          <div
            className={`drop-zone ${dragging ? 'dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-zone-icon">🖼️ 📄 📋</div>
            <div className="drop-zone-text">Drag & drop OR press <strong>Ctrl+V</strong> to paste copied Image / PDF</div>
            <div className="drop-zone-hint">or click here to browse files from your device</div>
            <div className="drop-zone-hint" style={{ marginTop: 12, lineHeight: 1.5 }}>
              Supports: <strong>Clipboard Images (Ctrl+V)</strong>, <strong>Image files (.png, .jpg, .webp)</strong>, <strong>PDFs (.pdf)</strong>, <strong>Code files (.java, .py, .js, .cpp, .sql)</strong>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.go,.rb,.php,.swift,.cs,.rs,.sql,.html,.css,.scss,.json,.xml,.yaml,.yml,.txt,.md,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.svg"
            />
          </div>
        )}

        {/* Tab 3: URL Link Input Form */}
        {activeTab === 'url' && !result && !loading && (
          <form onSubmit={handleUrlSubmit} className="url-analysis-form" style={{ padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }}>🌐 Enter Web Link or Article URL</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Paste any documentation link, tutorial page, LeetCode problem, or technical blog post to extract & generate Q&As with AI.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="input-field"
                placeholder="https://geeksforgeeks.org/java-dsa-guide or https://..."
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', fontSize: 14 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}>
                🚀 Analyze Link
              </button>
            </div>
          </form>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-spinner" style={{ padding: '40px 0' }}>
            <div className="spinner" />
            <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              🧠 AI is analyzing your content across all sections...
            </div>
            <div className="drop-zone-hint">Extracting concepts, generating code snippets & formatting outputs...</div>
            <div className="progress-bar" style={{ marginTop: 20 }}><div className="progress-bar-fill" /></div>
          </div>
        )}

        {/* Results & Saving Folder Configuration */}
        {result && (
          <div className="analysis-result">
            <div className="explanation-card" style={{ marginBottom: 20 }}>
              <h4>📋 Summary & Analysis — {result.file_name}</h4>
              <p style={{ marginTop: 8, lineHeight: 1.6 }}>{result.explanation}</p>
              {result.technologies && result.technologies.length > 0 && (
                <div className="tech-tags" style={{ marginTop: 12 }}>
                  {result.technologies.map((t, i) => (
                    <span key={i} className="tech-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Folder / Section Selector Bar */}
            <div style={{ padding: 16, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 12, border: '1px solid var(--accent-purple)', marginBottom: 20 }}>
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: 6 }}>
                📁 Target Language / Folder Destination for Questions
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="saveMode"
                    value="auto"
                    checked={saveMode === 'auto'}
                    onChange={() => setSaveMode('auto')}
                  />
                  <span>Auto-Detected Language ({editableQuestions[0]?.language || 'DSA (Java)'})</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="saveMode"
                    value="existing"
                    checked={saveMode === 'existing'}
                    onChange={() => setSaveMode('existing')}
                  />
                  <span>Select Existing Language Section</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="saveMode"
                    value="custom"
                    checked={saveMode === 'custom'}
                    onChange={() => setSaveMode('custom')}
                  />
                  <span>✨ Create NEW Section / Folder</span>
                </label>
              </div>

              {saveMode === 'existing' && (
                <div style={{ marginTop: 12 }}>
                  <select
                    className="input-field"
                    value={selectedFolder}
                    onChange={e => setSelectedFolder(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value="">-- Choose Existing Language Section --</option>
                    {existingLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              )}

              {saveMode === 'custom' && (
                <div style={{ marginTop: 12 }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter Custom Folder/Section Name (e.g. 'Sigma Java Course', 'DSA Masterclass')"
                    value={customFolderName}
                    onChange={e => setCustomFolderName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 600 }}>🧠 Extracted Questions Across All Sections ({editableQuestions.length})</h4>
              <button className="btn btn-primary" onClick={saveAllQuestions} style={{ padding: '10px 18px' }}>
                💾 Save All {editableQuestions.length} Questions to "{getTargetFolder(editableQuestions[0]?.language)}"
              </button>
            </div>

            <div className="generated-questions" style={{ maxHeight: 440, overflowY: 'auto' }}>
              {editableQuestions.map((q, i) => {
                const diffClass = q.difficulty === 'Easy' ? 'badge-easy' : q.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard';
                const currentFolder = getTargetFolder(q.language);

                return (
                  <div key={i} className="gen-question-card" style={{ padding: 16, marginBottom: 14, border: '1px solid var(--border-color)', borderRadius: 10 }}>
                    <div className="question-text" style={{ fontWeight: 600, fontSize: 15 }}>{q.question}</div>
                    
                    <div className="question-meta" style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge ${diffClass}`}>{q.difficulty}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Section:</span>
                        <select
                          className="input-field"
                          value={q.category}
                          onChange={e => handleQuestionCategoryChange(i, e.target.value)}
                          style={{ padding: '2px 8px', fontSize: 12, width: 'auto' }}
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <span className="badge badge-language">📁 {currentFolder}</span>
                    </div>

                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>Answer:</strong> {q.answer}
                    </div>

                    {q.codeExample && (
                      <div className="code-block" style={{ marginTop: 10, padding: 12, borderRadius: 8, background: '#09090b', border: '1px solid #27272a', overflowX: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: 12 }}>{q.codeExample}</pre>
                      </div>
                    )}

                    <div className="save-actions" style={{ marginTop: 12 }}>
                      {savedIds.has(i) ? (
                        <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>✅ Saved into "{currentFolder}"</span>
                      ) : (
                        <button className="btn btn-secondary btn-small" onClick={() => saveSingleQuestion(q, i)}>
                          💾 Save to "{currentFolder}"
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
              onClick={() => { setResult(null); setEditableQuestions([]); setSavedIds(new Set()); setPastedText(''); setUrlInput(''); setTextTitle(''); }}
            >
              🔄 Analyze More Multi-Section Files or Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
