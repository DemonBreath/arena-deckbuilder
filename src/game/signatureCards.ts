import { getCard, type CardId } from './cardDatabase'
import type { CardEffectInput, CardEffectResult } from './cardEffects'
import { getAttackDamageBonus } from './relicDatabase'
import { SIGNATURE_CARD_IDS } from './signatureCardEntries'
import type { ClassMechanicMeter } from '../types/classMechanic'

const SIGNATURE_CARD_SET = new Set<string>(SIGNATURE_CARD_IDS)

export interface SignatureCardEffectInput extends CardEffectInput {
  mechanic: ClassMechanicMeter
}

export interface SignatureCardEffectResult extends CardEffectResult {
  mechanicGain?: number
  mechanicSpend?: number
  mechanicSet?: number
}

export function isSignatureMechanicCard(cardId: CardId): boolean {
  return SIGNATURE_CARD_SET.has(cardId)
}

export function getSignatureCardTooltip(cardId: CardId): string | null {
  const card = getCard(cardId)
  if (!card.mechanicHint) return null
  return `${card.description}\n\nMechanic: ${card.mechanicHint}`
}

function applyDamageToEnemy(
  enemyHp: number,
  enemyBlock: number,
  rawDamage: number,
): { enemyHp: number; enemyBlock: number; damageDealt: number } {
  if (rawDamage <= 0) {
    return { enemyHp, enemyBlock, damageDealt: 0 }
  }
  const damageDealt = Math.max(0, rawDamage - Math.min(enemyBlock, rawDamage))
  return {
    enemyHp: enemyHp - damageDealt,
    enemyBlock: Math.max(0, enemyBlock - rawDamage),
    damageDealt,
  }
}

function baseResult(input: SignatureCardEffectInput): SignatureCardEffectResult {
  const card = getCard(input.cardId)
  return {
    playerHp: input.playerHp,
    playerBlock: input.playerBlock,
    playerEnergy: input.playerEnergy,
    enemyHp: input.enemyHp,
    enemyBlock: input.enemyBlock,
    damageDealt: 0,
    blockGained: 0,
    extraDraws: 0,
    logLine: `Played ${card.name}.`,
    countsAsAttack: false,
  }
}

function deal(
  input: SignatureCardEffectInput,
  rawDamage: number,
): Pick<
  SignatureCardEffectResult,
  'enemyHp' | 'enemyBlock' | 'damageDealt' | 'countsAsAttack'
> {
  const bonus = getAttackDamageBonus(input.relics)
  const hit = applyDamageToEnemy(
    input.enemyHp,
    input.enemyBlock,
    rawDamage + bonus,
  )
  return { ...hit, countsAsAttack: true }
}

function spend(
  meter: ClassMechanicMeter,
  cost: number,
): { meter: ClassMechanicMeter; spent: number } {
  const spent = Math.min(cost, meter.value)
  return {
    meter: { ...meter, value: Math.max(0, meter.value - spent) },
    spent,
  }
}

function gain(meter: ClassMechanicMeter, amount: number): ClassMechanicMeter {
  return {
    ...meter,
    value: Math.min(meter.max, meter.value + amount),
  }
}

function setValue(
  meter: ClassMechanicMeter,
  value: number,
): ClassMechanicMeter {
  return {
    ...meter,
    value: Math.max(0, Math.min(meter.max, value)),
  }
}

