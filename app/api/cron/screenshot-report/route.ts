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

    // 4) รอให้ล็อกอินสำเร็จและโหลดหน้าหลัก
    console.log('[CRON] Waiting for navigation after login...')
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }),
      page.waitForSelector('button, .dashboard, [data-dashboard-ready="true"]', { timeout: 60_000 }),
    ]).catch(() => {
      console.warn('[CRON] Navigation/initial load timeout; continuing...')
    })

    await delay(3000) // รอให้หน้าโหลดเสร็จ

    // 5) คลิกปุ่ม "View Dashboard" เพื่อไปหน้า /dashboard (ถ้ายังไม่ได้อยู่)
    console.log('[CRON] Checking if need to navigate to dashboard...')
    const currentUrl = page.url()
    
    if (!currentUrl.includes('/dashboard')) {
      console.log('[CRON] Navigating to dashboard...')
      // หาปุ่ม "View Dashboard" และคลิก
      const dashboardClicked = await page.$$eval('a, button', (elements) => {
        const dashboardBtn = elements.find((el) => {
          const text = el.textContent || ''
          return /view\s*dashboard|dashboard/i.test(text.trim())
        }) as HTMLElement | undefined
        if (dashboardBtn) {
          dashboardBtn.click()
          return true
        }
        return false
      })

      if (!dashboardClicked) {
        // ถ้าหาปุ่มไม่เจอ ให้ navigate ตรงๆ
        const dashboardUrl = `${targetUrl}/dashboard`
        console.log(`[CRON] Navigate directly to: ${dashboardUrl}`)
        await page.goto(dashboardUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
      } else {
        // รอให้ navigate เสร็จ
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }).catch(() => {})
      }

      await delay(3000)
    }

    // 6) เปลี่ยนเป็น Dot View
    console.log('[CRON] Switching to Dot View...')
    const dotViewClicked = await page.evaluate(() => {
      // หาปุ่มที่เป็น Dot View โดยดูจาก aria-label, title, หรือ data attribute
      const buttons = Array.from(document.querySelectorAll('button'))
      
      // วิธีที่ 1: หาจาก aria-label หรือ title
      let dotButton = buttons.find(btn => {
        const ariaLabel = btn.getAttribute('aria-label') || ''
        const title = btn.getAttribute('title') || ''
        return /dot.*view/i.test(ariaLabel) || /dot.*view/i.test(title)
      })

      // วิธีที่ 2: หาจากโครงสร้าง ViewSelector (ปุ่มที่ 3)
      if (!dotButton) {
        // หา container ของ ViewSelector
        const viewSelectorContainer = document.querySelector('[class*="flex"][class*="gap"]')
        if (viewSelectorContainer) {
          const viewButtons = viewSelectorContainer.querySelectorAll('button')
          // ปุ่ม Dot View มักเป็นปุ่มที่ 3 (index 2)
          dotButton = viewButtons[2] as HTMLButtonElement
        }
      }

      // วิธีที่ 3: หาจากไอคอนที่เกี่ยวข้องกับ dot
      if (!dotButton) {
        dotButton = buttons.find(btn => {
          const svg = btn.querySelector('svg')
          if (!svg) return false
          const circles = svg.querySelectorAll('circle')
          // Dot view icon มักมีหลาย circle
          return circles.length >= 3
        })
      }

      if (dotButton) {
        (dotButton as HTMLElement).click()
        return true
      }
      return false
    })

    if (!dotViewClicked) {
      console.warn('[CRON] Could not find Dot View button, will capture current view')
    } else {
      console.log('[CRON] Dot View button clicked')
      await delay(3000) // รอให้ view เปลี่ยน
    }

    // 7) รอให้ข้อมูล sensor โหลดเสร็จ
    console.log('[CRON] Waiting for sensor data to load...')
    const start = Date.now()
    const cap = 120_000
    while (Date.now() - start < cap) {
      await delay(5_000)
      const ready = await page.evaluate(() => {
        const explicitReady =
          document.querySelector('#dashboard-ready') ||
          document.querySelector('[data-dashboard-ready="true"]')
        const hasVisuals =
          document.querySelectorAll('.chart, canvas, [role="table"], table, [class*="sensor"]').length > 0
        return !!explicitReady || hasVisuals
      })
      if (ready) break
    }

    await delay(2000) // รอเพิ่มเล็กน้อยให้แน่ใจว่าข้อมูลโหลดเสร็จ

    // 8) แคปหน้าจอ
    console.log('[CRON] Taking screenshot...')
    const screenshot = (await page.screenshot({ type: 'png', fullPage: true })) as Buffer

    await browser.close()
    console.log('[CRON] Screenshot captured.')

    // 9) ส่งอีเมล
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
          <h2 style="color: #333;">รายงานประจำทุก 2 สัปดาห์ (Dot View)</h2>
          <p>สวัสดีครับ,</p>
          <p>นี่คือ screenshot ระบบ TBKK-Surazense (Dot View) ณ วันที่ ${nowTH}</p>
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
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}