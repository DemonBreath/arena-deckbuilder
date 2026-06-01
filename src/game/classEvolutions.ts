import type { ClassId, ClassPassive, ClassPassiveKind, ClassRole, ClassStats } from './classDatabase'

/** Scalable evolution id — validated via registry (supports 30×3 expansions). */
export type EvolutionId = string

/** Battles won before the evolution choice appears (after the 3rd victory). */
export const EVOLUTION_TRIGGER_AFTER_BATTLES_WON = 3

export interface EvolutionRewardWeights {
  /** Added to class-pool roll chance (0–1 scale, e.g. 0.1 = +10%). */
  classPoolBonus: number
  /** Added to rare-class roll chance. */
  rarePoolBonus: number
}

export interface EvolutionDefinition {
  id: EvolutionId
  baseClassId: ClassId
  name: string
  role: ClassRole
  tagline: string
  description: string
  passive: ClassPassive
  passiveKind: ClassPassiveKind
  /** Added to base class stats for the rest of the run. */
  statModifiers: Partial<ClassStats>
  rewardWeights: EvolutionRewardWeights
}

const EVOLUTION_REGISTRY: EvolutionDefinition[] = [
  // —— Guardian ——
  {
    id: 'guardian_warden',
    baseClassId: 'guardian',
    name: 'Warden',
    role: 'Tank',
    tagline: 'Bulwark of the arena.',
    description: 'More HP and stronger opening block each turn.',
    passive: {
      id: 'warden_fortify',
      name: 'Bulwark',
      description: '+6 Max HP. Start each turn with 2 Block.',
    },
    passiveKind: 'warden_fortify',
    statModifiers: { maxHp: 6 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0 },
  },
  {
    id: 'guardian_sentinel',
    baseClassId: 'guardian',
    name: 'Sentinel',
    role: 'Tank',
    tagline: 'Strike back when you guard.',
    description: 'Counterattack focus — Guards punish attackers.',
    passive: {
      id: 'sentinel_counter',
      name: 'Riposte',
      description: 'Start with 1 Block. Guards deal 2 damage to the enemy.',
    },
    passiveKind: 'sentinel_counter',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'guardian_templar',
    baseClassId: 'guardian',
    name: 'Templar',
    role: 'Sustain',
    tagline: 'Holy support and recovery.',
    description: 'Support and sustain — block and heal when guarding.',
    passive: {
      id: 'templar_aegis',
      name: 'Holy Aegis',
      description: 'Start with 1 Block. Heal 2 HP when you play Guard.',
    },
    passiveKind: 'templar_aegis',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0 },
  },

  // —— Berserker ——
  {
    id: 'berserker_executioner',
    baseClassId: 'berserker',
    name: 'Executioner',
    role: 'Aggro',
    tagline: 'Finish them in one blow.',
    description: 'Extreme damage on core attack cards.',
    passive: {
      id: 'executioner_slain',
      name: 'Death Sentence',
      description: 'Strike and Heavy Strike deal +3 damage.',
    },
    passiveKind: 'executioner_slain',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.1, rarePoolBonus: 0.03 },
  },
  {
    id: 'berserker_bloodlord',
    baseClassId: 'berserker',
    name: 'Bloodlord',
    role: 'Sustain',
    tagline: 'Violence feeds your vitality.',
    description: 'Lifesteal on every attack that connects.',
    passive: {
      id: 'bloodlord_siphon',
      name: 'Bloodlord',
      description: 'Heal 2 HP when an attack deals damage.',
    },
    passiveKind: 'bloodlord_siphon',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'berserker_juggernaut',
    baseClassId: 'berserker',
    name: 'Juggernaut',
    role: 'Tank',
    tagline: 'Unstoppable front-line pressure.',
    description: 'Tanky bruiser — block and bonus attack damage.',
    passive: {
      id: 'juggernaut_brute',
      name: 'Unstoppable',
      description: 'Start with 1 Block. Attacks deal +1 damage.',
    },
    passiveKind: 'juggernaut_brute',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0.01 },
  },

  // —— Gunslinger ——
  {
    id: 'gunslinger_deadeye',
    baseClassId: 'gunslinger',
    name: 'Deadeye',
    role: 'Aggro',
    tagline: 'First shot never misses.',
    description: 'Stronger opening strike each turn.',
    passive: {
      id: 'deadeye_opening',
      name: 'Deadeye',
      description: 'First attack each turn deals +3 bonus damage.',
    },
    passiveKind: 'deadeye_opening',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.1, rarePoolBonus: 0.02 },
  },
  {
    id: 'gunslinger_outlaw',
    baseClassId: 'gunslinger',
    name: 'Outlaw',
    role: 'Combo',
    tagline: 'Never stop firing.',
    description: 'Combo chains hit harder.',
    passive: {
      id: 'outlaw_combo',
      name: 'Outlaw Rhythm',
      description: 'Second Strike each turn deals +3 bonus damage.',
    },
    passiveKind: 'combo_shot',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0 },
  },
  {
    id: 'gunslinger_sheriff',
    baseClassId: 'gunslinger',
    name: 'Sheriff',
    role: 'Control',
    tagline: 'Measured tempo.',
    description: 'Strong first turn burst.',
    passive: {
      id: 'sheriff_tempo',
      name: 'High Noon',
      description: '+2 Energy on the first turn of each battle.',
    },
    passiveKind: 'opening_tempo',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0.02 },
  },

  // —— Necromancer ——
  {
    id: 'necromancer_lich',
    baseClassId: 'necromancer',
    name: 'Lich',
    role: 'Sustain',
    tagline: 'Deeper life drain.',
    description: 'Greater healing from Guard cards.',
    passive: {
      id: 'lich_drain',
      name: 'Soul Leech',
      description: 'Heal 2 HP when you play a Guard card.',
    },
    passiveKind: 'lich_drain',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'necromancer_reaper',
    baseClassId: 'necromancer',
    name: 'Reaper',
    role: 'Aggro',
    tagline: 'Death follows every blow.',
    description: 'Attacks hit harder at a cost.',
    passive: {
      id: 'reaper_touch',
      name: 'Grim Touch',
      description: '+1 damage on all attacks. -2 Max HP.',
    },
    passiveKind: 'burn_touch',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.1, rarePoolBonus: 0.03 },
  },
  {
    id: 'necromancer_phylactery',
    baseClassId: 'necromancer',
    name: 'Phylactery',
    role: 'Control',
    tagline: 'Bone armor perfected.',
    description: 'Block and small heals.',
    passive: {
      id: 'phylactery_bone',
      name: 'Phylactery',
      description: 'Start with 1 Block. Heal 1 HP on Guard.',
    },
    passiveKind: 'paladin_aegis',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0.01 },
  },

  // —— Pyromancer ——
  {
    id: 'pyromancer_infernal',
    baseClassId: 'pyromancer',
    name: 'Infernal',
    role: 'Aggro',
    tagline: 'All-consuming flames.',
    description: 'Maximum burn damage.',
    passive: {
      id: 'infernal_scorch',
      name: 'Inferno',
      description: '+2 damage on all attack cards.',
    },
    passiveKind: 'infernal_scorch',
    statModifiers: { maxHp: -4 },
    rewardWeights: { classPoolBonus: 0.12, rarePoolBonus: 0.04 },
  },
  {
    id: 'pyromancer_ember',
    baseClassId: 'pyromancer',
    name: 'Ember',
    role: 'Aggro',
    tagline: 'Quick burns.',
    description: 'Reliable scorch on attacks.',
    passive: {
      id: 'ember_scorch',
      name: 'Ember',
      description: '+1 damage on all attack cards.',
    },
    passiveKind: 'burn_touch',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'pyromancer_ashen',
    baseClassId: 'pyromancer',
    name: 'Ashen',
    role: 'Control',
    tagline: 'Survive the blaze.',
    description: 'Slight defense with firepower.',
    passive: {
      id: 'ashen_ember',
      name: 'Ashen Guard',
      description: 'Start with 1 Block. Attacks deal +1 damage.',
    },
    passiveKind: 'juggernaut_brute',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0.01 },
  },

  // —— Cryomancer ——
  {
    id: 'cryomancer_glacier',
    baseClassId: 'cryomancer',
    name: 'Glacier',
    role: 'Tank',
    tagline: 'Immovable ice.',
    description: 'Heavy block focus.',
    passive: {
      id: 'glacier_ice',
      name: 'Glacier',
      description: 'Start each turn with 2 Block.',
    },
    passiveKind: 'warden_fortify',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0 },
  },
  {
    id: 'cryomancer_frostbite',
    baseClassId: 'cryomancer',
    name: 'Frostbite',
    role: 'Control',
    tagline: 'Cold retaliation.',
    description: 'Guards chill the enemy.',
    passive: {
      id: 'frostbite_counter',
      name: 'Frostbite',
      description: 'Start with 1 Block. Guards deal 2 damage.',
    },
    passiveKind: 'sentinel_counter',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'cryomancer_hail',
    baseClassId: 'cryomancer',
    name: 'Hail',
    role: 'Control',
    tagline: 'Steady ice armor.',
    description: 'Standard ice armor improved.',
    passive: {
      id: 'hail_armor',
      name: 'Hail Armor',
      description: 'Start each turn with 1 Block.',
    },
    passiveKind: 'ice_armor',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0.01 },
  },

  // —— Paladin ——
  {
    id: 'paladin_crusader',
    baseClassId: 'paladin',
    name: 'Crusader',
    role: 'Aggro',
    tagline: 'Holy wrath.',
    description: 'Strikes with holy fury.',
    passive: {
      id: 'crusader_strike',
      name: 'Crusade',
      description: 'Strike and Heavy Strike deal +2 damage.',
    },
    passiveKind: 'bloodlust',
    statModifiers: { maxHp: 0 },
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'paladin_hospitaller',
    baseClassId: 'paladin',
    name: 'Hospitaller',
    role: 'Sustain',
    tagline: 'Greater healing light.',
    description: 'Superior sustain on Guard.',
    passive: {
      id: 'hospitaller_heal',
      name: 'Hospitaller',
      description: 'Start with 1 Block. Heal 2 HP on Guard.',
    },
    passiveKind: 'templar_aegis',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0 },
  },
  {
    id: 'paladin_bulwark',
    baseClassId: 'paladin',
    name: 'Bulwark',
    role: 'Tank',
    tagline: 'Shield of the faithful.',
    description: 'Extra HP and block.',
    passive: {
      id: 'bulwark_holy',
      name: 'Bulwark',
      description: '+4 Max HP. Start with 1 Block.',
    },
    passiveKind: 'paladin_aegis',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.04, rarePoolBonus: 0 },
  },

  // —— Assassin ——
  {
    id: 'assassin_shadow',
    baseClassId: 'assassin',
    name: 'Shadow',
    role: 'Aggro',
    tagline: 'Lethal opener.',
    description: 'Devastating first strike.',
    passive: {
      id: 'shadow_opening',
      name: 'Shadow Strike',
      description: 'First attack each turn deals +4 bonus damage.',
    },
    passiveKind: 'shadow_opening',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.1, rarePoolBonus: 0.03 },
  },
  {
    id: 'assassin_poisoner',
    baseClassId: 'assassin',
    name: 'Poisoner',
    role: 'Control',
    tagline: 'Slow venom.',
    description: 'Consistent attack pressure.',
    passive: {
      id: 'poisoner_sting',
      name: 'Venom',
      description: '+1 damage on all attacks.',
    },
    passiveKind: 'burn_touch',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'assassin_duelist',
    baseClassId: 'assassin',
    name: 'Duelist',
    role: 'Combo',
    tagline: 'Chain the blades.',
    description: 'Combo strike specialist.',
    passive: {
      id: 'duelist_combo',
      name: 'Flurry',
      description: 'Second Strike each turn deals +3 bonus damage.',
    },
    passiveKind: 'combo_shot',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.09, rarePoolBonus: 0.02 },
  },

  // —— Alchemist ——
  {
    id: 'alchemist_mutagenist',
    baseClassId: 'alchemist',
    name: 'Mutagenist',
    role: 'Utility',
    tagline: 'Volatile power.',
    description: 'Wild brews hit harder.',
    passive: {
      id: 'mutagenist_brew',
      name: 'Mutagen',
      description: 'Even hand-slot attacks deal +2 damage.',
    },
    passiveKind: 'mutagenist_brew',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.1, rarePoolBonus: 0.03 },
  },
  {
    id: 'alchemist_apothecary',
    baseClassId: 'alchemist',
    name: 'Apothecary',
    role: 'Sustain',
    tagline: 'Healing draughts.',
    description: 'Heal when guarding.',
    passive: {
      id: 'apothecary_heal',
      name: 'Apothecary',
      description: 'Heal 2 HP when you play Guard.',
    },
    passiveKind: 'lich_drain',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0.01 },
  },
  {
    id: 'alchemist_artificer',
    baseClassId: 'alchemist',
    name: 'Artificer',
    role: 'Utility',
    tagline: 'Measured formulas.',
    description: 'Slight brew bonus.',
    passive: {
      id: 'artificer_brew',
      name: 'Artifice',
      description: 'Even hand-slot attacks deal +1 damage.',
    },
    passiveKind: 'alchemist_potion',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.07, rarePoolBonus: 0.02 },
  },

  // —— Timekeeper ——
  {
    id: 'timekeeper_chronomancer',
    baseClassId: 'timekeeper',
    name: 'Chronomancer',
    role: 'Control',
    tagline: 'Bend the first moment.',
    description: 'Powerful opening tempo.',
    passive: {
      id: 'chrono_tempo',
      name: 'Chronology',
      description: '+3 Energy on the first turn of each battle.',
    },
    passiveKind: 'chrono_tempo',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'timekeeper_watcher',
    baseClassId: 'timekeeper',
    name: 'Watcher',
    role: 'Control',
    tagline: 'Patient strikes.',
    description: 'Stronger first attack.',
    passive: {
      id: 'watcher_opening',
      name: 'Foresight',
      description: 'First attack each turn deals +3 bonus damage.',
    },
    passiveKind: 'deadeye_opening',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.07, rarePoolBonus: 0.02 },
  },
  {
    id: 'timekeeper_paradox',
    baseClassId: 'timekeeper',
    name: 'Paradox',
    role: 'Utility',
    tagline: 'Unstable timeline.',
    description: 'Opening energy and chip damage.',
    passive: {
      id: 'paradox_tempo',
      name: 'Paradox',
      description: '+2 Energy on first turn. Attacks +1 damage.',
    },
    passiveKind: 'paradox_tempo',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.09, rarePoolBonus: 0.03 },
  },

  // —— Merchant ——
  {
    id: 'merchant_tycoon',
    baseClassId: 'merchant',
    name: 'Tycoon',
    role: 'Economy',
    tagline: 'Wealth is power.',
    description: 'Even richer — weaker combat focus.',
    passive: {
      id: 'tycoon_barter',
      name: 'Tycoon',
      description: '+20 starting gold. 25% shop discount.',
    },
    passiveKind: 'tycoon_barter',
    statModifiers: { startingGoldBonus: 20, maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.04, rarePoolBonus: 0.05 },
  },
  {
    id: 'merchant_smuggler',
    baseClassId: 'merchant',
    name: 'Smuggler',
    role: 'Economy',
    tagline: 'Undermarket deals.',
    description: 'Discounts and modest combat.',
    passive: {
      id: 'smuggler_barter',
      name: 'Smuggler',
      description: '+15 starting gold. 20% shop discount.',
    },
    passiveKind: 'merchant_barter',
    statModifiers: { startingGoldBonus: 15, maxHp: 0 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0.03 },
  },
  {
    id: 'merchant_quartermaster',
    baseClassId: 'merchant',
    name: 'Quartermaster',
    role: 'Economy',
    tagline: 'Supplies and shields.',
    description: 'Gold plus survivability.',
    passive: {
      id: 'quartermaster',
      name: 'Quartermaster',
      description: '+10 starting gold. Start with 1 Block.',
    },
    passiveKind: 'quartermaster',
    statModifiers: { startingGoldBonus: 10, maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0.02 },
  },

  // —— Vampire ——
  {
    id: 'vampire_sovereign',
    baseClassId: 'vampire',
    name: 'Sovereign',
    role: 'Sustain',
    tagline: 'Royal blood feast.',
    description: 'Strong lifesteal.',
    passive: {
      id: 'sovereign_siphon',
      name: 'Sovereign',
      description: 'Heal 2 HP when an attack deals damage.',
    },
    passiveKind: 'bloodlord_siphon',
    statModifiers: { maxHp: 0 },
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'vampire_nightstalker',
    baseClassId: 'vampire',
    name: 'Nightstalker',
    role: 'Aggro',
    tagline: 'Predator strikes.',
    description: 'Opening burst with drain.',
    passive: {
      id: 'nightstalker',
      name: 'Nightstalker',
      description: 'First attack +3 damage. Heal 1 if it hits.',
    },
    passiveKind: 'nightstalker',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.1, rarePoolBonus: 0.03 },
  },
  {
    id: 'vampire_thrall',
    baseClassId: 'vampire',
    name: 'Thrall',
    role: 'Sustain',
    tagline: 'Hungry but durable.',
    description: 'Classic lifesteal improved.',
    passive: {
      id: 'thrall_siphon',
      name: 'Thrall',
      description: 'Heal 1 HP when an attack deals damage.',
    },
    passiveKind: 'vampire_lifesteal',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.07, rarePoolBonus: 0.01 },
  },

  // —— Pirate ——
  {
    id: 'pirate_captain',
    baseClassId: 'pirate',
    name: 'Captain',
    role: 'Risk/Reward',
    tagline: 'Legendary plunder.',
    description: 'More gold and steadier HP.',
    passive: {
      id: 'pirate_plunder',
      name: 'Captain\'s Share',
      description: '+20 bonus gold after victories. +10 starting gold.',
    },
    passiveKind: 'pirate_plunder',
    statModifiers: { startingGoldBonus: 10, maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0.02 },
  },
  {
    id: 'pirate_buccaneer',
    baseClassId: 'pirate',
    name: 'Buccaneer',
    role: 'Aggro',
    tagline: 'Raid and run.',
    description: 'Aggressive plunderer.',
    passive: {
      id: 'burn_touch',
      name: 'Broadside',
      description: '+1 damage on all attacks.',
    },
    passiveKind: 'burn_touch',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'pirate_smuggler',
    baseClassId: 'pirate',
    name: 'Smuggler',
    role: 'Economy',
    tagline: 'Black market deals.',
    description: 'Shop discounts stack with plunder.',
    passive: {
      id: 'merchant_barter',
      name: 'Smuggler\'s Cut',
      description: '+15 starting gold. 10% shop discount.',
    },
    passiveKind: 'merchant_barter',
    statModifiers: { startingGoldBonus: 15, shopDiscountPercent: 10 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0.03 },
  },

  // —— Chef ——
  {
    id: 'chef_sous',
    baseClassId: 'chef',
    name: 'Sous Chef',
    role: 'Preparation',
    tagline: 'Sharper prep.',
    description: 'Even stronger battle openers.',
    passive: {
      id: 'chef_prep',
      name: 'Perfect Prep',
      description: '+4 Block on the first turn of each battle.',
    },
    passiveKind: 'chef_prep',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0 },
  },
  {
    id: 'chef_grillmaster',
    baseClassId: 'chef',
    name: 'Grillmaster',
    role: 'Damage Over Time',
    tagline: 'Heat the line.',
    description: 'Burning strikes.',
    passive: {
      id: 'burn_touch',
      name: 'Sear',
      description: '+1 damage on all attacks.',
    },
    passiveKind: 'burn_touch',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.07, rarePoolBonus: 0.02 },
  },
  {
    id: 'chef_patissier',
    baseClassId: 'chef',
    name: 'Patissier',
    role: 'Sustain',
    tagline: 'Sweet recovery.',
    description: 'Heal while guarding.',
    passive: {
      id: 'paladin_aegis',
      name: 'Comfort Food',
      description: 'Start with 1 Block. Heal 1 HP when playing Guard.',
    },
    passiveKind: 'paladin_aegis',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0.01 },
  },

  // —— Dragon Knight ——
  {
    id: 'dragon_knight_wyrm',
    baseClassId: 'dragon_knight',
    name: 'Wyrm Knight',
    role: 'Scaling',
    tagline: 'Ancient fury.',
    description: 'Scales faster in long fights.',
    passive: {
      id: 'dragon_knight_siege',
      name: 'Wyrm Fury',
      description: '+1 attack damage per turn taken (max +4).',
    },
    passiveKind: 'dragon_knight_siege',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'dragon_knight_sky',
    baseClassId: 'dragon_knight',
    name: 'Sky Knight',
    role: 'Burst',
    tagline: 'Diving strikes.',
    description: 'Opening burst damage.',
    passive: {
      id: 'assassin_healthy',
      name: 'Dive Bomb',
      description: 'First attack +2. +1 more vs healthy foes.',
    },
    passiveKind: 'assassin_healthy',
    statModifiers: { maxHp: -2 },
    rewardWeights: { classPoolBonus: 0.09, rarePoolBonus: 0.03 },
  },
  {
    id: 'dragon_knight_brood',
    baseClassId: 'dragon_knight',
    name: 'Brood Keeper',
    role: 'Tank',
    tagline: 'Armored scales.',
    description: 'Heavy armor each turn.',
    passive: {
      id: 'warden_fortify',
      name: 'Scale Mail',
      description: '+4 Max HP. Start each turn with 2 Block.',
    },
    passiveKind: 'warden_fortify',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0.01 },
  },

  // —— Gambler ——
  {
    id: 'gambler_high_roller',
    baseClassId: 'gambler',
    name: 'High Roller',
    role: 'High Variance',
    tagline: 'All-in damage.',
    description: 'Wilder lucky shots.',
    passive: {
      id: 'gambler_lucky',
      name: 'High Roller',
      description: 'Attacks deal +0 to +3 random bonus damage.',
    },
    passiveKind: 'gambler_lucky',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.1, rarePoolBonus: 0.04 },
  },
  {
    id: 'gambler_house',
    baseClassId: 'gambler',
    name: 'House Dealer',
    role: 'Economy',
    tagline: 'The house wins.',
    description: 'Gold and safer HP.',
    passive: {
      id: 'merchant_barter',
      name: 'House Edge',
      description: '+20 starting gold.',
    },
    passiveKind: 'merchant_barter',
    statModifiers: { startingGoldBonus: 20, maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0.03 },
  },
  {
    id: 'gambler_card_sharp',
    baseClassId: 'gambler',
    name: 'Card Sharp',
    role: 'Combo',
    tagline: 'Stack the deck.',
    description: 'Combo chains pay off.',
    passive: {
      id: 'monk_flow',
      name: 'Marked Deck',
      description: 'Second+ attacks each turn deal +2 damage.',
    },
    passiveKind: 'monk_flow',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },

  // —— Bard ——
  {
    id: 'bard_maestro',
    baseClassId: 'bard',
    name: 'Maestro',
    role: 'Utility',
    tagline: 'Grand improvisation.',
    description: 'Huge hands every turn.',
    passive: {
      id: 'bard_improv',
      name: 'Maestro',
      description: 'Draw 7 cards per turn.',
    },
    passiveKind: 'bard_improv',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.07, rarePoolBonus: 0.02 },
  },
  {
    id: 'bard_dirge',
    baseClassId: 'bard',
    name: 'Dirge Singer',
    role: 'Sustain',
    tagline: 'Melancholy drain.',
    description: 'Lifesteal ballads.',
    passive: {
      id: 'vampire_lifesteal',
      name: 'Dirge',
      description: 'Heal 1 HP when an attack deals damage.',
    },
    passiveKind: 'vampire_lifesteal',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0.01 },
  },
  {
    id: 'bard_battle_hymn',
    baseClassId: 'bard',
    name: 'Battle Hymn',
    role: 'Battlefield Commander',
    tagline: 'War songs.',
    description: 'Grinds longer fights.',
    passive: {
      id: 'warlord_endurance',
      name: 'War Hymn',
      description: '+1 attack damage per turn taken (max +3).',
    },
    passiveKind: 'warlord_endurance',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0.01 },
  },

  // —— Engineer ——
  {
    id: 'engineer_artificer',
    baseClassId: 'engineer',
    name: 'Artificer',
    role: 'Resource Generation',
    tagline: 'Peak overclock.',
    description: 'More even-turn energy spikes.',
    passive: {
      id: 'engineer_overclock',
      name: 'Artificer Core',
      description: '+1 Energy on even turns. +1 Block each turn.',
    },
    passiveKind: 'engineer_overclock',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.07, rarePoolBonus: 0.03 },
  },
  {
    id: 'engineer_siege',
    baseClassId: 'engineer',
    name: 'Siege Engineer',
    role: 'Scaling',
    tagline: 'Deployed turrets.',
    description: 'Damage scales in long fights.',
    passive: {
      id: 'dragon_knight_siege',
      name: 'Turret Field',
      description: '+1 attack damage per turn taken (max +3).',
    },
    passiveKind: 'dragon_knight_siege',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.08, rarePoolBonus: 0.02 },
  },
  {
    id: 'engineer_tinker',
    baseClassId: 'engineer',
    name: 'Tinker',
    role: 'Utility',
    tagline: 'Volatile gadgets.',
    description: 'Potion-style variance.',
    passive: {
      id: 'alchemist_potion',
      name: 'Gadget Mix',
      description: 'Even hand-slot attacks deal +2 damage.',
    },
    passiveKind: 'alchemist_potion',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.09, rarePoolBonus: 0.03 },
  },

  // —— Monk ——
  {
    id: 'monk_master',
    baseClassId: 'monk',
    name: 'Grandmaster',
    role: 'Combo',
    tagline: 'Perfect flow.',
    description: 'Devastating chains.',
    passive: {
      id: 'monk_flow',
      name: 'Grandmaster Flow',
      description: 'Second+ attacks each turn deal +2 damage.',
    },
    passiveKind: 'monk_flow',
    statModifiers: { maxHp: 2 },
    rewardWeights: { classPoolBonus: 0.09, rarePoolBonus: 0.03 },
  },
  {
    id: 'monk_iron',
    baseClassId: 'monk',
    name: 'Iron Body',
    role: 'Tank',
    tagline: 'Unbreakable stance.',
    description: 'Block every turn.',
    passive: {
      id: 'fortify',
      name: 'Iron Body',
      description: '+6 Max HP. Start each turn with 1 Block.',
    },
    passiveKind: 'fortify',
    statModifiers: { maxHp: 6 },
    rewardWeights: { classPoolBonus: 0.04, rarePoolBonus: 0 },
  },
  {
    id: 'monk_wind',
    baseClassId: 'monk',
    name: 'Wind Walker',
    role: 'Control',
    tagline: 'Swift tempo.',
    description: 'Opening energy and flow.',
    passive: {
      id: 'opening_tempo',
      name: 'Wind Step',
      description: '+2 Energy turn 1. Chain attacks +1 after first.',
    },
    passiveKind: 'opening_tempo',
    statModifiers: {},
    rewardWeights: { classPoolBonus: 0.07, rarePoolBonus: 0.02 },
  },

  // —— Warlord ——
  {
    id: 'warlord_conqueror',
    baseClassId: 'warlord',
    name: 'Conqueror',
    role: 'Battlefield Commander',
    tagline: 'Total war.',
    description: 'Maximum siege scaling.',
    passive: {
      id: 'warlord_endurance',
      name: 'Conqueror',
      description: '+1 attack damage per turn taken (max +5).',
    },
    passiveKind: 'warlord_endurance',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.06, rarePoolBonus: 0.02 },
  },
  {
    id: 'warlord_veteran',
    baseClassId: 'warlord',
    name: 'Veteran',
    role: 'Tank',
    tagline: 'Unbreakable line.',
    description: 'Massive HP and block.',
    passive: {
      id: 'warden_fortify',
      name: 'Veteran\'s Wall',
      description: '+8 Max HP. Start each turn with 2 Block.',
    },
    passiveKind: 'warden_fortify',
    statModifiers: { maxHp: 8 },
    rewardWeights: { classPoolBonus: 0.04, rarePoolBonus: 0 },
  },
  {
    id: 'warlord_strategist',
    baseClassId: 'warlord',
    name: 'Strategist',
    role: 'Defensive Control',
    tagline: 'Controlled grind.',
    description: 'Ice armor and endurance.',
    passive: {
      id: 'ice_armor',
      name: 'Fortify Line',
      description: 'Start each turn with 1 Block. +4 Max HP.',
    },
    passiveKind: 'ice_armor',
    statModifiers: { maxHp: 4 },
    rewardWeights: { classPoolBonus: 0.05, rarePoolBonus: 0.01 },
  },
]

