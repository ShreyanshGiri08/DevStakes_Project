import { AnimatePresence } from 'framer-motion';
import GraphEngine from './components/Graph/GraphEngine';
import FloatingHUD from './components/HUD/FloatingHUD';
import DeepDiveScreen from './components/DeepDive/DeepDiveScreen';
import LandingScreen from './components/Landing/LandingScreen';
import { useStore } from './store/useStore';

export default function App() {
  const activeDeepDiveNodeId = useStore((state) => state.activeDeepDiveNodeId);
  const activeNodes = useStore((state) => state.activeNodes);

  // If no nodes are loaded representing a graph, we are on the landing page
  if (activeNodes.length === 0) {
    return <LandingScreen />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-50 relative">
      {/* 
        The main interaction graph engine. We keep it rendered in the background 
        even when deep diving so we can smoothly animate out.
      */}
      <div className={`transition-all duration-700 w-full h-full ${activeDeepDiveNodeId ? 'scale-95 blur-md opacity-40' : 'scale-100 blur-0 opacity-100'}`}>
        <GraphEngine />
      </div>

      {/* Floating UI overlays */}
      <FloatingHUD />

      {/* Deep Dive Screen handled by Framer Motion's AnimatePresence for mount/unmount animations */}
      <AnimatePresence>
        {activeDeepDiveNodeId && <DeepDiveScreen />}
      </AnimatePresence>
    </div>
  );
}
