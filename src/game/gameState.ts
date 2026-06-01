import { getCard, type CardId } from './cardDatabase'
import { resolveCardEffect, cardCountsAsAttack } from './cardEffects'
import { generateClassCardOffers } from './classCardPools'
import {
  createClassIdentity,
  getPlayerMaxHp,
  getPlayerPassive,
  getPlayerTurnEnergy,
  resolveClassIdentity,
  type PlayerClassIdentity,
} from './classIdentity'
import {
  shouldOfferEvolution,
  type EvolutionId,
} from './classEvolutions'
import {
  applyClassPostCardEffects,
  formatClassPassiveLog,
  getClassBonusDamage,
  getClassExtraTurnEnergy,
  getClassFirstTurnBlockBonus,
  getClassOpeningEnergyBonus,
  getClassTurnHandSize,
  getClassTurnStartBlock,
  getClassVictoryGoldBonus,
  shouldIncrementAttackCounter,
  shouldIncrementStrikeCounter,
} from './classPassives'
import {
  applyMechanicAfterCardPlay,
  applyMechanicOnEndTurn,
  applyMechanicOnTurnStart,
  cardCountsAsGuard,
  createInitialMechanicMeter,
  formatMechanicLogSuffix,
  getMechanicCombatModifiers,
  normalizeMechanicMeter,
} from './classMechanics'
import { cardCountsAsStrike } from './cardEffects'
import type { ClassMechanicMeter } from '../types/classMechanic'
import {
  applySignatureMechanicToMeter,
  isSignatureMechanicCard,
} from './signatureCards'
import type { SignatureCardEffectResult } from './cardEffects'
import {
  DEFAULT_CLASS_ID,
  getClassDefinition,
  getClassStartingGold,
  getClassStarterDeck,
  type ClassId,
} from './classDatabase'
import { CLASS_CARD_POOLS } from './classCardPools'
import {
  pickRandomOpponent,
  getOpponent,
  getEnemyIntentText,
  getInitialTurtlePhase,
  BRUISER_ATTACK,
  GLASSBLADE_ATTACK,
  THIEF_ATTACK,
  THIEF_STEAL_GOLD,
  TURTLE_BLOCK_GAIN,
  TURTLE_ATTACK_DAMAGE,
  type OpponentId,
  type TurtlePhase,
} from './opponentDatabase'
import {
  getWinGoldAmount,
  getLossGoldAmount,
  getShopCardPrice,
  getBattleStartBlock,
  generateRelicOffers,
  hasRelic,
  getRelic,
  type RelicId,
} from './relicDatabase'
import {
  createArenaRoster,
  pickRandomActiveOpponent,
  markOpponentDefeated,
  getDefeatedOpponentCount,
  isArenaComplete,
  syncPlayerContestant,
  getContestantById,
  OPPONENT_COUNT,
  type Contestant,
} from './tournamentDatabase'

export type Screen =
  | 'title'
  | 'battle'
  | 'evolution'
  | 'reward'
  | 'shop'
  | 'gameover'
  | 'victory'
  | 'champions'

export type RewardType = 'cards' | 'relics' | 'none'

export const PLAYER_MAX_HP = 30
export const STARTING_LIVES = 3
const MAX_LOG_ENTRIES = 80

export interface GameState {
  screen: Screen
  championName: string
  classId: ClassId
  /** Permanent for this run — chosen after surviving enough battles. */
  evolutionId: EvolutionId | null
  /** True while evolution screen is shown before post-win rewards. */
  evolutionOfferPending: boolean
  /** Dev class test lab — single training fight, no arena progression. */
  classTestMode: boolean
  playerTurnCount: number
  strikesPlayedThisTurn: number
  attacksPlayedThisTurn: number
  currentArenaContestantId: string | null
  playerHp: number
  enemyHp: number
  enemyBlock: number
  opponentId: OpponentId
  turtlePhase: TurtlePhase
  deck: CardId[]
  drawPile: CardId[]
  discardPile: CardId[]
  hand: CardId[]
  energy: number
  block: number
  gold: number
  lives: number
  shopOffers: CardId[]
  lastReward: number
  battleNumber: number
  message: string
  battleWon: boolean | null
  battleLog: string[]
  /** Signature class resource meter (Resolve, Rage, Combo, …). */
  mechanic: ClassMechanicMeter
  relics: RelicId[]
  rewardType: RewardType
  rewardCards: CardId[]
  rewardRelics: RelicId[]
  rewardClaimed: boolean
  contestants: Contestant[]
  championSubmitted: boolean
}

