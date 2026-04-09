import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ImageUp, Save, Shuffle, User2 } from 'lucide-react';
import { setupProfile } from '../../api';
import { useStore } from '../../store/useStore';

type AvatarPreset = {
  bg: string;
  skin: string;
  hair: string;
  hair2: string;
  beard: string;
  shirt: string;
  shirt2: string;
  hairStyle: 0 | 1 | 2 | 3 | 4;
  outfit: 0 | 1 | 2 | 3;
  hasBeard: boolean;
  hasMoustache: boolean;
  hasGlasses: boolean;
};

const AVATAR_PRESETS: AvatarPreset[] = [
  { bg: '#D6DEE2', skin: '#F2C6A8', hair: '#111827', hair2: '#0F172A', beard: '#0F172A', shirt: '#0F3D3E', shirt2: '#263A52', hairStyle: 0, outfit: 1, hasBeard: true, hasMoustache: false, hasGlasses: false },
  { bg: '#D9E2E6', skin: '#EAB698', hair: '#1F2937', hair2: '#111827', beard: '#111827', shirt: '#143B5A', shirt2: '#2C3E50', hairStyle: 3, outfit: 0, hasBeard: true, hasMoustache: true, hasGlasses: false },
  { bg: '#CFD8DC', skin: '#EEC3A4', hair: '#202124', hair2: '#1C1917', beard: '#1C1917', shirt: '#18484E', shirt2: '#263A52', hairStyle: 1, outfit: 2, hasBeard: false, hasMoustache: false, hasGlasses: true },
  { bg: '#DCE4E7', skin: '#E7B893', hair: '#0F172A', hair2: '#111827', beard: '#111827', shirt: '#1B3A57', shirt2: '#143B5A', hairStyle: 2, outfit: 0, hasBeard: true, hasMoustache: false, hasGlasses: true },
  { bg: '#D1DADD', skin: '#F1C2A2', hair: '#1C1917', hair2: '#202124', beard: '#202124', shirt: '#2C3E50', shirt2: '#263A52', hairStyle: 4, outfit: 3, hasBeard: false, hasMoustache: false, hasGlasses: false },

  { bg: '#D6DEE2', skin: '#D7A889', hair: '#111827', hair2: '#0F172A', beard: '#0F172A', shirt: '#143B5A', shirt2: '#18484E', hairStyle: 2, outfit: 1, hasBeard: true, hasMoustache: false, hasGlasses: false },
  { bg: '#D9E2E6', skin: '#C99572', hair: '#202124', hair2: '#1F2937', beard: '#1F2937', shirt: '#0F3D3E', shirt2: '#2C3E50', hairStyle: 0, outfit: 0, hasBeard: true, hasMoustache: true, hasGlasses: true },
  { bg: '#CFD8DC', skin: '#B9825F', hair: '#0F172A', hair2: '#111827', beard: '#111827', shirt: '#263A52', shirt2: '#2C3E50', hairStyle: 3, outfit: 2, hasBeard: false, hasMoustache: false, hasGlasses: false },
  { bg: '#DCE4E7', skin: '#A87352', hair: '#1F2937', hair2: '#111827', beard: '#111827', shirt: '#18484E', shirt2: '#0F3D3E', hairStyle: 1, outfit: 0, hasBeard: true, hasMoustache: false, hasGlasses: true },
  { bg: '#D1DADD', skin: '#956444', hair: '#202124', hair2: '#1C1917', beard: '#1C1917', shirt: '#143B5A', shirt2: '#1B3A57', hairStyle: 4, outfit: 3, hasBeard: true, hasMoustache: false, hasGlasses: false },

  // additional 5 for variety (lighter/darker + glasses/hair)
  { bg: '#D6DEE2', skin: '#F6D2BB', hair: '#1F2937', hair2: '#111827', beard: '#111827', shirt: '#1B3A57', shirt2: '#2C3E50', hairStyle: 1, outfit: 0, hasBeard: false, hasMoustache: false, hasGlasses: true },
  { bg: '#D9E2E6', skin: '#F0C9B3', hair: '#0F172A', hair2: '#111827', beard: '#111827', shirt: '#0F3D3E', shirt2: '#18484E', hairStyle: 2, outfit: 2, hasBeard: true, hasMoustache: false, hasGlasses: false },
  { bg: '#CFD8DC', skin: '#D19E7C', hair: '#202124', hair2: '#1C1917', beard: '#1C1917', shirt: '#2C3E50', shirt2: '#263A52', hairStyle: 0, outfit: 1, hasBeard: true, hasMoustache: true, hasGlasses: false },
  { bg: '#DCE4E7', skin: '#B07A58', hair: '#111827', hair2: '#0F172A', beard: '#0F172A', shirt: '#143B5A', shirt2: '#1B3A57', hairStyle: 3, outfit: 0, hasBeard: false, hasMoustache: false, hasGlasses: true },
  { bg: '#D1DADD', skin: '#8A5A3E', hair: '#1C1917', hair2: '#202124', beard: '#202124', shirt: '#18484E', shirt2: '#0F3D3E', hairStyle: 4, outfit: 3, hasBeard: true, hasMoustache: false, hasGlasses: true },
];

