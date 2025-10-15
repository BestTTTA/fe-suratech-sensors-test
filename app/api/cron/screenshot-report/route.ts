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

    const isVercel = !!process.env.VERCEL
    const executablePath = isVercel
      ? await chromium.executablePath()
      : process.env.PUPPETEER_EXECUTABLE_PATH || undefined

    if (isVercel && !executablePath) {
      throw new Error('Could not resolve chromium executablePath on Vercel')
    }

    console.log('[CRON] Launching browser...')
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--no-zygote',
        '--single-process',
        '--ignore-certificate-errors',
      ],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
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

    // 3) คลิกปุ่ม Sign in
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

    // 4) รอ redirect/โหลดข้อมูล (สูงสุด 60s) แล้วรอต่อให้เสถียร
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }),
      page.waitForSelector('button, h1, .dashboard, [data-dashboard-ready="true"]', { timeout: 60_000 }),
    ]).catch(() => {
      console.warn('[CRON] No explicit signal; will rely on timed wait.')
    })

    console.log('[CRON] Logged in, waiting for page to load...')
    await delay(5000) // รอให้หน้าโหลดเสร็จ

    // 5) คลิกปุ่ม Dot View
    console.log('[CRON] Looking for Dot View button...')
    const dotViewClicked = await page.evaluate(() => {
      // วิธีที่ 1: หาจาก aria-label หรือ title
      let dotButton = Array.from(document.querySelectorAll('button')).find(btn => {
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase()
        const title = (btn.getAttribute('title') || '').toLowerCase()
        return ariaLabel.includes('dot') || title.includes('dot')
      })

      // วิธีที่ 2: หาจากไอคอนที่มีหลาย circles (Dot View icon มักมี 9 circles)
      if (!dotButton) {
        const buttons = Array.from(document.querySelectorAll('button'))
        dotButton = buttons.find(btn => {
          const svg = btn.querySelector('svg')
          if (!svg) return false
          const circles = svg.querySelectorAll('circle')
          // Dot view icon มีหลาย circles (มากกว่า 3)
          return circles.length >= 4
        })
      }

      // วิธีที่ 3: หาตามตำแหน่ง - หาปุ่มที่อยู่ในกลุ่มเดียวกับ Register Device
      if (!dotButton) {
        // หา section ที่มีปุ่ม Register Device และ View Dashboard
        const sections = Array.from(document.querySelectorAll('div'))
        for (const section of sections) {
          const text = section.textContent || ''
          if (text.includes('Register Device') && text.includes('View Dashboard')) {
            // หาปุ่มทั้งหมดใน section นี้
            const buttons = section.querySelectorAll('button')
            const viewButtons = Array.from(buttons).filter(btn => {
              const btnText = btn.textContent || ''
              // กรองเอาเฉพาะปุ่มที่ไม่ใช่ Register, Dashboard, Refresh
              return !btnText.includes('Register') && 
                     !btnText.includes('Dashboard') && 
                     !btnText.includes('Refresh') &&
                     !btnText.includes('Now')
            })
            
            // ถ้ามี 3 ปุ่ม (Grid, List, Dot) เอาปุ่มที่ 3
            if (viewButtons.length >= 3) {
              dotButton = viewButtons[2] as HTMLButtonElement
            }
          }
        }
      }

      // วิธีที่ 4: หาจาก SVG path หรือ structure
      if (!dotButton) {
        const buttons = Array.from(document.querySelectorAll('button'))
        dotButton = buttons.find(btn => {
          const svg = btn.querySelector('svg')
          if (!svg) return false
          // Dot view มักมี circle หลายตัว หรือ rect หลายตัว
          const shapes = svg.querySelectorAll('circle, rect')
          return shapes.length >= 6
        })
      }

      if (dotButton) {
        console.log('Found Dot View button, clicking...')
        ;(dotButton as HTMLElement).click()
        return true
      }
      
      console.log('Dot View button not found')
      return false
    })

    if (!dotViewClicked) {
      console.warn('[CRON] Could not find Dot View button')
      // ถ้าหาไม่เจอ ลองแสดงข้อมูลปุ่มทั้งหมดเพื่อ debug
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        console.log('All buttons found:', buttons.map((btn, i) => ({
          index: i,
          text: btn.textContent?.trim(),
          ariaLabel: btn.getAttribute('aria-label'),
          title: btn.getAttribute('title'),
          hasSvg: !!btn.querySelector('svg'),
          circles: btn.querySelectorAll('circle').length
        })))
      })
    } else {
      console.log('[CRON] Dot View button clicked')
      await delay(5000) // รอให้ view เปลี่ยนและข้อมูลโหลด
    }

    // 6) รอให้ข้อมูลโหลดเสร็จ
    console.log('[CRON] Waiting for data to settle...')
    const start = Date.now()
    const cap = 120_000
    while (Date.now() - start < cap) {
      await delay(5_000)
      const ready = await page.evaluate(() => {
        const explicitReady =
          document.querySelector('#dashboard-ready') ||
          document.querySelector('[data-dashboard-ready="true"]')
        const hasVisuals =
          document.querySelectorAll('.chart, canvas, [role="table"], table, [class*="sensor"], [class*="card"]').length > 0
        return !!explicitReady || hasVisuals
      })
      if (ready) break
    }

    await delay(2000)

    // 7) แคปหน้าจอ
    console.log('[CRON] Taking screenshot...')
    const screenshot = (await page.screenshot({ type: 'png', fullPage: true })) as Buffer

    await browser.close()
    console.log('[CRON] Screenshot captured.')

    // 8) ส่งอีเมล
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
    const subjectTH = `TBKK-Surazense - รายงานประจำทุก 2 สัปดาห์ (Dot View) ${new Date().toLocaleDateString('th-TH')}`

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: recipients.join(','),
      subject: subjectTH,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">รายงานประจำทุก 2 สัปดาห์ (Dot View)</h2>
          <p>สวัสดีครับ,</p>
          <p>นี่คือ screenshot ระบบ TBKK-Surazense ในโหมด Dot View ณ วันที่ ${nowTH}</p>
          <p>Screenshot แนบมาพร้อมอีเมลนี้แล้วครับ</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            อีเมลนี้ถูกส่งอัตโนมัติจากระบบ TBKK-Surazense<br>
            หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      `,
      attachments: [
        { filename: `tbkk-dotview-report-${Date.now()}.png`, content: screenshot, contentType: 'image/png' },
      ],
    })

    console.log('[CRON] Email sent.')

    return NextResponse.json({
      success: true,
      message: 'Screenshot report (Dot View) sent successfully',
      timestamp: new Date().toISOString(),
      recipients: recipients.length,
      viewClicked: dotViewClicked,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}