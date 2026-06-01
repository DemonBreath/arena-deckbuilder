import { getCard, STARTER_DECK, type CardId } from './cardDatabase'
import {
  applyClassPostCardEffects,
  formatClassPassiveLog,
  getClassBonusDamage,
  getClassTurnHandSize,
  getClassTurnStartBlock,
  shouldIncrementAttackCounter,
  shouldIncrementStrikeCounter,
} from './classPassives'
import {
  DEFAULT_CLASS_ID,
  getClassMaxHp,
  getClassTurnEnergy,
  isClassId,
  type ClassId,
} from './classDatabase'

export const PVP_MAX_HP = 30
export const PVP_STARTING_ENERGY = 3
export const PVP_HAND_SIZE = 5
const MAX_LOG_ENTRIES = 80

export const PVP_ALLOWED_CARDS: readonly CardId[] = [
  'strike',
  'guard',
  'strike_plus',
  'guard_plus',
  'heavy_strike',
] as const

export type PvpCardId = (typeof PVP_ALLOWED_CARDS)[number]

export type PvpEmoteId = 'gg' | 'oops' | 'thinking' | 'nice'

export const PVP_EMOTES: { id: PvpEmoteId; label: string }[] = [
  { id: 'gg', label: 'GG' },
  { id: 'oops', label: 'Oops' },
  { id: 'thinking', label: 'Thinking…' },
  { id: 'nice', label: 'Nice play' },
]

export function getEmoteLabel(id: PvpEmoteId): string {
  return PVP_EMOTES.find((e) => e.id === id)?.label ?? id
}

export function isPvpAllowedCard(cardId: CardId): cardId is PvpCardId {
  return (PVP_ALLOWED_CARDS as readonly string[]).includes(cardId)
}

const PVP_DECK_PAD_DEFAULTS: PvpCardId[] = [
  'strike',
  'guard',
  'heavy_strike',
  'strike_plus',
  'guard_plus',
]

/** Cards that can appear in the online shop (PvP-legal upgrades). */
export const PVP_SHOP_CARD_POOL: readonly CardId[] = [
  'strike_plus',
  'guard_plus',
  'heavy_strike',
] as const

/** Strip non-PvP cards from a deck saved during shop rounds. */
export function sanitizePvpDeck(deck: CardId[]): CardId[] {
  const filtered = deck.filter(isPvpAllowedCard)
  return filtered.length > 0 ? filtered : [...STARTER_DECK]
}

/** Build a shuffled draw pile using only PvP-legal cards (pads if the deck is thin). */
export function buildPvpDrawPile(source?: CardId[]): CardId[] {
  const raw = source ?? STARTER_DECK
  const filtered = raw.filter(isPvpAllowedCard)
  const pile = [...filtered]
  for (const card of PVP_DECK_PAD_DEFAULTS) {
    if (pile.length >= 10) break
    pile.push(card)
  }
  while (pile.length < 5) {
    pile.push(PVP_DECK_PAD_DEFAULTS[pile.length % PVP_DECK_PAD_DEFAULTS.length])
  }
  return shuffle(pile)
}

export interface PvpPlayerBattleState {
  playerId: string
  championName: string
  classId: ClassId
  maxHp: number
  hp: number
  block: number
  energy: number
  drawPile: CardId[]
  discardPile: CardId[]
  hand: CardId[]
  /** Gunslinger combo tracking within the current turn. */
  strikesPlayedThisTurn: number
  /** Assassin / tempo tracking for first-attack bonuses. */
  attacksPlayedThisTurn: number
}

export interface PvpBattleCombatant {
  id: string
  championName: string
  deck?: CardId[]
  classId?: ClassId
}

export interface PvpPlayerMatchStats {
  damageDealt: number
  cardsPlayed: number
}

export interface PvpBattleEmote {
  id: PvpEmoteId
  at: number
}

