import { getCard, type CardId } from './cardDatabase'
import { cardCountsAsAttack } from './cardEffects'
import { DEFAULT_CLASS_ID, type ClassId } from './classDatabase'
import type {
  ClassMechanicDefinition,
  ClassMechanicId,
  ClassMechanicMeter,
  MechanicCardPlayContext,
  MechanicCombatModifiers,
  MechanicDisplay,
} from '../types/classMechanic'

const MECHANIC_BY_CLASS: Record<ClassId, ClassMechanicId> = {
  guardian: 'resolve',
  berserker: 'rage',
  gunslinger: 'combo',
  necromancer: 'souls',
  pirate: 'booty',
  vampire: 'blood',
  merchant: 'coin',
  alchemist: 'brew',
  timekeeper: 'time',
  pyromancer: 'ember',
  cryomancer: 'frost',
  paladin: 'faith',
  assassin: 'edge',
  chef: 'prep',
  dragon_knight: 'scale',
  gambler: 'luck',
  bard: 'verse',
  engineer: 'charge',
  monk: 'focus',
  warlord: 'momentum',
}

const MECHANIC_META: Record<
  ClassMechanicId,
  { name: string; hint: string; max: number; thresholdAt?: number }
> = {
  resolve: {
    name: 'Resolve',
    hint: 'Build on Guards (+2). At 5+, Guards grant +2 block.',
    max: 10,
    thresholdAt: 5,
  },
  rage: {
    name: 'Rage',
    hint: 'Gain on attacks (+2). Every 3 Rage adds +1 attack damage.',
    max: 10,
    thresholdAt: 3,
  },
  combo: {
    name: 'Combo',
    hint: 'Gain on Strikes (+1). At 3+, Strikes deal +2 damage.',
    max: 6,
    thresholdAt: 3,
  },
  souls: {
    name: 'Souls',
    hint: 'Gain on any card (+1). At 4+, Guards heal 2 HP.',
    max: 8,
    thresholdAt: 4,
  },
  booty: {
    name: 'Booty',
    hint: 'Gain when attacks deal damage (+2). Every 2 Booty adds +1 damage.',
    max: 10,
    thresholdAt: 2,
  },
  blood: {
    name: 'Blood',
    hint: 'Gain when attacks hit (+1). At 6+, attacks heal 1 HP.',
    max: 10,
    thresholdAt: 6,
  },
  coin: {
    name: 'Coin',
    hint: '+1 each turn. Every 3 Coin adds +1 attack damage.',
    max: 10,
    thresholdAt: 3,
  },
  brew: {
    name: 'Brew',
    hint: '50% chance +1 on any card. At 4+, attacks deal +1 damage.',
    max: 6,
    thresholdAt: 4,
  },
  time: {
    name: 'Time',
    hint: '+1 each turn. At 4+, attacks deal +1 damage.',
    max: 6,
    thresholdAt: 4,
  },
  ember: {
    name: 'Ember',
    hint: 'Gain on attacks (+1). Every 2 Ember adds +1 damage.',
    max: 8,
    thresholdAt: 2,
  },
  frost: {
    name: 'Frost',
    hint: 'Gain on Guards (+1). At 4+, start turns with +1 block.',
    max: 8,
    thresholdAt: 4,
  },
  faith: {
    name: 'Faith',
    hint: 'Gain on Guards (+1). At 3+, Guards heal 1 HP.',
    max: 8,
    thresholdAt: 3,
  },
  edge: {
    name: 'Edge',
    hint: 'First attack each turn (+2). At 4+, first attack deals +2 damage.',
    max: 6,
    thresholdAt: 4,
  },
  prep: {
    name: 'Prep',
    hint: '+1 at end of turn. Every 2 Prep adds +1 block on Guards.',
    max: 5,
    thresholdAt: 2,
  },
  scale: {
    name: 'Scale',
    hint: '+1 each turn. Every 2 Scale adds +1 attack damage.',
    max: 8,
    thresholdAt: 2,
  },
  luck: {
    name: 'Luck',
    hint: '50% +1 on attacks. Every 2 Luck adds +1 attack damage.',
    max: 7,
    thresholdAt: 2,
  },
  verse: {
    name: 'Verse',
    hint: 'Gain on any card (+1). At 4+, attacks deal +1 damage.',
    max: 6,
    thresholdAt: 4,
  },
  charge: {
    name: 'Charge',
    hint: '+2 on even turns. At 3+, even turns grant +1 energy.',
    max: 6,
    thresholdAt: 3,
  },
  focus: {
    name: 'Focus',
    hint: '2nd+ attacks each turn (+2). Every 2 Focus adds +1 damage.',
    max: 8,
    thresholdAt: 2,
  },
  momentum: {
    name: 'Momentum',
    hint: '+1 each turn. Every 2 Momentum adds +1 attack damage.',
    max: 10,
    thresholdAt: 2,
  },
}

