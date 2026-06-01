import type { CardId } from '../game/cardDatabase'
import type { ClassId } from '../game/classDatabase'

/** Resource id shown on the mechanic meter (one per playable class). */
export type ClassMechanicId =
  | 'resolve'
  | 'rage'
  | 'combo'
  | 'souls'
  | 'booty'
  | 'blood'
  | 'coin'
  | 'brew'
  | 'time'
  | 'ember'
  | 'frost'
  | 'faith'
  | 'edge'
  | 'prep'
  | 'scale'
  | 'luck'
  | 'verse'
  | 'charge'
  | 'focus'
  | 'momentum'

export interface ClassMechanicMeter {
  id: ClassMechanicId
  value: number
  max: number
}

export interface ClassMechanicDefinition {
  id: ClassMechanicId
  name: string
  /** Short rules text for tooltips and class selection. */
  hint: string
  max: number
  classId: ClassId
  /** UI label when a threshold bonus is active (e.g. "5+"). */
  thresholdAt?: number
}

export interface MechanicCardPlayContext {
  classId: ClassId
  meter: ClassMechanicMeter
  cardId: CardId
  damageDealt: number
  blockGained: number
  isAttack: boolean
  isStrike: boolean
  isGuard: boolean
  strikesPlayedThisTurn: number
  attacksPlayedThisTurn: number
  turnNumber: number
}

export interface MechanicCombatModifiers {
  bonusDamage: number
  bonusBlock: number
  heal: number
  logParts: string[]
}

export interface MechanicDisplay {
  id: ClassMechanicId
  name: string
  hint: string
  value: number
  max: number
  percent: number
  thresholdAt?: number
  thresholdActive: boolean
}
