export type RoleKey = 'mafia' | 'detective' | 'doctor' | 'villager' | 'narrator'
export type Phase   = 'lobby' | 'role-reveal' | 'night' | 'day' | 'voting' | 'ended'
export type Team    = 'mafia' | 'village'

export interface Player {
  id:          string
  name:        string
  role:        RoleKey | null
  isNarrator:  boolean
  isAlive:     boolean
  isConnected: boolean
  hasVoted:    boolean
  voteTarget:  string | null
}

export interface VoteTally {
  [playerId: string]: number
}

export interface NightAction {
  round:      number
  actor:      RoleKey
  targetId:   string
  targetName: string
}

export interface GameLogEntry {
  id:        string
  round:     number
  phase:     Phase
  message:   string
  timestamp: number
  type:      'info' | 'elimination' | 'phase' | 'action' | 'system'
}

export interface GameResult {
  id:           string
  winner:       Team
  rounds:       number
  players:      { name: string; role: RoleKey; survived: boolean }[]
  startedAt:    number
  endedAt:      number
  narratorName: string
}

export interface Room {
  id:           string
  code:         string
  hostId:       string
  players:      Player[]
  phase:        Phase
  round:        number
  nightActions: NightAction[]
  log:          GameLogEntry[]
  createdAt:    number
  startedAt?:   number
}

export interface ServerToClientEvents {
  'room:updated':      (room: Room) => void
  'game:started':      (room: Room) => void
  'phase:changed':     (phase: Phase, round: number) => void
  'player:eliminated': (playerId: string, name: string) => void
  'vote:updated':      (tally: VoteTally) => void
  'game:ended':        (result: GameResult) => void
  'error':             (message: string) => void
  'player:joined':     (player: Player) => void
  'player:left':       (playerId: string) => void
}

export interface ClientToServerEvents {
  'room:create':      (hostName: string, cb: (room: Room) => void) => void
  'room:join':        (code: string, playerName: string, cb: (room: Room | null, error?: string) => void) => void
  'room:leave':       () => void
  'game:start':       (narratorId: string) => void
  'phase:set':        (phase: Phase) => void
  'player:eliminate': (playerId: string) => void
  'player:restore':   (playerId: string) => void
  'vote:cast':        (targetId: string) => void
  'vote:resolve':     () => void
  'game:end':         (winner: Team) => void
  'night:action':     (action: Omit<NightAction, 'round'>) => void
}
