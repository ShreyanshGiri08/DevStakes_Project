import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TopicNode from './TopicNode';

const nodeTypes = {
  topic: TopicNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'topic',
    position: { x: 400, y: 100 },
    data: {
      title: 'Introduction to React',
      description: 'Learn the basics of components and JSX.',
      status: 'completed',
      xpReward: 100,
      difficulty: 'Easy',
    },
  },
  {
    id: '2',
    type: 'topic',
    position: { x: 300, y: 300 },
    data: {
      title: 'State & Props',
      description: 'Understand how data flows in React applications.',
      status: 'available',
      xpReward: 250,
      difficulty: 'Medium',
    },
  },
  {
    id: '3',
    type: 'topic',
    position: { x: 500, y: 300 },
    data: {
      title: 'React Hooks',
      description: 'Master useEffect, useContext, and custom hooks.',
      status: 'locked',
      xpReward: 300,
      difficulty: 'Hard',
    },
  },
  {
    id: '4',
    type: 'topic',
    position: { x: 400, y: 500 },
    data: {
      title: 'Advanced Patterns',
      description: 'Higher order components and render props.',
      status: 'locked',
      xpReward: 500,
      difficulty: 'Hard',
    },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    animated: false,
    style: { stroke: '#475569', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    animated: false,
    style: { stroke: '#475569', strokeWidth: 2, strokeDasharray: '5 5' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    animated: false,
    style: { stroke: '#475569', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
  },
];

export default function GraphEngine() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-screen bg-slate-900 relative">
      {/* Background radial gradient for dynamic effect */}
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
