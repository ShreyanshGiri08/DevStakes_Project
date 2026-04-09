import { motion } from 'framer-motion';
import { Flame, Trophy, Target, Sparkles, Home, Sun, Moon, Star } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function FloatingHUD() {
  const { xp, streak, level, activeDeepDiveNodeId, theme, toggleTheme, clearActiveRoadmap, activeNodes, pinnedNodeIds } = useStore();

  const isDeepDive = !!activeDeepDiveNodeId;
  if (activeNodes.length === 0) return null;

  const completed = activeNodes.filter(n => n.data.status === 'completed').length;
  const total = activeNodes.length;
  const progressPct = Math.round((completed / total) * 100);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40"
    >
      <motion.div
        layout
        className="bg-slate-900/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-2xl shadow-black/30 border border-slate-700/50"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {!isDeepDive ? (
          <>
            {/* XP & Level */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Lvl {level}</div>
                <div className="font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                  {xp} <span className="text-xs text-slate-400">XP</span>
                </div>
              </div>
            </div>

            <div className="w-px h-7 bg-slate-700/50" />

            {/* Streak */}
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
              <span className="font-bold text-xs text-white">{streak}d</span>
            </div>

            <div className="w-px h-7 bg-slate-700/50" />

            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">{completed}/{total}</span>
            </div>

            {/* Pinned count */}
            {pinnedNodeIds.length > 0 && (
              <>
                <div className="w-px h-7 bg-slate-700/50" />
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">{pinnedNodeIds.length}</span>
                </div>
              </>
            )}

            <div className="w-px h-7 bg-slate-700/50" />

            {/* Theme */}
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-colors">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
            </button>

            {/* Home */}
            <button onClick={clearActiveRoadmap} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors">
              <Home className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-blue-400 font-medium text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Deep Dive Active</span>
            <div className="w-px h-5 bg-slate-700" />
            <span className="text-emerald-400 font-bold">{xp} XP</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
