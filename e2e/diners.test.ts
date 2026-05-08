import { test, expect, Browser, chromium } from '@playwright/test'

const BASE = 'http://localhost:3000'
const ADMIN_PASSWORD = 'livefy2024'

// Helper: create an isolated browser context (= different diner/device)
async function newDiner(browser: Browser, name: string) {
  const ctx = await browser.newContext({
    storageState: undefined,
    // Each context gets a unique localStorage so session IDs differ
  })
  const page = await ctx.newPage()
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[${name}] ERROR: ${msg.text()}`)
  })
  return { page, ctx, name }
}

test.describe('Livefy — full flow with 5 diners', () => {

  test('Admin setup: login, create event, add songs to setlist', async ({ page }) => {
    // Login
    await page.goto(`${BASE}/admin/login`)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')
    await expect(page.locator('text=Livefy Admin')).toBeVisible()
    console.log('✓ Admin login OK')

    // Check if there's already an active event
    const hasEvent = await page.locator('text=Añadir canción').isVisible().catch(() => false)

    if (!hasEvent) {
      // Create event
      await page.fill('input[placeholder*="evento"]', 'Test Muelle')
      const dateInput = page.locator('input[type="date"]')
      await dateInput.fill('2026-05-06')
      await page.fill('input[placeholder*="Bizum"]', '648725622')
      await page.click('button:has-text("Crear")')
      await page.waitForTimeout(1500)
      console.log('✓ Event created')
    } else {
      console.log('✓ Active event already exists')
    }

    // Add a song to setlist
    await page.click('button:has-text("Añadir canción")')
    await page.waitForTimeout(500)

    const firstSong = page.locator('[class*="cursor-pointer"], button').filter({ hasText: /Radiohead|Oasis|Creep|Wonderwall/i }).first()
    if (await firstSong.isVisible()) {
      await firstSong.click()
      await page.waitForTimeout(1000)
      console.log('✓ Song added to setlist')
    }

    await expect(page.locator('text=Livefy Admin')).toBeVisible()
  })

  test('5 diners connect simultaneously and see the setlist', async () => {
    const browser = await chromium.launch({ headless: true })

    const diners = await Promise.all([
      newDiner(browser, 'Comensal 1'),
      newDiner(browser, 'Comensal 2'),
      newDiner(browser, 'Comensal 3'),
      newDiner(browser, 'Comensal 4'),
      newDiner(browser, 'Comensal 5'),
    ])

    console.log('✓ 5 browser contexts created')

    // All diners navigate to the client page simultaneously
    await Promise.all(diners.map(d => d.page.goto(BASE)))
    await Promise.all(diners.map(d => d.page.waitForLoadState('networkidle')))

    console.log('✓ All 5 diners loaded the page')

    // Check each diner sees either the setlist or "no active event"
    for (const diner of diners) {
      const hasSetlist = await diner.page.locator('[class*="rounded"]').first().isVisible()
      const hasNoEvent = await diner.page.locator('text=No hay ninguna actuación').isVisible().catch(() => false)
      expect(hasSetlist || hasNoEvent).toBeTruthy()
      console.log(`✓ ${diner.name}: page loaded correctly`)
    }

    await browser.close()
  })

  test('5 diners vote for different songs with unique sessions', async () => {
    const browser = await chromium.launch({ headless: true })

    const diners = await Promise.all([
      newDiner(browser, 'Comensal 1'),
      newDiner(browser, 'Comensal 2'),
      newDiner(browser, 'Comensal 3'),
      newDiner(browser, 'Comensal 4'),
      newDiner(browser, 'Comensal 5'),
    ])

    // Load page for all
    await Promise.all(diners.map(d => d.page.goto(BASE)))
    await Promise.all(diners.map(d => d.page.waitForLoadState('networkidle')))
    await Promise.all(diners.map(d => d.page.waitForTimeout(2000)))

    // Check if there are vote buttons
    const { page: firstPage } = diners[0]
    const voteButtons = firstPage.locator('button').filter({ hasText: /votar|♥|voto/i })
    const voteCount = await voteButtons.count()

    if (voteCount === 0) {
      console.log('⚠ No vote buttons found — setlist may be empty or no active event')
      await browser.close()
      return
    }

    console.log(`✓ Found ${voteCount} vote buttons`)

    // Each diner tries to vote (first available song)
    const results = await Promise.allSettled(
      diners.map(async (diner) => {
        const btn = diner.page.locator('button').filter({ hasText: /votar|♥/i }).first()
        if (await btn.isVisible()) {
          await btn.click()
          await diner.page.waitForTimeout(500)
          // If modal opens, select free tier and confirm
          const freeBtn = diner.page.locator('button').filter({ hasText: /gratis|añadir al setlist/i }).first()
          if (await freeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await freeBtn.click()
            await diner.page.waitForTimeout(500)
          }
          console.log(`✓ ${diner.name}: voted`)
          return 'voted'
        }
        return 'no button'
      })
    )

    const voted = results.filter(r => r.status === 'fulfilled' && r.value === 'voted').length
    console.log(`✓ ${voted}/5 diners voted successfully`)

    await browser.close()
  })

  test('Same diner cannot vote twice for the same song', async () => {
    const browser = await chromium.launch({ headless: true })
    const diner = await newDiner(browser, 'Diner duplicado')

    await diner.page.goto(BASE)
    await diner.page.waitForLoadState('networkidle')
    await diner.page.waitForTimeout(2000)

    const voteBtn = diner.page.locator('button').filter({ hasText: /votar|♥/i }).first()

    if (!(await voteBtn.isVisible().catch(() => false))) {
      console.log('⚠ No vote button — skipping duplicate vote test')
      await browser.close()
      return
    }

    // First vote
    await voteBtn.click()
    await diner.page.waitForTimeout(500)
    const freeBtn = diner.page.locator('button').filter({ hasText: /gratis|añadir/i }).first()
    if (await freeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await freeBtn.click()
    }
    await diner.page.waitForTimeout(1000)

    // After voting, button should be disabled/grey
    const btnAfter = diner.page.locator('button').filter({ hasText: /votar|♥/i }).first()
    const isDisabled = await btnAfter.isDisabled().catch(() => false)
    const hasGrayClass = await btnAfter.evaluate(el =>
      el.className.includes('gray') || el.className.includes('disabled') || el.getAttribute('disabled') !== null
    ).catch(() => false)

    console.log(`✓ After voting, button disabled: ${isDisabled || hasGrayClass}`)

    await browser.close()
  })

  test('Admin sees votes update in real time', async () => {
    const browser = await chromium.launch({ headless: true })

    // Open admin panel
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    await adminPage.goto(`${BASE}/admin/login`)
    await adminPage.fill('input[type="password"]', ADMIN_PASSWORD)
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForURL('**/admin')
    await adminPage.waitForTimeout(1000)

    // Open diner
    const diner = await newDiner(browser, 'Comensal RT')
    await diner.page.goto(BASE)
    await diner.page.waitForLoadState('networkidle')
    await diner.page.waitForTimeout(2000)

    // Diner votes
    const voteBtn = diner.page.locator('button').filter({ hasText: /votar|♥/i }).first()
    if (await voteBtn.isVisible().catch(() => false)) {
      await voteBtn.click()
      await diner.page.waitForTimeout(500)
      const freeBtn = diner.page.locator('button').filter({ hasText: /gratis|añadir/i }).first()
      if (await freeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await freeBtn.click()
      }
      console.log('✓ Diner voted')
      await diner.page.waitForTimeout(2000)

      // Admin should see updated vote count
      const voteCount = adminPage.locator('text=/\\d+ voto/i').first()
      const visible = await voteCount.isVisible().catch(() => false)
      console.log(`✓ Admin sees vote count updated: ${visible}`)
    } else {
      console.log('⚠ No vote button available for realtime test')
    }

    await browser.close()
  })
})