export function cardCountsAsGuard(cardId: CardId): boolean {
  const card = getCard(cardId)
  if (card.special === 'double_guard') return true
  if (card.block !== undefined && !cardCountsAsAttack(cardId)) return true
  return cardId === 'guard' || cardId === 'guard_plus'
}

export function getMechanicIdForClass(classId: ClassId): ClassMechanicId {
  return MECHANIC_BY_CLASS[classId] ?? MECHANIC_BY_CLASS[DEFAULT_CLASS_ID]
}

export function getMechanicDefinition(classId: ClassId): ClassMechanicDefinition {
  const id = getMechanicIdForClass(classId)
  const meta = MECHANIC_META[id]
  return { id, classId, ...meta }
}

export function getAllMechanicDefinitions(): ClassMechanicDefinition[] {
  return (Object.keys(MECHANIC_BY_CLASS) as ClassId[]).map(getMechanicDefinition)
}

export function createInitialMechanicMeter(classId: ClassId): ClassMechanicMeter {
  const def = getMechanicDefinition(classId)
  return { id: def.id, value: 0, max: def.max }
}

export function normalizeMechanicMeter(
  raw: ClassMechanicMeter | undefined | null,
  classId: ClassId,
): ClassMechanicMeter {
  const def = getMechanicDefinition(classId)
  if (!raw || typeof raw.value !== 'number') {
    return createInitialMechanicMeter(classId)
  }
  return clampMeter({
    id: def.id,
    value: raw.value,
    max: def.max,
  })
}

function clampMeter(meter: ClassMechanicMeter): ClassMechanicMeter {
  return {
    ...meter,
    value: Math.max(0, Math.min(meter.max, Math.floor(meter.value))),
  }
}

function addToMeter(meter: ClassMechanicMeter, amount: number): ClassMechanicMeter {
  return clampMeter({ ...meter, value: meter.value + amount })
}

export function getMechanicDisplay(
  meter: ClassMechanicMeter,
  classId: ClassId,
): MechanicDisplay {
  const def = getMechanicDefinition(classId)
  const thresholdAt = def.thresholdAt
  return {
    id: meter.id,
    name: def.name,
    hint: def.hint,
    value: meter.value,
    max: meter.max,
    percent: meter.max > 0 ? Math.round((meter.value / meter.max) * 100) : 0,
    thresholdAt,
    thresholdActive:
      thresholdAt !== undefined ? meter.value >= thresholdAt : false,
  }
}

const EMPTY_MODS: MechanicCombatModifiers = {
  bonusDamage: 0,
  bonusBlock: 0,
  heal: 0,
  logParts: [],
}

