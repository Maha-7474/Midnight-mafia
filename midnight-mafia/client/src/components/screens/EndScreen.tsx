import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ROLE_DEFS } from '../../utils/roles'

export default function EndScreen() {
  const navigate = useNavigate()
  const store    = useGameStore()
  const result   = store.gameHistory[0]
  const cardRef  = useRef<HTMLDivElement>(null)

  if (!result) { navigate('/'); return null }

  const isMafiaWin = result.winner === 'mafia'

  async function shareCard() {
    if (!cardRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#1A1410' })
      const link   = document.createElement('a')
      link.download = `midnight-mafia-${result.id}.png`
      link.href    = canvas.toDataURL()
      link.click()
    } catch {
      alert('Could not capture the card. Try a screenshot.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 text-center"
         style={{ background: isMafiaWin
           ? 'radial-gradient(ellipse 80% 60% at 50% 30%, #2D0808 0%, #1A1410 70%)'
           : 'radial-gradient(ellipse 80% 60% at 50% 30%, #0A2D0A 0%, #1A1410 70%)' }}>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">

        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
          className={`inline-block font-mono text-[0.7rem] tracking-[0.25em] uppercase px-4 py-2 border rounded-sm mb-6 ${
            isMafiaWin ? 'border-crimson/50 bg-crimson/15 text-crimson' : 'border-green-500/45 bg-green-500/12 text-green-400'
          }`}>
          {isMafiaWin ? '🩸 Mafia Victorious' : '🏡 Village Victorious'}
        </motion.div>

        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="font-serif font-black text-5xl mb-3">
          {isMafiaWin ? 'Omertà Holds' : 'Justice Served'}
        </motion.h2>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="font-body italic text-cream/60 mb-8 leading-relaxed">
          {isMafiaWin
            ? 'The shadows prevail. The village succumbs to the code of silence.'
            : 'Truth came to light. The Mafia was expelled. Peace returns — for now.'}
        </motion.p>

        <motion.div ref={cardRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-charcoal border border-white/10 rounded-sm p-6 mb-6 text-left">

          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
            <span className="font-serif font-bold text-lg text-gold">OMERTÀ</span>
            <div className="text-right">
              <p className="font-mono text-[0.6rem] text-cream/35 uppercase tracking-wider">
                {result.rounds} rounds · {new Date(result.endedAt).toLocaleDateString()}
              </p>
              <p className={`font-mono text-[0.65rem] font-bold uppercase tracking-wider ${isMafiaWin ? 'text-crimson' : 'text-green-400'}`}>
                {isMafiaWin ? 'Mafia Won' : 'Village Won'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {result.players.map(p => {
              const def = ROLE_DEFS[p.role]
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-crimson/12 border border-crimson/20 flex items-center justify-center font-serif font-bold text-xs text-crimson flex-shrink-0">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-body text-cream text-sm flex-1">{p.name}</span>
                  <span className="font-mono text-[0.58rem] px-2 py-0.5 border border-crimson/25 bg-crimson/6 text-crimson/75 rounded-sm">
                    {def?.icon} {def?.label}
                  </span>
                  {!p.survived && (
                    <span className="font-mono text-[0.55rem] text-crimson/50">eliminated</span>
                  )}
                </div>
              )
            })}
          </div>

          <p className="font-mono text-[0.55rem] text-cream/20 uppercase tracking-wider mt-4 text-center">
            Narrator: {result.narratorName}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="flex flex-col gap-3">
          <button className="btn-gold" onClick={shareCard}>↓ Download Result Card</button>
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={() => navigate('/')}>Play Again</button>
            <button className="btn-ghost flex-1" onClick={() => { store.setRoom(null); navigate('/') }}>Exit</button>
          </div>
          <button className="btn-ghost" onClick={() => navigate('/history')}>View Game History</button>
        </motion.div>
      </motion.div>
    </div>
  )
}
