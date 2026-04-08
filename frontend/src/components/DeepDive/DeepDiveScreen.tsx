import { motion } from 'framer-motion';
import { X, PlayCircle, FileText, BrainCircuit, CheckSquare, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function DeepDiveScreen() {
  const activeNodeId = useStore((state) => state.activeDeepDiveNodeId);
  const setActiveDeepDive = useStore((state) => state.setActiveDeepDive);

  if (!activeNodeId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        layoutId={`node-${activeNodeId}`}
        initial={{ opacity: 0, borderRadius: 24 }}
        animate={{ opacity: 1, borderRadius: 16 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-6xl h-[90vh] glass-panel flex overflow-hidden relative shadow-2xl shadow-blue-500/20"
      >
        {/* Close Button */}
        <button 
          onClick={() => setActiveDeepDive(null)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PANEL: Flowchart / Sub-concepts */}
        <div className="w-1/3 border-r border-slate-700/50 bg-slate-900/60 p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Deep Dive Flow
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {['Introduction', 'Core Concepts', 'Advanced Patterns', 'Summary Challenge'].map((step, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                  idx === 1 
                    ? 'border-blue-500/50 bg-blue-500/10' 
                    : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-emerald-500/20 text-emerald-400' 
                  : idx === 1 ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-slate-700 text-slate-400'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 font-medium text-slate-200">{step}</div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Content Tabs */}
        <div className="w-2/3 flex flex-col bg-slate-900/90">
          {/* Tabs header */}
          <div className="flex px-6 pt-6 gap-4 border-b border-slate-700/50">
            <Tab icon={<PlayCircle size={18} />} label="Videos" active />
            <Tab icon={<FileText size={18} />} label="Docs" />
            <Tab icon={<BrainCircuit size={18} />} label="AI Tutor" />
            <Tab icon={<CheckSquare size={18} />} label="Quiz" />
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-4">Core Concepts Overview</h1>
            <p className="text-slate-300 leading-relaxed mb-6">
              In this module, you'll learn the fundamental principles required to master this topic. 
              The AI has curated the best visual explanations and contextual analogies.
            </p>
            
            <div className="aspect-video bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
              <PlayCircle className="w-16 h-16 text-slate-600" />
            </div>

            <div className="mt-8 p-6 bg-violet-900/20 border border-violet-500/30 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full" />
              <h3 className="text-lg font-semibold text-violet-300 flex items-center gap-2 mb-2">
                <BrainCircuit className="w-5 h-5" />
                AI Generated Analogy
              </h3>
              <p className="text-slate-300 italic">
                "Think of state in React like a person's memory. When the memory changes (state updates), 
                the person reacts and changes their behavior (component re-renders)."
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Tab({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
      active 
        ? 'border-blue-500 text-blue-400 bg-blue-500/5 rounded-t-lg' 
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-t-lg'
    }`}>
      {icon}
      {label}
    </button>
  );
}
