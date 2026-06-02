import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createBotLogger } from './botLog'
import { onlineLobbyScreen } from './selectors'

/** Click through post-match rewards and shop until back in the online lobby. */
export async function advancePostMatchToLobby(
  page: Page,
  log: ReturnType<typeof createBotLogger>,
): Promise<void> {
  log.step('Post-match: open reward selection')
  await expect(page.getByRole('heading', { name: 'Post-Match' })).toBeVisible({
    timeout: 60_000,
  })

  const chooseReward = page.getByRole('button', { name: /Choose your reward/i })
  const chooseEvolution = page.getByRole('button', { name: /Choose your evolution/i })
  if (await chooseReward.isVisible().catch(() => false)) {
    await chooseReward.click()
  } else if (await chooseEvolution.isVisible().catch(() => false)) {
    await chooseEvolution.click()
    const pickEvolution = page.locator('.class-picker-card').first()
    if (await pickEvolution.isVisible().catch(() => false)) {
      await pickEvolution.click()
      await page.getByRole('button', { name: /as /i }).click()
    }
  }

  log.step('Post-match: pick first reward')
  await expect(page.getByRole('heading', { name: 'Reward selection' })).toBeVisible({
    timeout: 45_000,
  })
  const rewardGrid = page.locator('.post-match-rewards__grid')
  const rewardButton = rewardGrid
    .locator('button.post-match-reward-card')
    .or(rewardGrid.locator('.post-match-reward-option [data-testid="card-button"]'))
    .or(rewardGrid.locator('.post-match-reward-option .card-button'))
    .first()
  await expect(rewardButton).toBeVisible({ timeout: 45_000 })
  await rewardButton.click()

  log.step('Post-match: continue to shop')
  await page.getByRole('button', { name: /Continue to Shop/i }).click({ timeout: 60_000 })

  log.step('Shop or lobby after post-match')
  const continueArena = page.getByRole('button', { name: /Continue to Arena/i })
  const lobby = onlineLobbyScreen(page)
  const shopHeading = page.getByRole('heading', { name: /Shop —/i })

  const deadline = Date.now() + 90_000
  let handled = false
  while (Date.now() < deadline && !handled) {
    if (await lobby.isVisible().catch(() => false)) {
      log.info('Already in arena lobby (Final Duel skips shop between games)')
      handled = true
      break
    }
    if (await continueArena.isVisible().catch(() => false)) {
      log.step('Shop: continue to arena lobby')
      await continueArena.click()
      handled = true
      break
    }
    if (await shopHeading.isVisible().catch(() => false)) {
      // Shop loaded; button may appear after offers load.
      await page.waitForTimeout(400)
      continue
    }
    await page.waitForTimeout(400)
  }

  if (!handled) {
    throw new Error('Timed out waiting for shop or arena lobby after post-match.')
  }

  log.step('Wait for online lobby after post-match')
  await expect(onlineLobbyScreen(page)).toBeVisible({ timeout: 90_000 })
}
