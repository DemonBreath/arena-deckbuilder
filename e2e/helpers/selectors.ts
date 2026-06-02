import type { Locator, Page } from '@playwright/test'

/** Display names for class picker fallbacks when data-testid is not deployed yet. */
const CLASS_DISPLAY_NAMES: Record<string, string> = {
  guardian: 'Guardian',
  berserker: 'Berserker',
}

function classDisplayName(classId: string): string {
  return CLASS_DISPLAY_NAMES[classId] ?? classId
}

/** Prefer data-testid; fall back to accessible labels on older deploys. */
export function championNameInput(page: Page): Locator {
  return page
    .getByTestId('champion-name-input')
    .or(page.getByRole('textbox', { name: 'Champion Name' }))
}

export function lobbyCodeInput(page: Page): Locator {
  return page
    .getByTestId('lobby-code-input')
    .or(page.getByRole('textbox', { name: 'Lobby Code' }))
}

export function joinLobbyButton(page: Page): Locator {
  return page
    .getByTestId('join-lobby-button')
    .or(page.getByRole('button', { name: /Choose Class & Join Lobby/i }))
}

export function classCard(page: Page, classId: string): Locator {
  const name = classDisplayName(classId)
  return page
    .locator(`[data-testid="class-card"][data-class-id="${classId}"]`)
    .or(page.locator('.class-picker-card').filter({ hasText: name }).first())
    .or(page.getByRole('button', { name: new RegExp(`^${name}\\b`) }).first())
}

export function classConfirmButton(page: Page, classId: string): Locator {
  const name = classDisplayName(classId)
  return page
    .getByTestId('class-confirm-button')
    .or(
      page.getByRole('button', {
        name: new RegExp(`(Join (Online )?Lobby|Start Solo Run|Join Lobby).*as ${name}`, 'i'),
      }),
    )
}

export function onlineLobbyScreen(page: Page): Locator {
  return page
    .getByTestId('online-lobby-screen')
    .or(page.locator('.online-lobby-screen'))
}

export function readyButton(page: Page): Locator {
  return page
    .getByTestId('ready-button')
    .or(page.getByRole('button', { name: /Ready for Round|Cancel Ready/i }))
}

export function startMatchButton(page: Page): Locator {
  return page
    .getByTestId('start-match-button')
    .or(page.getByRole('button', { name: 'Start Round' }))
}

/** Single match-room root (avoids matching nested headings/taglines). */
export function matchRoomScreen(page: Page): Locator {
  return page
    .getByTestId('match-room-screen')
    .or(page.locator('section.match-room-screen').first())
}

export function matchIntroScreen(page: Page): Locator {
  return page
    .getByTestId('match-intro-screen')
    .or(page.locator('section.match-intro-screen').first())
}

export function pvpCombatScreen(page: Page): Locator {
  return page.locator('.pvp-battle-view').first()
}

/** First visible post-pairing screen: match room, intro, or combat. */
export function matchAssignmentScreen(page: Page): Locator {
  return page
    .locator(
      [
        '[data-testid="match-room-screen"]',
        '[data-testid="match-intro-screen"]',
        'section.match-room-screen',
        'section.match-intro-screen',
        '.pvp-battle-view',
      ].join(', '),
    )
    .first()
}

export function beginCombatButton(page: Page): Locator {
  return page
    .getByTestId('begin-combat-button')
    .or(page.getByRole('button', { name: /Begin combat/i }))
}

export function playableCardButtons(page: Page): Locator {
  return page
    .locator('.hand__cards [data-testid="card-button"]:not([disabled])')
    .or(page.locator('.hand__cards .card-button:not([disabled])'))
    .or(page.locator('.hand__cards button:not([disabled])'))
}

export function endTurnButton(page: Page): Locator {
  return page
    .getByTestId('end-turn-button')
    .or(page.getByRole('button', { name: 'End Turn' }))
}