export interface PvpLastPlayEffect {
  kind: 'damage' | 'block'
  amount: number
  actorSlot: PlayerSlot
  targetSlot: PlayerSlot
  cardName: string
  atVersion: number
}

export type PvpBattlePhase = 'active' | 'completed'
export type PlayerSlot = 1 | 2

export interface PvpBattleState {
  version: number
  activeSlot: PlayerSlot
  player1: PvpPlayerBattleState
  player2: PvpPlayerBattleState
  stats: {
    player1: PvpPlayerMatchStats
    player2: PvpPlayerMatchStats
  }
  emote1: PvpBattleEmote | null
  emote2: PvpBattleEmote | null
  lastEffect: PvpLastPlayEffect | null
  battleLog: string[]
  message: string
  phase: PvpBattlePhase
  winnerSlot: PlayerSlot | null
}

export type PvpBattleAction =
  | { type: 'PLAY_CARD'; handIndex: number }
  | { type: 'END_TURN' }
  | { type: 'EMOTE'; emoteId: PvpEmoteId }

export interface PvpBattleViewPlayer {
  playerId: string
  championName: string
  classId: ClassId
  maxHp: number
  hp: number
  block: number
  energy: number
  maxEnergy: number
  drawCount: number
  discardCount: number
  handSize: number
  hand: CardId[] | null
}

export interface PvpBattleView {
  version: number
  activeSlot: PlayerSlot
  mySlot: PlayerSlot
  me: PvpBattleViewPlayer
  opponent: PvpBattleViewPlayer
  myStats: PvpPlayerMatchStats
  opponentStats: PvpPlayerMatchStats
  myEmote: PvpBattleEmote | null
  opponentEmote: PvpBattleEmote | null
  lastEffect: PvpLastPlayEffect | null
  battleLog: string[]
  message: string
  phase: PvpBattlePhase
  winnerSlot: PlayerSlot | null
  isMyTurn: boolean
  isCompleted: boolean
  didIWin: boolean | null
}

export interface PvpMatchSummary {
  winnerName: string
  loserName: string
  didIWin: boolean
  myDamageDealt: number
  opponentDamageDealt: number
  myCardsPlayed: number
  opponentCardsPlayed: number
  livesRemaining: number
  livesChange: number
}

export interface SpectatorBattleView {
  version: number
  player1: PvpBattleViewPlayer
  player2: PvpBattleViewPlayer
  activeSlot: PlayerSlot
  activePlayerName: string
  phase: PvpBattlePhase
  message: string
  battleLog: string[]
  lastEffect: PvpLastPlayEffect | null
  winnerName: string | null
  isCompleted: boolean
}

const EMPTY_STATS: PvpPlayerMatchStats = { damageDealt: 0, cardsPlayed: 0 }

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalizeCombatantPlayer(
  player: PvpPlayerBattleState,
): PvpPlayerBattleState {
  const classId =
    player.classId && isClassId(player.classId)
      ? player.classId
      : DEFAULT_CLASS_ID
  const maxHp =
    typeof player.maxHp === 'number' ? player.maxHp : getClassMaxHp(classId)
  return {
    ...player,
    classId,
    maxHp,
    strikesPlayedThisTurn: player.strikesPlayedThisTurn ?? 0,
    attacksPlayedThisTurn: player.attacksPlayedThisTurn ?? 0,
  }
}

export function normalizePvpBattleState(state: PvpBattleState): PvpBattleState {
  return {
    ...state,
    player1: normalizeCombatantPlayer(state.player1),
    player2: normalizeCombatantPlayer(state.player2),
    stats: state.stats ?? {
      player1: { ...EMPTY_STATS },
      player2: { ...EMPTY_STATS },
    },
    emote1: state.emote1 ?? null,
    emote2: state.emote2 ?? null,
    lastEffect: state.lastEffect ?? null,
  }
}

