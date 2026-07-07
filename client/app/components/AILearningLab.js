'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const PRESETS = [
  { name: 'Bubble Sort (Books)', query: 'Explain Bubble Sort algorithm step-by-step with visual details using sorting books on a shelf analogy' },
  { name: 'Binary Search (Roster)', query: 'Explain Binary Search step-by-step using finding a student in an alphabetical roster analogy' },
  { name: 'Stack (Dinner Plates)', query: 'Explain Stack Push and Pop LIFO concept step-by-step using a stack of dinner plates analogy' },
  { name: 'Queue (Ticket Line)', query: 'Explain Queue Enqueue and Dequeue FIFO concept step-by-step using a movie ticket checkout line analogy' },
  { name: 'Linked List (Train Cars)', query: 'Explain how to insert a carriage at the head of a train using a Linked List carriage chain analogy' },
  { name: 'JavaScript Closures', query: 'Explain how lexical closures work in JavaScript using a backpack containing variables analogy' },
  { name: 'PostgreSQL Indexing', query: 'Explain how a B-Tree index speeds up database queries using a book index analogy' },
];

export default function AILearningLab({ onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  
  // Custom input panel state
  const [customType, setCustomType] = useState('bubble_sort');
  const [customInput, setCustomInput] = useState('5, 2, 9, 1, 6');
  const [customTarget, setCustomTarget] = useState('9');

  // Visualizer playback state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('visualizer'); // 'visualizer' | 'explanation' | 'code'

  const currentUtteranceRef = useRef(null);
  const isPlayingRef = useRef(false);
  const advanceStepRef = useRef(null);
  const treeContainerRef = useRef(null);

  // Tree coordinates for drawing SVG lines dynamically
  const [treeLines, setTreeLines] = useState([]);

  // Sync isPlaying state to ref
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Stop voice synthesis
  const stopVoice = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
    setIsPlaying(false);
  }, []);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [stopVoice]);

  // Inject keyframe CSS animations and styles on mount (avoids SSR hydration mismatch)
  useEffect(() => {
    const styleId = 'ai-learning-lab-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseGlowActive {
          0% { box-shadow: 0 0 8px rgba(34, 197, 94, 0.4), inset 0 0 4px rgba(34, 197, 94, 0.2); border-color: #22c55e; }
          50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), inset 0 0 10px rgba(34, 197, 94, 0.4); border-color: #4ade80; }
          100% { box-shadow: 0 0 8px rgba(34, 197, 94, 0.4), inset 0 0 4px rgba(34, 197, 94, 0.2); border-color: #22c55e; }
        }
        @keyframes pulseGlowCompare {
          0% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); border-color: #f59e0b; }
          50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8); border-color: #fbbf24; }
          100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); border-color: #f59e0b; }
        }
        @keyframes pulseGlowSwap {
          0% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); border-color: #ef4444; }
          50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); border-color: #f87171; }
          100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); border-color: #ef4444; }
        }
        @keyframes pushIn {
          0% { transform: translateY(-40px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes enqueueIn {
          0% { transform: translateX(50px) scale(0.8); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes conveyorBeltScroll {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        .learning-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .learning-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.01);
        }
        .learning-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .learning-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        .preset-btn {
          padding: 10px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #a1a1aa;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .preset-btn:hover {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: #fff;
          transform: translateX(4px);
        }
        .teach-btn {
          padding: 12px;
          border-radius: 8px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          border: none;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          text-align: center;
        }
        .teach-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
        }
        .teach-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .learning-modal {
          max-width: 1040px;
          width: 92%;
          height: 88vh;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
          background: #0e0e12;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .learning-split-container {
          display: flex;
          flex-direction: row;
          flex-grow: 1;
          overflow: hidden;
          width: 100%;
        }
        .learning-left-sidebar {
          width: 290px;
          border-right: 1px solid rgba(255,255,255,0.08);
          padding: 18px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: #09090b;
          flex-shrink: 0;
        }
        .learning-right-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          background: #0e0e12;
          overflow: hidden;
        }
        .visualizer-split-container {
          display: flex;
          flex-direction: row;
          gap: 14px;
          flex-grow: 1;
          min-height: 300px;
          height: 100%;
        }
        .visualizer-canvas-container {
          flex-grow: 1;
          background: #070709;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .step-logs-panel {
          width: 250px;
          background: #09090b;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .visualizer-controls-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.02);
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .learning-modal {
            height: 90vh !important;
            overflow-y: auto !important;
          }
          .learning-split-container {
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          .learning-left-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.08) !important;
            flex-shrink: 0 !important;
            overflow-y: visible !important;
          }
          .learning-right-content {
            overflow: visible !important;
            flex-grow: 1 !important;
          }
          .visualizer-split-container {
            flex-direction: column !important;
            height: auto !important;
            min-height: auto !important;
          }
          .step-logs-panel {
            width: 100% !important;
            height: 220px !important;
            flex-shrink: 0 !important;
          }
          .visualizer-controls-footer {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .visualizer-controls-footer > div {
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, []);

  // Recalculate tree connection coordinates when visual step changes
  useEffect(() => {
    if (activeTab === 'visualizer' && data && data.topicType === 'binary_tree' && treeContainerRef.current) {
      // Small timeout to allow DOM to finish rendering
      const timeout = setTimeout(() => {
        const container = treeContainerRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const coords = {};
        
        // Find all node circles
        const nodeElements = container.querySelectorAll('[data-node-id]');
        nodeElements.forEach(el => {
          const id = el.getAttribute('data-node-id');
          const rect = el.getBoundingClientRect();
          coords[id] = {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2
          };
        });

        // Parse tree and build list of lines
        const lines = [];
        const currentStep = data.visualSteps[currentStepIndex];
        if (currentStep && currentStep.state && currentStep.state.nodes) {
          const flatNodes = Array.isArray(currentStep.state.nodes[0]) 
            ? currentStep.state.nodes.flat() 
            : currentStep.state.nodes;

          flatNodes.forEach(node => {
            const parentCoord = coords[node.id];
            if (!parentCoord) return;

            if (node.leftId && coords[node.leftId]) {
              lines.push({ from: parentCoord, to: coords[node.leftId], key: `${node.id}-${node.leftId}` });
            }
            if (node.rightId && coords[node.rightId]) {
              lines.push({ from: parentCoord, to: coords[node.rightId], key: `${node.id}-${node.rightId}` });
            }
          });
        }
        setTreeLines(lines);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [data, currentStepIndex, activeTab]);

  // Handle explain query submit
  const handleExplain = async (topicQuery) => {
    stopVoice();
    setLoading(true);
    setError('');
    setData(null);
    setCurrentStepIndex(0);

    try {
      const response = await fetch(`${API_BASE}/learning/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicQuery }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate visual learning explanation');
      }

      const resData = await response.json();
      setData(resData);
      setQuery(resData.title || topicQuery);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching explanation.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger custom explanation based on builder state
  const handleCustomExplainSubmit = () => {
    let finalQuery = '';
    if (customType === 'bubble_sort') {
      finalQuery = `Explain Bubble Sort algorithm step-by-step with visual details for input array [${customInput}]`;
    } else if (customType === 'binary_search') {
      finalQuery = `Explain Binary Search step-by-step for target element ${customTarget} on sorted array [${customInput}]`;
    } else if (customType === 'stack') {
      finalQuery = `Explain Stack Push and Pop LIFO concept step-by-step with sequence of actions: ${customInput}`;
    } else if (customType === 'queue') {
      finalQuery = `Explain Queue Enqueue and Dequeue FIFO concept step-by-step with sequence of actions: ${customInput}`;
    } else if (customType === 'linked_list') {
      finalQuery = `Explain Linked List step-by-step with operations: ${customInput}`;
    } else if (customType === 'binary_tree') {
      finalQuery = `Explain Binary Search Tree insertion step-by-step with visual tree nodes for values: ${customInput}`;
    } else if (customType === 'recursion') {
      finalQuery = `Explain recursion step-by-step with call stack steps for input: ${customInput}`;
    } else {
      finalQuery = `Explain ${customType} step-by-step with visual details for: ${customInput}`;
    }
    handleExplain(finalQuery);
  };

  // advanceStep must be defined before speakStep to avoid circular ref
  const advanceStep = useCallback(() => {
    if (!data || !data.visualSteps) return;
    setCurrentStepIndex((prev) => {
      if (prev < data.visualSteps.length - 1) {
        return prev + 1;
      } else {
        setIsPlaying(false);
        return prev;
      }
    });
  }, [data]);

  // Keep ref in sync so speakStep callbacks always call the latest advanceStep
  useEffect(() => {
    advanceStepRef.current = advanceStep;
  }, [advanceStep]);

  // Play a specific step spoken text
  const speakStep = useCallback((index) => {
    if (!data || !data.visualSteps || !data.visualSteps[index]) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    if (isMuted) {
      const spokenText = data.visualSteps[index].spokenText || data.visualSteps[index].description || '';
      const delay = Math.max(3000, spokenText.length * 60);
      setTimeout(() => {
        if (isPlayingRef.current && advanceStepRef.current) {
          advanceStepRef.current();
        }
      }, delay / voiceSpeed);
      return;
    }

    const textToSpeak = data.visualSteps[index].spokenText || data.visualSteps[index].description || 'Next step.';
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en-'));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.rate = voiceSpeed;

    utterance.onend = () => {
      if (isPlayingRef.current && advanceStepRef.current) {
        advanceStepRef.current();
      }
    };

    utterance.onerror = () => {
      if (isPlayingRef.current && advanceStepRef.current) {
        advanceStepRef.current();
      }
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [data, isMuted, voiceSpeed]);

  // Control playback
  useEffect(() => {
    if (isPlaying && data) {
      speakStep(currentStepIndex);
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, [isPlaying, currentStepIndex, speakStep, data]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
      }
    }
  };

  const handleStepForward = () => {
    stopVoice();
    if (data && data.visualSteps && currentStepIndex < data.visualSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleStepBackward = () => {
    stopVoice();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleRestart = () => {
    stopVoice();
    setCurrentStepIndex(0);
  };

  // Helper to safely group flat tree list into levels for backward compatibility
  const buildTreeLevels = (nodes) => {
    if (!Array.isArray(nodes)) return [];
    if (nodes.length > 0 && Array.isArray(nodes[0])) {
      return nodes; // already grouped
    }
    // Group flat nodes into layers using BFS
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, n));
    
    // Find Root (node without any parent pointing to it)
    const childIds = new Set();
    nodes.forEach(n => {
      if (n.leftId) childIds.add(n.leftId);
      if (n.rightId) childIds.add(n.rightId);
    });
    const root = nodes.find(n => !childIds.has(n.id)) || nodes[0];
    if (!root) return [];

    const levels = [];
    let currentLevel = [root];
    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      const nextLevel = [];
      currentLevel.forEach(n => {
        if (n.leftId && nodeMap.has(n.leftId)) nextLevel.push(nodeMap.get(n.leftId));
        if (n.rightId && nodeMap.has(n.rightId)) nextLevel.push(nodeMap.get(n.rightId));
      });
      currentLevel = nextLevel;
    }
    return levels;
  };

  // Visualizers Renderers
  const renderVisualizer = () => {
    if (!data) return null;

    const step = data.visualSteps[currentStepIndex];
    if (!step || !step.state) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#a1a1aa' }}>
          No visual state available for this step.
        </div>
      );
    }

    const { state } = step;
    const type = data.topicType;

    switch (type) {
      case 'bubble_sort': {
        const arr = state.array || [];
        const labels = state.labels || [];
        const highlight = state.highlight || [];
        const sorted = state.sorted || [];
        const maxVal = Math.max(...arr, 1);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: 20 }}>
            {/* Visualizer canvas */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, flexGrow: 1, minHeight: 220 }}>
              {arr.map((val, idx) => {
                const isHighlight = highlight.includes(idx);
                const isSorted = sorted.includes(idx);
                const itemLabel = labels[idx] || `Item ${idx}`;

                let bg = 'linear-gradient(to top, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.4))';
                let border = '1px solid rgba(99, 102, 241, 0.4)';
                let anim = 'none';

                if (isHighlight) {
                  bg = 'linear-gradient(to top, rgba(245, 158, 11, 0.4), rgba(245, 158, 11, 0.8))';
                  border = '1px solid #f59e0b';
                  anim = 'pulseGlowCompare 1.5s infinite';
                } else if (isSorted) {
                  bg = 'linear-gradient(to top, rgba(34, 197, 94, 0.4), rgba(34, 197, 94, 0.8))';
                  border = '1px solid #22c55e';
                }

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
                    {isHighlight && (
                      <span style={{ fontSize: 14, color: '#f59e0b', marginBottom: 4, animation: 'slideDown 0.3s ease-out' }}>
                        🔍
                      </span>
                    )}
                    <span style={{ fontSize: 13, color: '#f4f4f5', marginBottom: 4, fontWeight: 700 }}>{val}</span>
                    <div style={{
                      width: '100%',
                      height: `${(val / maxVal) * 150}px`,
                      background: bg,
                      border: border,
                      borderRadius: '8px 8px 0 0',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isHighlight ? '0 0 16px rgba(245, 158, 11, 0.4)' : 'none',
                      animation: anim
                    }} />
                    <span style={{ fontSize: 11, color: '#a1a1aa', marginTop: 6, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{itemLabel}</span>
                    <span style={{ fontSize: 9, color: '#71717a', marginTop: 1 }}>idx {idx}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'binary_search': {
        const arr = state.array || [];
        const labels = state.labels || [];
        const low = state.low !== undefined ? state.low : -1;
        const high = state.high !== undefined ? state.high : -1;
        const mid = state.mid !== undefined ? state.mid : -1;
        const target = state.target || 0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: 20 }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', gap: 24 }}>
              <span style={{ fontSize: 13, color: '#a1a1aa' }}>Target Item: <strong style={{ color: '#06b6d4', fontSize: 15 }}>{target}</strong></span>
              <span style={{ fontSize: 13, color: '#a1a1aa' }}>Active Window: <strong style={{ color: '#e2e8f0' }}>[{low} to {high}]</strong></span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, alignItems: 'center', flexGrow: 1 }}>
              {arr.map((val, idx) => {
                const isLow = idx === low;
                const isHigh = idx === high;
                const isMid = idx === mid;
                const isActiveRange = idx >= low && idx <= high;
                const itemLabel = labels[idx] || `Item ${idx}`;

                let border = '1px solid rgba(255, 255, 255, 0.08)';
                let bg = 'rgba(255, 255, 255, 0.02)';
                let opacity = 0.2;
                let filter = 'blur(0.5px) grayscale(60%)';
                let transform = 'scale(0.95)';

                if (isActiveRange) {
                  opacity = 1;
                  filter = 'none';
                  transform = 'scale(1)';
                  bg = 'rgba(255, 255, 255, 0.05)';
                  border = '1px solid rgba(255, 255, 255, 0.15)';
                }
                if (isMid) {
                  bg = 'rgba(16, 185, 129, 0.15)';
                  border = '2px solid #10b981';
                  transform = 'scale(1.08)';
                }

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity, filter, transform, transition: 'all 0.3s' }}>
                    <div style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      background: bg,
                      border: border,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: isMid ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none'
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: isMid ? '#10b981' : '#fff' }}>{val}</span>
                      <span style={{ fontSize: 9, color: '#71717a', maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemLabel}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 2, height: 22, marginTop: 6 }}>
                      {isLow && <span style={{ fontSize: 9, background: '#ef4444', color: '#fff', padding: '2px 4px', borderRadius: 4, fontWeight: 700 }}>LOW</span>}
                      {isMid && <span style={{ fontSize: 9, background: '#10b981', color: '#fff', padding: '2px 4px', borderRadius: 4, fontWeight: 700 }}>MID</span>}
                      {isHigh && <span style={{ fontSize: 9, background: '#f59e0b', color: '#fff', padding: '2px 4px', borderRadius: 4, fontWeight: 700 }}>HIGH</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'stack': {
        const elements = state.elements || [];
        const action = state.action || 'idle';
        const activeVal = state.activeVal || '';

        return (
          <div style={{ display: 'flex', height: '100%', gap: 32, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
            {/* Visual Stack container - designed like a glass cylinder tube */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column-reverse', 
              width: 180, 
              height: 260, 
              borderLeft: '4px solid rgba(99, 102, 241, 0.5)', 
              borderRight: '4px solid rgba(99, 102, 241, 0.5)', 
              borderBottom: '4px solid rgba(99, 102, 241, 0.5)', 
              borderRadius: '0 0 16px 16px',
              padding: 12, 
              gap: 8, 
              background: 'linear-gradient(to top, rgba(99,102,241,0.03), rgba(99,102,241,0.01))',
              position: 'relative',
              boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)'
            }}>
              {elements.map((val, idx) => {
                const isTop = idx === elements.length - 1;
                return (
                  <div key={idx} style={{
                    padding: '12px 8px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)',
                    border: isTop ? '1.5px solid #a855f7' : '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 8,
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: isTop ? '0 0 12px rgba(168, 85, 247, 0.4)' : '0 4px 6px rgba(0,0,0,0.15)',
                    animation: isTop && action === 'push' ? 'pushIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>[{idx}]</span>
                    <span>{val}</span>
                    <span style={{ fontSize: 9, background: isTop ? '#a855f7' : 'rgba(255,255,255,0.1)', color: '#fff', padding: '1px 4px', borderRadius: 3 }}>
                      {isTop ? 'TOP' : 'Pl.'}
                    </span>
                  </div>
                );
              })}
              {elements.length === 0 && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#71717a', fontSize: 12, textAlign: 'center', width: '80%' }}>
                  [ Empty Stack (LIFO) ]
                </div>
              )}
            </div>

            {/* Action Pane */}
            <div style={{ display: 'flex', flexDirection: 'column', width: 220, gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
                <span style={{ fontSize: 11, color: '#a1a1aa', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Action</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    background: action === 'push' ? 'rgba(34,197,94,0.15)' : action === 'pop' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)',
                    color: action === 'push' ? '#22c55e' : action === 'pop' ? '#ef4444' : '#a1a1aa'
                  }}>
                    {action.toUpperCase()}
                  </span>
                  <strong style={{ fontSize: 15, color: '#fff' }}>{activeVal}</strong>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.4 }}>
                ℹ️ <strong>LIFO Concept:</strong> Elements are pushed onto the top and popped off the top. The last item added is the first one removed.
              </div>
            </div>
          </div>
        );
      }

      case 'queue': {
        const elements = state.elements || [];
        const action = state.action || 'idle';
        const activeVal = state.activeVal || '';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: 20, gap: 20 }}>
            {/* Visual conveyor belt */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8, 
              borderTop: '2px dashed rgba(255,255,255,0.12)', 
              borderBottom: '2px dashed rgba(255,255,255,0.12)', 
              padding: '24px 0', 
              minHeight: 110, 
              background: 'linear-gradient(to right, rgba(6,182,212,0.02) 0%, rgba(255,255,255,0.01) 100%)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', left: 16, top: -10, color: '#ef4444', fontSize: 10, fontWeight: 700, background: '#121216', padding: '0 6px' }}>
                FRONT (DEQUEUE ➔ OUT)
              </div>
              
              {elements.length === 0 ? (
                <span style={{ color: '#71717a', fontSize: 13 }}>[ Queue Empty (FIFO) ]</span>
              ) : (
                elements.map((val, idx) => {
                  const isFront = idx === 0;
                  const isRear = idx === elements.length - 1;
                  return (
                    <div 
                      key={idx} 
                      style={{
                        padding: '12px 18px',
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
                        border: isFront ? '1.5px solid #ef4444' : isRear ? '1.5px solid #10b981' : '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                        animation: isRear && action === 'enqueue' ? 'enqueueIn 0.4s ease-out' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <span>{val}</span>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                        {isFront ? 'Front' : isRear ? 'Rear' : `idx ${idx}`}
                      </span>
                    </div>
                  );
                })
              )}

              <div style={{ position: 'absolute', right: 16, bottom: -10, color: '#10b981', fontSize: 10, fontWeight: 700, background: '#121216', padding: '0 6px' }}>
                REAR (IN ➔ ENQUEUE)
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 16px', fontSize: 12 }}>
                Last Event: <strong style={{ color: action === 'enqueue' ? '#10b981' : action === 'dequeue' ? '#ef4444' : '#fff' }}>{action.toUpperCase()} {activeVal ? `(${activeVal})` : ''}</strong>
              </div>
            </div>
          </div>
        );
      }

      case 'linked_list': {
        const nodes = state.nodes || [];
        const activeNodeId = state.activeNodeId;
        const action = state.action || 'idle';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 120 }}>
              {nodes.map((node, idx) => {
                const isActive = node.id === activeNodeId;
                const nodeLabel = node.label || `Node ${idx}`;
                return (
                  <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Node block */}
                    <div style={{
                      borderRadius: 10,
                      background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.3)' : 'none',
                      transition: 'all 0.3s',
                      display: 'flex',
                      overflow: 'hidden'
                    }}>
                      <div style={{ padding: '10px 14px', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{node.val}</span>
                        <span style={{ fontSize: 8, color: '#71717a' }}>{nodeLabel}</span>
                      </div>
                      <div style={{ padding: '10px 8px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', fontSize: 10, color: '#38bdf8', fontFamily: 'monospace' }}>
                        NEXT
                      </div>
                    </div>
                    {/* Connection Arrow */}
                    {idx < nodes.length - 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36 }}>
                        <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
                          <path d="M0 10H26M26 10L18 3M26 10L18 17" stroke={isActive ? '#38bdf8' : 'rgba(255,255,255,0.25)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
              {nodes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36 }}>
                    <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
                      <path d="M0 10H26M26 10L18 3M26 10L18 17" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 10, color: '#71717a', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', background: 'rgba(255,255,255,0.01)' }}>
                    NULL
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#a1a1aa' }}>Operation: <strong style={{ color: '#38bdf8' }}>{action.toUpperCase()}</strong></span>
            </div>
          </div>
        );
      }

      case 'binary_tree': {
        const highlightedNodeId = state.highlightedNodeId;
        const visited = state.visited || [];
        const levels = buildTreeLevels(state.nodes);

        return (
          <div ref={treeContainerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: 20, position: 'relative', minHeight: 250 }}>
            {/* SVG lines overlay */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
              {treeLines.map(line => (
                <line
                  key={line.key}
                  x1={line.from.x}
                  y1={line.from.y}
                  x2={line.to.x}
                  y2={line.to.y}
                  stroke="rgba(99, 102, 241, 0.4)"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
              ))}
            </svg>

            {/* Tree nodes rendering level-by-level */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, zIndex: 1 }}>
              {levels.map((lvlNodes, lvlIdx) => (
                <div key={lvlIdx} style={{ display: 'flex', gap: Math.max(32, 120 / (lvlIdx + 1)), justifyContent: 'center', width: '100%' }}>
                  {Array.isArray(lvlNodes) && lvlNodes.map(node => {
                    const isHighlighted = node.id === highlightedNodeId;
                    const isVisited = visited.includes(node.id);
                    
                    let border = '1.5px solid rgba(255,255,255,0.12)';
                    let bg = 'rgba(255,255,255,0.03)';
                    let anim = 'none';
                    let scale = '1';

                    if (isHighlighted) {
                      bg = 'rgba(244, 63, 94, 0.15)';
                      border = '2px solid #f43f5e';
                      anim = 'pulseGlowSwap 1.5s infinite';
                      scale = '1.1';
                    } else if (isVisited) {
                      bg = 'rgba(99, 102, 241, 0.15)';
                      border = '1.5px solid #6366f1';
                    }

                    return (
                      <div 
                        key={node.id} 
                        data-node-id={node.id}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          background: bg,
                          border: border,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          animation: anim,
                          transform: `scale(${scale})`,
                          zIndex: 2,
                          boxShadow: isHighlighted ? '0 0 16px rgba(244, 63, 94, 0.4)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{node.val}</span>
                        {node.label && (
                          <span style={{ fontSize: 8, color: '#a1a1aa', maxWidth: 45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {node.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'recursion': {
        const stack = state.callStack || [];
        const activeNodeId = state.activeNodeId;
        const returnValue = state.returnValue;

        return (
          <div style={{ display: 'flex', height: '100%', gap: 24, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
            {/* Stacked recursive call frames (rendered in reverse order to show top frame first) */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column-reverse', 
              gap: 12, 
              flexGrow: 1, 
              maxWidth: 320, 
              borderLeft: '2px solid rgba(168, 85, 247, 0.2)', 
              paddingLeft: 16 
            }}>
              {stack.map((frame, idx) => {
                const isActive = idx === stack.length - 1;
                // apply depth effects
                const depth = stack.length - 1 - idx;
                const scale = Math.max(0.85, 1 - depth * 0.05);
                const opacity = Math.max(0.4, 1 - depth * 0.15);
                
                return (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    background: isActive ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: isActive ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    color: isActive ? '#e9d5ff' : '#a1a1aa',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    transition: 'all 0.3s',
                    opacity,
                    transform: `scale(${scale})`,
                    boxShadow: isActive ? '0 0 16px rgba(168, 85, 247, 0.3)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>➔ {frame}</span>
                    {isActive && (
                      <span style={{ fontSize: 9, background: '#a855f7', color: '#fff', padding: '2px 4px', borderRadius: 3, fontWeight: 700 }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', width: 180, gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
                <span style={{ fontSize: 10, color: '#71717a', display: 'block' }}>RECURSION DEPTH</span>
                <strong style={{ fontSize: 24, color: '#a855f7' }}>{stack.length}</strong>
              </div>
              {returnValue && (
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  border: '1px solid rgba(34, 197, 94, 0.2)', 
                  borderRadius: 10, 
                  padding: 12,
                  animation: 'slideDown 0.3s ease-out' 
                }}>
                  <span style={{ fontSize: 10, color: '#4ade80', display: 'block', fontWeight: 700 }}>RETURN VALUE</span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#fff' }}>{returnValue}</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'general_flow':
      default: {
        const nodes = state.nodes || [];
        const activeNodeId = state.activeNodeId;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420, margin: '0 auto', width: '100%', position: 'relative' }}>
              {nodes.map((node, idx) => {
                const isActive = node.id === activeNodeId || node.status === 'active';
                const isDone = node.status === 'done';

                let border = '1px solid rgba(255, 255, 255, 0.06)';
                let bg = 'rgba(255, 255, 255, 0.02)';
                let glow = 'none';
                let anim = 'none';

                if (isActive) {
                  bg = 'rgba(6, 182, 212, 0.1)';
                  border = '1.5px solid #06b6d4';
                  glow = '0 0 16px rgba(6, 182, 212, 0.3)';
                  anim = 'pulseGlowActive 1.8s infinite';
                } else if (isDone) {
                  bg = 'rgba(34, 197, 94, 0.05)';
                  border = '1px solid rgba(34, 197, 94, 0.2)';
                }

                return (
                  <div key={node.id} style={{
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: bg,
                    border: border,
                    boxShadow: glow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.3s',
                    position: 'relative',
                    animation: anim
                  }}>
                    {/* Stepper connecting line */}
                    {idx < nodes.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: 23,
                        top: 42,
                        width: 2,
                        height: 20,
                        background: isDone ? '#22c55e' : 'rgba(255,255,255,0.08)',
                        zIndex: 0
                      }} />
                    )}

                    <div style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: isActive ? '#06b6d4' : isDone ? '#22c55e' : 'rgba(255,255,255,0.15)',
                      boxShadow: isActive ? '0 0 8px #06b6d4' : 'none',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isDone && <span style={{ color: '#fff', fontSize: 8 }}>✓</span>}
                    </div>
                    
                    <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : isDone ? '#a1a1aa' : '#71717a' }}>
                      {node.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={() => { stopVoice(); onClose(); }} style={{ zIndex: 1000, background: 'rgba(8, 8, 12, 0.75)', backdropFilter: 'blur(12px)' }}>
      <div className="modal learning-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#09090b' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎓 AI Concept Learning & Algorithmic Visualizer</span>
            </h2>
            <p style={{ fontSize: 12, color: '#a1a1aa', margin: '2px 0 0 0' }}>Teach algorithms with interactive visual steps, audio speech synthesis, and concrete real-world examples.</p>
          </div>
          <button onClick={() => { stopVoice(); onClose(); }} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#71717a'}>✕</button>
        </div>

        {/* Core Layout split */}
        <div className="learning-split-container">
          
          {/* Left panel: Presets & prompt input & Custom simulation */}
          <div className="learning-scrollbar learning-left-sidebar">
            
            {/* Quick Presets */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presets</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExplain(preset.query)}
                    disabled={loading}
                    className="preset-btn"
                  >
                    💡 {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />

            {/* Custom Input Simulation Panel */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚙️ Custom Simulation</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {/* Selector */}
                <div>
                  <label style={{ fontSize: 10, color: '#71717a', display: 'block', marginBottom: 3 }}>ALGORITHM TYPE</label>
                  <select 
                    value={customType} 
                    onChange={e => {
                      setCustomType(e.target.value);
                      if (e.target.value === 'bubble_sort') setCustomInput('5, 2, 9, 1, 6');
                      else if (e.target.value === 'binary_search') setCustomInput('1, 3, 5, 7, 9, 11');
                      else if (e.target.value === 'stack') setCustomInput('push(Plate A), push(Plate B), pop(), push(Plate C)');
                      else if (e.target.value === 'queue') setCustomInput('enqueue(Alice), enqueue(Bob), dequeue(), enqueue(Charlie)');
                      else if (e.target.value === 'linked_list') setCustomInput('insert(Car A), insert(Car B), reverse()');
                      else if (e.target.value === 'binary_tree') setCustomInput('10, 5, 15, 2, 7');
                      else if (e.target.value === 'recursion') setCustomInput('factorial(4)');
                    }}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: '#18181c', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 11 }}
                  >
                    <option value="bubble_sort">Bubble Sort</option>
                    <option value="binary_search">Binary Search</option>
                    <option value="stack">Stack (LIFO)</option>
                    <option value="queue">Queue (FIFO)</option>
                    <option value="linked_list">Linked List</option>
                    <option value="binary_tree">Binary Tree</option>
                    <option value="recursion">Recursion Stack</option>
                  </select>
                </div>

                {/* Input text */}
                <div>
                  <label style={{ fontSize: 10, color: '#71717a', display: 'block', marginBottom: 3 }}>
                    {customType === 'bubble_sort' || customType === 'binary_tree' ? 'ARRAY NUMBERS' : 
                     customType === 'binary_search' ? 'SORTED ARRAY' : 
                     customType === 'stack' || customType === 'queue' || customType === 'linked_list' ? 'ACTIONS LIST' : 'INPUT PARAMETER'}
                  </label>
                  <input
                    type="text"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    placeholder="e.g. 5, 2, 9, 1, 6"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: '#18181c', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 11, fontFamily: 'monospace' }}
                  />
                </div>

                {/* Binary search Target */}
                {customType === 'binary_search' && (
                  <div>
                    <label style={{ fontSize: 10, color: '#71717a', display: 'block', marginBottom: 3 }}>SEARCH TARGET</label>
                    <input
                      type="text"
                      value={customTarget}
                      onChange={e => setCustomTarget(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: '#18181c', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 11 }}
                    />
                  </div>
                )}

                <button
                  onClick={handleCustomExplainSubmit}
                  disabled={loading || !customInput.trim()}
                  className="teach-btn"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.25)' }}
                >
                  {loading ? '🧠 Simulating...' : '⚡ Generate Custom'}
                </button>
              </div>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />

            {/* General input prompt textarea */}
            <div style={{ marginTop: 'auto' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Custom Concept Ask</span>
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Explain lexical scoping closures in JavaScript..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  background: '#18181c',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 11,
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.4
                }}
              />
              <button
                onClick={() => handleExplain(query)}
                disabled={loading || !query.trim()}
                className="teach-btn"
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading ? '🧠 Explaining...' : '🎓 Teach Me!'}
              </button>
            </div>
          </div>

          {/* Right panel: Tab views & visual screen */}
          <div className="learning-right-content">
            {error && (
              <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: 12 }}>
                <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid #22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>AI is building the simulation steps & narration script...</span>
              </div>
            )}

            {!loading && !data && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: 40, textAlign: 'center' }}>
                <span style={{ fontSize: 42, marginBottom: 16 }}>🎓</span>
                <h3 style={{ fontSize: 18, color: '#f4f4f5', fontWeight: 700 }}>AI Algorithmic Visualizer & Tutor Lab</h3>
                <p style={{ fontSize: 13, color: '#a1a1aa', maxWidth: 440, marginTop: 8, lineHeight: 1.6 }}>
                  Choose one of the quick presets on the left, create your own custom data simulation, or type a technical question to begin.
                </p>
              </div>
            )}

            {data && (
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#09090b', padding: '0 12px' }}>
                  {[
                    { id: 'visualizer', label: '🎬 Execution Visualizer' },
                    { id: 'explanation', label: '📖 Text Explanation' },
                    { id: 'code', label: '💻 Implementation Code' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '14px 18px',
                        border: 'none',
                        background: 'none',
                        color: activeTab === tab.id ? '#22c55e' : '#71717a',
                        fontWeight: activeTab === tab.id ? 700 : 400,
                        borderBottom: activeTab === tab.id ? '2px solid #22c55e' : 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        transition: 'color 0.2s'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content wrapper */}
                <div className="learning-scrollbar" style={{ flexGrow: 1, overflowY: 'auto', padding: 20 }}>
                  
                  {activeTab === 'visualizer' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14 }}>
                      
                      {/* Analogy banner */}
                      {data.analogy && (
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
                          border: '1px dashed rgba(34, 197, 94, 0.2)',
                          borderRadius: 10,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <span style={{ fontSize: 20 }}>💡</span>
                          <div>
                            <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Real-world Analogy</span>
                            <span style={{ color: '#e4e4e7', fontSize: 12 }}>{data.analogy}</span>
                          </div>
                        </div>
                      )}

                      {/* Main Split Layout: Visualizer Canvas (Left) + Step log panel (Right) */}
                      <div className="visualizer-split-container">
                        
                        {/* Visual screen container */}
                        <div className="visualizer-canvas-container">
                          <div style={{ position: 'absolute', top: 12, left: 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e', textTransform: 'uppercase' }}>
                              {data.topicType.toUpperCase()}
                            </span>
                            <span style={{ fontSize: 11, color: '#71717a' }}>Step {currentStepIndex + 1} of {data.visualSteps.length}</span>
                          </div>
                          
                          {/* Visual render node */}
                          <div style={{ flexGrow: 1, position: 'relative' }}>
                            {renderVisualizer()}
                          </div>

                          {/* Step Description panel */}
                          <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#09090b', color: '#e4e4e7', fontSize: 12.5, minHeight: 52, display: 'flex', alignItems: 'center', lineHeight: 1.5 }}>
                            💡 &nbsp;{data.visualSteps[currentStepIndex]?.description}
                          </div>
                        </div>

                        {/* Step logs panel (Right) */}
                        <div className="learning-scrollbar step-logs-panel">
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#f4f4f5', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>
                            📋 Execution Log
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                            {data.visualSteps.map((step, idx) => {
                              const isCurrent = idx === currentStepIndex;
                              const isVisited = idx < currentStepIndex;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => { stopVoice(); setCurrentStepIndex(idx); }}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    background: isCurrent ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.01)',
                                    border: isCurrent ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.04)',
                                    transition: 'all 0.2s',
                                    opacity: isCurrent ? 1 : isVisited ? 0.7 : 0.4
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? '#22c55e' : '#a1a1aa' }}>
                                      Step {idx + 1}
                                    </span>
                                    {isCurrent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />}
                                  </div>
                                  <p style={{ fontSize: 10, color: isCurrent ? '#fff' : '#a1a1aa', margin: 0, lineHeight: 1.3 }}>
                                    {step.description.length > 50 ? `${step.description.substring(0, 50)}...` : step.description}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* Visualizer controls footer */}
                      <div className="visualizer-controls-footer">
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={handleStepBackward} disabled={currentStepIndex === 0} style={{ padding: '8px 12px', background: '#18181c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, fontSize: 12, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#27272a'} onMouseLeave={e => e.target.style.background = '#18181c'}>⏮ Step</button>
                          <button
                            onClick={handlePlayPause}
                            style={{
                              padding: '8px 16px',
                              background: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                              border: isPlaying ? '1px solid #ef4444' : '1px solid #22c55e',
                              color: isPlaying ? '#ef4444' : '#22c55e',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isPlaying ? '⏸ Pause' : '▶ Play Voice & Visual'}
                          </button>
                          <button onClick={handleStepForward} disabled={currentStepIndex === data.visualSteps.length - 1} style={{ padding: '8px 12px', background: '#18181c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, fontSize: 12, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#27272a'} onMouseLeave={e => e.target.style.background = '#18181c'}>Step ⏭</button>
                          <button onClick={handleRestart} style={{ padding: '8px 12px', background: '#18181c', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, fontSize: 12, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#27272a'} onMouseLeave={e => e.target.style.background = '#18181c'}>🔄 Reset</button>
                        </div>

                        {/* Mute and Speed settings */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#a1a1aa' }}>
                            <input type="checkbox" checked={isMuted} onChange={(e) => { stopVoice(); setIsMuted(e.target.checked); }} style={{ width: 14, height: 14 }} />
                            🔇 Mute Voice
                          </label>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: '#71717a' }}>Speed:</span>
                            <select value={voiceSpeed} onChange={(e) => { stopVoice(); setVoiceSpeed(parseFloat(e.target.value)); }} style={{ padding: '4px 8px', background: '#18181c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 11 }}>
                              <option value="0.75">0.75x</option>
                              <option value="1">1.0x</option>
                              <option value="1.25">1.25x</option>
                              <option value="1.5">1.5x</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'explanation' && (
                    <div style={{ color: '#d4d4d8', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#09090b', padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', wordBreak: 'break-word', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                      {data.explanation}
                    </div>
                  )}

                  {activeTab === 'code' && (
                    <div style={{ position: 'relative' }}>
                      <pre style={{
                        background: '#070709',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 12,
                        padding: 20,
                        color: '#f4f4f5',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        overflowX: 'auto',
                        lineHeight: 1.6
                      }}>
                        <code>{data.codeExample || '// No code sample provided.'}</code>
                      </pre>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
