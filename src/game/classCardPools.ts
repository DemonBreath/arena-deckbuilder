import type { CardId } from './cardDatabase'
import { SHOP_CARD_POOL } from './cardDatabase'
import type { ClassId } from './classDatabase'
import {
  createClassIdentity,
  type PlayerClassIdentity,
} from './classIdentity'
import {
  getEvolutionDefinition,
  type EvolutionId,
} from './classEvolutions'

/** Cards any class can roll in rewards and shops. */
export const SHARED_CARD_POOL: readonly CardId[] = SHOP_CARD_POOL

export type ClassCardPoolTier = 'shared' | 'class' | 'rare_class' | 'signature'

export interface ClassCardPool {
  classCards: readonly CardId[]
  rareClassCards: readonly CardId[]
  /** M30 — three cards that spend or build the class mechanic. */
  signatureCards: readonly CardId[]
}

/** Two class cards + one rare per playable class. */
export const CLASS_CARD_POOLS: Record<ClassId, ClassCardPool> = {
  guardian: {
    classCards: ['shield_slam', 'stonewall'],
    rareClassCards: ['bastion'],
    signatureCards: ['guardian_brace', 'guardian_shield_crush', 'guardian_stand_firm'],
  },
  berserker: {
    classCards: ['blood_rush', 'reckless_swing'],
    rareClassCards: ['rampage'],
    signatureCards: ['berserker_enrage', 'berserker_blood_strike', 'berserker_reckless_charge'],
  },
  gunslinger: {
    classCards: ['quickdraw', 'fan_the_hammer'],
    rareClassCards: ['dead_eye'],
    signatureCards: ['gunslinger_quick_shot', 'gunslinger_chain_fire', 'gunslinger_reload'],
  },
  necromancer: {
    classCards: ['soul_tax', 'bone_armor'],
    rareClassCards: ['grave_pact'],
    signatureCards: ['necromancer_harvest', 'necromancer_bone_spear', 'necromancer_soul_guard'],
  },
  pyromancer: {
    classCards: ['flame_bolt', 'ignite'],
    rareClassCards: ['inferno'],
    signatureCards: ['pyromancer_kindle', 'pyromancer_fireball', 'pyromancer_ignite_burst'],
  },
  cryomancer: {
    classCards: ['frost_wall', 'glacial_strike'],
    rareClassCards: ['absolute_zero'],
    signatureCards: ['cryomancer_chill', 'cryomancer_ice_lance', 'cryomancer_glacier'],
  },
  paladin: {
    classCards: ['lay_on_hands', 'consecrate'],
    rareClassCards: ['divine_shield'],
    signatureCards: ['paladin_prayer', 'paladin_smite', 'paladin_bulwark'],
  },
  assassin: {
    classCards: ['ambush', 'rupture'],
    rareClassCards: ['death_mark'],
    signatureCards: ['assassin_poised', 'assassin_shadow_cut', 'assassin_ambush_prep'],
  },
  alchemist: {
    classCards: ['unstable_concoction', 'grand_elixir'],
    rareClassCards: ['philosophers_stone'],
    signatureCards: ['alchemist_distill', 'alchemist_acid_flask', 'alchemist_elixir_surge'],
  },
  timekeeper: {
    classCards: ['temporal_draw', 'borrowed_power'],
    rareClassCards: ['time_stop'],
    signatureCards: ['timekeeper_tick', 'timekeeper_chrono_bolt', 'timekeeper_rewind'],
  },
  merchant: {
    classCards: ['spare_change', 'liquidation'],
    rareClassCards: ['golden_contract'],
    signatureCards: ['merchant_tithe', 'merchant_invoice', 'merchant_hoard'],
  },
  vampire: {
    classCards: ['sanguine_strike', 'essence_drain'],
    rareClassCards: ['blood_feast'],
    signatureCards: ['vampire_bloodletting', 'vampire_crimson_bite', 'vampire_blood_shield'],
  },
  pirate: {
    classCards: ['plunder_strike', 'broadside'],
    rareClassCards: ['captains_rum'],
    signatureCards: ['pirate_heist', 'pirate_cannon_volley', 'pirate_treasure_cache'],
  },
  chef: {
    classCards: ['serrated_blade', 'hearty_stew'],
    rareClassCards: ['grand_feast'],
    signatureCards: ['chef_chop', 'chef_simmer', 'chef_plated_feast'],
  },
  dragon_knight: {
    classCards: ['drake_strike', 'kindling'],
    rareClassCards: ['dragons_fury'],
    signatureCards: ['dragon_knight_hoard', 'dragon_knight_drake_fire', 'dragon_knight_armor_plate'],
  },
  gambler: {
    classCards: ['lucky_strike', 'double_down'],
    rareClassCards: ['jackpot'],
    signatureCards: ['gambler_chip', 'gambler_jackpot_shot', 'gambler_all_in'],
  },
  bard: {
    classCards: ['encore', 'harmony'],
    rareClassCards: ['grand_finale'],
    signatureCards: ['bard_verse', 'bard_crescendo', 'bard_harmony_shield'],
  },
  engineer: {
    classCards: ['wrench_strike', 'gyro_shot'],
    rareClassCards: ['overclock_core'],
    signatureCards: ['engineer_wind_up', 'engineer_pulse_blast', 'engineer_overcharge'],
  },
  monk: {
    classCards: ['flurry', 'palm_strike'],
    rareClassCards: ['thousand_steps'],
    signatureCards: ['monk_breath', 'monk_palm_burst', 'monk_meditation'],
  },
  warlord: {
    classCards: ['march_strike', 'war_cry'],
    rareClassCards: ['siege_breaker'],
    signatureCards: ['warlord_rally', 'warlord_charge', 'warlord_siege_wall'],
  },
}