function appendLog(state: PvpBattleState, entry: string): PvpBattleState {
  const battleLog = [...state.battleLog, entry]
  if (battleLog.length > MAX_LOG_ENTRIES) {
    battleLog.splice(0, battleLog.length - MAX_LOG_ENTRIES)
  }
  return { ...state, battleLog }
}

function getPlayer(state: PvpBattleState, slot: PlayerSlot): PvpPlayerBattleState {
  return slot === 1 ? state.player1 : state.player2
}

function setPlayer(
  state: PvpBattleState,
  slot: PlayerSlot,
  player: PvpPlayerBattleState,
): PvpBattleState {
  return slot === 1
    ? { ...state, player1: player }
    : { ...state, player2: player }
}

function getStats(state: PvpBattleState, slot: PlayerSlot): PvpPlayerMatchStats {
  return slot === 1 ? state.stats.player1 : state.stats.player2
}

function setStats(
  state: PvpBattleState,
  slot: PlayerSlot,
  stats: PvpPlayerMatchStats,
): PvpBattleState {
  return slot === 1
    ? { ...state, stats: { ...state.stats, player1: stats } }
    : { ...state, stats: { ...state.stats, player2: stats } }
}

function getOpponentSlot(slot: PlayerSlot): PlayerSlot {
  return slot === 1 ? 2 : 1
}

function drawCardsForPlayer(
  player: PvpPlayerBattleState,
  targetHandSize: number,
): PvpPlayerBattleState {
  let drawPile = [...player.drawPile]
  let discardPile = [...player.discardPile]
  const hand = [...player.hand]

  while (hand.length < targetHandSize) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break
      drawPile = shuffle(discardPile)
      discardPile = []
    }
    const card = drawPile.pop()
    if (!card) break
    hand.push(card)
  }

  return { ...player, drawPile, discardPile, hand }
}

function beginTurn(state: PvpBattleState, slot: PlayerSlot): PvpBattleState {
  const player = normalizeCombatantPlayer(getPlayer(state, slot))
  const startBlock = getClassTurnStartBlock(player.classId)
  let cleared: PvpPlayerBattleState = {
    ...player,
    block: startBlock,
    energy: getClassTurnEnergy(player.classId),
    hand: [],
    strikesPlayedThisTurn: 0,
    attacksPlayedThisTurn: 0,
  }
  const handSize = getClassTurnHandSize(player.classId)
  const drawn = drawCardsForPlayer(cleared, handSize)
  let next = setPlayer(state, slot, drawn)
  const passiveLog = formatClassPassiveLog(player.classId)
  if (passiveLog) {
    next = appendLog(next, `${player.championName} — ${passiveLog}`)
  }
  next = appendLog(next, `— ${player.championName}'s turn —`)
  return {
    ...next,
    activeSlot: slot,
    message: `${player.championName}'s turn — play cards, then end turn.`,
  }
}

function applyDamageToTarget(
  hp: number,
  block: number,
  rawDamage: number,
): { hp: number; block: number; damageDealt: number } {
  if (rawDamage <= 0) {
    return { hp, block, damageDealt: 0 }
  }
  const damageDealt = Math.max(0, rawDamage - Math.min(block, rawDamage))
  return {
    hp: hp - damageDealt,
    block: Math.max(0, block - rawDamage),
    damageDealt,
  }
}

