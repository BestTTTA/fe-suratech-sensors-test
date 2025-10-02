// app/api/cron/screenshot-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Import แบบมีเงื่อนไข
let chromium: any
let puppeteer: any

// ตรวจสอบว่าเป็น production หรือ development
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction) {
  chromium = require('@sparticuz/chromium')
  puppeteer = require('puppeteer-core')
} else {
  // ใน development ใช้ puppeteer แบบเต็ม
  puppeteer = require('puppeteer')
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting screenshot capture...')
    console.log('Environment:', isProduction ? 'Production' : 'Development')

    // Launch browser ตาม environment
    let browser
    
    if (isProduction) {
      // สำหรับ Vercel/Production
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      })
    } else {
      // สำหรับ Local Development
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    // ไปยังหน้าที่ต้องการแคป
    const targetUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    console.log(`Navigating to ${targetUrl}`)

    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // รอให้หน้าโหลดเสร็จ
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Capturing screenshot...')
    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png'
    })
    
    await browser.close()
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
      recipients: recipients.length,
      environment: isProduction ? 'production' : 'development'
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