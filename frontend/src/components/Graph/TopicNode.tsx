import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play, Star, Pin } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../../store/useStore';
import type { TopicNodeData } from '../../store/useStore';
import type { Node } from '@xyflow/react';

export type TopicNodeType = Node<TopicNodeData, 'topic'>;

export default function TopicNode({ id, data }: NodeProps<TopicNodeType>) {
  const setActiveDeepDive = useStore((state) => state.setActiveDeepDive);
  const togglePinNode = useStore((state) => state.togglePinNode);
  const pinnedNodeIds = useStore((state) => state.pinnedNodeIds);

  const isLocked = data.status === 'locked';
  const isCompleted = data.status === 'completed';
  const isAvailable = data.status === 'available';
  const isPinned = pinnedNodeIds.includes(id);

  const handleClick = () => {
    if (isLocked) return;
    setActiveDeepDive(id);
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    togglePinNode(id);
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
          "w-52 p-4 rounded-xl backdrop-blur-md border border-white/10 transition-colors cursor-pointer relative",
          {
            "opacity-50 grayscale bg-slate-800/50": isLocked,
            "bg-blue-900/40 ring-2 ring-blue-500/50 glow": isAvailable,
            "bg-emerald-900/40 ring-1 ring-emerald-500/50": isCompleted,
          },
          isPinned && !isLocked && "pinned-glow ring-2 ring-amber-400/50"
        )}
      >
        {/* Pin/Star Button */}
        {!isLocked && (
          <button
            onClick={handlePin}
            className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 ${
              isPinned
                ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/30 scale-110'
                : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600 hover:text-amber-400'
            }`}
          >
            {isPinned ? <Star className="w-3.5 h-3.5 fill-current" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}

        <div className="flex justify-between items-center mb-2">
          {isLocked && <Lock className="w-5 h-5 text-slate-400" />}
          {isAvailable && <Play className="w-5 h-5 text-blue-400" />}
          {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            data.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
            data.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {data.difficulty}
          </span>
        </div>
        
        <h3 className="font-bold text-slate-100 mb-1 text-sm leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {data.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2">{data.description}</p>
        
        <div className="mt-3 flex items-center gap-1 text-xs text-amber-400 font-medium">
          <Star className="w-3 h-3" />
          <span>{data.xpReward} XP</span>
        </div>
        
        {isAvailable && (
          <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-xl -z-10 animate-pulse" />
        )}
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 w-3 h-3" />
    </>
  );
}