export function getMechanicCombatModifiers(
  meter: ClassMechanicMeter,
  classId: ClassId,
  _cardId: CardId,
  ctx: {
    isAttack: boolean
    isStrike: boolean
    isGuard: boolean
    attacksPlayedThisTurn: number
    damageDealt: number
  },
): MechanicCombatModifiers {
  const v = meter.value
  const parts: string[] = []
  let bonusDamage = 0
  let bonusBlock = 0
  let heal = 0

  switch (classId) {
    case 'guardian':
      if (ctx.isGuard && v >= 5) {
        bonusBlock = 2
        parts.push('+2 Resolve block')
      }
      break
    case 'berserker':
      if (ctx.isAttack) {
        bonusDamage = Math.floor(v / 3)
        if (bonusDamage > 0) parts.push(`+${bonusDamage} Rage`)
      }
      break
    case 'gunslinger':
      if (ctx.isStrike && v >= 3) {
        bonusDamage = 2
        parts.push('+2 Combo')
      }
      break
    case 'necromancer':
      if (ctx.isGuard && v >= 4) {
        heal = 2
        parts.push('Souls heal 2')
      }
      break
    case 'pirate':
      if (ctx.isAttack) {
        bonusDamage = Math.floor(v / 2)
        if (bonusDamage > 0) parts.push(`+${bonusDamage} Booty`)
      }
      break
    case 'vampire':
      if (ctx.isAttack && v >= 6 && ctx.damageDealt > 0) {
        heal = 1
        parts.push('Blood sip +1')
      }
      break
    case 'merchant':
      if (ctx.isAttack) {
        bonusDamage = Math.floor(v / 3)
        if (bonusDamage > 0) parts.push(`+${bonusDamage} Coin`)
      }
      break
    case 'alchemist':
      if (ctx.isAttack && v >= 4) {
        bonusDamage = 1
        parts.push('+1 Brew')
      }
      break
    case 'timekeeper':
      if (ctx.isAttack && v >= 4) {
        bonusDamage = 1
        parts.push('+1 Time')
      }
      break
    case 'pyromancer':
      if (ctx.isAttack) {
        bonusDamage = Math.floor(v / 2)
        if (bonusDamage > 0) parts.push(`+${bonusDamage} Ember`)
      }
      break
    case 'paladin':
      if (ctx.isGuard && v >= 3) {
        heal = 1
        parts.push('Faith heal 1')
      }
      break
    case 'assassin':
      if (ctx.isAttack && ctx.attacksPlayedThisTurn === 0) {
        bonusDamage = v >= 4 ? 4 : 2
        parts.push(`+${bonusDamage} Edge`)
      }
      break
    case 'chef':
      if (ctx.isGuard) {
        bonusBlock = Math.floor(v / 2)
        if (bonusBlock > 0) parts.push(`+${bonusBlock} Prep block`)
      }
      break
    case 'dragon_knight':
      if (ctx.isAttack) {
        bonusDamage = Math.floor(v / 2)
        if (bonusDamage > 0) parts.push(`+${bonusDamage} Scale`)
      }
      break
    case 'gambler':
      if (ctx.isAttack) {
        bonusDamage = Math.floor(v / 2)
        if (bonusDamage > 0) parts.push(`+${bonusDamage} Luck`)
      }
      break
    case 'bard':
      if (ctx.isAttack && v >= 4) {
        bonusDamage = 1
        parts.push('+1 Verse')
      }
      break
    case 'monk':
      if (ctx.isAttack && ctx.attacksPlayedThisTurn > 0) {
        bonusDamage = Math.floor(v / 2)
        if (bonusDamage > 0) parts.push(`+${bonusDamage} Focus`)
      }
      break
    case 'warlord':
      if (ctx.isAttack) {
        bonusDamage = Math.floor(v / 2)
        if (bonusDamage > 0) parts.push(`+${bonusDamage} Momentum`)
      }
      break
    default:
      break
  }

  if (parts.length === 0) return EMPTY_MODS
  return { bonusDamage, bonusBlock, heal, logParts: parts }
}

export interface MechanicTurnStartResult {
  meter: ClassMechanicMeter
  bonusBlock: number
  bonusEnergy: number
  log?: string
}

