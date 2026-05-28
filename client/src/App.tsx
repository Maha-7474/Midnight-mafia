import { Routes, Route, Navigate } from 'react-router-dom'
import { useSocket } from './hooks/useSocket'
import LandingScreen    from './components/screens/LandingScreen'
import LobbyScreen      from './components/screens/LobbyScreen'
import RoleRevealScreen from './components/screens/RoleRevealScreen'
import GameBoardScreen  from './components/screens/GameBoardScreen'
import EndScreen        from './components/screens/EndScreen'
import HistoryScreen    from './components/screens/HistoryScreen'
import AudioControl     from './components/ui/AudioControl'
import { useGameStore } from './store/gameStore'

export default function App() {
  useSocket()   // initialise socket connection
  const room = useGameStore(s => s.room)

  return (
    <div className="relative min-h-screen">
      <AudioControl />
      <Routes>
        <Route path="/"         element={<LandingScreen />} />
        <Route path="/lobby"    element={<LobbyScreen />} />
        <Route path="/reveal"   element={<RoleRevealScreen />} />
        <Route path="/game"     element={<GameBoardScreen />} />
        <Route path="/end"      element={<EndScreen />} />
        <Route path="/history"  element={<HistoryScreen />} />
        <Route path="*"         element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
