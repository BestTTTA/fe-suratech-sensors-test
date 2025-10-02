// app/api/cron/screenshot-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const targetUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (!targetUrl) throw new Error('NEXT_PUBLIC_BASE_URL is not set')

    // ค่าพื้นฐานที่เสถียรบน serverless
    chromium.setHeadlessMode = true
    chromium.setGraphicsMode = false

    const isVercel = !!process.env.VERCEL
    const executablePath = isVercel
      ? await chromium.executablePath() // ใช้ binary ของ @sparticuz/chromium บน Vercel
      : process.env.PUPPETEER_EXECUTABLE_PATH || undefined // local dev: ใช้ Chrome/Chromium ติดเครื่อง

    if (isVercel && !executablePath) {
      throw new Error('Could not resolve chromium executablePath on Vercel')
    }

    console.log('[CRON] Launching browser for screenshot...')
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        // แทน ignoreHTTPSErrors ด้วย flag นี้ (Puppeteer v22 ไม่มี ignoreHTTPSErrors ใน launch)
        '--ignore-certificate-errors',
      ],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    console.log(`[CRON] Navigating to ${targetUrl} ...`)

    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 60_000,
    })

    // ถ้าต้องการรอ element/สัญญาณว่า dashboard พร้อม ใช้ waitForSelector แทน setTimeout
    // เช่น: await page.waitForSelector('#dashboard-ready', { timeout: 15_000 })

    // หน่วงเล็กน้อยให้ assets/rendering เสร็จ (แทน waitForTimeout)
    await new Promise((r) => setTimeout(r, 1500))

    const screenshot = (await page.screenshot({
      type: 'png',
      fullPage: true,
    })) as Buffer

    await browser.close()
    console.log('[CRON] Screenshot captured.')

    // ---------- ส่งอีเมล ----------
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
    const subjectTH = `TBKK-Surazense - รายงานประจำทุก 2 สัปดาห์ ${new Date().toLocaleDateString(
      'th-TH'
    )}`

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
        {
          filename: `tbkk-report-${Date.now()}.png`,
          content: screenshot,
          contentType: 'image/png',
        },
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
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