function resolvePvpCardPlay(
  cardId: CardId,
  attackerBlock: number,
  targetHp: number,
  targetBlock: number,
): {
  targetHp: number
  targetBlock: number
  attackerBlock: number
  logLine: string
  damageDealt: number
  blockGained: number
  effectKind: 'damage' | 'block' | 'none'
} {
  const card = getCard(cardId)

  if (card.damage !== undefined) {
    const result = applyDamageToTarget(targetHp, targetBlock, card.damage)
    return {
      targetHp: result.hp,
      targetBlock: result.block,
      attackerBlock,
      damageDealt: result.damageDealt,
      blockGained: 0,
      effectKind: 'damage',
      logLine: `Played ${card.name} — dealt ${result.damageDealt} damage.`,
    }
  }

  if (card.block !== undefined) {
    return {
      targetHp,
      targetBlock,
      attackerBlock: attackerBlock + card.block,
      damageDealt: 0,
      blockGained: card.block,
      effectKind: 'block',
      logLine: `Played ${card.name} — gained ${card.block} block.`,
    }
  }

  return {
    targetHp,
    targetBlock,
    attackerBlock,
    damageDealt: 0,
    blockGained: 0,
    effectKind: 'none',
    logLine: `Played ${card.name} — no effect.`,
  }
}

function discardHand(player: PvpPlayerBattleState): PvpPlayerBattleState {
  if (player.hand.length === 0) return player
  return {
    ...player,
    discardPile: [...player.discardPile, ...player.hand],
    hand: [],
  }
}

export function getPlayerSlot(
  state: PvpBattleState,
  playerId: string,
): PlayerSlot | null {
  if (state.player1.playerId === playerId) return 1
  if (state.player2.playerId === playerId) return 2
  return null
}

function buildCombatant(
  combatant: PvpBattleCombatant,
): PvpPlayerBattleState {
  const classId =
    combatant.classId && isClassId(combatant.classId)
      ? combatant.classId
      : DEFAULT_CLASS_ID
  const maxHp = getClassMaxHp(classId)
  return {
    playerId: combatant.id,
    championName: combatant.championName,
    classId,
    maxHp,
    hp: maxHp,
    block: 0,
    energy: 0,
    drawPile: buildPvpDrawPile(combatant.deck),
    discardPile: [],
    hand: [],
    strikesPlayedThisTurn: 0,
    attacksPlayedThisTurn: 0,
  }
}

export function createInitialPvpBattleState(
  player1: PvpBattleCombatant,
  player2: PvpBattleCombatant,
): PvpBattleState {
  const base: PvpBattleState = {
    version: 1,
    activeSlot: 1,
    player1: buildCombatant(player1),
    player2: buildCombatant(player2),
    stats: {
      player1: { ...EMPTY_STATS },
      player2: { ...EMPTY_STATS },
    },
    emote1: null,
    emote2: null,
    lastEffect: null,
    battleLog: [],
    message: '',
    phase: 'active',
    winnerSlot: null,
  }

  let next = appendLog(
    base,
    `PvP match — ${player1.championName} vs ${player2.championName}. Player 1 goes first.`,
  )
  next = beginTurn(next, 1)
  return next
}

export function buildPvpBattleView(
  state: PvpBattleState,
  myPlayerId: string,
): PvpBattleView | null {
  const normalized = normalizePvpBattleState(state)
  const mySlot = getPlayerSlot(normalized, myPlayerId)
  if (!mySlot) return null

  const opponentSlot = getOpponentSlot(mySlot)
  const meRaw = getPlayer(normalized, mySlot)
  const oppRaw = getPlayer(normalized, opponentSlot)

  const me: PvpBattleViewPlayer = {
    playerId: meRaw.playerId,
    championName: meRaw.championName,
    classId: meRaw.classId,
    maxHp: meRaw.maxHp,
    hp: meRaw.hp,
    block: meRaw.block,
    energy: meRaw.energy,
    maxEnergy: getClassTurnEnergy(meRaw.classId),
    drawCount: meRaw.drawPile.length,
    discardCount: meRaw.discardPile.length,
    handSize: meRaw.hand.length,
    hand: [...meRaw.hand],
  }

  const opponent: PvpBattleViewPlayer = {
    playerId: oppRaw.playerId,
    championName: oppRaw.championName,
    classId: oppRaw.classId,
    maxHp: oppRaw.maxHp,
    hp: oppRaw.hp,
    block: oppRaw.block,
    energy: oppRaw.energy,
    maxEnergy: getClassTurnEnergy(oppRaw.classId),
    drawCount: oppRaw.drawPile.length,
    discardCount: oppRaw.discardPile.length,
    handSize: oppRaw.hand.length,
    hand: null,
  }

  const didIWin =
    normalized.phase === 'completed' && normalized.winnerSlot !== null
      ? normalized.winnerSlot === mySlot
      : null

  return {
    version: normalized.version,
    activeSlot: normalized.activeSlot,
    mySlot,
    me,
    opponent,
    myStats: { ...getStats(normalized, mySlot) },
    opponentStats: { ...getStats(normalized, opponentSlot) },
    myEmote: mySlot === 1 ? normalized.emote1 : normalized.emote2,
    opponentEmote: opponentSlot === 1 ? normalized.emote1 : normalized.emote2,
    lastEffect: normalized.lastEffect,
    battleLog: normalized.battleLog,
    message: normalized.message,
    phase: normalized.phase,
    winnerSlot: normalized.winnerSlot,
    isMyTurn:
      normalized.phase === 'active' && normalized.activeSlot === mySlot,
    isCompleted: normalized.phase === 'completed',
    didIWin,
  }
}

