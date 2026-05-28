import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { ROLE_DEFS } from '../../utils/roles'

export default function HistoryScreen() {
  const navigate = useNavigate()
  const history  = useGameStore(s => s.gameHistory)

  return (
    <div className="min-h-screen px-4 py-10"
         style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 20%, #1E1508 0%, #1A1410 80%)' }}>

      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <button className="btn-ghost mb-6" onClick={() => navigate('/')}>← Back</button>

          <div className="text-center mb-8">
            <p className="font-mono text-[0.65rem] tracking-[0.3em] text-gold uppercase mb-2">Archive</p>
            <h2 className="font-serif font-black text-4xl">Game History</h2>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-16 border border-white/[0.06] rounded-sm bg-white/[0.02]">
              <p className="text-5xl mb-4 opacity-30">🂠</p>
              <p className="font-body italic text-cream/40">No games played yet.</p>
              <p className="font-mono text-[0.65rem] text-cream/25 uppercase tracking-wider mt-2">
                Completed games will appear here
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {history.map((result, idx) => {
                const isMafia = result.winner === 'mafia'
                return (
                  <motion.div key={result.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="border border-white/[0.08] rounded-sm bg-white/[0.02] overflow-hidden">

                    {/* Card header */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b border-white/[0.06] ${
                      isMafia ? 'bg-crimson/[0.06]' : 'bg-green-900/[0.08]'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-[0.6rem] tracking-[0.2em] uppercase px-2 py-1 rounded-sm border ${
                          isMafia
                            ? 'border-crimson/40 bg-crimson/12 text-crimson'
                            : 'border-green-500/35 bg-green-500/10 text-green-400'
                        }`}>
                          {isMafia ? '🩸 Mafia Won' : '🏡 Village Won'}
                        </span>
                        <span className="font-mono text-[0.58rem] text-cream/30 uppercase">
                          {result.rounds} rounds
                        </span>
                      </div>
                      <span className="font-mono text-[0.58rem] text-cream/25">
                        {new Date(result.endedAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Players */}
                    <div className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {result.players.map(p => {
                          const def = ROLE_DEFS[p.role]
                          return (
                            <div key={p.name}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border text-xs transition-opacity ${
                                p.survived
                                  ? 'border-white/12 bg-white/[0.03] text-cream/75'
                                  : 'border-crimson/15 bg-crimson/[0.04] text-cream/35 line-through'
                              }`}>
                              <span>{def?.icon}</span>
                              <span className="font-body">{p.name}</span>
                            </div>
                          )
                        })}
                      </div>
                      <p className="font-mono text-[0.55rem] text-cream/20 mt-2 uppercase tracking-wider">
                        Narrator: {result.narratorName}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
