import { test, expect } from '@playwright/test'
import { SMOKE_COMBAT_TIMEOUT_MS, SMOKE_TEST_TIMEOUT_MS } from './constants'
import { assertPageHealthy, isFirstPostMatchScreen } from './helpers/matchOutcome'
import { createBotLogger } from './helpers/botLog'
import { runCombatBot, waitForMatchRoom } from './helpers/playerBot'
import {
  closeTwoPlayerSession,
  createTwoPlayerSession,
  runLobbyToRoundStart,
} from './helpers/twoPlayerSession'

/**
 * Milestone 31 — multiplayer smoke baseline (<60s).
 * Verifies: lobby → ready → start → match room → intro → combat → first post-match.
 */
test.describe('Multiplayer smoke @smoke', () => {
  test('two bots complete one PvP game on production', async ({ browser, baseURL }) => {
    test.setTimeout(SMOKE_TEST_TIMEOUT_MS)

    const session = await createTwoPlayerSession(browser)
    const logA = createBotLogger('BotA')
    const logB = createBotLogger('BotB')

    try {
      await runLobbyToRoundStart(session, baseURL)

      logA.step('Wait for match assignment')
      logB.step('Wait for match assignment')
      await waitForMatchRoom(session.pageA, logA)
      await waitForMatchRoom(session.pageB, logB)

      logA.info('Starting combat bots (smoke)')
      logB.info('Starting combat bots (smoke)')

      await Promise.all([
        runCombatBot(session.pageA, logA, {
          mode: 'first-post-match',
          timeoutMs: SMOKE_COMBAT_TIMEOUT_MS,
        }),
        runCombatBot(session.pageB, logB, {
          mode: 'first-post-match',
          timeoutMs: SMOKE_COMBAT_TIMEOUT_MS,
        }),
      ])

      const postMatchA = await isFirstPostMatchScreen(session.pageA)
      const postMatchB = await isFirstPostMatchScreen(session.pageB)
      expect(postMatchA || postMatchB).toBe(true)

      await assertPageHealthy(session.pageA, 'BotA')
      await assertPageHealthy(session.pageB, 'BotB')

      logA.info('Smoke test complete — post-match reached')
      logB.info('Smoke test complete — post-match reached')
    } finally {
      await closeTwoPlayerSession(session)
    }
  })
})