function toSpectatorPlayer(player: PvpPlayerBattleState): PvpBattleViewPlayer {
  const normalized = normalizeCombatantPlayer(player)
  return {
    playerId: normalized.playerId,
    championName: normalized.championName,
    classId: normalized.classId,
    maxHp: normalized.maxHp,
    hp: normalized.hp,
    block: normalized.block,
    energy: normalized.energy,
    maxEnergy: getClassTurnEnergy(normalized.classId),
    drawCount: normalized.drawPile.length,
    discardCount: normalized.discardPile.length,
    handSize: normalized.hand.length,
    hand: null,
  }
}

export function buildSpectatorBattleView(
  state: PvpBattleState,
): SpectatorBattleView | null {
  const normalized = normalizePvpBattleState(state)
  const active = getPlayer(normalized, normalized.activeSlot)

  return {
    version: normalized.version,
    player1: toSpectatorPlayer(normalized.player1),
    player2: toSpectatorPlayer(normalized.player2),
    activeSlot: normalized.activeSlot,
    activePlayerName:
      normalized.phase === 'active' ? active.championName : '',
    phase: normalized.phase,
    message: normalized.message,
    battleLog: normalized.battleLog,
    lastEffect: normalized.lastEffect,
    winnerName: normalized.winnerSlot
      ? getPlayer(normalized, normalized.winnerSlot).championName
      : null,
    isCompleted: normalized.phase === 'completed',
  }
}

export function buildPvpMatchSummary(
  state: PvpBattleState,
  myPlayerId: string,
  livesRemaining: number,
  livesChange: number,
): PvpMatchSummary | null {
  const normalized = normalizePvpBattleState(state)
  if (!normalized.winnerSlot) return null

  const mySlot = getPlayerSlot(normalized, myPlayerId)
  if (!mySlot) return null

  const winnerSlot = normalized.winnerSlot
  const loserSlot = getOpponentSlot(winnerSlot)
  const winner = getPlayer(normalized, winnerSlot)
  const loser = getPlayer(normalized, loserSlot)
  const myStats = getStats(normalized, mySlot)
  const oppStats = getStats(normalized, getOpponentSlot(mySlot))

  return {
    winnerName: winner.championName,
    loserName: loser.championName,
    didIWin: mySlot === winnerSlot,
    myDamageDealt: myStats.damageDealt,
    opponentDamageDealt: oppStats.damageDealt,
    myCardsPlayed: myStats.cardsPlayed,
    opponentCardsPlayed: oppStats.cardsPlayed,
    livesRemaining,
    livesChange,
  }
}

