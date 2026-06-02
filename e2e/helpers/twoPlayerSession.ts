import type { Browser, BrowserContext, Page } from '@playwright/test'
import { PLAYER_A, PLAYER_B, resolveLobbyCode } from '../constants'
import { createBotLogger } from './botLog'
import {
  clickReady,
  expectRosterContains,
  fillChampionName,
  runFullBotFlow,
  startRoundWhenHostReady,
} from './playerBot'

export interface TwoPlayerSession {
  lobbyCode: string
  contextA: BrowserContext
  contextB: BrowserContext
  pageA: Page
  pageB: Page
}

export async function createTwoPlayerSession(browser: Browser): Promise<TwoPlayerSession> {
  const lobbyCode = resolveLobbyCode()
  const sessionIdA = `e2e-bot-a-${Date.now()}`
  const sessionIdB = `e2e-bot-b-${Date.now()}`

  const contextA = await browser.newContext()
  const contextB = await browser.newContext()

  await contextA.addInitScript((id: string) => {
    sessionStorage.setItem('arena-session-id', id)
  }, sessionIdA)
  await contextB.addInitScript((id: string) => {
    sessionStorage.setItem('arena-session-id', id)
  }, sessionIdB)

  const pageA = await contextA.newPage()
  const pageB = await contextB.newPage()

  return { lobbyCode, contextA, contextB, pageA, pageB }
}

/** Join lobby, verify roster, ready both, host starts round. */
export async function runLobbyToRoundStart(
  session: TwoPlayerSession,
  baseURL: string | undefined,
): Promise<void> {
  const logA = createBotLogger(PLAYER_A.name)
  const logB = createBotLogger(PLAYER_B.name)

  logA.info(`Base URL: ${baseURL}`)
  logB.info(`Base URL: ${baseURL}`)
  logA.info(`Lobby code: ${session.lobbyCode}`)
  logB.info(`Lobby code: ${session.lobbyCode}`)

  logA.step('Open home page')
  await session.pageA.goto('/')
  await fillChampionName(session.pageA, PLAYER_A.name, logA)
  await runFullBotFlow(session.pageA, { ...PLAYER_A, role: 'host' }, session.lobbyCode)

  logB.step(`Open invite URL /lobby/${session.lobbyCode}`)
  await session.pageB.goto(`/lobby/${session.lobbyCode}`)
  await fillChampionName(session.pageB, PLAYER_B.name, logB)
  await runFullBotFlow(session.pageB, { ...PLAYER_B, role: 'guest' }, session.lobbyCode)

  await expectRosterContains(session.pageA, PLAYER_B.name, logA)
  await expectRosterContains(session.pageB, PLAYER_A.name, logB)

  await clickReady(session.pageA, logA)
  await clickReady(session.pageB, logB)

  await startRoundWhenHostReady([
    { page: session.pageA, log: logA },
    { page: session.pageB, log: logB },
  ])
}

export async function closeTwoPlayerSession(session: TwoPlayerSession): Promise<void> {
  await session.contextA.close()
  await session.contextB.close()
}
