import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { TopicNodeData, useStore } from '../../store/useStore';

export default function TopicNode({ id, data }: NodeProps<TopicNodeData>) {
  const setActiveDeepDive = useStore((state) => state.setActiveDeepDive);
  
  const isLocked = data.status === 'locked';
  const isCompleted = data.status === 'completed';
  const isAvailable = data.status === 'available';

  const handleClick = () => {
    if (isLocked) return;
    setActiveDeepDive(id);
  };

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-slate-500 w-3 h-3" />
      <motion.div
        layoutId={`node-${id}`}
        onClick={handleClick}
        whileHover={!isLocked ? { scale: 1.05, boxShadow: "0px 0px 20px rgba(59, 130, 246, 0.5)" } : {}}
        whileTap={!isLocked ? { scale: 0.95 } : {}}
        className={clsx(
          "w-48 p-4 rounded-xl backdrop-blur-md border border-white/10 transition-colors cursor-pointer relative",
          {
            "opacity-50 grayscale bg-slate-800/50": isLocked,
            "bg-blue-900/40 ring-2 ring-blue-500/50 glow": isAvailable,
            "bg-emerald-900/40 ring-1 ring-emerald-500/50": isCompleted,
          }
        )}
      >
        <div className="flex justify-between items-center mb-2">
          {isLocked && <Lock className="w-5 h-5 text-slate-400" />}
          {isAvailable && <Play className="w-5 h-5 text-blue-400" />}
          {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-800/80 text-slate-300">
            {data.difficulty}
          </span>
        </div>
        
        <h3 className="font-bold text-slate-100 mb-1">{data.title}</h3>
        <p className="text-xs text-slate-400 line-clamp-2">{data.description}</p>
        
        <div className="mt-3 flex items-center gap-1 text-xs text-amber-400 font-medium">
          <Star className="w-3 h-3" />
          <span>{data.xpReward} XP</span>
        </div>
        
        {/* Glow effect for available nodes */}
        {isAvailable && (
          <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-xl -z-10 animate-pulse" />
        )}
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 w-3 h-3" />
    </>
  );
}
