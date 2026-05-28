import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { getSocket } from '../../hooks/useSocket'
import { useGameStore } from '../../store/gameStore'
import { ROLE_DEFS } from '../../utils/roles'
import type { Phase, Team, Player } from '../../types/game'

const PHASE_LABELS: Record<Phase, string> = {
  lobby: 'Lobby', 'role-reveal': 'Reveal', night: 'Night', day: 'Day', voting: 'Vote', ended: 'End',
}

export default function GameBoardScreen() {
  const navigate  = useNavigate()
  const socket    = getSocket()
  const store     = useGameStore()
  const room      = store.room
  const me        = store.getMe()
  const isNarrator = me?.isNarrator ?? false

  // Timer
  const [timerSecs, setTimerSecs] = useState(120)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Announcement modal
  const [announcement, setAnnouncement] = useState<{ title: string; body: string } | null>(null)

  useEffect(() => {
    if (room?.phase === 'ended') navigate('/end')
  }, [room?.phase])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSecs(s => { if (s <= 1) { stopTimer(); return 0 } return s - 1 })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  function startTimer(s: number) { setTimerSecs(s); setTimerRunning(false) }
  function stopTimer() { setTimerRunning(false); if (timerRef.current) clearInterval(timerRef.current) }
  function toggleTimer() { setTimerRunning(r => !r) }

  function setPhase(phase: Phase) { socket.emit('phase:set', phase) }
  function eliminate(id: string) { socket.emit('player:eliminate', id) }
  function restore(id: string)   { socket.emit('player:restore', id) }
  function endGame(winner: Team) { socket.emit('game:end', winner); setAnnouncement(null) }

  const timerMins = Math.floor(timerSecs / 60)
  const timerSec2 = timerSecs % 60
  const timerStr  = `${timerMins}:${timerSec2.toString().padStart(2, '0')}`
  const timerUrgent = timerSecs <= 10 && timerSecs > 0

  const phaseColor: Record<string, string> = {
    day:   'text-gold border-gold/40',
    night: 'text-blue-300 border-blue-300/40',
    voting:'text-crimson border-crimson/40',
    lobby: 'text-cream/40 border-white/15',
    'role-reveal': 'text-cream/40 border-white/15',
    ended: 'text-cream/40 border-white/15',
  }

  if (!room) { navigate('/'); return null }

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 0%, #1A1208 0%, #0E0B06 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/25">
        <span className="font-serif font-bold text-lg text-gold tracking-wider">OMERTÀ</span>
        <span className={`font-mono text-[0.65rem] tracking-[0.2em] uppercase px-3 py-1 border rounded-sm transition-all ${phaseColor[room.phase] ?? 'text-cream/40 border-white/15'}`}>
          {PHASE_LABELS[room.phase]} · Round {room.round}
        </span>
        {isNarrator && (
          <button className="btn-ghost text-[0.6rem]"
            onClick={() => setAnnouncement({ title: 'End Game?', body: '__endgame__' })}>
            End Game
          </button>
        )}
        {!isNarrator && <div className="w-20" />}
      </div>

      {/* Body */}
      <div className={`flex flex-1 overflow-hidden ${isNarrator ? 'flex-row' : 'flex-col'}`}>

        {/* Players panel */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
            <p className="font-mono text-[0.62rem] tracking-[0.2em] text-cream/35 uppercase">
              Players
            </p>
            {isNarrator && (
              <p className="font-mono text-[0.55rem] tracking-wider text-gold/60 uppercase">
                Narrator View
              </p>
            )}
          </div>

          {/* Role legend (narrator only) */}
          {isNarrator && (
            <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-white/[0.04]">
              {Object.values(ROLE_DEFS).map(d => {
                const count = room.players.filter(p => p.role === d.key).length
                if (!count) return null
                return (
                  <span key={d.key}
                    className="font-mono text-[0.58rem] px-2 py-1 rounded-sm border border-crimson/25 bg-crimson/6 text-crimson/75">
                    {d.icon} {count}× {d.label}
                  </span>
                )
              })}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {room.players.map(player => (
                <PlayerRow key={player.id}
                  player={player} isNarrator={isNarrator}
                  myId={me?.id ?? ''}
                  voteTally={store.voteTally}
                  totalVoters={store.getAlivePlayers().length}
                  phase={room.phase}
                  onEliminate={eliminate}
                  onRestore={restore}
                  onVote={(id) => socket.emit('vote:cast', id)}
                  myVoteTarget={me?.voteTarget ?? null}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Narrator control panel */}
        {isNarrator && (
          <div className="w-72 border-l border-white/[0.06] p-4 flex flex-col gap-3 overflow-y-auto bg-black/20">

            {/* Timer */}
            <p className="font-mono text-[0.6rem] tracking-[0.2em] text-cream/30 uppercase">Timer</p>
            <div className={`text-center font-mono text-3xl font-bold transition-colors ${timerUrgent ? 'text-crimson animate-pulse' : 'text-gold'}`}>
              {timerStr}
            </div>
            <div className="flex gap-1">
              {[60, 120, 180].map(s => (
                <button key={s} onClick={() => startTimer(s)}
                  className="flex-1 font-mono text-[0.6rem] tracking-wide border border-white/15 text-cream/50 py-1 rounded-sm hover:border-white/30 hover:text-cream transition-all">
                  {s / 60}m
                </button>
              ))}
              <button onClick={toggleTimer}
                className={`flex-1 font-mono text-[0.6rem] tracking-wide border py-1 rounded-sm transition-all ${timerRunning ? 'border-crimson text-crimson' : 'border-gold/50 text-gold'}`}>
                {timerRunning ? 'Pause' : 'Start'}
              </button>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Phase buttons */}
            <p className="font-mono text-[0.6rem] tracking-[0.2em] text-cream/30 uppercase">Phase</p>
            <CtrlBtn icon="☀️" label="Day Phase"    cls="text-gold   border-gold/30   hover:bg-gold/8"   onClick={() => setPhase('day')} />
            <CtrlBtn icon="🌙" label="Night Phase"  cls="text-blue-300 border-blue-300/30 hover:bg-blue-300/6" onClick={() => setPhase('night')} />
            <CtrlBtn icon="⚖️" label="Voting Phase" cls="text-crimson border-crimson/30 hover:bg-crimson/8" onClick={() => setPhase('voting')} />

            <div className="h-px bg-white/[0.06]" />

            {/* End game */}
            <p className="font-mono text-[0.6rem] tracking-[0.2em] text-cream/30 uppercase">Declare Winner</p>
            <CtrlBtn icon="🩸" label="Mafia Wins"   cls="text-crimson/80 border-crimson/25 hover:bg-crimson/6" onClick={() => endGame('mafia')} />
            <CtrlBtn icon="🏡" label="Village Wins" cls="text-green-400/80 border-green-400/25 hover:bg-green-400/6" onClick={() => endGame('village')} />

            <div className="h-px bg-white/[0.06]" />

            {/* Game log */}
            <p className="font-mono text-[0.6rem] tracking-[0.2em] text-cream/30 uppercase">Log</p>
            <div className="flex-1 max-h-48 overflow-y-auto border border-white/[0.06] rounded-sm bg-black/15 p-2">
              {[...room.log].reverse().map(entry => (
                <div key={entry.id} className="font-mono text-[0.6rem] text-cream/40 py-0.5 border-b border-white/[0.03] last:border-0">
                  <span className="text-gold/30 mr-1">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={entry.type === 'elimination' ? 'text-crimson/70' : ''}>
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Announcement modal */}
      <AnimatePresence>
        {announcement && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40" onClick={() => setAnnouncement(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm bg-charcoal border border-gold/30 rounded-sm p-8 text-center"
              style={{ boxShadow: '0 0 80px rgba(0,0,0,0.8)' }}>
              <h3 className="font-serif font-bold text-2xl text-gold mb-4">{announcement.title}</h3>
              {announcement.body === '__endgame__' ? (
                <div className="flex gap-3 justify-center mt-2">
                  <button className="btn-danger" onClick={() => endGame('mafia')}>Mafia Wins</button>
                  <button className="btn-secondary" onClick={() => endGame('village')}>Village Wins</button>
                </div>
              ) : (
                <p className="font-body text-cream/70 leading-relaxed mb-4">{announcement.body}</p>
              )}
              <button className="btn-ghost mt-4 w-full" onClick={() => setAnnouncement(null)}>Dismiss</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────

function CtrlBtn({ icon, label, cls, onClick }: { icon: string; label: string; cls: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 border rounded-sm font-mono text-[0.68rem] tracking-wider transition-all ${cls}`}>
      <span>{icon}</span><span>{label}</span>
    </button>
  )
}

function PlayerRow({ player, isNarrator, myId, voteTally, totalVoters, phase, onEliminate, onRestore, onVote, myVoteTarget }: {
  player: Player; isNarrator: boolean; myId: string
  voteTally: Record<string, number>; totalVoters: number
  phase: Phase
  onEliminate: (id: string) => void; onRestore: (id: string) => void
  onVote: (id: string) => void; myVoteTarget: string | null
}) {
  const def    = ROLE_DEFS[player.role ?? 'villager']
  const votes  = voteTally[player.id] ?? 0
  const pct    = totalVoters > 0 ? (votes / totalVoters) * 100 : 0
  const isMe   = player.id === myId
  const canVote = phase === 'voting' && !isNarrator && !isMe && player.isAlive && !player.isNarrator

  return (
    <motion.div layout
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-3 border rounded-sm transition-all relative overflow-hidden ${
        !player.isAlive ? 'opacity-40 border-crimson/15' :
        player.isNarrator ? 'border-purple-400/20 bg-purple-400/[0.03]' :
        'border-white/[0.08] bg-white/[0.02]'
      }`}>

      {/* Strikethrough for eliminated */}
      {!player.isAlive && (
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="w-full h-px bg-crimson/50" />
        </div>
      )}

      {/* Vote bar background */}
      {phase === 'voting' && pct > 0 && (
        <div className="absolute inset-0 bg-crimson/10 transition-all duration-500"
          style={{ width: `${pct}%` }} />
      )}

      {/* Avatar */}
      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 ${
        !player.isAlive ? 'bg-crimson/10 border border-crimson/20 text-crimson/50' :
        'bg-crimson/12 border border-crimson/22 text-crimson'
      }`}>
        {player.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-body text-cream text-sm truncate">{player.name}</span>
          {isMe && <span className="font-mono text-[0.55rem] text-cream/35 uppercase">you</span>}
          {!player.isAlive && <span className="font-mono text-[0.55rem] text-crimson/55 uppercase">eliminated</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Role pill — always shown to narrator, hidden to others */}
          {(isNarrator || isMe) && (
            <span className="font-mono text-[0.55rem] px-1.5 py-0.5 rounded-sm border border-crimson/25 bg-crimson/6 text-crimson/70">
              {def.icon} {def.label}
            </span>
          )}
          {/* Vote count */}
          {phase === 'voting' && votes > 0 && (
            <span className="font-mono text-[0.58rem] text-crimson">
              {votes} vote{votes !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="relative z-10 flex items-center gap-1 flex-shrink-0">
        {/* Vote button */}
        {canVote && (
          <button onClick={() => onVote(player.id)}
            className={`w-7 h-7 rounded-full font-mono text-sm flex items-center justify-center border transition-all ${
              myVoteTarget === player.id
                ? 'bg-crimson/25 border-crimson text-crimson'
                : 'border-crimson/25 text-crimson/50 hover:bg-crimson/15 hover:border-crimson/60'
            }`}>
            ✓
          </button>
        )}
        {/* Narrator eliminate / restore */}
        {isNarrator && !player.isNarrator && (
          player.isAlive ? (
            <button onClick={() => onEliminate(player.id)}
              className="w-7 h-7 rounded-full border border-crimson/30 text-crimson/55 text-xs flex items-center justify-center hover:bg-crimson/15 hover:text-crimson hover:border-crimson transition-all">
              ✕
            </button>
          ) : (
            <button onClick={() => onRestore(player.id)}
              className="w-7 h-7 rounded-full border border-green-500/30 text-green-500/55 text-xs flex items-center justify-center hover:bg-green-500/15 hover:text-green-400 transition-all">
              ↩
            </button>
          )
        )}
      </div>
    </motion.div>
  )
}
