import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { v4 as uuid } from 'uuid'
import type {
  Room, Player, Phase, Team, RoleKey,
  GameLogEntry, GameResult, NightAction,
  ServerToClientEvents, ClientToServerEvents, VoteTally,
} from './types'

// ─── Express + HTTP + Socket.io setup ────────────────────────────

const app    = express()
const http   = createServer(app)
const io     = new Server<ClientToServerEvents, ServerToClientEvents>(http, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
})

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok', rooms: rooms.size }))

const PORT = process.env.PORT || 3001

// ─── In-memory store ─────────────────────────────────────────────

const rooms = new Map<string, Room>()           // roomId → Room
const socketRoom = new Map<string, string>()    // socketId → roomId

// ─── Helpers ─────────────────────────────────────────────────────

/** Generate a unique 4-letter room code */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code: string
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  } while ([...rooms.values()].some(r => r.code === code))
  return code
}

/** Add an entry to the room's game log */
function addLog(
  room: Room,
  message: string,
  type: GameLogEntry['type'] = 'info'
): void {
  room.log.push({
    id:        uuid(),
    round:     room.round,
    phase:     room.phase,
    message,
    timestamp: Date.now(),
    type,
  })
  // Keep log from growing unbounded
  if (room.log.length > 200) room.log = room.log.slice(-200)
}

/** Broadcast the full room state to everyone in the room */
function broadcastRoom(room: Room): void {
  io.to(room.id).emit('room:updated', room)
}

