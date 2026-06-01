import { SIGNATURE_CARD_ENTRIES } from './signatureCardEntries'

export type CardId =
  | 'strike'
  | 'guard'
  | 'strike_plus'
  | 'guard_plus'
  | 'heavy_strike'
  | 'quick_jab'
  | 'shield_bash'
  | 'double_guard'
  | 'shield_slam'
  | 'stonewall'
  | 'bastion'
  | 'blood_rush'
  | 'reckless_swing'
  | 'rampage'
  | 'quickdraw'
  | 'fan_the_hammer'
  | 'dead_eye'
  | 'soul_tax'
  | 'bone_armor'
  | 'grave_pact'
  | 'flame_bolt'
  | 'ignite'
  | 'inferno'
  | 'frost_wall'
  | 'glacial_strike'
  | 'absolute_zero'
  | 'lay_on_hands'
  | 'consecrate'
  | 'divine_shield'
  | 'ambush'
  | 'rupture'
  | 'death_mark'
  | 'unstable_concoction'
  | 'grand_elixir'
  | 'philosophers_stone'
  | 'temporal_draw'
  | 'borrowed_power'
  | 'time_stop'
  | 'spare_change'
  | 'liquidation'
  | 'golden_contract'
  | 'sanguine_strike'
  | 'essence_drain'
  | 'blood_feast'
  | 'plunder_strike'
  | 'broadside'
  | 'salty_guard'
  | 'captains_rum'
  | 'serrated_blade'
  | 'hearty_stew'
  | 'mise_guard'
  | 'grand_feast'
  | 'drake_strike'
  | 'scale_guard'
  | 'kindling'
  | 'dragons_fury'
  | 'lucky_strike'
  | 'double_down'
  | 'hedged_guard'
  | 'jackpot'
  | 'encore'
  | 'harmony'
  | 'rhythm_guard'
  | 'grand_finale'
  | 'wrench_strike'
  | 'gyro_shot'
  | 'plating'
  | 'overclock_core'
  | 'flurry'
  | 'palm_strike'
  | 'focus_guard'
  | 'thousand_steps'
  | 'march_strike'
  | 'rally_guard'
  | 'war_cry'
  | 'siege_breaker'
  | 'guardian_brace'
  | 'guardian_shield_crush'
  | 'guardian_stand_firm'
  | 'berserker_enrage'
  | 'berserker_blood_strike'
  | 'berserker_reckless_charge'
  | 'gunslinger_quick_shot'
  | 'gunslinger_chain_fire'
  | 'gunslinger_reload'
  | 'necromancer_harvest'
  | 'necromancer_bone_spear'
  | 'necromancer_soul_guard'
  | 'vampire_bloodletting'
  | 'vampire_crimson_bite'
  | 'vampire_blood_shield'
  | 'pirate_heist'
  | 'pirate_cannon_volley'
  | 'pirate_treasure_cache'
  | 'merchant_tithe'
  | 'merchant_invoice'
  | 'merchant_hoard'
  | 'alchemist_distill'
  | 'alchemist_acid_flask'
  | 'alchemist_elixir_surge'
  | 'timekeeper_tick'
  | 'timekeeper_chrono_bolt'
  | 'timekeeper_rewind'
  | 'pyromancer_kindle'
  | 'pyromancer_fireball'
  | 'pyromancer_ignite_burst'
  | 'cryomancer_chill'
  | 'cryomancer_ice_lance'
  | 'cryomancer_glacier'
  | 'paladin_prayer'
  | 'paladin_smite'
  | 'paladin_bulwark'
  | 'assassin_poised'
  | 'assassin_shadow_cut'
  | 'assassin_ambush_prep'
  | 'chef_chop'
  | 'chef_simmer'
  | 'chef_plated_feast'
  | 'dragon_knight_hoard'
  | 'dragon_knight_drake_fire'
  | 'dragon_knight_armor_plate'
  | 'gambler_chip'
  | 'gambler_jackpot_shot'
  | 'gambler_all_in'
  | 'bard_verse'
  | 'bard_crescendo'
  | 'bard_harmony_shield'
  | 'engineer_wind_up'
  | 'engineer_pulse_blast'
  | 'engineer_overcharge'
  | 'monk_breath'
  | 'monk_palm_burst'
  | 'monk_meditation'
  | 'warlord_rally'
  | 'warlord_charge'
  | 'warlord_siege_wall'

export type CardSpecial = 'shield_bash' | 'double_guard'

export interface CardDefinition {
  id: CardId
  name: string
  cost: number
  damage?: number
  block?: number
  description: string
  /** Extra line for signature cards — shown in card tooltip. */
  mechanicHint?: string
  shopPrice: number
  special?: CardSpecial
}

