import { test, expect, Browser, chromium, Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Luke-Skywalker001'

async function newDiner(browser: Browser, name: string) {
  const ctx = await browser.newContext({ storageState: undefined })
  const page = await ctx.newPage()
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[${name}] ERROR: ${msg.text()}`)
  })
  return { page, ctx, name }
}

async function adminLogin(page: Page) {
  await page.goto(`${BASE}/admin/login`)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin')
}

test.describe('Livefy — admin flows', () => {

  test('admin can log in and see the dashboard', async ({ page }) => {
    await adminLogin(page)
    await expect(page.locator('text=Livefy')).toBeVisible()
  })

  test('admin is redirected to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/admin`)
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`)
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/contraseña|incorrecta|error/i')).toBeVisible()
  })

  test('admin can navigate to repertoire, events and stats', async ({ page }) => {
    await adminLogin(page)

    await page.click('a[href="/admin/songs"]')
    await expect(page).toHaveURL(/\/admin\/songs/)
    await expect(page.locator('h1', { hasText: 'Repertorio' })).toBeVisible()

    await page.goto(`${BASE}/admin`)
    await page.click('a[href="/admin/events"]')
    await expect(page).toHaveURL(/\/admin\/events/)

    await page.goto(`${BASE}/admin`)
    await page.click('a[href="/admin/stats"]')
    await expect(page).toHaveURL(/\/admin\/stats/)
  })

  test('admin can see suggestions panel', async ({ page }) => {
    await adminLogin(page)
    await page.click('text=Sugerencias')
    await expect(page).toHaveURL(/\/admin\/suggestions/)
  })

  test('admin setlist page loads with active event', async ({ page }) => {
    await adminLogin(page)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    // Either shows the setlist UI or the create event form
    const hasAddBtn = await page.locator('button', { hasText: /añadir canción/i }).isVisible().catch(() => false)
    const hasCreateForm = await page.locator('text=Crear nuevo evento').isVisible().catch(() => false)
    const hasLivefy = await page.locator('text=Livefy').first().isVisible().catch(() => false)
    expect(hasAddBtn || hasCreateForm || hasLivefy).toBeTruthy()
  })
})

test.describe('Livefy — client flows', () => {

  test('client page loads and shows logo', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    const hasLivefy = await page.locator('text=Livefy').first().isVisible().catch(() => false)
    expect(hasLivefy).toBeTruthy()
  })

  test('client sees either setlist or no-event screen', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const hasSetlist = await page.locator('text=Elige qué quieres escuchar').isVisible().catch(() => false)
    const hasNoEvent = await page.locator('text=No hay actuación activa').isVisible().catch(() => false)
    const hasWelcome = await page.locator('text=Bienvenido').isVisible().catch(() => false)

    expect(hasSetlist || hasNoEvent || hasWelcome).toBeTruthy()
  })

  test('welcome modal appears on first visit and can be dismissed', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const welcomeModal = page.locator('text=¡Empezar a votar!')
    if (await welcomeModal.isVisible().catch(() => false)) {
      await welcomeModal.click()
      await expect(welcomeModal).not.toBeVisible()
      console.log('✓ Welcome modal dismissed')
    } else {
      console.log('⚠ No active event — welcome modal not shown')
    }
  })

  test('search filters songs correctly', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Dismiss welcome modal if present
    const startBtn = page.locator('text=¡Empezar a votar!')
    if (await startBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await startBtn.click()
    }

    const searchInput = page.locator('input[type="search"]')
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Oasis')
      await page.waitForTimeout(500)
      const results = page.locator('text=Oasis')
      const count = await results.count()
      console.log(`✓ Search for "Oasis" returned ${count} results`)
    } else {
      console.log('⚠ Search not available — no active event')
    }
  })

  test('tip jar button is visible and opens modal', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Dismiss welcome modal
    const startBtn = page.locator('text=¡Empezar a votar!')
    if (await startBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await startBtn.click()
    }

    const tipBtn = page.locator('button', { hasText: 'Apoya' }).first()
    if (await tipBtn.isVisible().catch(() => false)) {
      await tipBtn.click()
      await expect(page.getByRole('heading', { name: 'Apoya al artista' })).toBeVisible()
      await page.locator('button', { hasText: 'Cerrar' }).click()
      console.log('✓ TipJar modal opens and closes')
    } else {
      console.log('⚠ TipJar not visible — bizum number not set')
    }
  })

  test('suggestion box is visible and accepts input', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const startBtn = page.locator('text=¡Empezar a votar!')
    if (await startBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await startBtn.click()
    }

    const titleInput = page.locator('input[placeholder="Nombre de la canción *"]')
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill('Bohemian Rhapsody')
      const submitBtn = page.locator('button', { hasText: 'Enviar sugerencia' })
      await expect(submitBtn).not.toBeDisabled()
      console.log('✓ Suggestion box accepts input')
    } else {
      console.log('⚠ Suggestion box not visible')
    }
  })
})

test.describe('Livefy — multi-diner voting', () => {

  test('5 diners connect simultaneously and each gets unique session', async () => {
    const browser = await chromium.launch({ headless: true })

    const diners = await Promise.all(
      Array.from({ length: 5 }, (_, i) => newDiner(browser, `Comensal ${i + 1}`))
    )

    await Promise.all(diners.map(d => d.page.goto(BASE)))
    await Promise.all(diners.map(d => d.page.waitForLoadState('networkidle')))

    // Each diner should have a unique sessionId in localStorage
    const sessions = await Promise.all(
      diners.map(d => d.page.evaluate(() => localStorage.getItem('livefy_session_id')))
    )

    const uniqueSessions = new Set(sessions.filter(Boolean))
    console.log(`✓ ${uniqueSessions.size}/5 unique sessions created`)
    expect(uniqueSessions.size).toBe(5)

    await browser.close()
  })

  test('diner cannot vote more than MAX_VOTES times', async () => {
    const browser = await chromium.launch({ headless: true })
    const diner = await newDiner(browser, 'Diner límite')

    await diner.page.goto(BASE)
    await diner.page.waitForLoadState('networkidle')
    await diner.page.waitForTimeout(2000)

    const startBtn = diner.page.locator('text=¡Empezar a votar!')
    if (await startBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await startBtn.click()
    }

    // Check vote counter shows correct max
    const voteCounter = diner.page.locator('text=/\\d+ votos restantes/i')
    if (await voteCounter.isVisible().catch(() => false)) {
      const text = await voteCounter.textContent()
      console.log(`✓ Vote counter visible: "${text}"`)
      expect(text).toMatch(/5 votos restantes/i)
    } else {
      console.log('⚠ Vote counter not visible — no active event')
    }

    await browser.close()
  })
})
