import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const ADMIN_PASSWORD = 'Luke-Skywalker001'
const OUT = './screenshots'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(`✓ ${name}.png`)
}

// Login once and capture cookies
async function getAdminCookies() {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/admin/login`)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin')
  const cookies = await ctx.cookies()
  await ctx.close()
  return cookies
}

const adminCookies = await getAdminCookies()

async function mobileCtx(withAdmin = false) {
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
  })
  if (withAdmin) await ctx.addCookies(adminCookies)
  return ctx
}

async function desktopCtx(withAdmin = false) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  })
  if (withAdmin) await ctx.addCookies(adminCookies)
  return ctx
}

// 1. Admin login page
{
  const ctx = await mobileCtx()
  const p = await ctx.newPage()
  await p.goto(`${BASE}/admin/login`)
  await p.waitForLoadState('networkidle')
  await shot(p, '02-admin-login')
  await ctx.close()
}

// 2. Admin dashboard
{
  const ctx = await mobileCtx(true)
  const p = await ctx.newPage()
  await p.goto(`${BASE}/admin`)
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(2000)
  await shot(p, '03-admin-dashboard')
  await ctx.close()
}

// 3. Admin repertoire
{
  const ctx = await mobileCtx(true)
  const p = await ctx.newPage()
  await p.goto(`${BASE}/admin/songs`)
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(1500)
  await shot(p, '04-admin-repertoire')
  await ctx.close()
}

// 4. Admin stats
{
  const ctx = await mobileCtx(true)
  const p = await ctx.newPage()
  await p.goto(`${BASE}/admin/stats`)
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(1500)
  await shot(p, '05-admin-stats')
  await ctx.close()
}

// 5. Admin suggestions
{
  const ctx = await mobileCtx(true)
  const p = await ctx.newPage()
  await p.goto(`${BASE}/admin/suggestions`)
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(1000)
  await shot(p, '06-admin-suggestions')
  await ctx.close()
}

// 6. Client — welcome modal + setlist
{
  const ctx = await mobileCtx()
  const p = await ctx.newPage()
  await p.goto(BASE)
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(2500)

  const welcomeBtn = p.locator('text=¡Empezar a votar!')
  if (await welcomeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await shot(p, '07-client-welcome-modal')
    await welcomeBtn.click()
    await p.waitForTimeout(800)
  }

  await shot(p, '08-client-setlist')

  // Tip jar
  const tipBtn = p.locator('button', { hasText: 'Propina' })
  if (await tipBtn.isVisible().catch(() => false)) {
    await tipBtn.click()
    await p.waitForTimeout(500)
    await shot(p, '09-client-tipjar')
    const closeBtn = p.locator('button', { hasText: 'Cerrar' })
    if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click()
  }

  // Suggestion box
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await p.waitForTimeout(800)
  await shot(p, '10-client-suggestions')

  await ctx.close()
}

// 7. Client — no event (fresh context, only if no active event)
{
  const ctx = await mobileCtx()
  const p = await ctx.newPage()
  await p.goto(BASE)
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(1500)
  await shot(p, '01-client-home')
  await ctx.close()
}

// 8. Admin desktop
{
  const ctx = await desktopCtx(true)
  const p = await ctx.newPage()
  await p.goto(`${BASE}/admin`)
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(2000)
  await shot(p, '11-admin-desktop')
  await ctx.close()
}

await browser.close()
console.log(`\n✅ Screenshots saved to ./${OUT}/`)
