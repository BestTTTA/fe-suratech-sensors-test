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
    console.log('Starting screenshot capture with API...')

    const targetUrl = process.env.NEXT_PUBLIC_BASE_URL
    
    // ใช้ Screenshot API (screenshotapi.net - มี free tier)
    const apiToken = process.env.SCREENSHOT_API_TOKEN
    const apiUrl = `https://shot.screenshotapi.net/screenshot`
    
    const params = new URLSearchParams({
      token: apiToken!,
      url: targetUrl!,
      output: 'image',
      file_type: 'png',
      wait_for_event: 'load',
      delay: '2000',
      width: '1920',
      height: '1080',
      full_page: 'true'
    })

    console.log(`Capturing screenshot of ${targetUrl}`)
    
    const screenshotResponse = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
    })

    if (!screenshotResponse.ok) {
      throw new Error(`Screenshot API error: ${screenshotResponse.status}`)
    }

    const screenshot = await screenshotResponse.arrayBuffer()
    console.log('Screenshot captured successfully')

    // ส่งอีเมล
    console.log('Sending email...')
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const recipients = process.env.REPORT_RECIPIENTS?.split(',') || []
    
    if (recipients.length === 0) {
      throw new Error('No recipients configured')
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipients.join(','),
      subject: `TBKK-Surazense - รายงานประจำทุก 2 สัปดาห์ ${new Date().toLocaleDateString('th-TH')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">รายงานประจำทุก 2 สัปดาห์</h2>
          <p>สวัสดีครับ,</p>
          <p>นี่คือ screenshot ระบบ TBKK-Surazense ณ วันที่ ${new Date().toLocaleString('th-TH')}</p>
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
    }

    await transporter.sendMail(mailOptions)
    console.log('Email sent successfully')

    return NextResponse.json({
      success: true,
      message: 'Screenshot report sent successfully',
      timestamp: new Date().toISOString(),
      recipients: recipients.length
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}