export const INITIAL_STATE: GameState = {
  screen: 'title',
  championName: '',
  classId: DEFAULT_CLASS_ID,
  evolutionId: null,
  evolutionOfferPending: false,
  classTestMode: false,
  playerTurnCount: 0,
  strikesPlayedThisTurn: 0,
  attacksPlayedThisTurn: 0,
  currentArenaContestantId: null,
  playerHp: PLAYER_MAX_HP,
  enemyHp: 30,
  enemyBlock: 0,
  opponentId: 'bruiser',
  turtlePhase: 'defend',
  deck: [],
  drawPile: [],
  discardPile: [],
  hand: [],
  energy: 3,
  block: 0,
  gold: 0,
  lives: STARTING_LIVES,
  shopOffers: [],
  lastReward: 0,
  battleNumber: 0,
  message: '',
  battleWon: null,
  battleLog: [],
  mechanic: createInitialMechanicMeter(DEFAULT_CLASS_ID),
  relics: [],
  rewardType: 'none',
  rewardCards: [],
  rewardRelics: [],
  rewardClaimed: false,
  contestants: [],
  championSubmitted: false,
}

export type GameAction =
  | { type: 'SET_CHAMPION_NAME'; name: string }
  | { type: 'SET_CLASS'; classId: ClassId }
  | { type: 'PICK_EVOLUTION'; evolutionId: EvolutionId }
  | { type: 'START_RUN' }
  | { type: 'START_CLASS_TEST' }
  | { type: 'RESET_CLASS_TEST' }
  | { type: 'EXIT_CLASS_TEST' }
  | { type: 'VIEW_DAILY_CHAMPIONS' }
  | { type: 'GO_TITLE' }
  | { type: 'PLAY_CARD'; handIndex: number }
  | { type: 'END_TURN' }
  | { type: 'PICK_CARD_REWARD'; offerIndex: number }
  | { type: 'PICK_RELIC_REWARD'; offerIndex: number }
  | { type: 'CONTINUE_TO_SHOP' }
  | { type: 'BUY_CARD'; offerIndex: number }
  | { type: 'NEXT_BATTLE' }
  | { type: 'SUBMIT_TO_DAILY_CHAMPIONS' }

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function formatRound(battleNumber: number): string {
  return `Round ${battleNumber}`
}

export function getRoundsSurvived(state: GameState): number {
  return state.battleNumber
}

export function getOpponentsDefeatedProgress(state: GameState): {
  defeated: number
  total: number
} {
  return {
    defeated: getDefeatedOpponentCount(state.contestants),
    total: OPPONENT_COUNT,
  }
}

export function getCurrentArenaOpponentName(state: GameState): string {
  if (!state.currentArenaContestantId) return 'Opponent'
  const contestant = getContestantById(
    state.contestants,
    state.currentArenaContestantId,
  )
  return contestant?.name ?? 'Opponent'
}

export function getEnemyIntent(state: GameState): string {
  return getEnemyIntentText(state.opponentId, state.turtlePhase)
}

function appendLog(state: GameState, entry: string): GameState {
  const battleLog = [...state.battleLog, entry]
  if (battleLog.length > MAX_LOG_ENTRIES) {
    battleLog.splice(0, battleLog.length - MAX_LOG_ENTRIES)
  }
  return { ...state, battleLog }
}

function syncRoster(state: GameState): GameState {
  return {
    ...state,
    contestants: syncPlayerContestant(
      state.contestants,
      state.championName,
      state.lives,
      state.gold,
    ),
  }
}

function drawCards(state: GameState, targetHandSize: number): GameState {
  let drawPile = [...state.drawPile]
  let discardPile = [...state.discardPile]
  const hand = [...state.hand]
  let next = state

  while (hand.length < targetHandSize) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break
      drawPile = shuffle(discardPile)
      discardPile = []
      next = appendLog(
        next,
        'Draw pile empty — shuffled discard into draw pile.',
      )
    }
    const card = drawPile.pop()
    if (!card) break
    hand.push(card)
  }

  return { ...next, drawPile, discardPile, hand }
}

export function runIdentity(state: GameState): PlayerClassIdentity {
  return createClassIdentity(state.classId, state.evolutionId)
}

export function getSoloPlayerMaxHp(state: GameState): number {
  return getPlayerMaxHp(runIdentity(state))
}

export function getSoloPlayerMaxEnergy(state: GameState): number {
  return getPlayerTurnEnergy(runIdentity(state))
}

