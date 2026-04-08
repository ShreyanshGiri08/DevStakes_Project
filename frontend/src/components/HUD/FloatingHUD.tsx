import { motion } from 'framer-motion';
import { Flame, Trophy, Target, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function FloatingHUD() {
  const { xp, streak, level, activeDeepDiveNodeId } = useStore();

  // Determine what to show based on context
  const isDeepDive = !!activeDeepDiveNodeId;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      <motion.div 
        layout
        className="glass-panel px-6 py-4 rounded-full flex items-center gap-8 shadow-2xl shadow-blue-500/10 border-slate-700/50"
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {!isDeepDive ? (
          <>
            {/* XP / Level Component */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">LEVEL {level}</div>
                <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                  {xp} <span className="text-sm font-medium text-slate-300">XP</span>
                </div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-700/50" />

            {/* Streak Component */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Flame className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">STREAK</div>
                <div className="font-bold text-white">
                  {streak} <span className="text-sm font-medium text-slate-300">days</span>
                </div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-700/50" />

            {/* Progress / Goal */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">NEXT GOAL</div>
                <div className="font-medium text-sm text-emerald-300">
                  Complete 'Hooks'
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Contextual actions when inside a node */}
            <div className="flex items-center gap-4 text-emerald-400 font-medium">
              <Sparkles className="w-5 h-5" />
              <span>AI Tutor Active</span>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
