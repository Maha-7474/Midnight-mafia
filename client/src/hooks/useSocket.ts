import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '../types/game'
import { useGameStore } from '../store/gameStore'
import { sound } from '../sounds/soundManager'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: AppSocket | null = null

export function getSocket(): AppSocket {
  if (!socket) {
    const serverUrl = (import.meta as { env: Record<string, string> }).env.VITE_SERVER_URL || 'http://localhost:3001'
    socket = io(serverUrl, {
      autoConnect: false,
      transports: ['websocket'],
    })
  }
  return socket
}

export function useSocket() {
  const store = useGameStore()
  const bound = useRef(false)

  useEffect(() => {
    if (bound.current) return
    bound.current = true

    const s = getSocket()
    s.connect()

    s.on('connect', () => {
      store.setConnected(true)
      store.setSocketId(s.id ?? '')
      store.setMyPlayerId(s.id ?? '')
    })

    s.on('disconnect', () => {
      store.setConnected(false)
    })

    s.on('room:updated', (room) => {
      store.setRoom(room)
    })

    s.on('game:started', (room) => {
      store.setRoom(room)
      sound.play('reveal')
    })

    s.on('phase:changed', (phase, round) => {
      const currentRoom = store.room
      store.setRoom(currentRoom ? { ...currentRoom, phase, round } : null)
      sound.play('phase')
      if (phase === 'night') sound.play('ambience')
      if (phase === 'day')   { sound.stop('ambience'); sound.play('day') }
    })

    s.on('player:eliminated', (_id, _name) => {
      sound.play('eliminate')
    })

    s.on('vote:updated', (tally) => {
      store.setVoteTally(tally)
      sound.play('vote')
    })

    s.on('game:ended', (result) => {
      store.addGameResult(result)
      const currentRoom = store.room
      store.setRoom(currentRoom ? { ...currentRoom, phase: 'ended' } : null)
      sound.stopAll()
      sound.play(result.winner === 'village' ? 'villageWin' : 'mafiaWin')
    })

    s.on('error', (msg) => {
      console.error('[Socket error]', msg)
    })

    return () => {
      s.off('connect')
      s.off('disconnect')
      s.off('room:updated')
      s.off('game:started')
      s.off('phase:changed')
      s.off('player:eliminated')
      s.off('vote:updated')
      s.off('game:ended')
      s.off('error')
    }
  }, [])

  return getSocket()
}