/** Resolve signature card — caller applies mechanicGain/Spend/Set to battle state. */
export function resolveSignatureMechanicCard(
  input: SignatureCardEffectInput,
): SignatureCardEffectResult {
  const card = getCard(input.cardId)
  const m = input.mechanic
  let result = baseResult(input)
  let meter = { ...m }

  switch (input.cardId) {
    case 'guardian_brace': {
      const gained = 6
      meter = gain(meter, 2)
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        mechanicGain: 2,
        logLine: `Played ${card.name} — gained ${gained} block, +2 Resolve.`,
      }
    }

    case 'guardian_shield_crush': {
      const spendRes = spend(meter, 3)
      meter = spendRes.meter
      const dmg = spendRes.spent >= 3 ? 8 : 5
      const hit = deal(input, dmg)
      return {
        ...result,
        ...hit,
        mechanicSpend: spendRes.spent,
        logLine:
          spendRes.spent >= 3
            ? `Played ${card.name} — spent 3 Resolve, dealt ${hit.damageDealt} damage.`
            : `Played ${card.name} — dealt ${hit.damageDealt} damage (need 3 Resolve).`,
      }
    }

    case 'guardian_stand_firm': {
      const gained = Math.max(3, meter.value)
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block (Resolve).`,
      }
    }

    case 'berserker_enrage': {
      meter = gain(meter, 3)
      return {
        ...result,
        playerHp: Math.max(0, input.playerHp - 2),
        mechanicGain: 3,
        logLine: `Played ${card.name} — +3 Rage, lost 2 HP.`,
      }
    }

    case 'berserker_blood_strike': {
      const hit = deal(input, 4 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Rage).`,
      }
    }

    case 'berserker_reckless_charge': {
      meter = gain(meter, 2)
      const hit = deal(input, 6)
      return {
        ...result,
        ...hit,
        playerBlock: 0,
        mechanicGain: 2,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, +2 Rage, lost block.`,
      }
    }

    case 'gunslinger_quick_shot': {
      meter = gain(meter, 2)
      const hit = deal(input, 3)
      return {
        ...result,
        ...hit,
        mechanicGain: 2,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, +2 Combo.`,
      }
    }

    case 'gunslinger_chain_fire': {
      const hit = deal(input, 4 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Combo).`,
      }
    }

    case 'gunslinger_reload': {
      meter = setValue(meter, 0)
      return {
        ...result,
        extraDraws: 2,
        mechanicSet: 0,
        logLine: `Played ${card.name} — Combo reset, drew 2 cards.`,
      }
    }

    case 'necromancer_harvest': {
      meter = gain(meter, 3)
      return {
        ...result,
        mechanicGain: 3,
        logLine: `Played ${card.name} — +3 Souls.`,
      }
    }

    case 'necromancer_bone_spear': {
      const spendRes = spend(meter, 3)
      meter = spendRes.meter
      const dmg = spendRes.spent >= 3 ? 9 : 4
      const hit = deal(input, dmg)
      return {
        ...result,
        ...hit,
        mechanicSpend: spendRes.spent,
        logLine:
          spendRes.spent >= 3
            ? `Played ${card.name} — spent 3 Souls, dealt ${hit.damageDealt} damage.`
            : `Played ${card.name} — dealt ${hit.damageDealt} damage (need 3 Souls).`,
      }
    }

    case 'necromancer_soul_guard': {
      const spendRes = spend(meter, 2)
      meter = spendRes.meter
      if (spendRes.spent >= 2) {
        const gained = 8
        const heal = 2
        return {
          ...result,
          playerBlock: input.playerBlock + gained,
          playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
          blockGained: gained,
          mechanicSpend: 2,
          logLine: `Played ${card.name} — spent 2 Souls, gained ${gained} block, healed ${heal}.`,
        }
      }
      const gained = 4
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block (need 2 Souls for more).`,
      }
    }

    case 'vampire_bloodletting': {
      meter = gain(meter, 1)
      return {
        ...result,
        playerHp: Math.max(0, input.playerHp - 3),
        extraDraws: 2,
        mechanicGain: 1,
        logLine: `Played ${card.name} — lost 3 HP, drew 2, +1 Blood.`,
      }
    }

    case 'vampire_crimson_bite': {
      const hit = deal(input, 5)
      const heal = meter.value >= 4 && hit.damageDealt > 0 ? 2 : 0
      return {
        ...result,
        ...hit,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        logLine:
          heal > 0
            ? `Played ${card.name} — dealt ${hit.damageDealt} damage, healed ${heal}.`
            : `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'vampire_blood_shield': {
      const gained = 10
      return {
        ...result,
        playerHp: Math.max(0, input.playerHp - 2),
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — lost 2 HP, gained ${gained} block.`,
      }
    }

    case 'pirate_heist': {
      meter = gain(meter, 2)
      const hit = deal(input, 4)
      return {
        ...result,
        ...hit,
        mechanicGain: 2,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, +2 Booty.`,
      }
    }

    case 'pirate_cannon_volley': {
      const hit = deal(input, 3 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Booty).`,
      }
    }

    case 'pirate_treasure_cache': {
      meter = gain(meter, 3)
      const gained = 5
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        mechanicGain: 3,
        logLine: `Played ${card.name} — gained ${gained} block, +3 Booty.`,
      }
    }

    case 'merchant_tithe': {
      meter = gain(meter, 2)
      const gained = 4
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        mechanicGain: 2,
        logLine: `Played ${card.name} — gained ${gained} block, +2 Coin.`,
      }
    }

    case 'merchant_invoice': {
      const bonus = Math.floor(meter.value / 2)
      const hit = deal(input, 4 + bonus)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${bonus} Coin).`,
      }
    }

    case 'merchant_hoard': {
      meter = gain(meter, 3)
      return {
        ...result,
        extraDraws: 1,
        mechanicGain: 3,
        logLine: `Played ${card.name} — +3 Coin, drew 1 card.`,
      }
    }

    case 'alchemist_distill': {
      meter = gain(meter, 2)
      return {
        ...result,
        extraDraws: 1,
        mechanicGain: 2,
        logLine: `Played ${card.name} — +2 Brew, drew 1 card.`,
      }
    }

    case 'alchemist_acid_flask': {
      const hit = deal(input, 5 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Brew).`,
      }
    }

    case 'alchemist_elixir_surge': {
      const spendRes = spend(meter, 3)
      meter = spendRes.meter
      const heal = spendRes.spent >= 3 ? 5 : 1
      return {
        ...result,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        mechanicSpend: spendRes.spent,
        logLine:
          spendRes.spent >= 3
            ? `Played ${card.name} — spent 3 Brew, healed ${heal}.`
            : `Played ${card.name} — healed ${heal}.`,
      }
    }

    case 'timekeeper_tick': {
      meter = gain(meter, 2)
      return {
        ...result,
        mechanicGain: 2,
        logLine: `Played ${card.name} — +2 Time.`,
      }
    }

    case 'timekeeper_chrono_bolt': {
      const hit = deal(input, 4 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Time).`,
      }
    }

    case 'timekeeper_rewind': {
      const big = meter.value >= 3
      const heal = big ? 4 : 1
      if (big) meter = gain(meter, 1)
      return {
        ...result,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        mechanicGain: big ? 1 : 0,
        logLine: `Played ${card.name} — healed ${heal}${big ? ', +1 Time' : ''}.`,
      }
    }

    case 'pyromancer_kindle': {
      meter = gain(meter, 2)
      const hit = deal(input, 3)
      return {
        ...result,
        ...hit,
        mechanicGain: 2,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, +2 Ember.`,
      }
    }

    case 'pyromancer_fireball': {
      const hit = deal(input, 5 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Ember).`,
      }
    }

    case 'pyromancer_ignite_burst': {
      const spendRes = spend(meter, 4)
      meter = spendRes.meter
      const dmg = spendRes.spent >= 4 ? 10 : 4
      const hit = deal(input, dmg)
      return {
        ...result,
        ...hit,
        mechanicSpend: spendRes.spent,
        logLine:
          spendRes.spent >= 4
            ? `Played ${card.name} — spent 4 Ember, dealt ${hit.damageDealt} damage.`
            : `Played ${card.name} — dealt ${hit.damageDealt} damage (need 4 Ember).`,
      }
    }

    case 'cryomancer_chill': {
      meter = gain(meter, 2)
      const gained = 5
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        mechanicGain: 2,
        logLine: `Played ${card.name} — gained ${gained} block, +2 Frost.`,
      }
    }

    case 'cryomancer_ice_lance': {
      const hit = deal(input, 4 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Frost).`,
      }
    }

    case 'cryomancer_glacier': {
      const spendRes = spend(meter, 3)
      meter = spendRes.meter
      const gained = spendRes.spent >= 3 ? 12 : 5
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        mechanicSpend: spendRes.spent,
        logLine:
          spendRes.spent >= 3
            ? `Played ${card.name} — spent 3 Frost, gained ${gained} block.`
            : `Played ${card.name} — gained ${gained} block.`,
      }
    }

    case 'paladin_prayer': {
      meter = gain(meter, 2)
      const heal = 2
      return {
        ...result,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        mechanicGain: 2,
        logLine: `Played ${card.name} — +2 Faith, healed ${heal}.`,
      }
    }

    case 'paladin_smite': {
      const hit = deal(input, 5 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Faith).`,
      }
    }

    case 'paladin_bulwark': {
      const spendRes = spend(meter, 2)
      meter = spendRes.meter
      if (spendRes.spent >= 2) {
        const gained = 9
        return {
          ...result,
          playerBlock: input.playerBlock + gained,
          playerHp: Math.min(input.playerMaxHp, input.playerHp + 1),
          blockGained: gained,
          mechanicSpend: 2,
          logLine: `Played ${card.name} — spent 2 Faith, gained ${gained} block, healed 1.`,
        }
      }
      const gained = 4
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block.`,
      }
    }

    case 'assassin_poised': {
      meter = gain(meter, 2)
      return {
        ...result,
        mechanicGain: 2,
        logLine: `Played ${card.name} — +2 Edge.`,
      }
    }

    case 'assassin_shadow_cut': {
      const hit = deal(input, 6 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Edge).`,
      }
    }

    case 'assassin_ambush_prep': {
      meter = gain(meter, 3)
      const gained = 3
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        mechanicGain: 3,
        logLine: `Played ${card.name} — gained ${gained} block, +3 Edge.`,
      }
    }

    case 'chef_chop': {
      meter = gain(meter, 1)
      const hit = deal(input, 5)
      return {
        ...result,
        ...hit,
        mechanicGain: 1,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, +1 Prep.`,
      }
    }

    case 'chef_simmer': {
      meter = gain(meter, 2)
      const gained = 4
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        mechanicGain: 2,
        logLine: `Played ${card.name} — gained ${gained} block, +2 Prep.`,
      }
    }

    case 'chef_plated_feast': {
      const gained = meter.value * 2 + 4
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block (Prep).`,
      }
    }

    case 'dragon_knight_hoard': {
      meter = gain(meter, 2)
      return {
        ...result,
        mechanicGain: 2,
        logLine: `Played ${card.name} — +2 Scale.`,
      }
    }

    case 'dragon_knight_drake_fire': {
      const hit = deal(input, 5 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Scale).`,
      }
    }

    case 'dragon_knight_armor_plate': {
      const gained = meter.value + 3
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block (Scale).`,
      }
    }

    case 'gambler_chip': {
      meter = gain(meter, 2)
      const hit = deal(input, 3)
      return {
        ...result,
        ...hit,
        mechanicGain: 2,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, +2 Luck.`,
      }
    }

    case 'gambler_jackpot_shot': {
      const hit = deal(input, 4 + meter.value * 2)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (Luck ×2).`,
      }
    }

    case 'gambler_all_in': {
      meter = gain(meter, 3)
      const dmg = Math.floor(Math.random() * 5) + 4
      const hit = deal(input, dmg)
      return {
        ...result,
        ...hit,
        mechanicGain: 3,
        logLine: `Played ${card.name} — +3 Luck, dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'bard_verse': {
      meter = gain(meter, 2)
      return {
        ...result,
        extraDraws: 1,
        mechanicGain: 2,
        logLine: `Played ${card.name} — +2 Verse, drew 1 card.`,
      }
    }

    case 'bard_crescendo': {
      const hit = deal(input, 4 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Verse).`,
      }
    }

    case 'bard_harmony_shield': {
      const spendRes = spend(meter, 3)
      meter = spendRes.meter
      if (spendRes.spent >= 3) {
        const gained = 8
        return {
          ...result,
          playerBlock: input.playerBlock + gained,
          blockGained: gained,
          extraDraws: 1,
          mechanicSpend: 3,
          logLine: `Played ${card.name} — spent 3 Verse, gained ${gained} block, drew 1.`,
        }
      }
      const gained = 4
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block.`,
      }
    }

    case 'engineer_wind_up': {
      meter = gain(meter, 2)
      return {
        ...result,
        mechanicGain: 2,
        logLine: `Played ${card.name} — +2 Charge.`,
      }
    }

    case 'engineer_pulse_blast': {
      const hit = deal(input, 4 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Charge).`,
      }
    }

    case 'engineer_overcharge': {
      const spendRes = spend(meter, 3)
      meter = spendRes.meter
      if (spendRes.spent >= 3) {
        return {
          ...result,
          playerEnergy: input.playerEnergy + 2,
          mechanicSpend: 3,
          logLine: `Played ${card.name} — spent 3 Charge, gained 2 energy.`,
        }
      }
      meter = gain(meter, 1)
      return {
        ...result,
        mechanicGain: 1,
        logLine: `Played ${card.name} — +1 Charge (need 3 to overcharge).`,
      }
    }

    case 'monk_breath': {
      meter = gain(meter, 2)
      return {
        ...result,
        mechanicGain: 2,
        logLine: `Played ${card.name} — +2 Focus.`,
      }
    }

    case 'monk_palm_burst': {
      const hit = deal(input, 5 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Focus).`,
      }
    }

    case 'monk_meditation': {
      meter = gain(meter, 3)
      const gained = 5
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        mechanicGain: 3,
        logLine: `Played ${card.name} — gained ${gained} block, +3 Focus.`,
      }
    }

    case 'warlord_rally': {
      meter = gain(meter, 2)
      return {
        ...result,
        mechanicGain: 2,
        logLine: `Played ${card.name} — +2 Momentum.`,
      }
    }

    case 'warlord_charge': {
      const hit = deal(input, 5 + meter.value)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (+${meter.value} Momentum).`,
      }
    }

    case 'warlord_siege_wall': {
      const gained = meter.value + 4
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block (Momentum).`,
      }
    }

    default:
      return result
  }
}

/** Apply signature card mechanic fields onto the battle meter. */
export function applySignatureMechanicToMeter(
  meter: ClassMechanicMeter,
  effect: SignatureCardEffectResult,
): ClassMechanicMeter {
  if (effect.mechanicSet !== undefined) {
    return {
      ...meter,
      value: Math.max(0, Math.min(meter.max, effect.mechanicSet)),
    }
  }
  let value = meter.value
  if (effect.mechanicSpend) {
    value = Math.max(0, value - effect.mechanicSpend)
  }
  if (effect.mechanicGain) {
    value = Math.min(meter.max, value + effect.mechanicGain)
  }
  return { ...meter, value }
}

/** Signature cards that deal damage (for attack passives and combat FX). */
export const SIGNATURE_ATTACK_CARD_IDS: readonly CardId[] =
  SIGNATURE_CARD_IDS.filter((id) => getCard(id).damage !== undefined)

export const SIGNATURE_STRIKE_CARD_IDS: readonly CardId[] = ['gunslinger_quick_shot']
