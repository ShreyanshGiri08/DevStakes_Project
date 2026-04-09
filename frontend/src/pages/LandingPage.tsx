import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import gsap from 'gsap';
import { ArrowRight, BrainCircuit, Network, NotebookPen, Sparkles, Target, Zap, Library } from 'lucide-react';

const FEATURES = [
  {
    icon: <Network className="w-5 h-5" />,
    title: 'AI Roadmap Generator',
    desc: 'Generates personalized learning paths based on your goals.',
    detail: 'Time-aware node count, prerequisites, and outcomes — delivered as a clickable graph.',
    accent: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: <NotebookPen className="w-5 h-5" />,
    title: 'Smart Reference Notes',
    desc: 'Deep, structured notes with examples, mistakes, and summaries.',
    detail: 'Notion-style sections with collapsible blocks, formulas/rules, and progressive examples.',
    accent: 'from-violet-500/20 to-violet-600/5',
    border: 'border-violet-500/20',
    iconColor: 'text-violet-400',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Quiz & Streak System',
    desc: 'Reinforce learning with daily practice and streak tracking.',
    detail: 'Quick checks that unlock nodes and award XP to keep momentum.',
    accent: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: <BrainCircuit className="w-5 h-5" />,
    title: 'Skill-Based Adaptation',
    desc: 'Difficulty adjusts based on your performance over time.',
    detail: 'Focus on weak areas and skip what you already know.',
    accent: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Node-Based Learning',
    desc: 'A visual graph of topics and dependencies you can explore.',
    detail: 'Zoom, pan, fit-to-view, and deep-dive into any unlocked node.',
    accent: 'from-fuchsia-500/20 to-fuchsia-600/5',
    border: 'border-fuchsia-500/20',
    iconColor: 'text-fuchsia-400',
  },
  {
    icon: <Library className="w-5 h-5" />,
    title: 'Curated Resources',
    desc: 'Docs, repos, and video searches for each concept.',
    detail: 'One click to jump to GitHub, GFG, and suggested YouTube queries.',
    accent: 'from-sky-500/20 to-sky-600/5',
    border: 'border-sky-500/20',
    iconColor: 'text-sky-400',
  },
];

export default function LandingPage() {
  const nav = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const cardsWrapRef = useRef<HTMLDivElement>(null);

  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(titleRef.current, { y: 40, opacity: 0, duration: 0.8, filter: 'blur(8px)' })
        .from(subtitleRef.current, { y: 24, opacity: 0, duration: 0.55 }, '-=0.4')
        .from(ctaRef.current, { y: 18, opacity: 0, duration: 0.5 }, '-=0.25')
        .from('.vv-feature', { y: 26, opacity: 0, duration: 0.45, stagger: 0.12 }, '-=0.15');
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = cardsWrapRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotateY: x * 6, rotateX: y * -6, duration: 0.8, ease: 'power2.out', transformPerspective: 1000 });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.25),_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(59,130,246,0.18),_transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(2,6,23,0.2),_rgba(2,6,23,0.95))] pointer-events-none" />

      <Particles
        id="landing-particles"
        init={particlesInit}
        options={{
          background: { color: { value: 'transparent' } },
          fpsLimit: 60,
          interactivity: { events: { onHover: { enable: true, mode: 'repulse' }, resize: true as any }, modes: { repulse: { distance: 120, duration: 0.2 } } },
          particles: {
            color: { value: ['#3b82f6', '#8b5cf6', '#10b981'] },
            links: { color: '#334155', distance: 160, enable: true, opacity: 0.22, width: 1 },
            move: { direction: 'none' as const, enable: true, outModes: { default: 'bounce' as const }, random: true, speed: 0.7, straight: false },
            number: { density: { enable: true, area: 900 } as any, value: 55 },
            opacity: { value: 0.55 },
            shape: { type: 'circle' },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Floating orbs */}
      <motion.div
        animate={{ x: [0, 90, -60, 0], y: [0, -80, 55, 0], scale: [1, 1.22, 0.9, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-10 -left-10 w-72 h-72 rounded-full blur-3xl bg-blue-500/20 z-0 pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -70, 70, 0], y: [0, 70, -55, 0], scale: [1, 0.9, 1.15, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl bg-violet-500/16 z-0 pointer-events-none"
      />

      {/* Top bar */}
      <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Vector <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Visionary</span>
          </span>
        </div>
        <button
          onClick={() => nav('/roadmap')}
          className="px-4 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/70 border border-slate-700/60 backdrop-blur-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          Open app
        </button>
      </div>

      {/* Hero */}
      <div ref={heroRef} className="relative z-10 w-full h-full flex items-center justify-center px-6">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="max-w-xl">
            <h1
              ref={titleRef}
              className="text-5xl md:text-6xl font-extrabold leading-[1.05]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500">
                Learn Smarter, Not Harder
              </span>
            </h1>
            <p ref={subtitleRef} className="mt-5 text-lg text-slate-400 leading-relaxed">
              AI-powered roadmap + reference system tailored to your goals.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <motion.button
                ref={ctaRef}
                onClick={() => nav('/roadmap')}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden px-6 py-3 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/25"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 opacity-95 transition-transform duration-500 group-hover:scale-[1.07]" />
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.22),transparent_55%)]" />
                <span className="relative flex items-center gap-2">
                  Launch Roadmap <ArrowRight className="w-5 h-5" />
                </span>
              </motion.button>
              <div className="text-xs text-slate-500">
                Premium learning UX • Fast • Visual
              </div>
            </div>
          </div>

          {/* Floating feature cards */}
          <div ref={cardsWrapRef} className="relative">
            <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/10 to-violet-500/10 blur-2xl rounded-[2.5rem]" />
            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  layout
                  className={`vv-feature p-5 rounded-2xl bg-gradient-to-br ${f.accent} border ${f.border} backdrop-blur-xl shadow-[0_0_60px_rgba(59,130,246,0.06)]`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  onMouseEnter={() => setHovered(f.title)}
                  onMouseLeave={() => setHovered((cur) => (cur === f.title ? null : cur))}
                  whileHover={{ y: -8, scale: 1.06, boxShadow: '0 0 70px rgba(99,102,241,0.22)' }}
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-11 h-11 rounded-2xl bg-slate-950/40 border border-white/10 flex items-center justify-center ${f.iconColor}`}>
                      {f.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white">{f.title}</div>
                      <div className="text-sm text-slate-400 mt-1 leading-relaxed">{f.desc}</div>
                      {hovered === f.title && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="mt-3 text-[13px] text-slate-200/90 leading-relaxed"
                        >
                          {f.detail}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