function beginPlayerTurn(state: GameState): GameState {
  const identity = runIdentity(state)
  const turnNumber = state.playerTurnCount + 1
  const openingBonus = getClassOpeningEnergyBonus(identity, turnNumber)
  const extraEnergy = getClassExtraTurnEnergy(identity, turnNumber)
  let next = appendLog(state, '— Your turn —')
  const mechanicStart = applyMechanicOnTurnStart(
    normalizeMechanicMeter(state.mechanic, state.classId),
    state.classId,
    turnNumber,
  )
  const startingBlock =
    getClassTurnStartBlock(identity) +
    getClassFirstTurnBlockBonus(identity, turnNumber) +
    mechanicStart.bonusBlock
  next = {
    ...next,
    playerTurnCount: turnNumber,
    mechanic: mechanicStart.meter,
    block: startingBlock,
    energy:
      getPlayerTurnEnergy(identity) +
      openingBonus +
      extraEnergy +
      mechanicStart.bonusEnergy,
    hand: [],
    strikesPlayedThisTurn: 0,
    attacksPlayedThisTurn: 0,
  }
  if (openingBonus > 0) {
    next = appendLog(
      next,
      `${getPlayerPassive(identity).name} (+${openingBonus} opening energy).`,
    )
  }
  const passiveLog = formatClassPassiveLog(identity)
  if (passiveLog) {
    next = appendLog(next, passiveLog)
  }
  if (mechanicStart.log) {
    next = appendLog(next, mechanicStart.log)
  }
  next = drawCards(next, getClassTurnHandSize(identity))
  return {
    ...next,
    message: 'Your turn — play cards, then end turn.',
  }
}

function applyIronCharmBattleStart(state: GameState): GameState {
  const startingBlock = getBattleStartBlock(state.relics)
  if (startingBlock <= 0) return state

  return appendLog(
    {
      ...state,
      block: startingBlock,
      message: `Iron Charm — start with ${startingBlock} block.`,
    },
    `Iron Charm — begin battle with ${startingBlock} block.`,
  )
}

const CLASS_TEST_OPPONENT_ID: OpponentId = 'bruiser'
const CLASS_TEST_DUMMY_HP = 28

function setupClassTestBattle(state: GameState): GameState {
  const classDef = getClassDefinition(state.classId)
  const sigPool = CLASS_CARD_POOLS[state.classId].signatureCards
  const testSig = sigPool.length > 0 ? sigPool[0] : null
  const shuffled = shuffle([
    ...getClassStarterDeck(state.classId),
    ...(testSig ? [testSig] : []),
  ])

  let next: GameState = {
    ...state,
    screen: 'battle',
    classTestMode: true,
    playerTurnCount: 0,
    currentArenaContestantId: null,
    opponentId: CLASS_TEST_OPPONENT_ID,
    turtlePhase: 'attack',
    playerHp: getPlayerMaxHp(runIdentity(state)),
    enemyHp: CLASS_TEST_DUMMY_HP,
    enemyBlock: 0,
    drawPile: shuffled,
    discardPile: [],
    hand: [],
    block: 0,
    energy: 0,
    gold: 0,
    lives: 1,
    battleNumber: 1,
    message: 'Class test — Training Dummy. Play cards, then end turn.',
    battleWon: null,
    battleLog: [],
    mechanic: createInitialMechanicMeter(state.classId),
    relics: [],
    rewardType: 'none',
    rewardCards: [],
    rewardRelics: [],
    rewardClaimed: false,
    contestants: [],
    shopOffers: [],
    lastReward: 0,
    championSubmitted: false,
  }

  next = appendLog(
    next,
    `Class test: ${classDef.name} vs Training Dummy (${CLASS_TEST_DUMMY_HP} HP).`,
  )
  return beginPlayerTurn(next)
}

function setupBattle(state: GameState): GameState {
  if (state.classTestMode) {
    return setupClassTestBattle(state)
  }

  const arenaOpponent = pickRandomActiveOpponent(state.contestants)
  if (!arenaOpponent) {
    return triggerVictory(syncRoster(state))
  }

  const opponentId = pickRandomOpponent()
  const archetype = getOpponent(opponentId)
  const shuffled = shuffle([...state.deck])
  const turtlePhase =
    opponentId === 'turtle' ? getInitialTurtlePhase() : 'attack'

  let next: GameState = {
    ...state,
    screen: 'battle',
    playerTurnCount: 0,
    currentArenaContestantId: arenaOpponent.id,
    opponentId,
    turtlePhase,
    playerHp: getPlayerMaxHp(runIdentity(state)),
    enemyHp: archetype.maxHp,
    enemyBlock: 0,
    drawPile: shuffled,
    discardPile: [],
    hand: [],
    block: 0,
    message: 'Your turn — play cards, then end turn.',
    battleWon: null,
    mechanic: createInitialMechanicMeter(state.classId),
    rewardType: 'none',
    rewardCards: [],
    rewardRelics: [],
    rewardClaimed: false,
  }

  const progress = getOpponentsDefeatedProgress(next)
  next = appendLog(
    next,
    `${formatRound(state.battleNumber)} — Facing ${arenaOpponent.name} (${archetype.name}, ${archetype.maxHp} HP).`,
  )
  next = appendLog(
    next,
    `Opponents defeated: ${progress.defeated} / ${progress.total}.`,
  )
  next = beginPlayerTurn(next)
  return applyIronCharmBattleStart(next)
}

