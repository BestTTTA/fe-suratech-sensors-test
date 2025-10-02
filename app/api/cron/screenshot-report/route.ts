// app/api/cron/screenshot-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const targetUrl = process.env.NEXT_PUBLIC_BASE_URL
    const apiToken  = process.env.SCREENSHOT_API_TOKEN

    if (!targetUrl) throw new Error('NEXT_PUBLIC_BASE_URL is not set')
    if (!apiToken)  throw new Error('SCREENSHOT_API_TOKEN is not set')

    console.log('Starting screenshot capture with API...')
    console.log(`Capturing screenshot of ${targetUrl}`)

    // ✅ Correct endpoint
    const apiUrl = 'https://screenshotapi.net/api/v1/screenshot'

    // Build query params (encode URL explicitly)
    const params = new URLSearchParams({
      token: apiToken,
      url: encodeURIComponent(targetUrl),
      output: 'image',
      file_type: 'png',
      wait_for_event: 'load',
      delay: '2000',
      width: '1920',
      height: '1080',
      full_page: 'true',
      // Optional: if target returns 4xx/5xx and you still want an image, set false (default)
      // fail_on_error: 'false',
    })

    const screenshotResponse = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
    })

    if (!screenshotResponse.ok) {
      // Try to read JSON error if present
      let detail = ''
      try {
        const j = await screenshotResponse.json()
        detail = j?.message || JSON.stringify(j)
      } catch {
        detail = await screenshotResponse.text()
      }
      throw new Error(`Screenshot API error ${screenshotResponse.status}: ${detail}`)
    }

    const screenshot = await screenshotResponse.arrayBuffer()
    console.log('Screenshot captured successfully')

    // Send email
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
          content: Buffer.from(screenshot),
          contentType: 'image/png',
        },
      ],
    })

    console.log('Email sent successfully')

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
      { status: 500 },
    )
  }
}
