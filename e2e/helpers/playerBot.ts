import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createBotLogger } from './botLog'
import {
  isFirstPostMatchScreen,
  isSeriesCompleteScreen,
} from './matchOutcome'
import {
  beginCombatButton,
  championNameInput,
  classCard,
  classConfirmButton,
  endTurnButton,
  joinLobbyButton,
  lobbyCodeInput,
  matchAssignmentScreen,
  matchIntroScreen,
  matchRoomScreen,
  onlineLobbyScreen,
  pvpCombatScreen,
  playableCardButtons,
  readyButton,
  startMatchButton,
} from './selectors'

export type BotRole = 'host' | 'guest'

/** When the combat loop should stop for this bot. */
export type CombatExitMode =
  | 'first-post-match'
  | 'game-complete'
  | 'series-complete'

export interface BotConfig {
  name: string
  classId: string
  role: BotRole
}

export async function dismissRejoinIfPresent(page: Page, log: ReturnType<typeof createBotLogger>) {
  const startFresh = page.getByRole('button', { name: 'Start Fresh' })
  if (await startFresh.isVisible().catch(() => false)) {
    log.step('Dismiss rejoin prompt (Start Fresh)')
    await startFresh.click()
  }
}

export async function fillChampionName(page: Page, name: string, log: ReturnType<typeof createBotLogger>) {
  log.step(`Set champion name to ${name}`)
  const input = championNameInput(page)
  await input.waitFor({ state: 'visible' })
  await input.fill(name)
}

export async function selectClassAndConfirm(page: Page, classId: string, log: ReturnType<typeof createBotLogger>) {
  log.step(`Select class ${classId}`)
  const card = classCard(page, classId)
  await card.waitFor({ state: 'visible' })
  await card.click()
  log.step('Confirm class selection')
  await classConfirmButton(page, classId).click()
}

/** Host: home → lobby TESTBOT. Guest: invite URL. */
export async function joinLobbyAsHost(page: Page, lobbyCode: string, log: ReturnType<typeof createBotLogger>) {
  await dismissRejoinIfPresent(page, log)
  log.step(`Set lobby code ${lobbyCode}`)
  await lobbyCodeInput(page).fill(lobbyCode)
  log.step('Open class selection (join lobby)')
  await joinLobbyButton(page).click()
}

export async function joinLobbyAsGuest(page: Page, log: ReturnType<typeof createBotLogger>) {
  await dismissRejoinIfPresent(page, log)
  log.step('Open class selection from invite screen')
  await joinLobbyButton(page).click()
}

export async function waitForLobby(page: Page, lobbyCode: string, log: ReturnType<typeof createBotLogger>) {
  log.step('Wait for online lobby screen')
  await expect(onlineLobbyScreen(page)).toBeVisible({ timeout: 90_000 })
  await expect(page.getByText(lobbyCode, { exact: true }).first()).toBeVisible()
}

export async function expectRosterContains(page: Page, championName: string, log: ReturnType<typeof createBotLogger>) {
  log.step(`Verify roster shows ${championName}`)
  await expect(
    page.locator('.arena-roster-panel').getByText(championName, { exact: true }).first(),
  ).toBeVisible({
    timeout: 60_000,
  })
}

export async function clickReady(page: Page, log: ReturnType<typeof createBotLogger>) {
  log.step('Wait for Supabase connection')
  await expect(page.getByText('Connected', { exact: true })).toBeVisible({ timeout: 90_000 })

  log.step('Click Ready for Round')
  const ready = readyButton(page)
  await ready.waitFor({ state: 'visible' })
  const label = await ready.textContent()
  if (label?.includes('Cancel Ready')) {
    log.info('Already ready')
    return
  }
  await expect(ready).toBeEnabled({ timeout: 60_000 })
  await ready.click()
  await expect(ready).toHaveText(/Cancel Ready/i, { timeout: 30_000 })
}

export async function assertNoBlockingLobbyError(
  page: Page,
  log: ReturnType<typeof createBotLogger>,
) {
  const errorLine = page.locator('.online-lobby-error')
  if (await errorLine.isVisible().catch(() => false)) {
    const msg = ((await errorLine.textContent()) ?? 'unknown lobby error').trim()
    log.warn(`Lobby error visible: ${msg}`)
    throw new Error(
      `${msg} — apply Supabase migrations (at least supabase/migrations/023_sudden_death_arena.sql) on the deployed project.`,
    )
  }
}

export async function startRoundIfHost(page: Page, log: ReturnType<typeof createBotLogger>) {
  await startRoundWhenHostReady([{ page, log }])
}

/** Poll until the lobby host can click Start Round (handles Supabase ready sync). */
export async function startRoundWhenHostReady(
  bots: Array<{ page: Page; log: ReturnType<typeof createBotLogger> }>,
): Promise<void> {
  const deadline = Date.now() + 90_000

  while (Date.now() < deadline) {
    for (const { page, log } of bots) {
      await assertNoBlockingLobbyError(page, log)

      const start = startMatchButton(page)
      if (!(await start.isVisible().catch(() => false))) {
        continue
      }

      if (!(await page.getByText(/\b2 ready\b/i).isVisible().catch(() => false))) {
        continue
      }

      if (!(await start.isEnabled().catch(() => false))) {
        continue
      }

      log.step('Wait until at least 2 players are ready')
      log.step('Host starts round')
      await start.click()
      await page.waitForTimeout(1500)
      await assertNoBlockingLobbyError(page, log)
      return
    }

    await bots[0].page.waitForTimeout(400)
  }

  throw new Error('Timed out waiting for host to start round (Start Round visible and enabled).')
}