const BASE_ODDS_CLASS = 0.28
const BASE_ODDS_RARE = 0.05
const BASE_ODDS_SIGNATURE = 0.12

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function getRewardOdds(identity: PlayerClassIdentity): {
  class: number
  rare: number
} {
  let classOdds = BASE_ODDS_CLASS
  let rareOdds = BASE_ODDS_RARE
  if (identity.evolutionId) {
    const evo = getEvolutionDefinition(identity.evolutionId)
    classOdds += evo.rewardWeights.classPoolBonus
    rareOdds += evo.rewardWeights.rarePoolBonus
  }
  const cap = 0.85
  classOdds = Math.min(cap, classOdds)
  rareOdds = Math.min(cap - 0.1, rareOdds)
  return { class: classOdds, rare: rareOdds }
}

function rollPoolTier(identity: PlayerClassIdentity): ClassCardPoolTier {
  const odds = getRewardOdds(identity)
  const r = Math.random()
  if (r < odds.rare) return 'rare_class'
  if (r < odds.rare + BASE_ODDS_SIGNATURE) return 'signature'
  if (r < odds.rare + BASE_ODDS_SIGNATURE + odds.class) return 'class'
  return 'shared'
}

export function rollClassOfferCard(identity: PlayerClassIdentity): CardId {
  const pool = CLASS_CARD_POOLS[identity.baseClassId]
  const tier = rollPoolTier(identity)

  if (tier === 'rare_class' && pool.rareClassCards.length > 0) {
    return pickRandom(pool.rareClassCards)
  }
  if (tier === 'signature' && pool.signatureCards.length > 0) {
    return pickRandom(pool.signatureCards)
  }
  if (tier === 'class' && pool.classCards.length > 0) {
    return pickRandom(pool.classCards)
  }
  return pickRandom(SHARED_CARD_POOL)
}

/** Generate N card offers — base 65% shared / 30% class / 5% rare, shifted by evolution. */
export function generateClassCardOffers(
  baseClassId: ClassId,
  count: number,
  evolutionId: EvolutionId | null = null,
): CardId[] {
  const identity = createClassIdentity(baseClassId, evolutionId)
  return Array.from({ length: count }, () => rollClassOfferCard(identity))
}

/** @deprecated Use identity-based roll; kept for simple call sites. */
export function rollClassOfferCardForClass(classId: ClassId): CardId {
  return rollClassOfferCard(createClassIdentity(classId, null))
}

/** All class-specific card ids (for PvP legality and UI). */
export function getAllClassCardIds(): CardId[] {
  const ids: CardId[] = []
  for (const pool of Object.values(CLASS_CARD_POOLS)) {
    ids.push(
      ...pool.classCards,
      ...pool.rareClassCards,
      ...pool.signatureCards,
    )
  }
  return ids
}

export function getEvolutionRewardOddsLabel(
  identity: PlayerClassIdentity,
): string | null {
  if (!identity.evolutionId) return null
  const evo = getEvolutionDefinition(identity.evolutionId)
  const { classPoolBonus, rarePoolBonus } = evo.rewardWeights
  if (classPoolBonus <= 0 && rarePoolBonus <= 0) return null
  const parts: string[] = []
  if (classPoolBonus > 0) {
    parts.push(`+${Math.round(classPoolBonus * 100)}% class card offers`)
  }
  if (rarePoolBonus > 0) {
    parts.push(`+${Math.round(rarePoolBonus * 100)}% rare offers`)
  }
  return parts.join(' · ')
}

export function getClassCardPoolTier(
  classId: ClassId,
  cardId: CardId,
): ClassCardPoolTier | null {
  const pool = CLASS_CARD_POOLS[classId]
  if (pool.rareClassCards.includes(cardId)) return 'rare_class'
  if (pool.signatureCards.includes(cardId)) return 'signature'
  if (pool.classCards.includes(cardId)) return 'class'
  if (SHARED_CARD_POOL.includes(cardId)) return 'shared'
  return null
}

export function getCardOwnerClass(cardId: CardId): ClassId | null {
  for (const [classId, pool] of Object.entries(CLASS_CARD_POOLS) as [
    ClassId,
    ClassCardPool,
  ][]) {
    if (
      pool.classCards.includes(cardId) ||
      pool.rareClassCards.includes(cardId) ||
      pool.signatureCards.includes(cardId)
    ) {
      return classId
    }
  }
  return null
}

export function isRareClassCard(cardId: CardId): boolean {
  for (const pool of Object.values(CLASS_CARD_POOLS)) {
    if (pool.rareClassCards.includes(cardId)) return true
  }
  return false
}

export function isSignatureClassCard(cardId: CardId): boolean {
  for (const pool of Object.values(CLASS_CARD_POOLS)) {
    if (pool.signatureCards.includes(cardId)) return true
  }
  return false
}

export function isClassSpecificCard(cardId: CardId): boolean {
  return getCardOwnerClass(cardId) !== null
}