function avatarSvgFromPreset(p: AvatarPreset) {
  const eyeY = 58;
  const mouthY = 74;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
  <circle cx="64" cy="64" r="58" fill="${p.bg}"/>
  <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(15,23,42,0.10)" stroke-width="2"/>

  ${
    p.outfit === 0
      ? `<path d="M18 124c7-26 26-42 46-42s39 16 46 42" fill="${p.shirt}" opacity="0.95"/>`
      : p.outfit === 1
        ? `<path d="M18 124c7-26 26-42 46-42s39 16 46 42" fill="${p.shirt2}" opacity="0.95"/><path d="M44 86c6 8 14 12 20 12s14-4 20-12" fill="rgba(255,255,255,0.10)"/>`
        : p.outfit === 2
          ? `<path d="M18 124c7-26 26-42 46-42s39 16 46 42" fill="${p.shirt}" opacity="0.95"/><path d="M54 86h20l-10 16z" fill="rgba(255,255,255,0.12)"/>`
          : `<path d="M18 124c7-26 26-42 46-42s39 16 46 42" fill="${p.shirt2}" opacity="0.95"/><path d="M48 90h32" stroke="rgba(255,255,255,0.16)" stroke-width="5" stroke-linecap="round"/>`
  }

  <path d="M56 76c0 8 4 12 8 12s8-4 8-12" fill="${p.skin}" opacity="0.95"/>
  <circle cx="64" cy="60" r="24" fill="${p.skin}"/>

  ${
    p.hairStyle === 0
      ? `<path d="M40 60c2-18 16-28 24-28s22 10 24 28c-5-8-13-12-24-12S45 52 40 60z" fill="${p.hair}"/>`
      : p.hairStyle === 1
        ? `<path d="M38 62c0-20 14-32 26-32s26 12 26 32c-7-11-15-15-26-15S45 51 38 62z" fill="${p.hair}"/><path d="M44 40c4-7 10-10 20-10s16 3 20 10" fill="${p.hair2}" opacity="0.7"/>`
        : p.hairStyle === 2
          ? `<path d="M42 40c8-9 18-12 22-12s14 3 22 12c-7 2-11 6-12 10-4-6-8-8-10-8s-6 2-10 8c-1-4-5-8-12-10z" fill="${p.hair}"/>`
          : p.hairStyle === 3
            ? `<path d="M36 62c2-22 16-34 28-34s26 12 28 34c-8-12-18-16-28-16S44 50 36 62z" fill="${p.hair}"/><path d="M50 34c3 8 7 12 14 12s11-4 14-12" fill="${p.hair2}" opacity="0.75"/>`
            : `<path d="M40 58c0-18 12-30 24-30s24 12 24 30c-6-9-14-13-24-13s-18 4-24 13z" fill="${p.hair}"/>`
  }

  <circle cx="54" cy="${eyeY}" r="3.05" fill="rgba(15,23,42,0.78)"/>
  <circle cx="74" cy="${eyeY}" r="3.05" fill="rgba(15,23,42,0.78)"/>
  <circle cx="53" cy="${eyeY - 1}" r="1.05" fill="rgba(255,255,255,0.65)"/>
  <circle cx="73" cy="${eyeY - 1}" r="1.05" fill="rgba(255,255,255,0.65)"/>

  <path d="M48 52c3-2 6-3 10-2" stroke="rgba(15,23,42,0.40)" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M70 50c4-1 7 0 10 2" stroke="rgba(15,23,42,0.40)" stroke-width="3" stroke-linecap="round" fill="none"/>

  ${
    p.hasGlasses
      ? `<rect x="45" y="54" width="16" height="10" rx="4" fill="none" stroke="rgba(15,23,42,0.35)" stroke-width="2"/><rect x="67" y="54" width="16" height="10" rx="4" fill="none" stroke="rgba(15,23,42,0.35)" stroke-width="2"/><path d="M61 59h6" stroke="rgba(15,23,42,0.35)" stroke-width="2" stroke-linecap="round"/>`
      : ''
  }

  ${p.hasBeard ? `<path d="M44 70c2 14 10 22 20 22s18-8 20-22c-6 6-12 9-20 9s-14-3-20-9z" fill="${p.beard}" opacity="0.92"/>` : ''}
  ${p.hasMoustache ? `<path d="M52 72c4 3 8 4 12 4s8-1 12-4" stroke="${p.beard}" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.9"/>` : ''}

  <path d="M56 ${mouthY}c4 4 12 4 16 0" stroke="rgba(15,23,42,0.40)" stroke-width="3" stroke-linecap="round" fill="none"/>
  <circle cx="92" cy="34" r="10" fill="rgba(255,255,255,0.18)"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h | 0;
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function ProfileSetup() {
  const { userEmail, userPhotoUrl, setUserSession } = useStore();
  const [displayName, setDisplayName] = useState('');
  const [photoUrl, setPhotoUrl] = useState(userPhotoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initial = useMemo(() => {
    const base = (userEmail ?? '').split('@')[0] ?? '';
    return base.replace(/[._-]+/g, ' ').trim();
  }, [userEmail]);

  const avatarOptions = useMemo(() => {
    return AVATAR_PRESETS.map((p, i) => ({ seed: `preset-${i + 1}`, src: avatarSvgFromPreset(p) }));
  }, []);

  if (!userEmail) return null;

  const canSave = displayName.trim().length >= 2 && !saving;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await setupProfile(userEmail, displayName.trim(), photoUrl.trim());
      const user = res?.user;
      setUserSession(user?.email ?? userEmail, user?.display_name ?? displayName.trim(), user?.photo_url ?? (photoUrl.trim() || null));
    } catch (err: any) {
      setError(err?.message || 'Profile setup failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = async (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (f.size > 2.5 * 1024 * 1024) {
      setError('Image is too large. Please use an image under 2.5MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(String(reader.result || ''));
    reader.readAsDataURL(f);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 22 }}
        className="w-full max-w-lg rounded-2xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-xl shadow-[0_0_80px_rgba(99,102,241,0.08)] p-7"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <User2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Finish your profile
            </div>
            <div className="text-sm text-slate-400">Used for your exports and progress.</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={initial || 'e.g. Mayank'}
              autoFocus
              className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Camera className="w-3.5 h-3.5" />
              Choose an avatar (15) or upload
            </label>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-700/70 bg-slate-900 shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                    {(displayName || initial || '?')[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200 truncate">Profile image</div>
                <div className="text-xs text-slate-500 truncate">
                  {photoUrl?.startsWith('data:image/') ? 'Uploaded image' : photoUrl ? 'Selected avatar' : 'Not set'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={saving}
                  className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <ImageUp className="w-4 h-4" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl(avatarOptions[Math.floor(Math.random() * avatarOptions.length)]?.src || '')}
                  disabled={saving}
                  className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Shuffle className="w-4 h-4" />
                  Random
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {avatarOptions.map((a) => (
                <button
                  key={a.seed}
                  type="button"
                  onClick={() => setPhotoUrl(a.src)}
                  disabled={saving}
                  className={`aspect-square rounded-2xl overflow-hidden border transition-all ${
                    photoUrl === a.src
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  title="Select avatar"
                >
                  <img src={a.src} alt="" className="w-full h-full object-cover" style={{ borderRadius: 9999 }} />
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSave}
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (
              <>
                <Save className="w-4 h-4" />
                Save profile
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

