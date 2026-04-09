import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, BrainCircuit, CheckSquare, ChevronRight, CheckCircle2, Send, Code2, PenTool, Loader2, ExternalLink, Trophy, XCircle, Orbit, RotateCcw, Play } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { TopicNodeType } from '../../store/useStore';
import { chatTutor, syncProgress, generateNotes, generateQuiz } from '../../api';
import confetti from 'canvas-confetti';

/** Render markdown-like text into styled HTML */
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks (```...```)
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900/80 text-emerald-300 p-3 rounded-lg text-xs my-2 overflow-x-auto" style="font-family:Fira Code,monospace;white-space:pre;"><code>$1</code></pre>')
    // Inline code (`...`)
    .replace(/`([^`]+)`/g, '<code class="bg-slate-700/60 text-blue-300 px-1.5 py-0.5 rounded text-xs">$1</code>')
    // Headings (### ... )
    .replace(/^###\s+(.+)$/gm, '<h3 class="font-bold text-blue-400 text-base mt-3 mb-1">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="font-bold text-blue-300 text-lg mt-3 mb-1">$1</h2>')
    // Bold (**...**)
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-400 underline hover:text-blue-300 transition-colors">$1</a>')
    // Bullet points (- item or * item)
    .replace(/^[-*]\s+(.+)$/gm, '<li class="flex gap-2 items-start"><span class="text-blue-400 mt-0.5">•</span><span>$1</span></li>')
    // Numbered lists (1. item)
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li class="flex gap-2 items-start"><span class="text-blue-400 font-bold mt-0.5">$1.</span><span>$2</span></li>')
    // Line breaks
    .replace(/\n/g, '<br/>');
  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>(?:<br\/>)?)+)/g, '<ul class="space-y-1 my-2">$1</ul>');
  // Clean up <br/> inside <ul>
  html = html.replace(/<ul([^>]*)>(.*?)<\/ul>/gs, (match) => match.replace(/<br\/>/g, ''));
  return html;
}

interface NotesRule {
  name: string;
  formula: string;
  explanation: string;
  whenToUse: string;
}

interface NotesMistake {
  mistake: string;
  whyItsWrong: string;
  fix: string;
}

interface NotesExample {
  prompt: string;
  solutionOutline: string[];
  answer: string;
}

interface StructuredNotesData {
  title: string;
  conceptOverview: string;
  whyItMatters: string[];
  coreExplanation: string[];
  keyFormulasOrRules: NotesRule[];
  commonMistakes: NotesMistake[];
  examples: { easy: NotesExample[]; medium: NotesExample[]; hard: NotesExample[] };
  tldr: string[];
  relatedTopics: string[];
  aiPracticePrompt: string;
}

interface LegacyNotesData {
  heading: string;
  keyPoints: string[];
  explanation: string;
  codeExample: string;
  proTip: string;
  connections: string;
}

type NotesData = StructuredNotesData | LegacyNotesData;

function isStructuredNotes(n: any): n is StructuredNotesData {
  return !!n && typeof n === 'object' && typeof n.title === 'string' && typeof n.conceptOverview === 'string';
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export default function DeepDiveScreen() {
  const { activeDeepDiveNodeId, setActiveDeepDive, activeNodes, completeNode, addXp, userEmail } = useStore();

  const [activeTab, setActiveTab] = useState('Notes');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Notes state
  const [notes, setNotes] = useState<NotesData | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);

  const focusedNode = activeNodes.find(n => n.id === activeDeepDiveNodeId) as TopicNodeType | undefined;

  // Reset everything when switching nodes
  useEffect(() => {
    setActiveTab('Notes');
    setNotes(null);
    setQuizQuestions([]);
    setSelectedAnswers({});
    setRevealedAnswers({});
    setQuizCompleted(false);
    setChatHistory(focusedNode ? [{ role: 'tutor', text: `🚀 Vector Visionary Tutor online! I'm here to help you master **${focusedNode.data.title}**. Ask me anything — concepts, examples, resources.` }] : []);
  }, [activeDeepDiveNodeId]);

  // Auto-fetch notes when Notes tab is active
  useEffect(() => {
    if (activeTab === 'Notes' && !notes && !notesLoading && focusedNode) {
      fetchNotes();
    }
  }, [activeTab, focusedNode]);

  // Auto-fetch quiz when Quiz tab is active
  useEffect(() => {
    if (activeTab === 'Quiz' && quizQuestions.length === 0 && !quizLoading && focusedNode) {
      fetchQuiz();
    }
  }, [activeTab, focusedNode]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!activeDeepDiveNodeId || !focusedNode) return null;
  const data = focusedNode.data;

  async function fetchNotes() {
    setNotesLoading(true);
    try {
      const res = await generateNotes(data.title, data.topicContext || '');
      setNotes(res.notes as NotesData);
    } catch (e) {
      console.error(e);
    }
    setNotesLoading(false);
  }

  async function fetchQuiz() {
    setQuizLoading(true);
    try {
      const res = await generateQuiz(data.title, data.topicContext || '');
      const questions = res.quiz as QuizQuestion[];
      setQuizQuestions(questions);
      const blank: Record<number, null> = {};
      questions.forEach((_, i: number) => { blank[i] = null; });
      setSelectedAnswers(blank);
      setRevealedAnswers({});
    } catch (e) {
      console.error(e);
    }
    setQuizLoading(false);
  }

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;
    const msg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const res = await chatTutor(msg, data.title);
      setChatHistory(prev => [...prev, { role: 'tutor', text: res.reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'tutor', text: '⚠️ Neural link disrupted. Try again.' }]);
    }
    setChatLoading(false);
  };

  const handleQuizSelect = (qIdx: number, oIdx: number) => {
    if (revealedAnswers[qIdx]) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleQuizSubmit = (qIdx: number) => {
    if (selectedAnswers[qIdx] === null || selectedAnswers[qIdx] === undefined) return;
    setRevealedAnswers(prev => ({ ...prev, [qIdx]: true }));

    // Check if all questions are now revealed
    const updatedRevealed = { ...revealedAnswers, [qIdx]: true };
    const allRevealed = quizQuestions.every((_, i) => updatedRevealed[i]);

    if (allRevealed) {
      const correctCount = quizQuestions.filter((q, i) => selectedAnswers[i] === q.correctIndex).length;
      const allCorrect = correctCount === quizQuestions.length;

      setQuizCompleted(true);

      if (allCorrect && data.status !== 'completed') {
        // Perfect score -> confetti + completion
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']
          });
          confetti({
            particleCount: 100,
            spread: 120,
            origin: { y: 0.5, x: 0.3 },
            colors: ['#ec4899', '#06b6d4']
          });
        }, 300);

        completeNode(activeDeepDiveNodeId);
        addXp(data.xpReward);
        if (userEmail) syncProgress(userEmail, data.xpReward);
      } else if (correctCount >= Math.ceil(quizQuestions.length * 0.6) && data.status !== 'completed') {
        // 60%+ pass
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#10b981'] });
        completeNode(activeDeepDiveNodeId);
        addXp(Math.floor(data.xpReward * 0.7));
        if (userEmail) syncProgress(userEmail, Math.floor(data.xpReward * 0.7));
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Notes':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-beteen mb-2">
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{data.title}</h1>
              {notes && (
                <button onClick={() => {
                  const text = isStructuredNotes(notes)
                    ? `# ${notes.title}\n\n## Concept Overview\n${notes.conceptOverview}\n\n## Why It Matters\n${notes.whyItMatters.map((p) => `- ${p}`).join('\n')}\n\n## Core Explanation\n${notes.coreExplanation.map((p) => `- ${p}`).join('\n')}\n\n## Key Formulas / Rules\n${notes.keyFormulasOrRules.map((r) => `- **${r.name}**: ${r.formula}\n  - ${r.explanation}\n  - When: ${r.whenToUse}`).join('\n')}\n\n## Common Mistakes\n${notes.commonMistakes.map((m) => `- **${m.mistake}**\n  - Why: ${m.whyItsWrong}\n  - Fix: ${m.fix}`).join('\n')}\n\n## Examples\n### Easy\n${notes.examples.easy.map((e) => `- ${e.prompt}\n  - Outline: ${e.solutionOutline.join(' | ')}\n  - Answer: ${e.answer}`).join('\n')}\n\n### Medium\n${notes.examples.medium.map((e) => `- ${e.prompt}\n  - Outline: ${e.solutionOutline.join(' | ')}\n  - Answer: ${e.answer}`).join('\n')}\n\n### Hard\n${notes.examples.hard.map((e) => `- ${e.prompt}\n  - Outline: ${e.solutionOutline.join(' | ')}\n  - Answer: ${e.answer}`).join('\n')}\n\n## TL;DR\n${notes.tldr.map((p) => `- ${p}`).join('\n')}\n\n## Related Topics\n${notes.relatedTopics.map((t) => `- ${t}`).join('\n')}\n\n## AI Practice Prompt\n${notes.aiPracticePrompt}\n\n— Vector Visionary 🚀`
                    : `# ${notes.heading}\n\n## Key Points\n${notes.keyPoints.map((p: string) => `• ${p}`).join('\n')}\n\n## Explanation\n${notes.explanation}\n\n## Code Example\n${notes.codeExample}\n\n## Pro Tip\n${notes.proTip}\n\n## Connections\n${notes.connections}\n\n— Vector Visionary 🚀`;
                  const blob = new Blob([text], { type: 'text/markdown' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `${data.title.replace(/\s+/g, '_')}_notes.md`;
                  a.click();
                }} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 text-sm font-medium transition-colors flex items-center gap-2">
                  📥 Download Notes
                </button>
              )}
            </div>
            <p className="text-slate-400 mb-6 text-sm">AI-generated study notes powered by Vector Visionary</p>

            {notesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  <span>Generating Notes...</span>
                </div>
              </div>
            ) : notes ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isStructuredNotes(notes) ? (
                  <StructuredNotesView notes={notes} />
                ) : (
                  <LegacyNotesView notes={notes} />
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">Failed to load notes. Click to retry.
                <button onClick={fetchNotes} className="ml-2 text-blue-400 underline">Retry</button>
              </div>
            )}
          </div>
        );

      case 'Docs':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Documentation & Resources</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <a href={`https://github.com/search?q=${encodeURIComponent(data.title)}&type=repositories`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all group">
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-600">
                  <Code2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white group-hover:text-blue-400 transition-colors">GitHub Repositories</div>
                  <div className="text-xs text-slate-400">Search repos for {data.title}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
              </a>

              <a href={`https://www.google.com/search?q=${encodeURIComponent(data.title + ' site:geeksforgeeks.org')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all group">
                <div className="w-12 h-12 rounded-xl bg-emerald-900/40 flex items-center justify-center border border-emerald-700/50">
                  <span className="text-emerald-400 font-black text-lg">GFG</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">GeeksforGeeks</div>
                  <div className="text-xs text-slate-400">Articles & tutorials for {data.title}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
              </a>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">Suggested YouTube Videos</h3>
                <span className="text-[11px] text-slate-500">Opens YouTube search results</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'Beginner-friendly', q: `${data.title} tutorial for beginners` },
                  { label: 'Deep explanation', q: `${data.title} explained in depth` },
                  { label: 'Build a project', q: `${data.title} project walkthrough` },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.q)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 p-4 bg-slate-900/70 hover:bg-slate-900 border border-slate-700/60 rounded-xl transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/20">
                      <Play className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-100 group-hover:text-red-300 transition-colors">{item.label}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.q}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-red-300 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
              <h3 className="text-lg font-bold text-white mb-3">Reference Notes</h3>
              <div className="text-slate-300 leading-relaxed space-y-3">
                <p>{data.topicContext}</p>
                <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-700/50">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Concept Summary</div>
                  <p className="text-slate-300 text-sm">{data.description}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'AI Tutor':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Orbit className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Vector Visionary Tutor</h1>
                <p className="text-xs text-slate-400">Powered by Llama 3.3 AI • Context: {data.title}</p>
              </div>
            </div>

            <div className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-xl flex flex-col overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

              <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                {chatHistory.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-md'
                    }`}>
                      {msg.role === 'user' ? (
                        msg.text
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                      )}
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChat} className="p-3 bg-slate-800/50 border-t border-slate-700 flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder="Ask Vector Visionary anything..."
                  disabled={chatLoading}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button type="submit" disabled={chatLoading || !chatMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl px-4 flex items-center justify-center transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        );

      case 'Quiz':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Knowledge Check</h1>
                <p className="text-slate-400 text-sm mt-1">Score 60%+ to complete this module</p>
              </div>
              {quizCompleted && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Score:</span>
                  <span className="text-lg font-bold text-white">
                    {quizQuestions.filter((q, i) => selectedAnswers[i] === q.correctIndex).length}/{quizQuestions.length}
                  </span>
                </div>
              )}
            </div>

            {quizLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  <span>Generating quiz from AI...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {quizQuestions.map((q, qIdx) => {
                  const isRevealed = revealedAnswers[qIdx];
                  const selected = selectedAnswers[qIdx];
                  const isCorrect = selected === q.correctIndex;

                  return (
                    <motion.div
                      key={qIdx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: qIdx * 0.1 }}
                      className={`bg-slate-800/60 border rounded-xl p-6 transition-all ${
                        isRevealed
                          ? isCorrect
                            ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                            : 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                          : 'border-slate-700'
                      }`}
                    >
                      <p className="text-lg font-medium text-slate-200 mb-4">
                        <span className="text-blue-400 font-bold mr-2">Q{qIdx + 1}.</span>
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt, oIdx) => {
                          let btnStyle = 'border-slate-700 hover:border-blue-500 hover:bg-blue-500/10 text-slate-300 cursor-pointer';

                          if (isRevealed) {
                            if (oIdx === q.correctIndex) {
                              btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
                            } else if (oIdx === selected && oIdx !== q.correctIndex) {
                              btnStyle = 'border-red-500 bg-red-500/20 text-red-300';
                            } else {
                              btnStyle = 'border-slate-800 text-slate-600 opacity-50';
                            }
                          } else if (selected === oIdx) {
                            btnStyle = 'border-blue-500 bg-blue-500/20 text-blue-300 ring-2 ring-blue-500/30';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleQuizSelect(qIdx, oIdx)}
                              disabled={isRevealed}
                              className={`text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${btnStyle}`}
                            >
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isRevealed && oIdx === q.correctIndex ? 'bg-emerald-500 text-white' :
                                isRevealed && oIdx === selected ? 'bg-red-500 text-white' :
                                selected === oIdx ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                              }`}>
                                {isRevealed && oIdx === q.correctIndex ? <CheckCircle2 className="w-4 h-4" /> :
                                 isRevealed && oIdx === selected ? <XCircle className="w-4 h-4" /> :
                                 String.fromCharCode(65 + oIdx)}
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {!isRevealed && (
                        <button
                          onClick={() => handleQuizSubmit(qIdx)}
                          disabled={selected === null || selected === undefined}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                        >
                          Submit Answer
                        </button>
                      )}

                      {isRevealed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={`mt-3 p-3 rounded-lg text-sm font-medium ${
                            isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {isCorrect ? '✅ Correct! Great work.' : `❌ Incorrect. The correct answer was: ${q.options[q.correctIndex]}`}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Results footer */}
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center p-6 bg-slate-900/80 border border-slate-700 rounded-xl">
                    <div>
                      <div className="text-emerald-400 font-bold text-lg mb-1">+{data.xpReward} XP</div>
                      <div className="text-sm text-slate-400">Perfect score for full XP, 60%+ for partial.</div>
                    </div>
                    {(data.status === 'completed' || quizCompleted) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 text-emerald-400 font-bold px-5 py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30"
                      >
                        <Trophy className="w-5 h-5" /> Module Complete
                      </motion.div>
                    )}
                  </div>

                  {/* Retake Quiz Button */}
                  {quizCompleted && (
                    <button
                      onClick={() => {
                        setQuizQuestions([]);
                        setSelectedAnswers({});
                        setRevealedAnswers({});
                        setQuizCompleted(false);
                        fetchQuiz();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 font-semibold text-sm transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Retake Quiz
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg">
      <motion.div
        layoutId={`node-${activeDeepDiveNodeId}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-6xl h-[92vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl flex overflow-hidden relative shadow-2xl shadow-blue-500/10"
      >
        <button
          onClick={() => setActiveDeepDive(null)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors z-10 border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT: Node Navigation */}
        <div className="w-72 shrink-0 border-r border-slate-700/50 bg-slate-950/50 p-5 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-1">Learning Path</h2>
          <p className="text-xs text-slate-500 mb-5">Navigate between modules</p>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {activeNodes.map((n, idx) => {
              const isActive = n.id === activeDeepDiveNodeId;
              const isPast = n.data.status === 'completed';
              const isLocked = n.data.status === 'locked';

              return (
                <motion.div
                  key={n.id}
                  whileHover={!isLocked ? { x: 4 } : {}}
                  onClick={() => { if (!isLocked) setActiveDeepDive(n.id); }}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-sm ${
                    isActive
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-[inset_0_0_20px_rgba(59,130,246,0.08)]'
                      : isPast
                        ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer'
                        : isLocked
                          ? 'border-slate-800 bg-slate-900/30 opacity-35 cursor-not-allowed'
                          : 'border-slate-700/40 bg-slate-800/30 hover:bg-slate-700/40 cursor-pointer'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isPast ? 'bg-emerald-500/20 text-emerald-400'
                    : isActive ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`flex-1 truncate ${isActive ? 'text-white font-medium' : 'text-slate-400'}`}>
                    {n.data.title}
                  </span>
                  {!isLocked && <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-600'}`} />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex px-6 pt-5 gap-1 border-b border-slate-700/50 shrink-0 overflow-x-auto custom-scrollbar pb-0">
            <Tab icon={<PenTool size={16} />} label="Notes" active={activeTab === 'Notes'} onClick={() => setActiveTab('Notes')} />
            <Tab icon={<FileText size={16} />} label="Docs" active={activeTab === 'Docs'} onClick={() => setActiveTab('Docs')} />
            <Tab icon={<BrainCircuit size={16} />} label="AI Tutor" active={activeTab === 'AI Tutor'} onClick={() => setActiveTab('AI Tutor')} />
            <Tab icon={<CheckSquare size={16} />} label="Quiz" active={activeTab === 'Quiz'} onClick={() => setActiveTab('Quiz')} />
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Tab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
        active
          ? 'border-blue-500 text-blue-400 bg-blue-500/5'
          : 'border-transparent text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StructuredNotesView({ notes }: { notes: StructuredNotesData }) {
  return (
    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.06)]">
      <div className="px-6 py-5 border-b border-slate-800/60 bg-gradient-to-r from-slate-950/60 to-slate-900/30">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Reference Notes</div>
        <div className="text-2xl font-bold text-white mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {notes.title}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <CollapsibleSection title="Concept Overview" defaultOpen>
          <p className="text-slate-200 leading-relaxed">{notes.conceptOverview}</p>
        </CollapsibleSection>

        <CollapsibleSection title="Why It Matters" defaultOpen>
          <ul className="space-y-2">
            {notes.whyItMatters.map((x, i) => (
              <li key={i} className="text-slate-200 flex gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        <CollapsibleSection title="Core Explanation (step-by-step)" defaultOpen>
          <ol className="space-y-2">
            {notes.coreExplanation.map((x, i) => (
              <li key={i} className="text-slate-200 flex gap-3">
                <span className="text-blue-400 font-bold">{i + 1}.</span>
                <span>{x}</span>
              </li>
            ))}
          </ol>
        </CollapsibleSection>

        <CollapsibleSection title="Key Formulas / Rules">
          {notes.keyFormulasOrRules.length === 0 ? (
            <div className="text-sm text-slate-500">No formulas/rules for this topic.</div>
          ) : (
            <div className="space-y-3">
              {notes.keyFormulasOrRules.map((r, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-800/70 bg-slate-950/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-white">{r.name}</div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Rule</span>
                  </div>
                  {r.formula && (
                    <div className="mt-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 font-mono text-sm text-blue-200 overflow-x-auto">
                      {r.formula}
                    </div>
                  )}
                  <div className="mt-3 text-slate-200 leading-relaxed">{r.explanation}</div>
                  <div className="mt-3 text-sm text-slate-400">
                    <span className="font-semibold text-slate-200">When to use:</span> {r.whenToUse}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Common Mistakes">
          <div className="space-y-3">
            {notes.commonMistakes.map((m, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-800/70 bg-slate-950/40">
                <div className="font-semibold text-rose-200">Mistake: {m.mistake}</div>
                <div className="mt-2 text-slate-200 leading-relaxed">
                  <span className="text-slate-400 font-semibold">Why it’s wrong:</span> {m.whyItsWrong}
                </div>
                <div className="mt-2 text-slate-200 leading-relaxed">
                  <span className="text-slate-400 font-semibold">Fix:</span> {m.fix}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Examples (Easy → Medium → Hard)" defaultOpen>
          <ExamplesBlock title="Easy" items={notes.examples.easy} />
          <div className="h-px bg-slate-800/60 my-4" />
          <ExamplesBlock title="Medium" items={notes.examples.medium} />
          <div className="h-px bg-slate-800/60 my-4" />
          <ExamplesBlock title="Hard" items={notes.examples.hard} />
        </CollapsibleSection>

        <CollapsibleSection title="Quick Summary (TL;DR)" defaultOpen>
          <ul className="space-y-2">
            {notes.tldr.map((x, i) => (
              <li key={i} className="text-slate-200 flex gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        <CollapsibleSection title="Related Topics">
          {notes.relatedTopics.length === 0 ? (
            <div className="text-sm text-slate-500">No related topics provided.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {notes.relatedTopics.map((t, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-slate-900/70 border border-slate-700/60 text-slate-200 text-sm">
                  {t}
                </span>
              ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="AI Practice Prompt" defaultOpen>
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/15 text-slate-100 leading-relaxed">
            {notes.aiPracticePrompt}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

function ExamplesBlock({ title, items }: { title: string; items: NotesExample[] }) {
  return (
    <div>
      <div className="text-sm font-bold text-white mb-2">{title}</div>
      <div className="space-y-3">
        {items.map((ex, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-800/70 bg-slate-950/40">
            <div className="text-slate-200 font-semibold mb-2">{ex.prompt}</div>
            {ex.solutionOutline?.length > 0 && (
              <ul className="space-y-1 mb-2">
                {ex.solutionOutline.map((s, idx) => (
                  <li key={idx} className="text-slate-300 text-sm flex gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="text-sm text-slate-300">
              <span className="text-slate-400 font-semibold">Answer:</span> {ex.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegacyNotesView({ notes }: { notes: LegacyNotesData }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;700&display=swap');
      `}</style>
      <div className="bg-[#fdfaf6] rounded-2xl border border-amber-200/50 shadow-lg overflow-hidden">
        <div
          className="relative p-8 pl-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
            backgroundAttachment: 'local',
          }}
        >
          <div className="absolute top-0 bottom-0 left-16 w-[2px] bg-red-300/50" />

          <div style={{ fontFamily: "'Caveat', cursive", lineHeight: '32px', fontSize: '1.4rem', color: '#1e293b' }}>
            <h2 className="text-3xl font-bold text-blue-600 mb-1" style={{ fontFamily: "'Caveat', cursive" }}>
              {notes.heading}
            </h2>
            <div className="w-32 h-1 bg-blue-400/40 rounded mb-4" />

            <p className="mb-4 text-slate-700">{notes.explanation}</p>

            <h3 className="text-xl font-bold text-violet-600 mt-6 mb-2" style={{ fontFamily: "'Caveat', cursive" }}>
              Key Takeaways ✦
            </h3>
            <ul className="space-y-1 mb-4">
              {notes.keyPoints.map((pt, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-blue-500 font-bold shrink-0">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            {notes.codeExample && (
              <>
                <h3 className="text-xl font-bold text-emerald-600 mt-6 mb-2" style={{ fontFamily: "'Caveat', cursive" }}>
                  Code Example 💻
                </h3>
                <div className="bg-[#1e1e2e] rounded-xl overflow-hidden border border-slate-700/50 shadow-inner">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">code</span>
                  </div>
                  <pre
                    className="p-4 overflow-x-auto"
                    style={{
                      margin: 0,
                      whiteSpace: 'pre',
                      fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                      fontSize: '0.82rem',
                      lineHeight: '1.7',
                      tabSize: 4,
                      color: '#a6e3a1',
                    }}
                  >
                    <code>{notes.codeExample}</code>
                  </pre>
                </div>
              </>
            )}

            <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
              <span className="font-bold text-amber-700">💡 Pro Tip: </span>
              <span className="text-amber-800">{notes.proTip}</span>
            </div>

            <p className="mt-6 text-slate-500 text-lg italic">{notes.connections}</p>
            <p className="mt-4 text-right text-slate-400 text-base">— Vector Visionary 🚀</p>
          </div>
        </div>
      </div>
    </>
  );
}

function CollapsibleSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-slate-800/70 bg-slate-950/30 overflow-hidden"
    >
      <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between gap-3">
        <div className="font-semibold text-white">{title}</div>
        <div className="text-slate-500 text-sm group-open:rotate-180 transition-transform">⌄</div>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