export async function waitForMatchRoom(page: Page, log: ReturnType<typeof createBotLogger>) {
  log.step('Wait for match assignment screen')
  await expect(matchAssignmentScreen(page)).toBeVisible({ timeout: 120_000 })

  if (await matchRoomScreen(page).isVisible().catch(() => false)) {
    await waitForMatchPairingReady(page, log)
  }
}

/** After match-room screen: wait until pairing/load finishes (intro, combat, or both connected). */
async function waitForMatchPairingReady(
  page: Page,
  log: ReturnType<typeof createBotLogger>,
) {
  if (await matchIntroScreen(page).isVisible().catch(() => false)) {
    log.info('Match intro already visible')
    return
  }
  if (await pvpCombatScreen(page).isVisible().catch(() => false)) {
    log.info('PvP combat already visible')
    return
  }
  if (await beginCombatButton(page).isVisible().catch(() => false)) {
    log.info('Begin combat already visible')
    return
  }

  log.step('Wait for both players to connect (leave connecting state)')
  const connectingTagline = page.locator('.match-room-screen__tagline')

  await expect(
    page
      .getByText('Both players connected — preparing scouting report', { exact: false })
      .or(matchIntroScreen(page))
      .or(pvpCombatScreen(page))
      .or(beginCombatButton(page))
      .first(),
  ).toBeVisible({ timeout: 90_000 })

  await expect(connectingTagline).toBeHidden({ timeout: 90_000 }).catch(() => {
    log.info('Connecting tagline still visible; continuing if intro/combat appeared')
  })
}

export async function beginCombatIfNeeded(page: Page, log: ReturnType<typeof createBotLogger>) {
  const begin = beginCombatButton(page)
  if (await begin.isVisible().catch(() => false)) {
    log.step('Acknowledge match introduction')
    await begin.click()
  }
}

function isAttackCardDescription(text: string): boolean {
  const lower = text.toLowerCase()
  if (lower.includes('gain') && lower.includes('block') && !lower.includes('deal')) {
    return false
  }
  return lower.includes('deal') && lower.includes('damage')
}

function isGuardCardDescription(text: string): boolean {
  const lower = text.toLowerCase()
  return lower.includes('gain') && lower.includes('block')
}

async function playBestCard(page: Page, log: ReturnType<typeof createBotLogger>): Promise<boolean> {
  const cards = playableCardButtons(page)
  const count = await cards.count()
  if (count === 0) return false

  let attackIndex = -1
  let guardIndex = -1

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i)
    const combined =
      (await card.textContent()) ??
      `${(await card.locator('.card-button__name').textContent()) ?? ''} ${(await card.locator('.card-button__desc').textContent()) ?? ''}`
    if (attackIndex < 0 && isAttackCardDescription(combined)) {
      attackIndex = i
    }
    if (guardIndex < 0 && isGuardCardDescription(combined)) {
      guardIndex = i
    }
  }

  const pick = attackIndex >= 0 ? attackIndex : guardIndex >= 0 ? guardIndex : 0
  const picked = cards.nth(pick)
  const pickedName = await picked.locator('.card-button__name').textContent()
  log.step(`Play card: ${pickedName?.trim() ?? 'unknown'}`)
  await picked.click()
  await page.waitForTimeout(400)
  return true
}

async function isMyTurn(page: Page): Promise<boolean> {
  return page.locator('.pvp-turn-banner--yours').isVisible().catch(() => false)
}

async function shouldExitCombat(page: Page, mode: CombatExitMode): Promise<boolean> {
  if (mode === 'series-complete' && (await isSeriesCompleteScreen(page))) {
    return true
  }
  if (mode === 'first-post-match' || mode === 'game-complete') {
    if (await isFirstPostMatchScreen(page)) return true
  }
  if (mode === 'first-post-match' && (await isSeriesCompleteScreen(page))) {
    return true
  }
  return false
}

export async function runCombatBot(
  page: Page,
  log: ReturnType<typeof createBotLogger>,
  options: {
    mode?: CombatExitMode
    timeoutMs?: number
  } = {},
) {
  const mode = options.mode ?? 'first-post-match'
  const timeoutMs = options.timeoutMs ?? 45_000

  log.step(`Enter combat loop (${mode})`)
  await beginCombatIfNeeded(page, log)

  const deadline = Date.now() + timeoutMs
  let turnActions = 0

  while (Date.now() < deadline) {
    if (await shouldExitCombat(page, mode)) {
      log.info('Combat phase complete for this bot')
      return
    }

    if (await isMyTurn(page)) {
      turnActions += 1
      log.step(`Turn ${turnActions} — my turn`)

      let played = true
      while (played && (await isMyTurn(page)) && !(await shouldExitCombat(page, mode))) {
        played = await playBestCard(page, log)
        if (!played) break
      }

      if (await isMyTurn(page) && !(await shouldExitCombat(page, mode))) {
        log.step('End turn')
        const endTurn = endTurnButton(page)
        await endTurn.waitFor({ state: 'visible' })
        if (await endTurn.isEnabled()) {
          await endTurn.click()
        }
      }

      await page.waitForTimeout(800)
      continue
    }

    await page.waitForTimeout(500)
  }

  throw new Error(`Combat timed out after ${timeoutMs / 1000}s (${mode})`)
}

export async function runFullBotFlow(page: Page, config: BotConfig, lobbyCode: string) {
  const log = createBotLogger(config.name)

  if (config.role === 'host') {
    await joinLobbyAsHost(page, lobbyCode, log)
  } else {
    await joinLobbyAsGuest(page, log)
  }

  await selectClassAndConfirm(page, config.classId, log)
  await waitForLobby(page, lobbyCode, log)
}