const CLASS_CARD_PRICE = 30
const RARE_CLASS_CARD_PRICE = 40

const CORE_CARD_DATABASE = {
  strike: {
    id: 'strike',
    name: 'Strike',
    cost: 1,
    damage: 6,
    description: 'Deal 6 damage',
    shopPrice: 25,
  },
  guard: {
    id: 'guard',
    name: 'Guard',
    cost: 1,
    block: 5,
    description: 'Gain 5 block',
    shopPrice: 25,
  },
  strike_plus: {
    id: 'strike_plus',
    name: 'Strike+',
    cost: 1,
    damage: 9,
    description: 'Deal 9 damage',
    shopPrice: 25,
  },
  guard_plus: {
    id: 'guard_plus',
    name: 'Guard+',
    cost: 1,
    block: 8,
    description: 'Gain 8 block',
    shopPrice: 25,
  },
  heavy_strike: {
    id: 'heavy_strike',
    name: 'Heavy Strike',
    cost: 2,
    damage: 14,
    description: 'Deal 14 damage',
    shopPrice: 25,
  },
  quick_jab: {
    id: 'quick_jab',
    name: 'Quick Jab',
    cost: 0,
    damage: 4,
    description: 'Deal 4 damage',
    shopPrice: 25,
  },
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    cost: 1,
    special: 'shield_bash',
    description: 'Deal damage equal to your block',
    shopPrice: 25,
  },
  double_guard: {
    id: 'double_guard',
    name: 'Double Guard',
    cost: 2,
    special: 'double_guard',
    description: 'Gain 5 block twice',
    shopPrice: 25,
  },
  shield_slam: {
    id: 'shield_slam',
    name: 'Shield Slam',
    cost: 1,
    description: 'Deal damage equal to your block',
    shopPrice: CLASS_CARD_PRICE,
  },
  stonewall: {
    id: 'stonewall',
    name: 'Stonewall',
    cost: 2,
    description: 'Gain 12 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  bastion: {
    id: 'bastion',
    name: 'Bastion',
    cost: 2,
    description: 'Gain 8 block',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  blood_rush: {
    id: 'blood_rush',
    name: 'Blood Rush',
    cost: 0,
    description: 'Lose 3 HP. Gain 2 energy',
    shopPrice: CLASS_CARD_PRICE,
  },
  reckless_swing: {
    id: 'reckless_swing',
    name: 'Reckless Swing',
    cost: 2,
    description: 'Deal 11 damage. Lose all block',
    shopPrice: CLASS_CARD_PRICE,
  },
  rampage: {
    id: 'rampage',
    name: 'Rampage',
    cost: 2,
    description: 'Deal 9 damage. Lose 2 HP',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  quickdraw: {
    id: 'quickdraw',
    name: 'Quickdraw',
    cost: 1,
    description: 'Deal 5 damage. Draw 1 card',
    shopPrice: CLASS_CARD_PRICE,
  },
  fan_the_hammer: {
    id: 'fan_the_hammer',
    name: 'Fan the Hammer',
    cost: 2,
    description: 'Deal 3 damage three times',
    shopPrice: CLASS_CARD_PRICE,
  },
  dead_eye: {
    id: 'dead_eye',
    name: 'Dead Eye',
    cost: 2,
    description: 'Deal 8 damage. Draw 1 card',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  soul_tax: {
    id: 'soul_tax',
    name: 'Soul Tax',
    cost: 1,
    description: 'Lose 2 HP. Draw 2 cards',
    shopPrice: CLASS_CARD_PRICE,
  },
  bone_armor: {
    id: 'bone_armor',
    name: 'Bone Armor',
    cost: 2,
    description: 'Gain 6 block. Heal 1 HP',
    shopPrice: CLASS_CARD_PRICE,
  },
  grave_pact: {
    id: 'grave_pact',
    name: 'Grave Pact',
    cost: 1,
    description: 'Lose 1 HP. Gain 4 block',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  flame_bolt: {
    id: 'flame_bolt',
    name: 'Flame Bolt',
    cost: 1,
    description: 'Deal 7 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  ignite: {
    id: 'ignite',
    name: 'Ignite',
    cost: 1,
    description: 'Deal 5 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    cost: 2,
    description: 'Deal 10 damage',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  frost_wall: {
    id: 'frost_wall',
    name: 'Frost Wall',
    cost: 2,
    description: 'Gain 7 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  glacial_strike: {
    id: 'glacial_strike',
    name: 'Glacial Strike',
    cost: 1,
    description: 'Deal 6 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  absolute_zero: {
    id: 'absolute_zero',
    name: 'Absolute Zero',
    cost: 2,
    description: 'Gain 5 block. Deal 4 damage',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  lay_on_hands: {
    id: 'lay_on_hands',
    name: 'Lay on Hands',
    cost: 1,
    description: 'Heal 3 HP',
    shopPrice: CLASS_CARD_PRICE,
  },
  consecrate: {
    id: 'consecrate',
    name: 'Consecrate',
    cost: 2,
    description: 'Gain 5 block. Heal 1 HP',
    shopPrice: CLASS_CARD_PRICE,
  },
  divine_shield: {
    id: 'divine_shield',
    name: 'Divine Shield',
    cost: 2,
    description: 'Gain 10 block. Heal 2 HP',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  ambush: {
    id: 'ambush',
    name: 'Ambush',
    cost: 2,
    description: 'Deal 9 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  rupture: {
    id: 'rupture',
    name: 'Rupture',
    cost: 1,
    description: 'Deal 6 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  death_mark: {
    id: 'death_mark',
    name: 'Death Mark',
    cost: 2,
    description: 'Deal 12 damage',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  unstable_concoction: {
    id: 'unstable_concoction',
    name: 'Unstable Concoction',
    cost: 1,
    description: '50%: 6 damage or 6 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  grand_elixir: {
    id: 'grand_elixir',
    name: 'Grand Elixir',
    cost: 2,
    description: 'Heal 2 HP. Gain 4 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  philosophers_stone: {
    id: 'philosophers_stone',
    name: "Philosopher's Stone",
    cost: 2,
    description: 'Heal 3 HP. Deal 5 damage',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  temporal_draw: {
    id: 'temporal_draw',
    name: 'Temporal Draw',
    cost: 1,
    description: 'Draw 2 cards',
    shopPrice: CLASS_CARD_PRICE,
  },
  borrowed_power: {
    id: 'borrowed_power',
    name: 'Borrowed Power',
    cost: 2,
    description: 'Deal 7 damage. Draw 1 card',
    shopPrice: CLASS_CARD_PRICE,
  },
  time_stop: {
    id: 'time_stop',
    name: 'Time Stop',
    cost: 2,
    description: 'Draw 3 cards. Gain 1 energy',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  spare_change: {
    id: 'spare_change',
    name: 'Spare Change',
    cost: 1,
    description: 'Gain 4 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  liquidation: {
    id: 'liquidation',
    name: 'Liquidation',
    cost: 1,
    description: 'Deal 4 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  golden_contract: {
    id: 'golden_contract',
    name: 'Golden Contract',
    cost: 2,
    description: 'Gain 6 block',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  sanguine_strike: {
    id: 'sanguine_strike',
    name: 'Sanguine Strike',
    cost: 1,
    description: 'Deal 5 damage. Heal 2 HP if hit',
    shopPrice: CLASS_CARD_PRICE,
  },
  essence_drain: {
    id: 'essence_drain',
    name: 'Essence Drain',
    cost: 2,
    description: 'Deal 6 damage. Heal 1 HP if hit',
    shopPrice: CLASS_CARD_PRICE,
  },
  blood_feast: {
    id: 'blood_feast',
    name: 'Blood Feast',
    cost: 2,
    description: 'Deal 8 damage. Heal 3 HP if hit',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  plunder_strike: {
    id: 'plunder_strike',
    name: 'Plunder Strike',
    cost: 1,
    damage: 6,
    description: 'Deal 6 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  broadside: {
    id: 'broadside',
    name: 'Broadside',
    cost: 2,
    damage: 9,
    description: 'Deal 9 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  salty_guard: {
    id: 'salty_guard',
    name: 'Salty Guard',
    cost: 1,
    block: 7,
    description: 'Gain 7 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  captains_rum: {
    id: 'captains_rum',
    name: "Captain's Rum",
    cost: 2,
    block: 10,
    description: 'Gain 10 block',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  serrated_blade: {
    id: 'serrated_blade',
    name: 'Serrated Blade',
    cost: 1,
    damage: 6,
    description: 'Deal 6 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  hearty_stew: {
    id: 'hearty_stew',
    name: 'Hearty Stew',
    cost: 1,
    block: 6,
    description: 'Gain 6 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  mise_guard: {
    id: 'mise_guard',
    name: 'Mise en Place',
    cost: 1,
    block: 8,
    description: 'Gain 8 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  grand_feast: {
    id: 'grand_feast',
    name: 'Grand Feast',
    cost: 2,
    damage: 7,
    block: 5,
    description: 'Deal 7 damage. Gain 5 block',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  drake_strike: {
    id: 'drake_strike',
    name: 'Drake Strike',
    cost: 1,
    damage: 6,
    description: 'Deal 6 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  scale_guard: {
    id: 'scale_guard',
    name: 'Scale Guard',
    cost: 1,
    block: 7,
    description: 'Gain 7 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  kindling: {
    id: 'kindling',
    name: 'Kindling Breath',
    cost: 2,
    damage: 8,
    description: 'Deal 8 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  dragons_fury: {
    id: 'dragons_fury',
    name: "Dragon's Fury",
    cost: 2,
    damage: 10,
    description: 'Deal 10 damage',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  lucky_strike: {
    id: 'lucky_strike',
    name: 'Lucky Strike',
    cost: 1,
    damage: 6,
    description: 'Deal 6 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  double_down: {
    id: 'double_down',
    name: 'Double Down',
    cost: 2,
    damage: 8,
    description: 'Deal 8 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  hedged_guard: {
    id: 'hedged_guard',
    name: 'Hedged Guard',
    cost: 1,
    block: 6,
    description: 'Gain 6 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  jackpot: {
    id: 'jackpot',
    name: 'Jackpot',
    cost: 2,
    damage: 11,
    description: 'Deal 11 damage',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  encore: {
    id: 'encore',
    name: 'Encore',
    cost: 1,
    damage: 5,
    description: 'Deal 5 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  harmony: {
    id: 'harmony',
    name: 'Harmony',
    cost: 1,
    block: 6,
    description: 'Gain 6 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  rhythm_guard: {
    id: 'rhythm_guard',
    name: 'Rhythm Guard',
    cost: 1,
    block: 7,
    description: 'Gain 7 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  grand_finale: {
    id: 'grand_finale',
    name: 'Grand Finale',
    cost: 2,
    damage: 9,
    description: 'Deal 9 damage',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  wrench_strike: {
    id: 'wrench_strike',
    name: 'Wrench Strike',
    cost: 1,
    damage: 6,
    description: 'Deal 6 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  gyro_shot: {
    id: 'gyro_shot',
    name: 'Gyro Shot',
    cost: 2,
    damage: 8,
    description: 'Deal 8 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  plating: {
    id: 'plating',
    name: 'Plating',
    cost: 1,
    block: 7,
    description: 'Gain 7 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  overclock_core: {
    id: 'overclock_core',
    name: 'Overclock Core',
    cost: 2,
    damage: 7,
    block: 4,
    description: 'Deal 7 damage. Gain 4 block',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  flurry: {
    id: 'flurry',
    name: 'Flurry',
    cost: 1,
    damage: 5,
    description: 'Deal 5 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  palm_strike: {
    id: 'palm_strike',
    name: 'Palm Strike',
    cost: 1,
    damage: 6,
    description: 'Deal 6 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  focus_guard: {
    id: 'focus_guard',
    name: 'Focus Guard',
    cost: 1,
    block: 7,
    description: 'Gain 7 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  thousand_steps: {
    id: 'thousand_steps',
    name: 'Thousand Steps',
    cost: 2,
    damage: 9,
    description: 'Deal 9 damage',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
  march_strike: {
    id: 'march_strike',
    name: 'March Strike',
    cost: 1,
    damage: 6,
    description: 'Deal 6 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  rally_guard: {
    id: 'rally_guard',
    name: 'Rally Guard',
    cost: 1,
    block: 7,
    description: 'Gain 7 block',
    shopPrice: CLASS_CARD_PRICE,
  },
  war_cry: {
    id: 'war_cry',
    name: 'War Cry',
    cost: 2,
    damage: 7,
    description: 'Deal 7 damage',
    shopPrice: CLASS_CARD_PRICE,
  },
  siege_breaker: {
    id: 'siege_breaker',
    name: 'Siege Breaker',
    cost: 2,
    damage: 10,
    description: 'Deal 10 damage',
    shopPrice: RARE_CLASS_CARD_PRICE,
  },
} satisfies Partial<Record<CardId, CardDefinition>>

export const CARD_DATABASE: Record<CardId, CardDefinition> = {
  ...CORE_CARD_DATABASE,
  ...SIGNATURE_CARD_ENTRIES,
} as Record<CardId, CardDefinition>

export const STARTER_DECK: CardId[] = [
  ...Array<CardId>(5).fill('strike'),
  ...Array<CardId>(5).fill('guard'),
]

export const SHOP_CARD_POOL: CardId[] = [
  'strike_plus',
  'guard_plus',
  'heavy_strike',
  'quick_jab',
  'shield_bash',
  'double_guard',
]

/** Cards offered as post-battle rewards (solo — class-aware generation overrides). */
export const REWARD_CARD_POOL: CardId[] = [...SHOP_CARD_POOL]

export const SHOP_CARD_PRICE = 25

export function getCard(id: CardId): CardDefinition {
  return CARD_DATABASE[id]
}
