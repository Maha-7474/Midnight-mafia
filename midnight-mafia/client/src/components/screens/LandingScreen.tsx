import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { getSocket } from '../../hooks/useSocket'
import { useGameStore } from '../../store/gameStore'
import Particles from '../ui/Particles'
import CornerOrnaments from '../ui/CornerOrnaments'

export default function LandingScreen() {
  const navigate  = useNavigate()
  const store     = useGameStore()
  const [mode, setMode]       = useState<'idle' | 'create' | 'join'>('idle')
  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const socket = getSocket()

  async function handleCreate() {
    if (!name.trim()) { setError('Enter your name'); return }
    setLoading(true)
    socket.emit('room:create', name.trim(), (room) => {
      store.setRoom(room)
      store.setMyPlayerId(socket.id ?? '')
      navigate('/lobby')
    })
  }

  async function handleJoin() {
    if (!name.trim()) { setError('Enter your name'); return }
    if (!code.trim()) { setError('Enter the room code'); return }
    setLoading(true)
    socket.emit('room:join', code.toUpperCase(), name.trim(), (room, err) => {
      if (err || !room) { setError(err ?? 'Room not found'); setLoading(false); return }
      store.setRoom(room)
      store.setMyPlayerId(socket.id ?? '')
      navigate('/lobby')
    })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
         style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #2D2010 0%, #1A1410 70%)' }}>

      <Particles />
      <CornerOrnaments />

      <div className="relative z-10 text-center max-w-lg px-6">

        {/* Spade */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }} className="mb-6">
          <svg className="w-20 h-20 mx-auto drop-shadow-[0_0_20px_rgba(139,26,26,0.6)]"
               viewBox="0 0 90 90" fill="none">
            <path d="M45 8C45 8 10 32 10 52C10 64 20 70 32 66C28 72 26 80 26 80H64C64 80 62 72 58 66C70 70 80 64 80 52C80 32 45 8 45 8Z"
              fill="url(#spadeG)" />
            <defs>
              <linearGradient id="spadeG" x1="45" y1="8" x2="45" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C0392B" />
                <stop offset="100%" stopColor="#7B241C" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Eyebrow */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="font-mono text-[0.7rem] tracking-[0.35em] text-gold uppercase mb-3">
          — A Game of Deception —
        </motion.p>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="font-serif font-black leading-none mb-3"
          style={{ fontSize: 'clamp(3.5rem, 12vw, 6rem)', letterSpacing: '-0.02em' }}>
          OMER<span className="text-crimson">TÀ</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="font-body italic text-cream/70 mb-8 leading-relaxed">
          The code of silence. The law of the streets.<br />Only one side walks away.
        </motion.p>

        {/* Divider */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="flex items-center gap-3 max-w-xs mx-auto mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold/60" />
          <div className="w-2 h-2 bg-gold rotate-45 flex-shrink-0" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/60" />
        </motion.div>

        {/* Mode select */}
        {mode === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary" onClick={() => setMode('create')}>
              Create Room
            </button>
            <button className="btn-secondary" onClick={() => setMode('join')}>
              Join Room
            </button>
            <button className="btn-ghost" onClick={() => navigate('/history')}>
              History
            </button>
          </motion.div>
        )}

        {/* Create form */}
        {mode === 'create' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 max-w-xs mx-auto">
            <input className="game-input" placeholder="Your name…"
              value={name} onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus maxLength={24} />
            {error && <p className="font-mono text-xs text-red-400">{error}</p>}
            <button className="btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating…' : 'Create Game'}
            </button>
            <button className="btn-ghost" onClick={() => { setMode('idle'); setError('') }}>
              ← Back
            </button>
          </motion.div>
        )}

        {/* Join form */}
        {mode === 'join' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 max-w-xs mx-auto">
            <input className="game-input" placeholder="Your name…"
              value={name} onChange={e => { setName(e.target.value); setError('') }}
              maxLength={24} autoFocus />
            <input className="game-input uppercase tracking-widest text-center text-lg"
              placeholder="ROOM CODE"
              value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()} maxLength={4} />
            {error && <p className="font-mono text-xs text-red-400">{error}</p>}
            <button className="btn-primary" onClick={handleJoin} disabled={loading}>
              {loading ? 'Joining…' : 'Join Game'}
            </button>
            <button className="btn-ghost" onClick={() => { setMode('idle'); setError('') }}>
              ← Back
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
