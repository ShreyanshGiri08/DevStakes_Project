import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Mail, Code2, BookOpen, History, TrendingUp, Orbit, Clock, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { loginUser, generateRoadmap, fetchHistory, fetchSuggestions } from '../../api';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import gsap from 'gsap';

const TIME_OPTIONS = [
  { label: '15 min', value: 15, desc: 'Quick Review', nodes: '~4 nodes' },
  { label: '30 min', value: 30, desc: 'Focused Session', nodes: '~5 nodes' },
  { label: '1 hour', value: 60, desc: 'Standard Learn', nodes: '~6 nodes' },
  { label: '1.5 hr', value: 90, desc: 'Deep Dive', nodes: '~8 nodes' },
  { label: '2+ hr', value: 120, desc: 'Full Mastery', nodes: '~10 nodes' },
];

export default function LandingScreen() {
  const { userEmail, userDisplayName, userPhotoUrl, setUserSession, setProgression, setActiveRoadmap, topicHistory, addTopicToHistory, setAvailableTime } = useStore();
  
  const [emailInput, setEmailInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState(60);

  // GSAP refs
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const cursorOrbRef = useRef<HTMLDivElement>(null);

  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  // GSAP: Hero text reveal animation on mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      tl.from(badgeRef.current, { y: -30, opacity: 0, duration: 0.6, delay: 0.2 })
        .from(titleRef.current, { y: 60, opacity: 0, duration: 0.8, filter: 'blur(8px)' }, '-=0.3')
        .from(subtitleRef.current, { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.feature-card', { y: 40, opacity: 0, duration: 0.5, stagger: 0.15 }, '-=0.3');
    }, heroRef);
    
    return () => ctx.revert();
  }, []);

  // Cursor-following orb
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorOrbRef.current) {
        gsap.to(cursorOrbRef.current, {
          x: e.clientX - 100,
          y: e.clientY - 100,
          duration: 1.2,
          ease: 'power2.out',
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch AI suggestions
  useEffect(() => {
    if (userEmail && topicHistory.length > 0) {
      fetchSuggestions(topicHistory.slice(0, 5)).then(data => {
        setSuggestions(data.suggestions || []);
      }).catch(() => {});
    }
  }, [userEmail, topicHistory]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setLoading(true);
    try {
      const data = await loginUser(emailInput);
      setUserSession(data.user.email, data.user.display_name, data.user.photo_url);
      setProgression(data.user.xp, data.user.streak_days, data.user.level);
    } catch (err) {
      console.error("Login failed", err);
    }
    setLoading(false);
  };

  const handleGenerate = async (e?: React.FormEvent, overrideTopic?: string) => {
    e?.preventDefault();
    const topic = overrideTopic || topicInput;
    if (!topic || !userEmail) return;
    setLoading(true);
    setAvailableTime(selectedTime);
    try {
      const data = await generateRoadmap(topic, userEmail, selectedTime);
      addTopicToHistory(topic);
      setActiveRoadmap(data.nodes, data.edges, topic);
    } catch (err) {
      console.error("Generation failed", err);
    }
    setLoading(false);
  };

  const quickGenerate = async (topic: string) => {
    if (!userEmail) return;
    setTopicInput(topic);
    handleGenerate(undefined, topic);
  };

  const loadHistory = async () => {
    if (!userEmail) return;
    setShowHistory(true);
    const data = await fetchHistory(userEmail);
    setHistoryItems(data.history);
  };

  // 3D tilt on feature cards
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;
  };
  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 relative overflow-hidden text-slate-50">
      {/* Cursor-following gradient orb */}
      <div
        ref={cursorOrbRef}
        className="fixed w-52 h-52 rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          interactivity: { events: { onHover: { enable: true, mode: "grab" }, resize: true as any }, modes: { grab: { distance: 140, links: { opacity: 0.5 } } } },
          particles: {
            color: { value: ["#3b82f6", "#8b5cf6", "#10b981"] },
            links: { color: "#334155", distance: 150, enable: true, opacity: 0.2, width: 1 },
            move: { direction: "none" as const, enable: true, outModes: { default: "bounce" as const }, random: true, speed: 0.8, straight: false },
            number: { density: { enable: true, area: 800 } as any, value: 60 },
            opacity: { value: 0.5 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
        className="absolute inset-0 z-0 pointer-events-auto"
      />

      {/* Header */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
        >
          <Orbit className="w-5 h-5 text-white" />
        </motion.div>
        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Vector <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Visionary</span>
        </span>
      </div>

      {/* Logged-in user avatar in top right */}
      {userEmail && userDisplayName && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-6 right-6 z-10 flex items-center gap-3 px-4 py-2 bg-slate-800/60 backdrop-blur-md rounded-full border border-slate-700/50">
          {userPhotoUrl ? (
            <img src={userPhotoUrl} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
              {userDisplayName[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-white">{userDisplayName}</span>
        </motion.div>
      )}

      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-center p-8 z-10 gap-12" ref={heroRef}>
        {/* LEFT: Hero with GSAP animations */}
        <div className="flex-1 max-w-2xl text-left pointer-events-none">
          <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium mb-6 text-sm">
            <Sparkles className="w-4 h-4" /> Vector Visionary Learning Engine
          </div>
          
          <h1 ref={titleRef} className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500">Visualize your path to </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 animate-gradient-x">Mastery.</span>
          </h1>
          
          <p ref={subtitleRef} className="text-lg text-slate-400 mb-8 leading-relaxed max-w-xl">
            AI-powered multi-branching skill trees, handcrafted notes, gamified quizzes, and a personal tutor — all generated in seconds.
          </p>
          
          {/* Feature cards with 3D tilt */}
          <div ref={cardsRef} className="flex gap-5 mt-8 pointer-events-auto">
            {[
              { icon: <BookOpen className="w-6 h-6" />, title: 'Dynamic Trees', desc: 'Topic → adaptive roadmap', gradient: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-400', border: 'border-blue-500/20' },
              { icon: <Activity className="w-6 h-6" />, title: 'Gamification', desc: 'XP, quizzes & streaks', gradient: 'from-violet-500/20 to-violet-600/5', iconColor: 'text-violet-400', border: 'border-violet-500/20' },
              { icon: <Code2 className="w-6 h-6" />, title: 'Open Knowledge', desc: 'GFG + GitHub docs', gradient: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400', border: 'border-emerald-500/20' },
            ].map(f => (
              <div
                key={f.title}
                className={`feature-card flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-br ${f.gradient} border ${f.border} backdrop-blur-sm transition-all duration-200 cursor-default`}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                style={{ transition: 'transform 0.15s ease-out' }}
              >
                <div className={`w-11 h-11 rounded-xl bg-slate-900/60 flex items-center justify-center ${f.iconColor}`}>{f.icon}</div>
                <h3 className="font-bold text-sm text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Action Panel */}
        <div className="flex-1 max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', damping: 20 }}
            className="w-full glass-panel p-8 rounded-2xl shadow-[0_0_60px_rgba(59,130,246,0.08)] border border-slate-700/50 backdrop-blur-xl bg-slate-900/80"
          >
            <div className="flex justify-center mb-5">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40"
              >
                <Orbit className="w-7 h-7 text-white" />
              </motion.div>
            </div>

            <h2 className="text-xl font-bold text-center mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {!userEmail ? 'Welcome Aboard' : 'Launch a Roadmap'}
            </h2>

            {!userEmail ? (
              <>
                <p className="text-slate-400 text-center mb-6 text-sm">Start your learning journey</p>
                <form onSubmit={handleLogin} className="space-y-4 relative z-20">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="email" placeholder="Your email..." className="w-full bg-slate-950/80 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                      value={emailInput} onChange={(e) => setEmailInput(e.target.value)} disabled={loading} />
                  </div>
                  <button type="submit" disabled={loading || !emailInput}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50">
                    {loading ? 'Authenticating...' : 'Enter Ecosystem'} <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : !showHistory ? (
              <>
                <p className="text-slate-400 text-center mb-4 text-sm">Choose your time and topic</p>

                {/* Time Selection */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Clock className="w-3 h-3" /> Available Time
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {TIME_OPTIONS.map(t => (
                      <button key={t.value}
                        onClick={() => setSelectedTime(t.value)}
                        className={`p-2 rounded-lg border text-center transition-all ${selectedTime === t.value
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'}`}>
                        <div className="text-xs font-bold">{t.label}</div>
                        <div className="text-[9px] opacity-60">{t.nodes}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic Input */}
                <form onSubmit={handleGenerate} className="space-y-3 mb-4 relative z-20">
                  <input type="text" placeholder="e.g. React, Machine Learning, DSA..."
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl py-3 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    value={topicInput} onChange={(e) => setTopicInput(e.target.value)} disabled={loading} />
                  <button type="submit" disabled={loading || !topicInput}
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50">
                    {loading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Sparkles className="w-5 h-5" /></motion.div>
                    ) : (<><Zap className="w-5 h-5" /> Generate ({selectedTime}min)</>)}
                  </button>
                </form>

                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-violet-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> AI Recommends for You
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map(s => (
                        <button key={s} onClick={() => quickGenerate(s)} disabled={loading}
                          className="px-3 py-1 text-xs bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-full text-violet-300 transition-colors disabled:opacity-30">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Topics (max 5) */}
                {topicHistory.length > 0 && (
                  <div className="mb-3 p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <TrendingUp className="w-3 h-3" /> Recent
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {topicHistory.slice(0, 5).map(t => (
                        <button key={t} onClick={() => quickGenerate(t)} disabled={loading}
                          className="px-3 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-full text-blue-400 transition-colors disabled:opacity-30">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={loadHistory}
                  className="w-full bg-slate-800/80 hover:bg-slate-700 py-2.5 rounded-xl font-semibold text-sm text-slate-300 transition-colors border border-slate-700 relative z-20 flex items-center justify-center gap-2">
                  <History className="w-4 h-4" /> Access Archives
                </button>
              </>
            ) : (
              <div className="flex flex-col h-64 relative z-20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Your Archives</h3>
                  <button onClick={() => setShowHistory(false)} className="text-sm text-blue-400 hover:text-blue-300">Back</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {historyItems.length === 0 ? (
                    <p className="text-center text-slate-500 mt-10">No archives yet.</p>
                  ) : (
                    historyItems.map((item, i) => (
                      <div key={i} onClick={() => { setActiveRoadmap(item.nodes, item.edges, item.topic); }}
                        className="p-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-colors flex items-center justify-between group">
                        <span className="font-medium text-slate-200 text-sm">{item.topic}</span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
