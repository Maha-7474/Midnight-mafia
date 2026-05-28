import type { RoleDef, RoleKey } from '../types/game'

export const ROLE_DEFS: Record<RoleKey, RoleDef> = {
  mafia: {
    key:   'mafia',
    label: 'Mafia',
    icon:  '🔫',
    suit:  '♠',
    pip:   'M',
    task:  'Eliminate villagers each night. Stay hidden.',
    team:  'mafia',
    color: '#8B1A1A',
  },
  detective: {
    key:   'detective',
    label: 'Detective',
    icon:  '🔍',
    suit:  '♦',
    pip:   'D',
    task:  'Investigate one player each night.',
    team:  'village',
    color: '#8B1A1A',
  },
  doctor: {
    key:   'doctor',
    label: 'Doctor',
    icon:  '💉',
    suit:  '♣',
    pip:   'Dr',
    task:  'Protect one player from elimination each night.',
    team:  'village',
    color: '#8B1A1A',
  },
  villager: {
    key:   'villager',
    label: 'Villager',
    icon:  '🏡',
    suit:  '♥',
    pip:   'V',
    task:  'Find and vote out the Mafia during the day.',
    team:  'village',
    color: '#8B1A1A',
  },
  narrator: {
    key:   'narrator',
    label: 'Narrator',
    icon:  '📜',
    suit:  '★',
    pip:   'N',
    task:  'Guide the game. You know everyone\'s role.',
    team:  null,
    color: '#8B1A1A',
  },
}

// ─── Role balancing ───────────────────────────────────────────────

export function assignRoles(
  playerNames: string[],
  narratorName: string
): Record<string, RoleKey> {
  const nonNarrators = playerNames.filter(n => n !== narratorName)
  const count = nonNarrators.length

  const mafiaCount = Math.min(
    Math.max(1, Math.floor(count / 4)),
    Math.floor(count / 3)
  )

  const roles: RoleKey[] = []
  for (let i = 0; i < mafiaCount; i++) roles.push('mafia')
  roles.push('doctor')
  if (count >= 3) roles.push('detective')
  while (roles.length < count) roles.push('villager')

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[roles[i], roles[j]] = [roles[j], roles[i]]
  }

  const map: Record<string, RoleKey> = {}
  map[narratorName] = 'narrator'
  nonNarrators.forEach((name, i) => { map[name] = roles[i] })
  return map
}

export function getRoleComposition(playerCount: number) {
  const nonN    = playerCount - 1
  const mafia   = Math.min(Math.max(1, Math.floor(nonN / 4)), Math.floor(nonN / 3))
  const doctor  = 1
  const detective = nonN >= 3 ? 1 : 0
  const villagers = Math.max(0, nonN - mafia - doctor - detective)
  return { mafia, doctor, detective, villagers, narrator: 1 }
}
