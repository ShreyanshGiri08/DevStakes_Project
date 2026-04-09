import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { setupProfile } from '../../api';
import { Orbit } from 'lucide-react';

// 15 diverse avatar options
const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sage',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Atlas',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Storm',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=River',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Cyber',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot3',
];

export default function ProfileSetup() {
  const { userEmail, setUserSession } = useStore();
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userEmail) return;
    setLoading(true);
    try {
      await setupProfile(userEmail, name, photo);
      setUserSession(userEmail, name, photo);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900 to-black z-0" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="z-10 p-10 glass-panel rounded-3xl max-w-lg w-full border border-slate-700/50 shadow-2xl shadow-blue-500/20"
      >
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40"
          >
            <Orbit className="w-7 h-7 text-white" />
          </motion.div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Complete Profile
        </h1>
        <p className="text-slate-400 text-center mb-6">Choose your avatar and set your identity</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected avatar preview */}
          <div className="flex flex-col items-center gap-4">
            <motion.img
              key={photo}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={photo}
              alt="avatar"
              className="w-24 h-24 rounded-full border-4 border-blue-500/30 shadow-xl shadow-blue-500/20 bg-slate-800"
            />
            
            {/* Avatar grid */}
            <div className="grid grid-cols-5 gap-2 max-w-xs">
              {AVATARS.map((av, i) => (
                <motion.img
                  key={i}
                  src={av}
                  alt={`av-${i}`}
                  onClick={() => setPhoto(av)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded-full cursor-pointer border-2 transition-all bg-slate-800 ${
                    photo === av
                      ? 'border-blue-500 ring-2 ring-blue-500/30 scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="e.g. CodeMaster99"
            />
          </div>

          <button
            disabled={loading || !name}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
          >
            {loading ? 'Saving...' : 'Start Learning →'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
