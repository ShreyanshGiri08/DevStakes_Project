import { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import TopicNode from './TopicNode';
import { useStore } from '../../store/useStore';
import dagre from 'dagre';
import { ZoomIn, ZoomOut, Expand, Move } from 'lucide-react';

const nodeTypes = {
  topic: TopicNode,
};

const topicGradients: Record<string, { from: string; via: string; dots: string; orbColor: string }> = {
  tech: { from: 'from-blue-950/40', via: 'via-slate-900', dots: '#1e40af', orbColor: 'rgba(59,130,246,0.15)' },
  science: { from: 'from-emerald-950/40', via: 'via-slate-900', dots: '#065f46', orbColor: 'rgba(16,185,129,0.15)' },
  creative: { from: 'from-purple-950/40', via: 'via-slate-900', dots: '#581c87', orbColor: 'rgba(168,85,247,0.15)' },
  business: { from: 'from-amber-950/40', via: 'via-slate-900', dots: '#78350f', orbColor: 'rgba(245,158,11,0.15)' },
  default: { from: 'from-indigo-950/40', via: 'via-slate-900', dots: '#312e81', orbColor: 'rgba(99,102,241,0.15)' },
};

function getTopicCategory(topic: string): string {
  const t = topic.toLowerCase();
  if (['react', 'node', 'python', 'javascript', 'web', 'api', 'dsa', 'coding', 'java', 'c++', 'typescript', 'rust', 'go'].some(k => t.includes(k))) return 'tech';
  if (['physics', 'chemistry', 'biology', 'math', 'science', 'ai', 'ml', 'neural', 'data', 'machine'].some(k => t.includes(k))) return 'science';
  if (['design', 'art', 'music', 'creative', 'ui', 'ux', 'animation', 'photo'].some(k => t.includes(k))) return 'creative';
  if (['business', 'startup', 'marketing', 'finance', 'product', 'economics'].some(k => t.includes(k))) return 'business';
  return 'default';
}

export default function GraphEngine() {
  const { activeNodes, activeEdges, currentTopic } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(activeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeEdges);
  const rfRef = useRef<ReactFlowInstance<any, any> | null>(null);

  useEffect(() => {
    // Auto-layout nodes on load/update to avoid tangled edges.
    const layouted = layoutGraph(activeNodes, activeEdges, 'TB');
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [activeNodes, activeEdges, setNodes, setEdges]);

  const cat = useMemo(() => getTopicCategory(currentTopic), [currentTopic]);
  const colors = topicGradients[cat];

  const handleFit = useCallback(() => {
    requestAnimationFrame(() => rfRef.current?.fitView({ padding: 0.18, duration: 500 }));
  }, []);

  const handleZoomIn = useCallback(() => {
    rfRef.current?.zoomIn({ duration: 200 });
  }, []);

  const handleZoomOut = useCallback(() => {
    rfRef.current?.zoomOut({ duration: 200 });
  }, []);

  return (
    <div className="w-full h-full bg-slate-900 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${colors.from} ${colors.via} to-black pointer-events-none z-0 transition-colors duration-1000`} />
      
      {/* Floating animated orbs */}
      <motion.div
        animate={{ x: [0, 100, -50, 0], y: [0, -80, 60, 0], scale: [1, 1.3, 0.8, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none z-0"
        style={{ background: colors.orbColor }}
      />
      <motion.div
        animate={{ x: [0, -70, 80, 0], y: [0, 60, -40, 0], scale: [1, 0.9, 1.2, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none z-0"
        style={{ background: colors.orbColor }}
      />
      <motion.div
        animate={{ x: [0, 40, -60, 0], y: [0, -50, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
        className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full blur-2xl pointer-events-none z-0"
        style={{ background: colors.orbColor }}
      />
      
      <div className="w-full h-full z-10 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          onInit={(instance) => {
            rfRef.current = instance;
            requestAnimationFrame(() => instance.fitView({ padding: 0.18, duration: 0 }));
          }}
          fitView
          minZoom={0.1}
          maxZoom={2}
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          selectionOnDrag={false}
          panOnDrag
          zoomOnDoubleClick={false}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'rgba(99,102,241,0.75)', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={colors.dots} gap={24} size={2} />
          <Controls className="!bg-slate-800 !border-slate-700 !fill-slate-300 shadow-xl" showInteractive={false} />
          <MiniMap
            nodeColor={(node: any) => {
              if (node.data.status === 'completed') return '#10b981';
              if (node.data.status === 'available') return '#3b82f6';
              return '#475569';
            }}
            maskColor="rgba(15, 23, 42, 0.7)"
            className="!border-slate-700 shadow-2xl"
          />

          <Panel position="top-right" className="!m-4">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 backdrop-blur-xl rounded-2xl px-3 py-2 shadow-2xl">
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider pr-2 border-r border-slate-700/60">
                <Move className="w-3.5 h-3.5" />
                Navigate
              </div>
              <button
                onClick={handleZoomOut}
                className="w-9 h-9 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-slate-200" />
              </button>
              <button
                onClick={handleZoomIn}
                className="w-9 h-9 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-slate-200" />
              </button>
              <button
                onClick={handleFit}
                className="w-9 h-9 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center transition-colors"
                title="Fit to view"
              >
                <Expand className="w-4 h-4 text-slate-200" />
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

function layoutGraph(
  inputNodes: any[],
  inputEdges: any[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: any[]; edges: any[] } {
  if (!inputNodes?.length) return { nodes: inputNodes, edges: inputEdges };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: 120,
    nodesep: 60,
    edgesep: 20,
    marginx: 40,
    marginy: 40,
  });

  const NODE_W = 220; // matches TopicNode w-52 (~208) + padding
  const NODE_H = 120;

  for (const n of inputNodes) {
    g.setNode(n.id, { width: NODE_W, height: NODE_H });
  }
  for (const e of inputEdges) {
    g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  const nodes = inputNodes.map((n) => {
    const p = g.node(n.id);
    if (!p) return n;
    return {
      ...n,
      sourcePosition: direction === 'LR' ? 'right' : 'bottom',
      targetPosition: direction === 'LR' ? 'left' : 'top',
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
    };
  });

  const edges = inputEdges.map((e) => ({
    ...e,
    type: e.type ?? 'smoothstep',
    animated: true,
    style: { ...(e.style ?? {}), strokeWidth: 2 },
  }));

  return { nodes, edges };
}
