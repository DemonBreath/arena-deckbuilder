import { getCard, type CardId } from './cardDatabase'
import { getAttackDamageBonus, type RelicId } from './relicDatabase'

export interface CardEffectInput {
  cardId: CardId
  playerHp: number
  playerMaxHp: number
  playerBlock: number
  playerEnergy: number
  enemyHp: number
  enemyBlock: number
  relics: RelicId[]
}

export interface CardEffectResult {
  playerHp: number
  playerBlock: number
  playerEnergy: number
  enemyHp: number
  enemyBlock: number
  damageDealt: number
  blockGained: number
  extraDraws: number
  logLine: string
  countsAsAttack: boolean
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

function dealDamage(
  input: CardEffectInput,
  rawDamage: number,
  attackBonus: number,
): Pick<
  CardEffectResult,
  'enemyHp' | 'enemyBlock' | 'damageDealt' | 'countsAsAttack'
> {
  const total = rawDamage + attackBonus
  const hit = applyDamageToEnemy(input.enemyHp, input.enemyBlock, total)
  return {
    enemyHp: hit.enemyHp,
    enemyBlock: hit.enemyBlock,
    damageDealt: hit.damageDealt,
    countsAsAttack: true,
  }
}

/** Resolve card play for solo and PvP (enemy = opponent). */
export function resolveCardEffect(input: CardEffectInput): CardEffectResult {
  const card = getCard(input.cardId)
  const attackBonus = getAttackDamageBonus(input.relics)
  let result: CardEffectResult = {
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

  switch (input.cardId) {
    case 'shield_bash':
    case 'shield_slam': {
      const hit = applyDamageToEnemy(
        input.enemyHp,
        input.enemyBlock,
        input.playerBlock,
      )
      return {
        ...result,
        ...hit,
        countsAsAttack: true,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage (equal to block).`,
      }
    }

    case 'double_guard': {
      const gained = 10
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block (5 + 5).`,
      }
    }

    case 'stonewall': {
      const gained = 12
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block.`,
      }
    }

    case 'bastion': {
      const gained = 8
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block.`,
      }
    }

    case 'blood_rush': {
      const hpLoss = 3
      const energyGain = 2
      return {
        ...result,
        playerHp: Math.max(0, input.playerHp - hpLoss),
        playerEnergy: input.playerEnergy + energyGain,
        logLine: `Played ${card.name} — lost ${hpLoss} HP, gained ${energyGain} energy.`,
      }
    }

    case 'reckless_swing': {
      const hit = dealDamage(input, 11, attackBonus)
      return {
        ...result,
        ...hit,
        playerBlock: 0,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, lost all block.`,
      }
    }

    case 'rampage': {
      const hit = dealDamage(input, 9, attackBonus)
      const hpLoss = 2
      return {
        ...result,
        ...hit,
        playerHp: Math.max(0, input.playerHp - hpLoss),
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, lost ${hpLoss} HP.`,
      }
    }

    case 'quickdraw': {
      const hit = dealDamage(input, 5, attackBonus)
      return {
        ...result,
        ...hit,
        extraDraws: 1,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, drew 1 card.`,
      }
    }

    case 'fan_the_hammer': {
      let hp = input.enemyHp
      let block = input.enemyBlock
      let total = 0
      for (let i = 0; i < 3; i++) {
        const hit = applyDamageToEnemy(hp, block, 3 + (i === 0 ? attackBonus : 0))
        hp = hit.enemyHp
        block = hit.enemyBlock
        total += hit.damageDealt
      }
      return {
        ...result,
        enemyHp: hp,
        enemyBlock: block,
        damageDealt: total,
        countsAsAttack: true,
        logLine: `Played ${card.name} — dealt ${total} damage (3×3).`,
      }
    }

    case 'dead_eye': {
      const hit = dealDamage(input, 8, attackBonus)
      return {
        ...result,
        ...hit,
        extraDraws: 1,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, drew 1 card.`,
      }
    }

    case 'soul_tax': {
      const hpLoss = 2
      return {
        ...result,
        playerHp: Math.max(0, input.playerHp - hpLoss),
        extraDraws: 2,
        logLine: `Played ${card.name} — lost ${hpLoss} HP, drew 2 cards.`,
      }
    }

    case 'bone_armor': {
      const gained = 6
      const heal = 1
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block, healed ${heal} HP.`,
      }
    }

    case 'grave_pact': {
      const hpLoss = 1
      const gained = 4
      return {
        ...result,
        playerHp: Math.max(0, input.playerHp - hpLoss),
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — lost ${hpLoss} HP, gained ${gained} block.`,
      }
    }

    case 'flame_bolt': {
      const hit = dealDamage(input, 7, attackBonus)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'ignite': {
      const hit = dealDamage(input, 5, attackBonus)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'inferno': {
      const hit = dealDamage(input, 10, attackBonus)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'frost_wall': {
      const gained = 7
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block.`,
      }
    }

    case 'glacial_strike': {
      const hit = dealDamage(input, 6, attackBonus)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'absolute_zero': {
      const gained = 5
      const hit = dealDamage(input, 4, attackBonus)
      return {
        ...result,
        ...hit,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block, dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'lay_on_hands': {
      const heal = 3
      return {
        ...result,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        logLine: `Played ${card.name} — healed ${heal} HP.`,
      }
    }

    case 'consecrate': {
      const gained = 5
      const heal = 1
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block, healed ${heal} HP.`,
      }
    }

    case 'divine_shield': {
      const gained = 10
      const heal = 2
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block, healed ${heal} HP.`,
      }
    }

    case 'ambush': {
      const hit = dealDamage(input, 9, attackBonus)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'rupture': {
      const hit = dealDamage(input, 6, attackBonus)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'death_mark': {
      const hit = dealDamage(input, 12, attackBonus)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'unstable_concoction': {
      const brewAttack = Math.random() < 0.5
      if (brewAttack) {
        const hit = dealDamage(input, 6, attackBonus)
        return {
          ...result,
          ...hit,
          logLine: `Played ${card.name} — volatile blast dealt ${hit.damageDealt} damage.`,
        }
      }
      const gained = 6
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — brew foamed into ${gained} block.`,
      }
    }

    case 'grand_elixir': {
      const heal = 2
      const gained = 4
      return {
        ...result,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — healed ${heal} HP, gained ${gained} block.`,
      }
    }

    case 'philosophers_stone': {
      const heal = 3
      const hit = dealDamage(input, 5, attackBonus)
      return {
        ...result,
        ...hit,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        logLine: `Played ${card.name} — healed ${heal} HP, dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'temporal_draw': {
      return {
        ...result,
        extraDraws: 2,
        logLine: `Played ${card.name} — drew 2 cards.`,
      }
    }

    case 'borrowed_power': {
      const hit = dealDamage(input, 7, attackBonus)
      return {
        ...result,
        ...hit,
        extraDraws: 1,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage, drew 1 card.`,
      }
    }

    case 'time_stop': {
      return {
        ...result,
        extraDraws: 3,
        playerEnergy: input.playerEnergy + 1,
        logLine: `Played ${card.name} — drew 3 cards, gained 1 energy.`,
      }
    }

    case 'spare_change': {
      const gained = 4
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block (hoarded coin).`,
      }
    }

    case 'liquidation': {
      const hit = dealDamage(input, 4, attackBonus)
      return {
        ...result,
        ...hit,
        logLine: `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'golden_contract': {
      const gained = 6
      return {
        ...result,
        playerBlock: input.playerBlock + gained,
        blockGained: gained,
        logLine: `Played ${card.name} — gained ${gained} block.`,
      }
    }

    case 'sanguine_strike': {
      const hit = dealDamage(input, 5, attackBonus)
      const heal = hit.damageDealt > 0 ? 2 : 0
      return {
        ...result,
        ...hit,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        logLine:
          heal > 0
            ? `Played ${card.name} — dealt ${hit.damageDealt} damage, healed ${heal} HP.`
            : `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'essence_drain': {
      const hit = dealDamage(input, 6, attackBonus)
      const heal = hit.damageDealt > 0 ? 1 : 0
      return {
        ...result,
        ...hit,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        logLine:
          heal > 0
            ? `Played ${card.name} — dealt ${hit.damageDealt} damage, healed ${heal} HP.`
            : `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    case 'blood_feast': {
      const hit = dealDamage(input, 8, attackBonus)
      const heal = hit.damageDealt > 0 ? 3 : 0
      return {
        ...result,
        ...hit,
        playerHp: Math.min(input.playerMaxHp, input.playerHp + heal),
        logLine:
          heal > 0
            ? `Played ${card.name} — dealt ${hit.damageDealt} damage, healed ${heal} HP.`
            : `Played ${card.name} — dealt ${hit.damageDealt} damage.`,
      }
    }

    default:
      break
  }

  if (card.damage !== undefined) {
    const hit = dealDamage(input, card.damage, attackBonus)
    const parts: string[] = [`dealt ${hit.damageDealt} damage`]
    if (card.block !== undefined) {
      result.playerBlock = input.playerBlock + card.block
      result.blockGained = card.block
      parts.push(`gained ${card.block} block`)
    }
    return {
      ...result,
      ...hit,
      playerBlock: card.block !== undefined ? input.playerBlock + card.block : input.playerBlock,
      blockGained: card.block ?? 0,
      logLine: `Played ${card.name} — ${parts.join(', ')}.`,
    }
  }

  if (card.block !== undefined) {
    return {
      ...result,
      playerBlock: input.playerBlock + card.block,
      blockGained: card.block,
      logLine: `Played ${card.name} — gained ${card.block} block.`,
    }
  }

  return result
}

export function cardCountsAsAttack(cardId: CardId): boolean {
  const card = getCard(cardId)
  if (card.damage !== undefined) return true
  const attackIds: CardId[] = [
    'shield_bash',
    'shield_slam',
    'reckless_swing',
    'rampage',
    'quickdraw',
    'fan_the_hammer',
    'dead_eye',
    'flame_bolt',
    'ignite',
    'inferno',
    'glacial_strike',
    'absolute_zero',
    'ambush',
    'rupture',
    'death_mark',
    'unstable_concoction',
    'philosophers_stone',
    'borrowed_power',
    'liquidation',
    'sanguine_strike',
    'essence_drain',
    'blood_feast',
  ]
  return attackIds.includes(cardId)
}

export function cardCountsAsStrike(cardId: CardId): boolean {
  return (
    cardId === 'strike' ||
    cardId === 'strike_plus' ||
    cardId === 'heavy_strike'
  )
}
