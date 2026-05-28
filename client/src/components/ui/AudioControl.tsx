import { useGameStore } from '../../store/gameStore'
import { sound } from '../../sounds/soundManager'

export default function AudioControl() {
  const { isMuted, setMuted } = useGameStore()

  function toggle() {
    const next = !isMuted
    setMuted(next)
    sound.setMuted(next)
  }

  return (
    <button
      onClick={toggle}
      className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center text-cream/60 hover:text-cream hover:border-gold/50 transition-all text-sm"
      title={isMuted ? 'Unmute' : 'Mute'}>
      {isMuted ? '🔇' : '🔊'}
    </button>
  )
}
