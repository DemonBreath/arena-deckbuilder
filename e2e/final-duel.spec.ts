import { test } from '@playwright/test'
import { FINAL_DUEL_TEST_TIMEOUT_MS } from './constants'
import { runFinalDuelSeries } from './helpers/finalDuelSeries'
import {
  closeTwoPlayerSession,
  createTwoPlayerSession,
  runLobbyToRoundStart,
} from './helpers/twoPlayerSession'

/**
 * Milestone 31 — full 2-player Final Duel best-of-3 on production.
 */
test.describe('Final Duel series @final-duel', () => {
  test('two bots play a complete best-of-3 series', async ({ browser, baseURL }) => {
    test.setTimeout(FINAL_DUEL_TEST_TIMEOUT_MS)

    const session = await createTwoPlayerSession(browser)

    try {
      await runLobbyToRoundStart(session, baseURL)
      await runFinalDuelSeries(session)
    } finally {
      await closeTwoPlayerSession(session)
    }
  })
})