export function applyMechanicOnTurnStart(
  meter: ClassMechanicMeter,
  classId: ClassId,
  turnNumber: number,
): MechanicTurnStartResult {
  let next = meter
  let bonusBlock = 0
  let bonusEnergy = 0
  const logs: string[] = []

  switch (classId) {
    case 'merchant':
    case 'timekeeper':
    case 'dragon_knight':
    case 'warlord':
      next = addToMeter(next, 1)
      logs.push(`+1 ${MECHANIC_META[next.id].name}`)
      break
    case 'engineer':
      if (turnNumber % 2 === 0) {
        next = addToMeter(next, 2)
        logs.push('+2 Charge')
      }
      if (next.value >= 3 && turnNumber % 2 === 0) {
        bonusEnergy = 1
        logs.push('+1 energy (Charge)')
      }
      break
    case 'cryomancer':
      if (next.value >= 4) {
        bonusBlock = 1
        logs.push('+1 block (Frost)')
      }
      break
    default:
      break
  }

  return {
    meter: next,
    bonusBlock,
    bonusEnergy,
    log: logs.length > 0 ? logs.join('; ') : undefined,
  }
}

export interface MechanicEndTurnResult {
  meter: ClassMechanicMeter
  log?: string
}

export function applyMechanicOnEndTurn(
  meter: ClassMechanicMeter,
  classId: ClassId,
): MechanicEndTurnResult {
  if (classId === 'chef') {
    const next = addToMeter(meter, 1)
    return { meter: next, log: '+1 Prep (end of turn)' }
  }
  return { meter }
}

export function applyMechanicAfterCardPlay(
  ctx: MechanicCardPlayContext,
): { meter: ClassMechanicMeter; log?: string } {
  let next = ctx.meter
  const logs: string[] = []
  const name = MECHANIC_META[next.id].name

  const rollGain = (chance: number) => Math.random() < chance

  switch (ctx.classId) {
    case 'guardian':
      if (ctx.isGuard) {
        next = addToMeter(next, 2)
        logs.push('+2 Resolve')
      } else {
        next = addToMeter(next, 1)
        logs.push('+1 Resolve')
      }
      break
    case 'berserker':
      if (ctx.isAttack) {
        next = addToMeter(next, 2)
        logs.push('+2 Rage')
      }
      break
    case 'gunslinger':
      if (ctx.isStrike) {
        next = addToMeter(next, 1)
        logs.push('+1 Combo')
      }
      break
    case 'necromancer':
    case 'bard':
      next = addToMeter(next, 1)
      logs.push(`+1 ${name}`)
      break
    case 'pirate':
      if (ctx.isAttack && ctx.damageDealt > 0) {
        next = addToMeter(next, 2)
        logs.push('+2 Booty')
      }
      break
    case 'vampire':
      if (ctx.isAttack && ctx.damageDealt > 0) {
        next = addToMeter(next, 1)
        logs.push('+1 Blood')
      }
      break
    case 'pyromancer':
      if (ctx.isAttack) {
        next = addToMeter(next, 1)
        logs.push('+1 Ember')
      }
      break
    case 'cryomancer':
    case 'paladin':
      if (ctx.isGuard) {
        next = addToMeter(next, 1)
        logs.push(`+1 ${name}`)
      }
      break
    case 'assassin':
      if (ctx.isAttack && ctx.attacksPlayedThisTurn === 0) {
        next = addToMeter(next, 2)
        logs.push('+2 Edge')
      }
      break
    case 'alchemist':
      if (rollGain(0.5)) {
        next = addToMeter(next, 1)
        logs.push('+1 Brew (mixed)')
      }
      break
    case 'gambler':
      if (ctx.isAttack && rollGain(0.5)) {
        next = addToMeter(next, 1)
        logs.push('+1 Luck')
      }
      break
    case 'monk':
      if (ctx.isAttack && ctx.attacksPlayedThisTurn > 0) {
        next = addToMeter(next, 2)
        logs.push('+2 Focus')
      }
      break
    default:
      break
  }

  return { meter: next, log: logs.length > 0 ? logs.join('; ') : undefined }
}

export function formatMechanicLogSuffix(parts: string[]): string {
  if (parts.length === 0) return ''
  return ` [${parts.join('; ')}]`
}
