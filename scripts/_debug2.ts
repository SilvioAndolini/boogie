import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(process.cwd(), '.env.local') })

import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

(async () => {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  })
  const page = await context.newPage()

  // 1. Ir a la home primero
  console.log('1. Navegando a home...')
  await page.goto('https://estei.app', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(3000)

  // 2. Aceptar cookies si aparece
  try {
    const acceptBtn = page.locator('button:has-text("Aceptar")')
    if (await acceptBtn.isVisible({ timeout: 3000 })) {
      console.log('2. Aceptando cookies...')
      await acceptBtn.click()
      await page.waitForTimeout(1000)
    }
  } catch {
    console.log('2. No se encontró banner de cookies')
  }

  // 3. Navegar a la página de búsqueda
  console.log('3. Navegando a búsqueda Caracas...')
  await page.goto('https://estei.app/search?search_text=Caracas&lat=10.4806&lng=-66.9036&zoom=12&guests=1', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })

  // Esperar más tiempo para que carguen los resultados
  console.log('4. Esperando resultados...')
  await page.waitForTimeout(10000)

  // 4. Capturar estado
  await page.screenshot({ path: 'scripts/_debug2.png', fullPage: false })

  const result = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="stay-card"]')
    const allImgs = Array.from(document.querySelectorAll('img'))
      .filter(i => i.src && !i.src.includes('googleapis') && !i.src.includes('data:'))

    const errors: string[] = []
    document.querySelectorAll('[class*="error"], [class*="Error"]').forEach(e => {
      errors.push(e.textContent?.trim() || '')
    })

    const bodyText = document.body?.innerText || ''

    // Buscar si hay algo que parezca una tarjeta de propiedad
    const divs = Array.from(document.querySelectorAll('div'))
    const propertyDivs = divs.filter(d => {
      const text = d.textContent || ''
      return text.includes('$') && text.includes('noche') && d.children.length > 2
    }).slice(0, 5)

    return {
      cardCount: cards.length,
      relevantImgCount: allImgs.length,
      errorElements: errors,
      bodyTextSnippet: bodyText.substring(0, 1000),
      propertyDivCount: propertyDivs.length,
      propertyDivTexts: propertyDivs.map(d => d.textContent?.trim().substring(0, 200)),
    }
  })

  console.log(JSON.stringify(result, null, 2))

  // 5. Verificar peticiones de red
  const logs: string[] = []
  page.on('response', resp => {
    if (resp.url().includes('api') || resp.url().includes('search') || resp.url().includes('stay') || resp.url().includes('property')) {
      logs.push(`${resp.status()} ${resp.url().substring(0, 100)}`)
    }
  })

  // Recargar para capturar network
  console.log('\n5. Recargando para capturar network...')
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(10000)

  console.log('Network requests:')
  logs.forEach(l => console.log('  ', l))

  const finalResult = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="stay-card"]')
    const allImgs = Array.from(document.querySelectorAll('img'))
      .filter(i => i.src && !i.src.includes('googleapis') && !i.src.includes('data:'))
    return { cardCount: cards.length, imgCount: allImgs.length }
  })
  console.log('\nFinal:', JSON.stringify(finalResult))

  await browser.close()
  process.exit(0)
})()