/** Get a room by socket id */
function getRoomBySocket(socketId: string): Room | null {
  const roomId = socketRoom.get(socketId)
  if (!roomId) return null
  return rooms.get(roomId) ?? null
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Assign roles based on player count */
function assignRoles(players: Player[], narratorId: string): void {
  const nonNarrators = players.filter(p => p.id !== narratorId)
  const count        = nonNarrators.length

  const mafiaCount = Math.min(Math.max(1, Math.floor(count / 4)), Math.floor(count / 3))

  const roles: RoleKey[] = []
  for (let i = 0; i < mafiaCount; i++) roles.push('mafia')
  roles.push('doctor')
  if (count >= 3) roles.push('detective')
  while (roles.length < count) roles.push('villager')

  const shuffled = shuffle(roles)

  // Assign narrator
  const narrator = players.find(p => p.id === narratorId)!
  narrator.role       = 'narrator'
  narrator.isNarrator = true

  // Assign everyone else
  nonNarrators.forEach((p, i) => { p.role = shuffled[i] })
}

/** Compute current vote tally */
function computeTally(room: Room): VoteTally {
  const tally: VoteTally = {}
  room.players.forEach(p => {
    if (p.voteTarget) {
      tally[p.voteTarget] = (tally[p.voteTarget] ?? 0) + 1
    }
  })
  return tally
}

/** Check win conditions — returns winner or null */
function checkWinCondition(room: Room): Team | null {
  const alive   = room.players.filter(p => p.isAlive && !p.isNarrator)
  const mafiaAlive   = alive.filter(p => p.role === 'mafia').length
  const villageAlive = alive.filter(p => p.role !== 'mafia').length

  if (mafiaAlive === 0) return 'village'
  if (mafiaAlive >= villageAlive) return 'mafia'
  return null
}

/** Build and broadcast a GameResult, then clean up */
function finaliseGame(room: Room, winner: Team): void {
  room.phase = 'ended'
  addLog(room, `Game over — ${winner === 'mafia' ? 'Mafia' : 'Village'} wins!`, 'phase')

  const narrator = room.players.find(p => p.isNarrator)

  const result: GameResult = {
    id:           uuid(),
    winner,
    rounds:       room.round,
    players:      room.players
      .filter(p => !p.isNarrator)
      .map(p => ({ name: p.name, role: p.role!, survived: p.isAlive })),
    startedAt:    room.startedAt ?? room.createdAt,
    endedAt:      Date.now(),
    narratorName: narrator?.name ?? 'Unknown',
  }

  broadcastRoom(room)
  io.to(room.id).emit('game:ended', result)

  // Clean up room after 10 minutes
  setTimeout(() => rooms.delete(room.id), 10 * 60 * 1000)
}

// ─── Socket.io event handlers ─────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`)

  // ── Create Room ──────────────────────────────────────────────
  socket.on('room:create', (hostName, cb) => {
    const player: Player = {
      id:          socket.id,
      name:        hostName.trim().slice(0, 24),
      role:        null,
      isNarrator:  false,
      isAlive:     true,
      isConnected: true,
      hasVoted:    false,
      voteTarget:  null,
    }

    const room: Room = {
      id:           uuid(),
      code:         generateCode(),
      hostId:       socket.id,
      players:      [player],
      phase:        'lobby',
      round:        1,
      nightActions: [],
      log:          [],
      createdAt:    Date.now(),
    }

    rooms.set(room.id, room)
    socketRoom.set(socket.id, room.id)
    socket.join(room.id)

    addLog(room, `${hostName} created the room.`, 'system')
    cb(room)
    console.log(`[Room] Created: ${room.code} by ${hostName}`)
  })

  // ── Join Room ────────────────────────────────────────────────
  socket.on('room:join', (code, playerName, cb) => {
    const room = [...rooms.values()].find(r => r.code === code.toUpperCase())

    if (!room) { cb(null, 'Room not found.'); return }
    if (room.phase !== 'lobby') { cb(null, 'Game already in progress.'); return }
    if (room.players.length >= 20) { cb(null, 'Room is full.'); return }

    const trimmed = playerName.trim().slice(0, 24)
    if (room.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      cb(null, 'That name is already taken.'); return
    }

    const player: Player = {
      id:          socket.id,
      name:        trimmed,
      role:        null,
      isNarrator:  false,
      isAlive:     true,
      isConnected: true,
      hasVoted:    false,
      voteTarget:  null,
    }

    room.players.push(player)
    socketRoom.set(socket.id, room.id)
    socket.join(room.id)

    addLog(room, `${trimmed} joined the game.`, 'system')
    broadcastRoom(room)
    io.to(room.id).emit('player:joined', player)
    cb(room)
    console.log(`[Room] ${trimmed} joined ${room.code}`)
  })

  // ── Leave Room ───────────────────────────────────────────────
  socket.on('room:leave', () => {
    handleLeave(socket.id)
  })

  // ── Start Game ───────────────────────────────────────────────
  socket.on('game:start', (narratorId) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    if (room.hostId !== socket.id) { socket.emit('error', 'Only the host can start.'); return }
    if (room.players.length < 5)  { socket.emit('error', 'Need at least 5 players.'); return }

    // Assign roles
    assignRoles(room.players, narratorId)
    room.phase     = 'role-reveal'
    room.startedAt = Date.now()
    room.round     = 1

    addLog(room, 'Roles have been assigned. The night begins…', 'phase')

    io.to(room.id).emit('game:started', room)
    console.log(`[Game] Started in room ${room.code}`)
  })

  // ── Set Phase ────────────────────────────────────────────────
  socket.on('phase:set', (phase) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return

    const narrator = room.players.find(p => p.id === socket.id && p.isNarrator)
    if (!narrator) { socket.emit('error', 'Only the narrator can change phases.'); return }

    room.phase = phase
    if (phase === 'night') {
      room.round++
      // Reset votes for new round
      room.players.forEach(p => { p.hasVoted = false; p.voteTarget = null })
    }

    addLog(room, `Phase changed to ${phase} (Round ${room.round}).`, 'phase')
    broadcastRoom(room)
    io.to(room.id).emit('phase:changed', phase, room.round)

    // Auto-check win on day start
    if (phase === 'day') {
      const winner = checkWinCondition(room)
      if (winner) finaliseGame(room, winner)
    }
  })

  // ── Eliminate Player ─────────────────────────────────────────
  socket.on('player:eliminate', (playerId) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return

    const narrator = room.players.find(p => p.id === socket.id && p.isNarrator)
    if (!narrator) return

    const target = room.players.find(p => p.id === playerId)
    if (!target || !target.isAlive) return

    target.isAlive = false
    addLog(room, `${target.name} has been eliminated.`, 'elimination')
    broadcastRoom(room)
    io.to(room.id).emit('player:eliminated', target.id, target.name)

    // Check win condition after elimination
    const winner = checkWinCondition(room)
    if (winner) finaliseGame(room, winner)
  })

  // ── Restore Player ───────────────────────────────────────────
  socket.on('player:restore', (playerId) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return

    const narrator = room.players.find(p => p.id === socket.id && p.isNarrator)
    if (!narrator) return

    const target = room.players.find(p => p.id === playerId)
    if (!target) return

    target.isAlive = true
    addLog(room, `${target.name} has been restored.`, 'info')
    broadcastRoom(room)
  })

  // ── Cast Vote ────────────────────────────────────────────────
  socket.on('vote:cast', (targetId) => {
    const room = getRoomBySocket(socket.id)
    if (!room || room.phase !== 'voting') return

    const voter = room.players.find(p => p.id === socket.id)
    if (!voter || !voter.isAlive || voter.isNarrator) return

    const target = room.players.find(p => p.id === targetId)
    if (!target || !target.isAlive) return

    // Toggle vote
    voter.voteTarget = voter.voteTarget === targetId ? null : targetId
    voter.hasVoted   = voter.voteTarget !== null

    const tally = computeTally(room)
    addLog(room, `${voter.name} voted.`, 'action')
    broadcastRoom(room)
    io.to(room.id).emit('vote:updated', tally)
  })

  // ── Resolve Votes ────────────────────────────────────────────
  socket.on('vote:resolve', () => {
    const room = getRoomBySocket(socket.id)
    if (!room) return

    const narrator = room.players.find(p => p.id === socket.id && p.isNarrator)
    if (!narrator) return

    const tally = computeTally(room)
    if (Object.keys(tally).length === 0) return

    // Find player with most votes
    const topId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0]
    const target = room.players.find(p => p.id === topId)
    if (!target) return

    target.isAlive = false
    addLog(room, `${target.name} was voted out! (${tally[topId]} votes)`, 'elimination')

    // Reset all votes
    room.players.forEach(p => { p.hasVoted = false; p.voteTarget = null })

    broadcastRoom(room)
    io.to(room.id).emit('player:eliminated', target.id, target.name)

    const winner = checkWinCondition(room)
    if (winner) finaliseGame(room, winner)
  })

  // ── Record Night Action ──────────────────────────────────────
  socket.on('night:action', (action) => {
    const room = getRoomBySocket(socket.id)
    if (!room || room.phase !== 'night') return

    room.nightActions.push({ ...action, round: room.round })
    addLog(room, `Night action recorded by ${action.actor}.`, 'action')
  })

  // ── End Game (manual) ────────────────────────────────────────
  socket.on('game:end', (winner) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return

    const narrator = room.players.find(p => p.id === socket.id && p.isNarrator)
    if (!narrator) return

    finaliseGame(room, winner)
  })

  // ── Disconnect ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`)
    handleLeave(socket.id, true)
  })
})

