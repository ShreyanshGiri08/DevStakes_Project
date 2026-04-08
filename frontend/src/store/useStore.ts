import { create } from 'zustand';
import { type Node, type Edge } from '@xyflow/react';

export type NodeStatus = 'locked' | 'available' | 'completed';

export interface TopicNodeData extends Record<string, unknown> {
  title: string;
  description: string;
  status: NodeStatus;
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type TopicNodeType = Node<TopicNodeData, 'topic'>;

interface AppState {
  // User Session
  userEmail: string | null;
  setUserEmail: (email: string) => void;
  logout: () => void;

  // Active Roadmap Graph State
  activeNodes: TopicNodeType[];
  activeEdges: Edge[];
  setActiveRoadmap: (nodes: TopicNodeType[], edges: Edge[]) => void;
  clearActiveRoadmap: () => void;

  // User Progression
  xp: number;
  streak: number;
  level: number;
  setProgression: (xp: number, streak: number, level: number) => void;
  pinnedNodeIds: string[];
  
  // UI State
  activeDeepDiveNodeId: string | null;
  historyModalOpen: boolean;
  
  // Actions
  addXp: (amount: number) => void;
  setActiveDeepDive: (nodeId: string | null) => void;
  setHistoryModalOpen: (open: boolean) => void;
  togglePinNode: (nodeId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  userEmail: null,
  setUserEmail: (email) => set({ userEmail: email }),
  logout: () => set({ userEmail: null, activeNodes: [], activeEdges: [] }),

  activeNodes: [],
  activeEdges: [],
  setActiveRoadmap: (nodes, edges) => set({ activeNodes: nodes, activeEdges: edges }),
  clearActiveRoadmap: () => set({ activeNodes: [], activeEdges: [] }),

  xp: 0,
  streak: 0,
  level: 1,
  setProgression: (xp, streak, level) => set({ xp, streak, level }),
  pinnedNodeIds: [],
  activeDeepDiveNodeId: null,
  historyModalOpen: false,

  addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
  setActiveDeepDive: (nodeId) => set({ activeDeepDiveNodeId: nodeId }),
  setHistoryModalOpen: (open) => set({ historyModalOpen: open }),
  togglePinNode: (nodeId) => set((state) => ({
    pinnedNodeIds: state.pinnedNodeIds.includes(nodeId)
      ? state.pinnedNodeIds.filter(id => id !== nodeId)
      : [...state.pinnedNodeIds, nodeId]
  })),
}));
