import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Node, type Edge } from '@xyflow/react';

export type NodeStatus = 'locked' | 'available' | 'completed';

export interface TopicNodeData extends Record<string, unknown> {
  title: string;
  description: string;
  status: NodeStatus;
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topicContext?: string;
}

export type TopicNodeType = Node<TopicNodeData, 'topic'>;

interface AppState {
  // User Session
  userEmail: string | null;
  userDisplayName: string | null;
  userPhotoUrl: string | null;
  setUserSession: (email: string, name: string | null, photo: string | null) => void;
  logout: () => void;

  // Active Roadmap Graph State
  activeNodes: TopicNodeType[];
  activeEdges: Edge[];
  currentTopic: string;
  setActiveRoadmap: (nodes: TopicNodeType[], edges: Edge[], topic?: string) => void;
  clearActiveRoadmap: () => void;
  completeNode: (nodeId: string) => void;

  // Pin/Star Nodes
  pinnedNodeIds: string[];
  togglePinNode: (nodeId: string) => void;

  // User Progression
  xp: number;
  streak: number;
  level: number;
  setProgression: (xp: number, streak: number, level: number) => void;
  
  // Topic History (for personalized suggestions)
  topicHistory: string[];
  addTopicToHistory: (topic: string) => void;

  // Time Focus
  availableTime: number; // in minutes
  setAvailableTime: (minutes: number) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // UI State
  activeDeepDiveNodeId: string | null;

  // Actions
  addXp: (amount: number) => void;
  setActiveDeepDive: (nodeId: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      userEmail: null,
      userDisplayName: null,
      userPhotoUrl: null,
      setUserSession: (email, name, photo) => set({ userEmail: email, userDisplayName: name, userPhotoUrl: photo }),
      logout: () => set({ userEmail: null, userDisplayName: null, userPhotoUrl: null, activeNodes: [], activeEdges: [], xp: 0, level: 1, streak: 0, currentTopic: '' }),

      activeNodes: [],
      activeEdges: [],
      currentTopic: '',
      setActiveRoadmap: (nodes, edges, topic) => set({ activeNodes: nodes, activeEdges: edges, currentTopic: topic || '', activeDeepDiveNodeId: null }),
      clearActiveRoadmap: () => set({ activeNodes: [], activeEdges: [], activeDeepDiveNodeId: null, currentTopic: '' }),

      completeNode: (nodeId) => set((state) => {
        const updatedNodes = state.activeNodes.map(n => {
          if (n.id === nodeId) return { ...n, data: { ...n.data, status: 'completed' } as TopicNodeData };
          return n;
        });
        const outgoingEdges = state.activeEdges.filter(e => e.source === nodeId);
        const targetIds = outgoingEdges.map(e => e.target);
        const finalNodes = updatedNodes.map(n => {
          if (targetIds.includes(n.id) && n.data.status === 'locked') {
            return { ...n, data: { ...n.data, status: 'available' } as TopicNodeData };
          }
          return n;
        });
        return { activeNodes: finalNodes };
      }),

      pinnedNodeIds: [],
      togglePinNode: (nodeId) => set((state) => ({
        pinnedNodeIds: state.pinnedNodeIds.includes(nodeId)
          ? state.pinnedNodeIds.filter(id => id !== nodeId)
          : [...state.pinnedNodeIds, nodeId]
      })),

      xp: 0,
      streak: 0,
      level: 1,
      setProgression: (xp, streak, level) => set({ xp, streak, level }),

      topicHistory: [],
      addTopicToHistory: (topic) => set((state) => ({
        topicHistory: [topic, ...state.topicHistory.filter(t => t !== topic)].slice(0, 20)
      })),

      availableTime: 60,
      setAvailableTime: (minutes) => set({ availableTime: minutes }),

      theme: 'dark',
      toggleTheme: () => set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        if (next === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { theme: next };
      }),

      activeDeepDiveNodeId: null,

      addXp: (amount) => set((state) => ({ xp: state.xp + amount, level: Math.floor((state.xp + amount) / 1000) + 1 })),
      setActiveDeepDive: (nodeId) => set({ activeDeepDiveNodeId: nodeId }),
    }),
    {
      name: 'vector-visionary-store',
      partialize: (state) => ({
        userEmail: state.userEmail,
        userDisplayName: state.userDisplayName,
        userPhotoUrl: state.userPhotoUrl,
        xp: state.xp,
        streak: state.streak,
        level: state.level,
        theme: state.theme,
        topicHistory: state.topicHistory,
        pinnedNodeIds: state.pinnedNodeIds,
      }),
    }
  )
);