// ─── Leave / Disconnect helper ────────────────────────────────────

function handleLeave(socketId: string, isDisconnect = false): void {
  const room = getRoomBySocket(socketId)
  if (!room) return

  const player = room.players.find(p => p.id === socketId)
  if (!player) return

  if (isDisconnect) {
    // Mark as disconnected but keep in game if it's already started
    player.isConnected = false
    if (room.phase === 'lobby') {
      room.players = room.players.filter(p => p.id !== socketId)
      addLog(room, `${player.name} left the room.`, 'system')
    } else {
      addLog(room, `${player.name} disconnected.`, 'system')
    }
  } else {
    room.players = room.players.filter(p => p.id !== socketId)
    addLog(room, `${player.name} left the room.`, 'system')
  }

  socketRoom.delete(socketId)
  io.to(room.id).emit('player:left', socketId)

  // If host left and game is in lobby, assign new host
  if (room.hostId === socketId && room.phase === 'lobby' && room.players.length > 0) {
    room.hostId = room.players[0].id
    addLog(room, `${room.players[0].name} is now the host.`, 'system')
  }

  // Delete empty rooms
  if (room.players.length === 0) {
    rooms.delete(room.id)
    console.log(`[Room] Deleted empty room ${room.code}`)
    return
  }

  broadcastRoom(room)
}

// ─── Start server ─────────────────────────────────────────────────

http.listen(PORT, () => {
  console.log(`\n🃏  Midnight Mafia server running on port ${PORT}\n`)
})
