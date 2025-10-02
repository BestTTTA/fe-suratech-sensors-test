// app/api/cron/screenshot-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export const dynamic = 'force-dynamic'
export const maxDuration = 60   // อาจต้องเพิ่มเวลาเล็กน้อย
export const runtime = 'nodejs' // สำคัญ: ใช้ Node runtime บน Vercel

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const targetUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (!targetUrl) throw new Error('NEXT_PUBLIC_BASE_URL is not set')

    // ตั้งค่า chromium บน serverless
    const executablePath = await chromium.executablePath()
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: chromium.headless,
    })

    const page = await browser.newPage()

    // ไปยังหน้าเป้าหมาย (ถ้าต้องรอ network idle เปลี่ยนเป็น 'networkidle2')
    await page.goto(targetUrl, { waitUntil: 'load', timeout: 60_000 })
    // รอ assets เพิ่มเติมเล็กน้อย
    await new Promise(resolve => setTimeout(resolve, 2000))

    // ถ้าหน้าคุณต้อง login/มี element เฉพาะ รอ selector ก็ได้ เช่น:
    // await page.waitForSelector('#dashboard-ready', { timeout: 15000 })

    const screenshot = await page.screenshot({ type: 'png', fullPage: true }) as Buffer
    await browser.close()

    // ส่งอีเมล
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const recipients = process.env.REPORT_RECIPIENTS?.split(',').map(s => s.trim()).filter(Boolean) || []
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
        {
          filename: `tbkk-report-${Date.now()}.png`,
          content: screenshot,
          contentType: 'image/png',
        },
      ],
    })

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
      { status: 500 }
    )
  }
}
