// app/api/cron/screenshot-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export const dynamic = 'force-dynamic'
export const maxDuration = 300
export const runtime = 'nodejs'

// ใช้แทน page.waitForTimeout (Puppeteer v22 ไม่มีแล้ว)
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const targetUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (!targetUrl) throw new Error('NEXT_PUBLIC_BASE_URL is not set')

    chromium.setHeadlessMode = true
    chromium.setGraphicsMode = false

    const isVercel = !!process.env.VERCEL
    const executablePath = isVercel
      ? await chromium.executablePath()
      : process.env.PUPPETEER_EXECUTABLE_PATH || undefined

    if (isVercel && !executablePath) {
      throw new Error('Could not resolve chromium executablePath on Vercel')
    }

    console.log('[CRON] Launching browser...')
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--ignore-certificate-errors'],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    page.setDefaultTimeout(60_000)

    // 1) ไปหน้าล็อกอิน
    console.log(`[CRON] goto: ${targetUrl}`)
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60_000 })

    // 2) กรอกข้อมูลล็อกอิน
    const loginEmail = process.env.REPORT_LOGIN_EMAIL || 'bst12546@gmail.com'
    const loginPassword = process.env.REPORT_LOGIN_PASSWORD || '12345678'

    const emailSel = 'input[type="email"], input[name="email"], #email'
    const passSel  = 'input[type="password"], input[name="password"], #password'

    console.log('[CRON] Waiting for login form...')
    await page.waitForSelector(emailSel, { timeout: 30_000 })
    await page.waitForSelector(passSel,  { timeout: 30_000 })

    await page.click(emailSel, { clickCount: 3 })
    await page.type(emailSel, loginEmail, { delay: 20 })
    await page.click(passSel, { clickCount: 3 })
    await page.type(passSel, loginPassword, { delay: 20 })

    // 3) คลิกปุ่ม Sign in (ไม่มี $x แล้ว -> ใช้ $$eval + innerText)
    console.log('[CRON] Clicking Sign in...')
    const clicked = await (async () => {
      const submitBtn = await page.$('button[type="submit"], input[type="submit"]')
      if (submitBtn) { await submitBtn.click(); return true }

      const success = await page.$$eval('button, input[type="button"]', (nodes) => {
        const match = (t: string) =>
          /sign\s*in|เข้าสู่ระบบ|ล็อกอิน|login/i.test(t.replace(/\s+/g, ' ').trim())
        const btn = nodes.find((n: Element) => {
          const text =
            (n as HTMLButtonElement).innerText ||
            (n as HTMLInputElement).value ||
            n.getAttribute('aria-label') ||
            ''
          return match(text)
        }) as HTMLElement | undefined
        if (btn) { btn.click(); return true }
        return false
      })
      if (success) return true

      await Promise.resolve()
      return false
    })()

    if (!clicked) {
      await page.focus(passSel)
      await page.keyboard.press('Enter')
    }

    // 4) รอ redirect/โหลดข้อมูลเบื้องต้น (สูงสุด 60s)
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }),
      page.waitForSelector('#dashboard-ready, [data-dashboard-ready="true"], .dashboard, .chart, canvas', { timeout: 60_000 }),
    ]).catch(() => {
      console.warn('[CRON] No explicit dashboard signal after login; continuing.')
    })

    // ⭐ 4.1) บังคับเข้า "dot view" เสมอหลังล็อกอิน
    const homeDotUrl = new URL('/home?view=dot', targetUrl).toString()
    console.log(`[CRON] Forcing dot view at: ${homeDotUrl}`)
    await page.goto(homeDotUrl, { waitUntil: 'networkidle2', timeout: 60_000 }).catch(() => {
      console.warn('[CRON] Could not goto /home?view=dot, will try in-page fallbacks.')
    })

    // ⭐ 4.2) ตั้งค่า view=dot แบบกันเหนียว (รองรับกรณีอิง localStorage / window.setViewMode)
    // - รอให้โค้ดฝั่ง client นิยาม setViewMode ถ้ามี
    await page.waitForFunction('document.body != null', { timeout: 10_000 }).catch(() => {})
    await page.evaluate(() => {
      try { localStorage.setItem('displayMode', 'dot') } catch {}
    })
    await page.waitForFunction('typeof window.setViewMode === "function"', { timeout: 10_000 }).then(
      async () => { await page.evaluate(() => (window as any).setViewMode?.('dot')) }
    ).catch(() => {
      // ถ้าไม่มี setViewMode ก็พึ่งพา query param + data-attr จากหน้า client
    })

    // ⭐ 4.3) รอให้หน้า "พร้อม" และยืนยันว่า data-view เป็น "dot"
    console.log('[CRON] Waiting up to 120s for dot view & data to settle...')
    const start = Date.now()
    const cap = 120_000
    while (Date.now() - start < cap) {
      await delay(5_000)
      const { ready, isDot } = await page.evaluate(() => {
        const explicitReady =
          document.querySelector('#dashboard-ready') ||
          document.querySelector('[data-dashboard-ready="true"]')
        const hasVisuals =
          document.querySelectorAll('.chart, canvas, [role="table"], table').length > 0
        const dataView = document.body?.getAttribute('data-view')
        return { ready: !!explicitReady || hasVisuals, isDot: dataView === 'dot' }
      })
      if (ready && isDot) break
    }

    await delay(1500)

    // 5) แคปหน้าจอ
    console.log('[CRON] Taking screenshot...')
    const screenshot = (await page.screenshot({ type: 'png', fullPage: true })) as Buffer

    await browser.close()
    console.log('[CRON] Screenshot captured.')

    // 6) ส่งอีเมล
    console.log('[CRON] Sending email...')
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const recipients =
      process.env.REPORT_RECIPIENTS?.split(',').map((s) => s.trim()).filter(Boolean) || []
    if (recipients.length === 0) throw new Error('No recipients configured in REPORT_RECIPIENTS')

    const nowTH = new Date().toLocaleString('th-TH')
    const subjectTH = `TBKK-Surazense - รายงานประจำทุก 2 สัปดาห์ ${new Date().toLocaleDateString('th-TH')}`

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: recipients.join(','),
      subject: subjectTH,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">รายงานประจำทุก 2 สัปดาห์</h2>
          <p>สวัสดีครับ,</p>
          <p>นี่คือ screenshot ระบบ TBKK-Surazense ณ วันที่ ${nowTH}</p>
          <p>Screenshot แนบมาพร้อมอีเมลนี้แล้วครับ</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            อีเมลนี้ถูกส่งอัตโนมัติจากระบบ TBKK-Surazense<br>
            หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      `,
      attachments: [
        { filename: `tbkk-report-${Date.now()}.png`, content: screenshot, contentType: 'image/png' },
      ],
    })

    console.log('[CRON] Email sent.')

    return NextResponse.json({
      success: true,
      message: 'Screenshot report sent successfully',
      timestamp: new Date().toISOString(),
      recipients: recipients.length,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