function generateShopOffers(state: GameState): CardId[] {
  return generateClassCardOffers(state.classId, 3, state.evolutionId)
}

function generateCardRewards(state: GameState): CardId[] {
  return generateClassCardOffers(state.classId, 3, state.evolutionId)
}

function isRelicRewardForDefeats(defeatedCount: number): boolean {
  return defeatedCount > 0 && defeatedCount % 3 === 0
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

function applyDamageToPlayer(
  state: GameState,
  rawDamage: number,
  attackerName: string,
): { state: GameState; damageToHp: number } {
  const absorbed = Math.min(state.block, rawDamage)
  const damageToHp = Math.max(0, rawDamage - state.block)
  const playerHp = state.playerHp - damageToHp

  const detail =
    absorbed > 0
      ? ` (${absorbed} blocked, ${damageToHp} HP lost)`
      : ` (${damageToHp} HP lost)`

  const next = appendLog(
    state,
    `${attackerName} attacks for ${rawDamage}${detail}.`,
  )

  return {
    state: {
      ...next,
      playerHp,
      message: `${attackerName} attacks for ${rawDamage}.`,
    },
    damageToHp,
  }
}

function applyEnemyTurn(state: GameState): GameState {
  const attackerName = getCurrentArenaOpponentName(state)

  switch (state.opponentId) {
    case 'turtle': {
      if (state.turtlePhase === 'defend') {
        const enemyBlock = state.enemyBlock + TURTLE_BLOCK_GAIN
        return appendLog(
          {
            ...state,
            enemyBlock,
            turtlePhase: 'attack',
            message: `${attackerName} gains ${TURTLE_BLOCK_GAIN} block.`,
          },
          `${attackerName} gains ${TURTLE_BLOCK_GAIN} block (total: ${enemyBlock}).`,
        )
      }
      const { state: afterDamage } = applyDamageToPlayer(
        state,
        TURTLE_ATTACK_DAMAGE,
        attackerName,
      )
      return {
        ...afterDamage,
        turtlePhase: 'defend',
        message: afterDamage.message,
      }
    }

    case 'thief': {
      const { state: afterDamage, damageToHp } = applyDamageToPlayer(
        state,
        THIEF_ATTACK,
        attackerName,
      )
      if (damageToHp > 0) {
        const gold = Math.max(0, afterDamage.gold - THIEF_STEAL_GOLD)
        let next = appendLog(
          {
            ...afterDamage,
            gold,
            message: `${attackerName} stole ${THIEF_STEAL_GOLD} gold!`,
          },
          `${attackerName} stole ${THIEF_STEAL_GOLD} gold (unblocked hit).`,
        )
        return syncRoster(next)
      }
      return syncRoster(afterDamage)
    }

    case 'bruiser': {
      const { state: afterDamage } = applyDamageToPlayer(
        state,
        BRUISER_ATTACK,
        attackerName,
      )
      return syncRoster(afterDamage)
    }

    case 'glassblade': {
      const { state: afterDamage } = applyDamageToPlayer(
        state,
        GLASSBLADE_ATTACK,
        attackerName,
      )
      return syncRoster(afterDamage)
    }

    default:
      return state
  }
}

function triggerGameOver(state: GameState): GameState {
  const next = syncRoster({ ...state, lives: 0 })
  return appendLog(
    {
      ...next,
      screen: 'gameover',
      message: 'Game Over — no lives remaining.',
    },
    `Game Over — ${next.championName} eliminated from the arena.`,
  )
}

function triggerVictory(state: GameState): GameState {
  const next = syncRoster(state)
  const progress = getOpponentsDefeatedProgress(next)
  return appendLog(
    {
      ...next,
      screen: 'victory',
      championSubmitted: false,
      message: 'Champion Crowned — all opponents defeated!',
    },
    `${next.championName} defeated all ${progress.defeated} opponents!`,
  )
}

function resolveBattleEnd(
  state: GameState,
  won: boolean,
): GameState {
  if (state.classTestMode) {
    const classDef = getClassDefinition(state.classId)
    const outcome = won ? 'Victory' : 'Defeat'
    let next = appendLog(
      state,
      `Class test ${outcome} — ${classDef.name} vs Training Dummy.`,
    )
    return {
      ...next,
      battleWon: won,
      message: won
        ? 'Test won! Reset to try again or exit to title.'
        : 'Test lost. Reset to try again or exit to title.',
    }
  }

  const arenaName = getCurrentArenaOpponentName(state)
  const archetype = getOpponent(state.opponentId)
  const outcome = won ? 'Victory' : 'Defeat'

  if (won) {
    const lastReward =
      getWinGoldAmount(state.relics) + getClassVictoryGoldBonus(state.classId)
    const gold = state.gold + lastReward

    let contestants = markOpponentDefeated(
      state.contestants,
      state.currentArenaContestantId ?? '',
    )
    contestants = syncPlayerContestant(
      contestants,
      state.championName,
      state.lives,
      gold,
    )

    const defeatedCount = getDefeatedOpponentCount(contestants)

    let next = appendLog(
      { ...state, gold, contestants },
      `${outcome} vs ${arenaName}! Earned ${lastReward} gold (total: ${gold}).`,
    )
    next = appendLog(
      next,
      `${arenaName} defeated! Opponents defeated: ${defeatedCount} / ${OPPONENT_COUNT}.`,
    )

    if (hasRelic(state.relics, 'training_coin')) {
      next = appendLog(next, 'Training Coin — +10 bonus gold.')
    }

    if (isArenaComplete(contestants)) {
      return triggerVictory(next)
    }

    const useRelicReward = isRelicRewardForDefeats(defeatedCount)
    const rewardRelics = useRelicReward
      ? generateRelicOffers(state.relics)
      : []
    if (
      shouldOfferEvolution(
        state.battleNumber,
        state.evolutionId,
        state.classTestMode,
      )
    ) {
      return appendLog(
        {
          ...next,
          screen: 'evolution',
          evolutionOfferPending: true,
          lastReward,
          battleWon: true,
          rewardType: 'none',
          rewardCards: [],
          rewardRelics: [],
          rewardClaimed: false,
          message:
            'You survived the trials — choose how your class will evolve.',
        },
        `Evolution available after ${state.battleNumber} victories.`,
      )
    }

    const rewardCards = useRelicReward ? [] : generateCardRewards(next)
    const rewardType: RewardType = useRelicReward
      ? rewardRelics.length > 0
        ? 'relics'
        : 'none'
      : 'cards'

    if (useRelicReward && rewardRelics.length > 0) {
      next = appendLog(
        next,
        `Relic reward — choose 1 of ${rewardRelics.length} relics.`,
      )
    } else if (rewardType === 'cards') {
      next = appendLog(next, 'Card reward — choose 1 of 3 cards.')
    }

    const rewardClaimed = rewardType === 'none'

    return {
      ...next,
      screen: 'reward',
      lastReward,
      battleWon: true,
      rewardType,
      rewardCards,
      rewardRelics,
      rewardClaimed,
      message:
        rewardType === 'relics'
          ? 'Choose a relic reward.'
          : rewardType === 'cards'
            ? 'Choose a card reward.'
            : 'Victory! Continue to the shop.',
    }
  }

  const lastReward = getLossGoldAmount()
  const gold = state.gold + lastReward
  const lives = state.lives - 1

  let next = appendLog(
    syncRoster({ ...state, gold }),
    `${outcome} vs ${arenaName} (${archetype.name})! Earned ${lastReward} gold.`,
  )
  next = appendLog(
    next,
    `${arenaName} remains active. Lost 1 life (${lives} remaining).`,
  )

  const defeatState: GameState = {
    ...syncRoster({ ...next, lives, gold }),
    lastReward,
    battleWon: false,
    rewardType: 'none',
    rewardCards: [],
    rewardRelics: [],
    rewardClaimed: true,
    message:
      lives > 0
        ? 'Defeat. Continue to the shop.'
        : 'Defeat. No lives remaining.',
  }

  if (lives <= 0) {
    return triggerGameOver(defeatState)
  }

  return {
    ...defeatState,
    screen: 'reward',
  }
}


function discardHand(state: GameState): GameState {
  if (state.hand.length === 0) return state
  const count = state.hand.length
  let next = appendLog(
    state,
    `Discarded ${count} card${count === 1 ? '' : 's'} from hand.`,
  )
  return {
    ...next,
    discardPile: [...next.discardPile, ...next.hand],
    hand: [],
  }
}

export function isBattleActive(state: GameState): boolean {
  return state.screen === 'battle' && state.battleWon === null
}

export function canContinueToShop(state: GameState): boolean {
  return state.screen === 'reward' && state.rewardClaimed
}

export function getShopPrice(state: GameState): number {
  const profile = resolveClassIdentity(runIdentity(state))
  const basePrice = getShopCardPrice(state.relics)
  const discount = profile.stats.shopDiscountPercent
  if (discount <= 0) return basePrice
  const multiplier = Math.max(0, 1 - discount / 100)
  return Math.max(1, Math.floor(basePrice * multiplier))
}

export function canStartRun(state: GameState): boolean {
  return state.championName.trim().length > 0
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CHAMPION_NAME': {
      return { ...state, championName: action.name }
    }

    case 'VIEW_DAILY_CHAMPIONS': {
      return { ...state, screen: 'champions' }
    }

    case 'GO_TITLE': {
      return {
        ...INITIAL_STATE,
        championName: state.championName,
        classId: state.classId,
        evolutionId: null,
        evolutionOfferPending: false,
        classTestMode: false,
      }
    }

    case 'EXIT_CLASS_TEST': {
      return {
        ...INITIAL_STATE,
        championName: state.championName,
        classId: state.classId,
        evolutionId: null,
        evolutionOfferPending: false,
        classTestMode: false,
      }
    }

    case 'START_CLASS_TEST': {
      const name = state.championName.trim() || 'Test Fighter'
      return setupClassTestBattle({
        ...INITIAL_STATE,
        championName: name,
        classId: state.classId,
        classTestMode: true,
      })
    }

    case 'RESET_CLASS_TEST': {
      if (!state.classTestMode) return state
      return setupClassTestBattle({
        ...state,
        battleLog: [],
        battleWon: null,
      })
    }

    case 'SET_CLASS': {
      return {
        ...state,
        classId: action.classId,
        evolutionId: null,
        evolutionOfferPending: false,
        mechanic: createInitialMechanicMeter(action.classId),
      }
    }

    case 'PICK_EVOLUTION': {
      if (state.screen !== 'evolution') return state

      const profile = resolveClassIdentity(
        createClassIdentity(state.classId, action.evolutionId),
      )

      let next = appendLog(
        {
          ...state,
          evolutionId: action.evolutionId,
          evolutionOfferPending: false,
          playerHp: profile.stats.maxHp,
          message: `Evolved into ${profile.displayName}! ${profile.passive.description}`,
        },
        `Champion evolved: ${profile.displayTitle}.`,
      )

      const defeatedCount = getDefeatedOpponentCount(next.contestants)
      const useRelicReward = isRelicRewardForDefeats(defeatedCount)
      const rewardRelics = useRelicReward ? generateRelicOffers(next.relics) : []
      const rewardCards = useRelicReward ? [] : generateCardRewards(next)
      const rewardType: RewardType = useRelicReward
        ? rewardRelics.length > 0
          ? 'relics'
          : 'none'
        : 'cards'

      if (useRelicReward && rewardRelics.length > 0) {
        next = appendLog(
          next,
          `Relic reward — choose 1 of ${rewardRelics.length} relics.`,
        )
      } else if (rewardType === 'cards') {
        next = appendLog(next, 'Card reward — choose 1 of 3 cards.')
      }

      return {
        ...next,
        screen: 'reward',
        rewardType,
        rewardCards,
        rewardRelics,
        rewardClaimed: rewardType === 'none',
        battleWon: true,
        message:
          rewardType === 'relics'
            ? 'Choose a relic reward.'
            : rewardType === 'cards'
              ? 'Choose a card reward.'
              : 'Victory! Continue to the shop.',
      }
    }

    case 'START_RUN': {
      const name = state.championName.trim()
      if (!name) return state
      const classDef = getClassDefinition(state.classId)

      let fresh = appendLog(
        {
          ...INITIAL_STATE,
          championName: name,
          classId: state.classId,
          evolutionId: null,
          evolutionOfferPending: false,
          screen: 'battle',
          deck: getClassStarterDeck(state.classId),
          gold: getClassStartingGold(state.classId, 0),
          lives: classDef.stats.arenaLives,
          battleNumber: 1,
          battleLog: [],
          relics: [],
          contestants: createArenaRoster(name),
          championSubmitted: false,
        },
        `${name} entered the arena as ${classDef.name} — ${classDef.stats.arenaLives} lives.`,
      )
      fresh = appendLog(
        fresh,
        `8 fighters in the roster — defeat all ${OPPONENT_COUNT} opponents to become champion.`,
      )
      return setupBattle(fresh)
    }

    case 'PLAY_CARD': {
      if (!isBattleActive(state)) return state

      const cardId = state.hand[action.handIndex]
      if (!cardId) return state

      const card = getCard(cardId)
      if (state.energy < card.cost) return state

      const hand = state.hand.filter((_, i) => i !== action.handIndex)
      const discardPile = [...state.discardPile, cardId]
      const energy = state.energy - card.cost

      const identity = runIdentity(state)
      const isAttack = cardCountsAsAttack(cardId)
      const isStrike = cardCountsAsStrike(cardId)
      const isGuard = cardCountsAsGuard(cardId)
      const mechanicMeter = normalizeMechanicMeter(state.mechanic, state.classId)

      const bonusDamage = getClassBonusDamage({
        identity,
        cardId,
        strikesPlayedThisTurn: state.strikesPlayedThisTurn,
        attacksPlayedThisTurn: state.attacksPlayedThisTurn,
        handIndex: action.handIndex,
        turnsTaken: state.playerTurnCount,
        defenderHp: state.enemyHp,
        defenderMaxHp: getOpponent(state.opponentId).maxHp,
      })

      const effect = resolveCardEffect({
        cardId,
        playerHp: state.playerHp,
        playerMaxHp: getPlayerMaxHp(identity),
        playerBlock: state.block,
        playerEnergy: energy,
        enemyHp: state.enemyHp,
        enemyBlock: state.enemyBlock,
        relics: state.relics,
        mechanic: mechanicMeter,
      })

      let enemyHp = effect.enemyHp
      let enemyBlock = effect.enemyBlock
      let block = effect.playerBlock
      let playerHp = effect.playerHp
      let energyAfter = effect.playerEnergy
      let logLine = effect.logLine
      let damageDealt = effect.damageDealt

      const preMechanicMods = getMechanicCombatModifiers(
        mechanicMeter,
        state.classId,
        cardId,
        {
          isAttack,
          isStrike,
          isGuard,
          attacksPlayedThisTurn: state.attacksPlayedThisTurn,
          damageDealt: 0,
        },
      )
      if (preMechanicMods.bonusBlock > 0) {
        block += preMechanicMods.bonusBlock
      }

      const mechanicMods = getMechanicCombatModifiers(
        mechanicMeter,
        state.classId,
        cardId,
        {
          isAttack,
          isStrike,
          isGuard,
          attacksPlayedThisTurn: state.attacksPlayedThisTurn,
          damageDealt,
        },
      )

      const combinedBonusDamage = bonusDamage + mechanicMods.bonusDamage
      if (combinedBonusDamage > 0 && isAttack) {
        const extra = applyDamageToEnemy(enemyHp, enemyBlock, combinedBonusDamage)
        enemyHp = extra.enemyHp
        enemyBlock = extra.enemyBlock
        damageDealt += extra.damageDealt
        if (bonusDamage > 0) {
          logLine += ` (+${bonusDamage} class bonus)`
        }
        if (mechanicMods.logParts.length > 0) {
          logLine += formatMechanicLogSuffix(mechanicMods.logParts)
        }
      }

      const postCard = applyClassPostCardEffects({
        identity,
        cardId,
        currentHp: playerHp,
        maxHp: getPlayerMaxHp(identity),
        damageDealt,
      })

      if (postCard.enemyDamage > 0) {
        const riposte = applyDamageToEnemy(enemyHp, enemyBlock, postCard.enemyDamage)
        enemyHp = riposte.enemyHp
        enemyBlock = riposte.enemyBlock
        damageDealt += riposte.damageDealt
      }

      const playerHpAfterHeal = Math.min(
        getPlayerMaxHp(identity),
        postCard.hp + mechanicMods.heal,
      )

      const mechanicAfter = isSignatureMechanicCard(cardId)
        ? {
            meter: applySignatureMechanicToMeter(
              mechanicMeter,
              effect as SignatureCardEffectResult,
            ),
            log: undefined as string | undefined,
          }
        : applyMechanicAfterCardPlay({
            classId: state.classId,
            meter: mechanicMeter,
            cardId,
            damageDealt,
            blockGained: effect.blockGained + preMechanicMods.bonusBlock,
            isAttack,
            isStrike,
            isGuard,
            strikesPlayedThisTurn: state.strikesPlayedThisTurn,
            attacksPlayedThisTurn: state.attacksPlayedThisTurn,
            turnNumber: state.playerTurnCount,
          })

      let mechanicLogSuffix = postCard.logSuffix
      if (mechanicAfter.log) {
        mechanicLogSuffix += ` (${mechanicAfter.log})`
      }

      let next = appendLog(
        {
          ...state,
          hand,
          discardPile,
          enemyHp,
          enemyBlock,
          block,
          energy: energyAfter,
          playerHp: playerHpAfterHeal,
          mechanic: mechanicAfter.meter,
          strikesPlayedThisTurn: shouldIncrementStrikeCounter(cardId)
            ? state.strikesPlayedThisTurn + 1
            : state.strikesPlayedThisTurn,
          attacksPlayedThisTurn: shouldIncrementAttackCounter(cardId)
            ? state.attacksPlayedThisTurn + 1
            : state.attacksPlayedThisTurn,
          message: `Played ${card.name}.`,
        },
        logLine + mechanicLogSuffix,
      )

      if (effect.extraDraws > 0) {
        next = drawCards(next, next.hand.length + effect.extraDraws)
      }

      if (enemyHp <= 0) {
        return resolveBattleEnd({ ...next, enemyHp: 0 }, true)
      }

      return next
    }

    case 'END_TURN': {
      if (!isBattleActive(state)) return state

      const endMechanic = applyMechanicOnEndTurn(
        normalizeMechanicMeter(state.mechanic, state.classId),
        state.classId,
      )
      let next = discardHand({
        ...state,
        mechanic: endMechanic.meter,
      })
      if (endMechanic.log) {
        next = appendLog(next, endMechanic.log)
      }
      next = applyEnemyTurn(next)

      if (next.playerHp <= 0) {
        return resolveBattleEnd({ ...next, playerHp: 0 }, false)
      }

      return beginPlayerTurn(next)
    }

    case 'PICK_CARD_REWARD': {
      if (
        state.screen !== 'reward' ||
        state.rewardType !== 'cards' ||
        state.rewardClaimed
      ) {
        return state
      }

      const cardId = state.rewardCards[action.offerIndex]
      if (!cardId) return state

      const card = getCard(cardId)
      return appendLog(
        {
          ...state,
          deck: [...state.deck, cardId],
          rewardClaimed: true,
          message: `Added ${card.name} to your deck.`,
        },
        `Reward — added ${card.name} to deck.`,
      )
    }

    case 'PICK_RELIC_REWARD': {
      if (
        state.screen !== 'reward' ||
        state.rewardType !== 'relics' ||
        state.rewardClaimed
      ) {
        return state
      }

      const relicId = state.rewardRelics[action.offerIndex]
      if (!relicId || state.relics.includes(relicId)) return state

      const relic = getRelic(relicId)
      return appendLog(
        {
          ...state,
          relics: [...state.relics, relicId],
          rewardClaimed: true,
          message: `Obtained ${relic.name}.`,
        },
        `Relic reward — obtained ${relic.name}.`,
      )
    }

    case 'CONTINUE_TO_SHOP': {
      if (!canContinueToShop(state)) return state

      return appendLog(
        syncRoster({
          ...state,
          screen: 'shop',
          shopOffers: generateShopOffers(state),
          rewardType: 'none',
          rewardCards: [],
          rewardRelics: [],
          message: 'Buy cards, then check standings.',
        }),
        'Entered the arena lobby.',
      )
    }

    case 'BUY_CARD': {
      const cardId = state.shopOffers[action.offerIndex]
      const price = getShopCardPrice(state.relics)
      if (!cardId || state.gold < price) return state

      const card = getCard(cardId)
      const gold = state.gold - price
      return appendLog(
        syncRoster({
          ...state,
          gold,
          deck: [...state.deck, cardId],
          message: `Purchased ${card.name}.`,
        }),
        `Bought ${card.name} for ${price} gold (${gold} gold left).`,
      )
    }

    case 'NEXT_BATTLE': {
      if (state.lives <= 0 || isArenaComplete(state.contestants)) return state
      return setupBattle({
        ...state,
        battleNumber: state.battleNumber + 1,
      })
    }

    case 'SUBMIT_TO_DAILY_CHAMPIONS': {
      if (state.screen !== 'victory' || state.championSubmitted) return state

      return appendLog(
        {
          ...state,
          championSubmitted: true,
          message: 'Submitted to Daily Champions!',
        },
        `${state.championName} immortalized on the Daily Champions board.`,
      )
    }

    default:
      return state
  }
}
