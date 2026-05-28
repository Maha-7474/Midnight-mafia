import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Room, Player, GameResult, VoteTally } from '../types/game'

interface GameStore {
  socketId:    string | null
  isConnected: boolean
  room:        Room | null
  myPlayerId:  string | null
  revealIndex:   number
  revealOrder:   string[]
  roleShown:     boolean
  voteTally:   VoteTally
  gameHistory: GameResult[]
  isMuted:     boolean
  volume:      number

  setSocketId:     (id: string) => void
  setConnected:    (v: boolean) => void
  setRoom:         (room: Room | null) => void
  setMyPlayerId:   (id: string) => void
  setRevealIndex:  (i: number) => void
  setRevealOrder:  (order: string[]) => void
  setRoleShown:    (v: boolean) => void
  setVoteTally:    (tally: VoteTally) => void
  addGameResult:   (result: GameResult) => void
  setMuted:        (v: boolean) => void
  setVolume:       (v: number) => void

  getMe: () => Player | null
  getAlivePlayers: () => Player[]
  getEliminatedPlayers: () => Player[]
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      socketId:    null,
      isConnected: false,
      room:        null,
      myPlayerId:  null,
      revealIndex: 0,
      revealOrder: [],
      roleShown:   false,
      voteTally:   {},
      gameHistory: [],
      isMuted:     false,
      volume:      0.7,

      setSocketId:    (id) => set({ socketId: id }),
      setConnected:   (v)  => set({ isConnected: v }),
      setRoom:        (room) => set({ room }),
      setMyPlayerId:  (id) => set({ myPlayerId: id }),
      setRevealIndex: (i)  => set({ revealIndex: i }),
      setRevealOrder: (o)  => set({ revealOrder: o }),
      setRoleShown:   (v)  => set({ roleShown: v }),
      setVoteTally:   (t)  => set({ voteTally: t }),
      addGameResult:  (r)  => set(s => ({ gameHistory: [r, ...s.gameHistory].slice(0, 20) })),
      setMuted:       (v)  => set({ isMuted: v }),
      setVolume:      (v)  => set({ volume: v }),

      getMe: () => {
        const { room, myPlayerId } = get()
        return room?.players.find(p => p.id === myPlayerId) ?? null
      },
      getAlivePlayers: () => {
        const { room } = get()
        return room?.players.filter(p => p.isAlive && !p.isNarrator) ?? []
      },
      getEliminatedPlayers: () => {
        const { room } = get()
        return room?.players.filter(p => !p.isAlive) ?? []
      },
    }),
    {
      name: 'midnight-mafia',
      partialize: (s) => ({
        gameHistory: s.gameHistory,
        isMuted:     s.isMuted,
        volume:      s.volume,
      }),
    }
  )
)
