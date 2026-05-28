import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ROLE_DEFS } from '../../utils/roles'
import { sound } from '../../sounds/soundManager'
import type { RoleKey } from '../../types/game'

export default function RoleRevealScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const room     = store.room

  const [currentIdx, setCurrentIdx]   = useState(0)
  const [showCard, setShowCard]       = useState(false)

  // Build reveal order once: narrator last
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    if (!room) { navigate('/'); return }
    const narrator  = room.players.find(p => p.isNarrator)
    const others    = room.players.filter(p => !p.isNarrator)
    setOrder([...others.map(p => p.id), ...(narrator ? [narrator.id] : [])])
  }, [])

  useEffect(() => {
    if (room?.phase === 'night' || room?.phase === 'day') navigate('/game')
  }, [room?.phase])

  if (!room || order.length === 0) return null

  const currentPlayerId = order[currentIdx]
  const currentPlayer   = room.players.find(p => p.id === currentPlayerId)!
  const myRole          = currentPlayer?.role as RoleKey
  const def             = ROLE_DEFS[myRole]
  const isLast          = currentIdx === order.length - 1

  function reveal() {
    setShowCard(true)
    sound.play('flip')
  }

  function next() {
    setShowCard(false)
    setTimeout(() => {
      if (isLast) {
        navigate('/game')
      } else {
        setCurrentIdx(i => i + 1)
      }
    }, 300)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 text-center"
         style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #3D2A10 0%, #1A1008 100%)' }}>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {order.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < currentIdx ? 'bg-gold' : i === currentIdx ? 'bg-crimson shadow-[0_0_8px_#8B1A1A]' : 'bg-white/15'
          }`} />
        ))}
      </div>

      {/* Player name */}
      <motion.p key={`ind-${currentIdx}`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="font-mono text-[0.68rem] tracking-[0.25em] text-cream/45 uppercase mb-1">
        Player {currentIdx + 1} of {order.length}
      </motion.p>

      <motion.h2 key={`name-${currentIdx}`}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="font-serif font-bold text-2xl text-cream mb-6">
        {currentPlayer?.name}
      </motion.h2>

      {/* Card */}
      <div className="w-full max-w-[240px] mx-auto mb-6">
        <AnimatePresence mode="wait">
          {!showCard ? (
            /* Face-down card */
            <motion.div key="cover"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={reveal}
              className="playing-card cursor-pointer select-none hover:-translate-y-1 hover:rotate-1 transition-transform"
              style={{ maxWidth: 240 }}>
              {/* crosshatch back */}
              <div className="absolute inset-[10px] rounded-lg pointer-events-none"
                style={{
                  border: '1.5px solid rgba(139,26,26,0.4)',
                  backgroundImage: `
                    repeating-linear-gradient(45deg,rgba(139,26,26,.06) 0px,rgba(139,26,26,.06) 1px,transparent 1px,transparent 8px),
                    repeating-linear-gradient(-45deg,rgba(139,26,26,.06) 0px,rgba(139,26,26,.06) 1px,transparent 1px,transparent 8px)
                  `
                }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-2">
                <span className="text-6xl opacity-10 text-crimson">♠</span>
                <p className="font-body italic text-crimson text-sm">Tap to reveal your role</p>
                <p className="font-mono text-[0.62rem] text-crimson/45 uppercase tracking-wide">
                  Ensure privacy
                </p>
              </div>
            </motion.div>
          ) : (
            /* Face-up role card */
            <motion.div key="card"
              initial={{ rotateY: 90, scale: 0.85, opacity: 0 }}
              animate={{ rotateY: 0,  scale: 1,    opacity: 1 }}
              transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
              className="playing-card select-none"
              style={{ maxWidth: 240 }}>

              {/* Corner pips */}
              {['tl','br'].map(pos => (
                <div key={pos} className={`absolute flex flex-col items-center z-20 ${
                  pos === 'tl' ? 'top-3 left-4' : 'bottom-3 right-4 rotate-180'
                }`} style={{ color: '#8B1A1A' }}>
                  <span className="font-serif font-black text-base leading-none">{def.pip}</span>
                  <span className="text-xs leading-none mt-px">{def.suit}</span>
                </div>
              ))}

              {/* Body */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 text-center">
                <p className="font-mono text-[0.52rem] tracking-[0.28em] uppercase mb-1"
                   style={{ color: 'rgba(139,26,26,0.5)' }}>
                  your role
                </p>
                <p className="font-script leading-none mb-1"
                   style={{ fontSize: '3rem', color: '#8B1A1A' }}>
                  {def.label}
                </p>
                <div className="w-10 h-px my-2" style={{ background: 'rgba(139,26,26,0.3)' }} />
                <span className="text-4xl leading-none mb-3">{def.icon}</span>
                <p className="font-body italic text-[0.74rem] leading-relaxed"
                   style={{ color: 'rgba(139,26,26,0.68)' }}>
                  {def.task}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next button */}
      <AnimatePresence>
        {showCard && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="btn-secondary" onClick={next}>
            {isLast ? 'Begin the Game →' : 'Next Player →'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
