import { create } from 'zustand';

export type NodeStatus = 'locked' | 'available' | 'completed';

export interface TopicNodeData {
  title: string;
  description: string;
  status: NodeStatus;
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface AppState {
  // User Progression
  xp: number;
  streak: number;
  level: number;
  pinnedNodeIds: string[];
  
  // UI State
  activeDeepDiveNodeId: string | null;
  
  // Actions
  addXp: (amount: number) => void;
  setActiveDeepDive: (nodeId: string | null) => void;
  togglePinNode: (nodeId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  xp: 1250,
  streak: 12,
  level: 5,
  pinnedNodeIds: [],
  activeDeepDiveNodeId: null,

  addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
  setActiveDeepDive: (nodeId) => set({ activeDeepDiveNodeId: nodeId }),
  togglePinNode: (nodeId) => set((state) => ({
    pinnedNodeIds: state.pinnedNodeIds.includes(nodeId)
      ? state.pinnedNodeIds.filter(id => id !== nodeId)
      : [...state.pinnedNodeIds, nodeId]
  })),
}));
