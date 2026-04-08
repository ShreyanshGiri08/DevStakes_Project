import { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TopicNode from './TopicNode';
import { useStore } from '../../store/useStore';

const nodeTypes = {
  topic: TopicNode,
};

export default function GraphEngine() {
  const { activeNodes, activeEdges } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(activeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeEdges);

  // Sync internal React Flow state with global Zustand state when it changes
  useEffect(() => {
    setNodes(activeNodes);
    setEdges(activeEdges);
  }, [activeNodes, activeEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-screen bg-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-black pointer-events-none z-0" />
      
      <div className="w-full h-full z-10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" gap={24} size={2} />
          <Controls className="!bg-slate-800 !border-slate-700 !fill-slate-300 shadow-xl" />
          <MiniMap 
            nodeColor={(node: any) => {
              if (node.data.status === 'completed') return '#10b981';
              if (node.data.status === 'available') return '#3b82f6';
              return '#475569';
            }}
            maskColor="rgba(15, 23, 42, 0.7)"
            className="!border-slate-700 shadow-2xl"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
