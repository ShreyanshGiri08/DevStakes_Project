import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useRef } from 'react';
import { Clock, Download, LogOut, Orbit } from 'lucide-react';
import GraphEngine from '../components/Graph/GraphEngine';
import FloatingHUD from '../components/HUD/FloatingHUD';
import DeepDiveScreen from '../components/DeepDive/DeepDiveScreen';
import LandingScreen from '../components/Landing/LandingScreen';
import ProfileSetup from '../components/Landing/ProfileSetup';
import { useStore } from '../store/useStore';

export default function RoadmapPage() {
  const {
    userEmail,
    userDisplayName,
    userPhotoUrl,
    activeNodes,
    activeEdges,
    activeDeepDiveNodeId,
    currentTopic,
    logout,
    availableTime,
    setAvailableTime,
  } = useStore();

  const graphRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(async () => {
    if (!graphRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    const canvas = await html2canvas(graphRef.current, { backgroundColor: '#0f172a', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pdfW, pdf.internal.pageSize.getHeight(), 'F');
    pdf.addImage(imgData, 'PNG', 0, 10, pdfW, pdfH);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text(`Vector Visionary — ${currentTopic || 'Roadmap'}`, 14, pdfH + 20);
    pdf.setFontSize(10);
    pdf.text(`Generated for ${userDisplayName || userEmail} • ${new Date().toLocaleDateString()}`, 14, pdfH + 28);
    pdf.save(`vector-visionary-${currentTopic || 'roadmap'}.pdf`);
  }, [currentTopic, userDisplayName, userEmail]);

  // Keep existing flow intact (do not redesign this page)
  if (userEmail && !userDisplayName) return <ProfileSetup />;
  if (activeNodes.length === 0 && activeEdges.length === 0) return <LandingScreen />;

  const topicClass = getTopicBgClass(currentTopic);

  return (
    <div className={`w-screen h-screen overflow-hidden bg-slate-950 text-slate-50 relative ${topicClass}`}>
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Orbit className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Vector <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Visionary</span>
          </span>
          {currentTopic && (
            <span className="ml-3 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              {currentTopic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min={15}
              max={120}
              step={15}
              value={availableTime}
              onChange={(e) => setAvailableTime(Number(e.target.value))}
              className="w-20 h-1 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-medium w-12">{availableTime}m</span>
          </div>

          <button
            onClick={handleExportPDF}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 transition-colors"
            title="Export PDF"
          >
            <Download className="w-4 h-4 text-slate-300" />
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            {userPhotoUrl ? (
              <img src={userPhotoUrl} alt="" className="w-8 h-8 rounded-full border-2 border-slate-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                {userDisplayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-white leading-tight">{userDisplayName}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{userEmail}</div>
            </div>
            <button onClick={logout} className="ml-1 p-1.5 rounded-md hover:bg-slate-800 transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </motion.header>

      <div
        ref={graphRef}
        className={`transition-all duration-700 w-full h-full pt-14 ${activeDeepDiveNodeId ? 'scale-95 blur-md opacity-40' : ''}`}
      >
        <GraphEngine />
      </div>

      <FloatingHUD />

      <AnimatePresence>
        {activeDeepDiveNodeId && <DeepDiveScreen />}
      </AnimatePresence>
    </div>
  );
}

function getTopicBgClass(topic: string): string {
  const t = (topic || '').toLowerCase();
  if (['react', 'node', 'python', 'javascript', 'dsa', 'web', 'java', 'c++'].some((k) => t.includes(k))) return 'topic-bg-tech';
  if (['physics', 'biology', 'science', 'ai', 'ml', 'neural', 'data'].some((k) => t.includes(k))) return 'topic-bg-science';
  if (['design', 'art', 'music', 'creative', 'ui', 'ux'].some((k) => t.includes(k))) return 'topic-bg-creative';
  if (['business', 'startup', 'marketing', 'finance'].some((k) => t.includes(k))) return 'topic-bg-business';
  return 'topic-bg-default';
}

