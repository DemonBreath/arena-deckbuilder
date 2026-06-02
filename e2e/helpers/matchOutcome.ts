import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** First game ended — post-match reward screen (not necessarily series over). */
export async function isFirstPostMatchScreen(page: Page): Promise<boolean> {
  return page.getByRole('heading', { name: 'Post-Match' }).isVisible().catch(() => false)
}

/** Final Duel series decided (first to 2 game wins) or arena champion crowned. */
export async function isSeriesCompleteScreen(page: Page): Promise<boolean> {
  if (
    await page
      .getByText(/Arena Champion — victorious in the Final Duel/i)
      .isVisible()
      .catch(() => false)
  ) {
    return true
  }

  const seriesLabel = page.locator('.arena-phase-banner__series')
  const text = ((await seriesLabel.textContent().catch(() => '')) ?? '').trim()
  const match = text.match(/Series\s+(\d+)\s*[–-]\s*(\d+)/i)
  if (match) {
    const left = Number.parseInt(match[1], 10)
    const right = Number.parseInt(match[2], 10)
    if (left >= 2 || right >= 2) return true
  }

  if (await page.getByText(/wins the series/i).first().isVisible().catch(() => false)) {
    return true
  }

  return false
}

/** Fail fast if the app shell is missing (black screen / crash). */
export async function assertPageHealthy(page: Page, botName: string): Promise<void> {
  await expect(page.locator('.app')).toBeVisible({ timeout: 10_000 })
  const text = ((await page.locator('body').textContent()) ?? '').trim()
  if (text.length < 20) {
    throw new Error(`${botName}: page appears blank or crashed (body text too short).`)
  }
}