export function applyPvpBattleAction(
  state: PvpBattleState,
  playerId: string,
  action: PvpBattleAction,
): PvpBattleState {
  const normalized = normalizePvpBattleState(state)
  if (normalized.phase === 'completed' && action.type !== 'EMOTE') {
    return normalized
  }

  const slot = getPlayerSlot(normalized, playerId)
  if (!slot) return normalized

  if (action.type === 'EMOTE') {
    return applyEmote(normalized, slot, action.emoteId)
  }

  if (normalized.phase === 'completed') return normalized
  if (normalized.activeSlot !== slot) return normalized

  switch (action.type) {
    case 'PLAY_CARD':
      return applyPlayCard(normalized, slot, action.handIndex)
    case 'END_TURN':
      return applyEndTurn(normalized, slot)
    default:
      return normalized
  }
}

function applyEmote(
  state: PvpBattleState,
  slot: PlayerSlot,
  emoteId: PvpEmoteId,
): PvpBattleState {
  const player = getPlayer(state, slot)
  const emote: PvpBattleEmote = { id: emoteId, at: Date.now() }
  const label = getEmoteLabel(emoteId)

  return {
    ...state,
    emote1: slot === 1 ? emote : state.emote1,
    emote2: slot === 2 ? emote : state.emote2,
    version: state.version + 1,
    message: `${player.championName} sent “${label}”.`,
  }
}

function applyPlayCard(
  state: PvpBattleState,
  slot: PlayerSlot,
  handIndex: number,
): PvpBattleState {
  const attacker = getPlayer(state, slot)
  const cardId = attacker.hand[handIndex]
  if (!cardId || !isPvpAllowedCard(cardId)) return state

  const card = getCard(cardId)
  if (attacker.energy < card.cost) return state

  const opponentSlot = getOpponentSlot(slot)
  const defender = getPlayer(state, opponentSlot)

  const hand = attacker.hand.filter((_, i) => i !== handIndex)
  const discardPile = [...attacker.discardPile, cardId]
  const energy = attacker.energy - card.cost

  const bonusDamage = getClassBonusDamage({
    classId: attacker.classId,
    cardId,
    strikesPlayedThisTurn: attacker.strikesPlayedThisTurn,
    attacksPlayedThisTurn: attacker.attacksPlayedThisTurn,
    handIndex,
  })

  const result = resolvePvpCardPlay(
    cardId,
    attacker.block,
    defender.hp,
    defender.block,
  )

  let targetHp = result.targetHp
  let targetBlock = result.targetBlock
  let totalDamage = result.damageDealt

  if (bonusDamage > 0 && card.damage !== undefined) {
    const extra = applyDamageToTarget(targetHp, targetBlock, bonusDamage)
    targetHp = extra.hp
    targetBlock = extra.block
    totalDamage += extra.damageDealt
  }

  let updatedAttacker: PvpPlayerBattleState = {
    ...attacker,
    hand,
    discardPile,
    energy,
    block: result.attackerBlock,
    strikesPlayedThisTurn: shouldIncrementStrikeCounter(cardId)
      ? attacker.strikesPlayedThisTurn + 1
      : attacker.strikesPlayedThisTurn,
    attacksPlayedThisTurn: shouldIncrementAttackCounter(cardId)
      ? attacker.attacksPlayedThisTurn + 1
      : attacker.attacksPlayedThisTurn,
  }

  const postCard = applyClassPostCardEffects({
    classId: attacker.classId,
    cardId,
    currentHp: updatedAttacker.hp,
    maxHp: updatedAttacker.maxHp,
    damageDealt: totalDamage,
  })
  updatedAttacker = { ...updatedAttacker, hp: postCard.hp }

  const updatedDefender: PvpPlayerBattleState = {
    ...defender,
    hp: targetHp,
    block: targetBlock,
  }

  const prevStats = getStats(state, slot)
  const nextStats: PvpPlayerMatchStats = {
    damageDealt: prevStats.damageDealt + totalDamage,
    cardsPlayed: prevStats.cardsPlayed + 1,
  }

  let logLine = result.logLine
  if (bonusDamage > 0) {
    logLine += ` (+${bonusDamage} class bonus)`
  }
  logLine += postCard.logSuffix

  let next = setPlayer(state, slot, updatedAttacker)
  next = setPlayer(next, opponentSlot, updatedDefender)
  next = setStats(next, slot, nextStats)
  next = {
    ...appendLog(next, `${attacker.championName}: ${logLine}`),
    version: state.version + 1,
    message: `${attacker.championName} played ${card.name}.`,
    lastEffect:
      result.effectKind === 'damage' && totalDamage > 0
        ? {
            kind: 'damage',
            amount: totalDamage,
            actorSlot: slot,
            targetSlot: opponentSlot,
            cardName: card.name,
            atVersion: state.version + 1,
          }
        : result.effectKind === 'block' && result.blockGained > 0
          ? {
              kind: 'block',
              amount: result.blockGained,
              actorSlot: slot,
              targetSlot: slot,
              cardName: card.name,
              atVersion: state.version + 1,
            }
          : null,
  }

  if (targetHp <= 0) {
    return completeMatch(next, slot)
  }

  return next
}