const EVOLUTION_BY_ID = new Map<EvolutionId, EvolutionDefinition>(
  EVOLUTION_REGISTRY.map((e) => [e.id, e]),
)

const EVOLUTIONS_BY_BASE = new Map<ClassId, EvolutionDefinition[]>()
for (const evo of EVOLUTION_REGISTRY) {
  const list = EVOLUTIONS_BY_BASE.get(evo.baseClassId) ?? []
  list.push(evo)
  EVOLUTIONS_BY_BASE.set(evo.baseClassId, list)
}

export function isEvolutionId(value: string): value is EvolutionId {
  return EVOLUTION_BY_ID.has(value)
}

export function parseEvolutionId(raw: unknown): EvolutionId | null {
  if (typeof raw === 'string' && isEvolutionId(raw)) return raw
  return null
}

export function getEvolutionDefinition(
  evolutionId: EvolutionId,
): EvolutionDefinition {
  return EVOLUTION_BY_ID.get(evolutionId)!
}

export function getEvolutionsForBase(
  baseClassId: ClassId,
): EvolutionDefinition[] {
  return [...(EVOLUTIONS_BY_BASE.get(baseClassId) ?? [])]
}

export function shouldOfferEvolution(
  battlesWon: number,
  evolutionId: EvolutionId | null,
  classTestMode: boolean,
): boolean {
  if (classTestMode) return false
  if (evolutionId !== null) return false
  return battlesWon >= EVOLUTION_TRIGGER_AFTER_BATTLES_WON
}

/** Count victories in the current run (battleNumber equals battles won after each win). */
export function countBattlesWon(battleNumber: number): number {
  return Math.max(0, battleNumber)
}
