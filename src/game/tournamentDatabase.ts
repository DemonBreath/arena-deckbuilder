export type ContestantStatus = 'active' | 'defeated' | 'eliminated'

export interface Contestant {
  id: string
  name: string
  isPlayer: boolean
  lives: number
  gold: number
  status: ContestantStatus
}

export const AI_NAME_POOL = [
  'Kira Ash',
  'Bronn Hex',
  'Mira Vale',
  'Cade Thorn',
  'Nova Rift',
  'Echo Kane',
  'Vex Moro',
  'Sable Finn',
  'Jin Crow',
  'Rook Ty',
]

export const ARENA_SIZE = 8
export const OPPONENT_COUNT = ARENA_SIZE - 1

export interface RankedContestant extends Contestant {
  rank: number
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function pickAiNames(): string[] {
  return shuffle([...AI_NAME_POOL]).slice(0, OPPONENT_COUNT)
}

export function createArenaRoster(championName: string): Contestant[] {
  const trimmed = championName.trim()
  const aiNames = pickAiNames()

  const player: Contestant = {
    id: 'player',
    name: trimmed,
    isPlayer: true,
    lives: 3,
    gold: 0,
    status: 'active',
  }

  const opponents: Contestant[] = aiNames.map((name, index) => ({
    id: `opponent-${index}`,
    name,
    isPlayer: false,
    lives: 0,
    gold: 0,
    status: 'active',
  }))

  return [player, ...opponents]
}

export function syncPlayerContestant(
  contestants: Contestant[],
  championName: string,
  lives: number,
  gold: number,
): Contestant[] {
  return contestants.map((contestant) => {
    if (!contestant.isPlayer) return contestant
    return {
      ...contestant,
      name: championName.trim() || contestant.name,
      lives,
      gold,
      status: lives > 0 ? 'active' : 'eliminated',
    }
  })
}

export function getActiveOpponents(contestants: Contestant[]): Contestant[] {
  return contestants.filter((c) => !c.isPlayer && c.status === 'active')
}

export function getDefeatedOpponentCount(contestants: Contestant[]): number {
  return contestants.filter((c) => !c.isPlayer && c.status === 'defeated').length
}

export function isArenaComplete(contestants: Contestant[]): boolean {
  return getDefeatedOpponentCount(contestants) >= OPPONENT_COUNT
}

export function pickRandomActiveOpponent(
  contestants: Contestant[],
): Contestant | null {
  const active = getActiveOpponents(contestants)
  if (active.length === 0) return null
  const index = Math.floor(Math.random() * active.length)
  return active[index]
}

export function markOpponentDefeated(
  contestants: Contestant[],
  opponentId: string,
): Contestant[] {
  return contestants.map((contestant) => {
    if (contestant.id !== opponentId || contestant.isPlayer) return contestant
    return { ...contestant, status: 'defeated' }
  })
}

export function getContestantById(
  contestants: Contestant[],
  id: string,
): Contestant | undefined {
  return contestants.find((c) => c.id === id)
}

export function getRankedContestants(
  contestants: Contestant[],
): RankedContestant[] {
  const sorted = [...contestants].sort((a, b) => {
    if (a.isPlayer && !b.isPlayer) return -1
    if (!a.isPlayer && b.isPlayer) return 1
    if (a.status !== b.status) {
      if (a.status === 'active') return -1
      if (b.status === 'active') return 1
      if (a.status === 'defeated' && b.status === 'eliminated') return -1
      if (a.status === 'eliminated' && b.status === 'defeated') return 1
    }
    if (a.isPlayer && b.isPlayer) return 0
    if (!a.isPlayer && !b.isPlayer) {
      if (a.status === 'defeated' && b.status === 'active') return -1
      if (a.status === 'active' && b.status === 'defeated') return 1
      return a.name.localeCompare(b.name)
    }
    return a.name.localeCompare(b.name)
  })

  return sorted.map((contestant, index) => ({
    ...contestant,
    rank: index + 1,
  }))
}

export function getStatusLabel(status: ContestantStatus): string {
  switch (status) {
    case 'active':
      return 'active'
    case 'defeated':
      return 'defeated'
    case 'eliminated':
      return 'eliminated'
    default:
      return status
  }
}