function applyEndTurn(state: PvpBattleState, slot: PlayerSlot): PvpBattleState {
  const attacker = getPlayer(state, slot)
  let next = setPlayer(state, slot, discardHand(attacker))
  next = appendLog(next, `${attacker.championName} ended their turn.`)

  const nextSlot = getOpponentSlot(slot)
  next = {
    ...next,
    activeSlot: nextSlot,
    version: state.version + 1,
    lastEffect: null,
  }
  return beginTurn(next, nextSlot)
}

function completeMatch(
  state: PvpBattleState,
  winnerSlot: PlayerSlot,
  logLine?: string,
  message?: string,
): PvpBattleState {
  const winner = getPlayer(state, winnerSlot)
  const defaultLog = `${winner.championName} wins — opponent at 0 HP!`
  const defaultMessage = `${winner.championName} wins the match!`
  return {
    ...appendLog(state, logLine ?? defaultLog),
    phase: 'completed',
    winnerSlot,
    version: state.version + 1,
    message: message ?? defaultMessage,
  }
}

export function completeMatchWithReason(
  state: PvpBattleState,
  winnerSlot: PlayerSlot,
  logLine: string,
  message: string,
): PvpBattleState {
  return completeMatch(state, winnerSlot, logLine, message)
}

export function applyTurnTimeoutEnd(state: PvpBattleState): PvpBattleState | null {
  if (state.phase !== 'active') return null
  const slot = state.activeSlot
  const attacker = getPlayer(state, slot)
  let next = setPlayer(state, slot, discardHand(attacker))
  next = appendLog(
    next,
    `${attacker.championName}'s turn timed out — turn ended automatically.`,
  )

  const nextSlot = getOpponentSlot(slot)
  next = {
    ...next,
    activeSlot: nextSlot,
    version: state.version + 1,
    lastEffect: null,
    message: `Turn timer expired — ${attacker.championName}'s turn ended.`,
  }
  return beginTurn(next, nextSlot)
}

export function resolveTimeoutWinnerSlot(
  state: PvpBattleState,
  player1Lives: number,
  player2Lives: number,
): PlayerSlot {
  const hp1 = state.player1.hp
  const hp2 = state.player2.hp
  if (hp1 > hp2) return 1
  if (hp2 > hp1) return 2
  if (player1Lives > player2Lives) return 1
  if (player2Lives > player1Lives) return 2
  return Math.random() < 0.5 ? 1 : 2
}

export function getWinnerPlayerId(state: PvpBattleState): string | null {
  if (!state.winnerSlot) return null
  return getPlayer(state, state.winnerSlot).playerId
}

export function serializePvpBattleState(state: PvpBattleState): string {
  return JSON.stringify(state, null, 2)
}
