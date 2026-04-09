import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoadmapPage from './pages/RoadmapPage';

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrap><LandingPage /></PageWrap>} />
        <Route path="/roadmap" element={<PageWrap><RoadmapPage /></PageWrap>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-screen h-screen"
    >
      {children}
    </motion.div>
  );
}
