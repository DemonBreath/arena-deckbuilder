import { expect } from '@playwright/test'
import { FINAL_DUEL_GAME_COMBAT_TIMEOUT_MS } from '../constants'
import { createBotLogger } from './botLog'
import { assertPageHealthy, isSeriesCompleteScreen } from './matchOutcome'
import { advancePostMatchToLobby } from './postMatchFlow'
import {
  clickReady,
  runCombatBot,
  startRoundWhenHostReady,
  waitForMatchRoom,
} from './playerBot'
import type { TwoPlayerSession } from './twoPlayerSession'

const MAX_SERIES_GAMES = 5

export async function runFinalDuelSeries(session: TwoPlayerSession): Promise<void> {
  const logA = createBotLogger('BotA')
  const logB = createBotLogger('BotB')

  for (let game = 1; game <= MAX_SERIES_GAMES; game += 1) {
    if (
      (await isSeriesCompleteScreen(session.pageA)) ||
      (await isSeriesCompleteScreen(session.pageB))
    ) {
      logA.info(`Series already complete before game ${game}`)
      break
    }

    logA.info(`Final Duel — game ${game}`)
    logB.info(`Final Duel — game ${game}`)

    await waitForMatchRoom(session.pageA, logA)
    await waitForMatchRoom(session.pageB, logB)

    await Promise.all([
      runCombatBot(session.pageA, logA, {
        mode: 'game-complete',
        timeoutMs: FINAL_DUEL_GAME_COMBAT_TIMEOUT_MS,
      }),
      runCombatBot(session.pageB, logB, {
        mode: 'game-complete',
        timeoutMs: FINAL_DUEL_GAME_COMBAT_TIMEOUT_MS,
      }),
    ])

    if (
      (await isSeriesCompleteScreen(session.pageA)) ||
      (await isSeriesCompleteScreen(session.pageB))
    ) {
      logA.info('Series complete after game')
      break
    }

    await Promise.all([
      advancePostMatchToLobby(session.pageA, logA),
      advancePostMatchToLobby(session.pageB, logB),
    ])

    if (
      (await isSeriesCompleteScreen(session.pageA)) ||
      (await isSeriesCompleteScreen(session.pageB))
    ) {
      logA.info('Series complete after post-match')
      break
    }

    logA.step('Ready for next game in series')
    logB.step('Ready for next game in series')
    await clickReady(session.pageA, logA)
    await clickReady(session.pageB, logB)
    await startRoundWhenHostReady([
      { page: session.pageA, log: logA },
      { page: session.pageB, log: logB },
    ])
  }

  const seriesDoneA = await isSeriesCompleteScreen(session.pageA)
  const seriesDoneB = await isSeriesCompleteScreen(session.pageB)
  expect(seriesDoneA || seriesDoneB).toBe(true)

  await assertPageHealthy(session.pageA, 'BotA')
  await assertPageHealthy(session.pageB, 'BotB')

  logA.info('Final Duel series finished — no blank screen')
  logB.info('Final Duel series finished — no blank screen')
}
