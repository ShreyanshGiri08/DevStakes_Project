import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Mail } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { loginUser, generateRoadmap, fetchHistory } from '../../api';

export default function LandingScreen() {
  const { userEmail, setUserEmail, setProgression, setActiveRoadmap } = useStore();
  
  const [emailInput, setEmailInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setLoading(true);
    try {
      const data = await loginUser(emailInput);
      setUserEmail(data.user.email);
      setProgression(data.user.xp, data.user.streak_days, data.user.level);
    } catch (err) {
      console.error("Login failed", err);
    }
    setLoading(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput || !userEmail) return;
    setLoading(true);
    try {
      const data = await generateRoadmap(topicInput, userEmail);
      setActiveRoadmap(data.nodes, data.edges);
    } catch (err) {
      console.error("Generation failed", err);
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    if (!userEmail) return;
    setShowHistory(true);
    const data = await fetchHistory(userEmail);
    setHistoryItems(data.history);
  };

  const selectHistoryItem = (item: any) => {
    setActiveRoadmap(item.nodes, item.edges);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-black z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10 glass-panel p-10 rounded-3xl shadow-2xl shadow-blue-500/20 border border-slate-700/50"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Vector Visionary</h1>
        
        {!userEmail ? (
          <>
            <p className="text-slate-400 text-center mb-8">Sign in to start your learning journey</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  autoFocus
                  placeholder="Enter your email" 
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !emailInput}
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Continue'} <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : !showHistory ? (
          <>
            <p className="text-slate-400 text-center mb-8">What do you want to master today?</p>
            <form onSubmit={handleGenerate} className="space-y-4 mb-6">
              <input 
                type="text" 
                autoFocus
                placeholder="e.g. Astrophysics, React, Chess..." 
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 px-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading || !topicInput}
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Generate AI Roadmap</>
                )}
              </button>
            </form>
            
            <button 
              onClick={loadHistory}
              className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-semibold text-slate-300 transition-colors"
            >
              View Learning History
            </button>
          </>
        ) : (
          <div className="flex flex-col h-64">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Your Roadmaps</h3>
              <button onClick={() => setShowHistory(false)} className="text-sm text-blue-400 hover:text-blue-300">Back</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {historyItems.length === 0 ? (
                <p className="text-center text-slate-500 mt-10">No history found.</p>
              ) : (
                historyItems.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => selectHistoryItem(item)}
                    className="p-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-200">{item.topic}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
