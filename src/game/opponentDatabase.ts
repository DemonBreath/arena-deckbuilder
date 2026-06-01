export type OpponentId = 'bruiser' | 'turtle' | 'glassblade' | 'thief'

export type TurtlePhase = 'defend' | 'attack'

export interface OpponentDefinition {
  id: OpponentId
  name: string
  maxHp: number
  description: string
}

export const OPPONENT_DATABASE: Record<OpponentId, OpponentDefinition> = {
  bruiser: {
    id: 'bruiser',
    name: 'Bruiser',
    maxHp: 40,
    description: '40 HP — attacks for 8',
  },
  turtle: {
    id: 'turtle',
    name: 'Turtle',
    maxHp: 35,
    description: '35 HP — gains 5 block, then attacks for 5',
  },
  glassblade: {
    id: 'glassblade',
    name: 'Glassblade',
    maxHp: 24,
    description: '24 HP — attacks for 12',
  },
  thief: {
    id: 'thief',
    name: 'Thief',
    maxHp: 30,
    description: '30 HP — attacks for 6, steals 5 gold if unblocked',
  },
}

export const ALL_OPPONENT_IDS: OpponentId[] = Object.keys(
  OPPONENT_DATABASE,
) as OpponentId[]

export const BRUISER_ATTACK = 8
export const GLASSBLADE_ATTACK = 12
export const THIEF_ATTACK = 6
export const THIEF_STEAL_GOLD = 5
export const TURTLE_BLOCK_GAIN = 5
export const TURTLE_ATTACK_DAMAGE = 5

export function getOpponent(id: OpponentId): OpponentDefinition {
  return OPPONENT_DATABASE[id]
}

export function pickRandomOpponent(): OpponentId {
  const index = Math.floor(Math.random() * ALL_OPPONENT_IDS.length)
  return ALL_OPPONENT_IDS[index]
}

export function getInitialTurtlePhase(): TurtlePhase {
  return 'defend'
}

export function getEnemyIntentText(
  opponentId: OpponentId,
  turtlePhase: TurtlePhase,
): string {
  switch (opponentId) {
    case 'bruiser':
      return `Intends to attack for ${BRUISER_ATTACK}.`
    case 'glassblade':
      return `Intends to attack for ${GLASSBLADE_ATTACK}.`
    case 'thief':
      return `Intends to attack for ${THIEF_ATTACK} (steals ${THIEF_STEAL_GOLD} gold if unblocked).`
    case 'turtle':
      return turtlePhase === 'defend'
        ? `Intends to gain ${TURTLE_BLOCK_GAIN} block.`
        : `Intends to attack for ${TURTLE_ATTACK_DAMAGE}.`
    default:
      return 'Unknown intent.'
  }
}
