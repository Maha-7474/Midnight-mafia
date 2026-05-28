import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { getSocket } from '../../hooks/useSocket'
import { useGameStore } from '../../store/gameStore'
import { getRoleComposition, ROLE_DEFS } from '../../utils/roles'

export default function LobbyScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const socket   = getSocket()
  const room     = store.room

  const [narratorId, setNarratorId] = useState<string>('__random__')
  const [copied, setCopied]         = useState(false)
  const isHost = room?.hostId === socket.id

  useEffect(() => {
    if (room?.phase === 'role-reveal') navigate('/reveal')
  }, [room?.phase])

  if (!room) { navigate('/'); return null }

  const comp = getRoleComposition(room.players.length)

  function copyCode() {
    navigator.clipboard.writeText(room!.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function startGame() {
    const narrator = narratorId === '__random__'
      ? room!.players[Math.floor(Math.random() * room!.players.length)].id
      : narratorId
    socket.emit('game:start', narrator)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
         style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 20%, #2A1A0A 0%, #1A1410 70%)' }}>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">

        <div className="text-center mb-8">
          <p className="font-mono text-[0.65rem] tracking-[0.3em] text-gold uppercase mb-2">Waiting Room</p>
          <h2 className="font-serif font-black text-4xl mb-3">The Gathering</h2>
          <button onClick={copyCode}
            className="inline-flex items-center gap-2 border border-white/20 rounded-sm px-4 py-2 hover:border-gold transition-colors">
            <span className="font-mono text-xl tracking-[0.3em] text-gold font-bold">{room.code}</span>
            <span className="font-mono text-[0.6rem] text-cream/40 uppercase tracking-wider">
              {copied ? '✓ Copied' : 'Tap to copy'}
            </span>
          </button>
        </div>

        <div className="mb-6">
          <p className="font-mono text-[0.62rem] tracking-[0.2em] text-cream/40 uppercase mb-3">
            {room.players.length} Player{room.players.length !== 1 ? 's' : ''} Joined
          </p>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {room.players.map((p) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="flex items-center gap-3 p-3 border border-white/10 rounded-sm bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-full bg-crimson/15 border border-crimson/25 flex items-center justify-center font-serif font-bold text-crimson text-sm flex-shrink-0">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-body text-cream flex-1">{p.name}</span>
                  {p.id === room.hostId && (
                    <span className="font-mono text-[0.58rem] text-gold tracking-wider uppercase border border-gold/30 px-2 py-0.5 rounded-sm">Host</span>
                  )}
                  {p.id === socket.id && (
                    <span className="font-mono text-[0.58rem] text-cream/40 tracking-wider uppercase">You</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="mb-6 p-4 border border-white/8 rounded-sm bg-black/15">
          <p className="font-mono text-[0.6rem] tracking-[0.2em] text-cream/35 uppercase mb-3">Role Composition</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(comp) as [string, number][])
              .filter(([, v]) => v > 0)
              .map(([role, count]) => {
                const def = ROLE_DEFS[role as keyof typeof ROLE_DEFS]
                return (
                  <div key={role} className="flex items-center gap-1 px-2 py-1 rounded-sm border border-crimson/25 bg-crimson/6">
                    <span className="text-sm">{def?.icon}</span>
                    <span className="font-mono text-[0.6rem] text-crimson/80 tracking-wide">{count}× {role}</span>
                  </div>
                )
              })}
          </div>
        </div>

        {isHost && (
          <div className="mb-6">
            <p className="font-mono text-[0.62rem] tracking-[0.2em] text-gold uppercase mb-3">Choose Narrator</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setNarratorId('__random__')}
                className={`p-3 text-left border rounded-sm transition-all font-body text-sm ${
                  narratorId === '__random__' ? 'border-crimson bg-crimson/10 text-cream' : 'border-white/15 text-cream/60 hover:border-white/30'
                }`}>
                🎲 Random
              </button>
              {room.players.map(p => (
                <button key={p.id} onClick={() => setNarratorId(p.id)}
                  className={`p-3 text-left border rounded-sm transition-all font-body text-sm ${
                    narratorId === p.id ? 'border-crimson bg-crimson/10 text-cream' : 'border-white/15 text-cream/60 hover:border-white/30'
                  }`}>
                  {p.name}{p.id === socket.id ? ' (You)' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {isHost ? (
          <button className="btn-primary w-full" onClick={startGame} disabled={room.players.length < 5}>
            {room.players.length < 5
              ? `Need ${5 - room.players.length} more player${5 - room.players.length !== 1 ? 's' : ''}`
              : 'Deal the Roles'}
          </button>
        ) : (
          <p className="text-center font-body italic text-cream/40 text-sm">Waiting for the host to start…</p>
        )}

        <button className="btn-ghost w-full mt-3"
          onClick={() => { socket.emit('room:leave'); store.setRoom(null); navigate('/') }}>
          Leave Room
        </button>
      </motion.div>
    </div>
  )
}
