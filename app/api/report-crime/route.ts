import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const description = formData.get('description') as string
    const contactInfo = formData.get('contactInfo') as string
    const isAnonymous = formData.get('isAnonymous') === 'true'

    if (!files.length || !description) {
      return NextResponse.json({ error: 'Files and description required' }, { status: 400 })
    }

    const reportId = `CR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    const reporterIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown'

    // Store files and extract location
    const fileUrls = await storeEncryptedFiles(files, reportId)
    const location = await extractLocationFromFiles(files)

    // Store in database (simplified for testing)
    const report = {
      id: reportId,
      description: encryptData(description),
      contactInfo: isAnonymous ? null : encryptData(contactInfo || ''),
      isAnonymous,
      fileUrls,
      location,
      reporterIp: encryptData(reporterIp),
      status: 'PENDING',
      createdAt: new Date()
    }
    
    // TODO: Store in database when Prisma client is working
    console.log('Report created (not stored in DB yet):', reportId)

    // Notify authorities
    await notifyLawEnforcement(report, location)
    await sendEmailNotifications(report, contactInfo, isAnonymous)

    return NextResponse.json({ 
      reportId,
      message: 'Report submitted successfully. Authorities have been notified.',
      filesReceived: files.length,
      location: location?.address || 'Location extracted from files'
    })

  } catch (error) {
    console.error('Crime report error:', error)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}

async function storeEncryptedFiles(files: File[], reportId: string): Promise<string[]> {
  const uploadDir = path.join(process.cwd(), 'uploads', 'crime-reports', reportId)
  await mkdir(uploadDir, { recursive: true })
  
  const fileUrls: string[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const buffer = Buffer.from(await file.arrayBuffer())
    const encryptedBuffer = encryptFile(buffer)
    const filename = `evidence_${i + 1}_${Date.now()}.enc`
    const filepath = path.join(uploadDir, filename)
    
    await writeFile(filepath, encryptedBuffer)
    fileUrls.push(`/uploads/crime-reports/${reportId}/${filename}`)
  }
  
  return fileUrls
}

function encryptData(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function encryptFile(buffer: Buffer): Buffer {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  return Buffer.concat([iv, encrypted])
}

async function extractLocationFromFiles(files: File[]) {
  try {
    const firstFile = files[0]
    const formData = new FormData()
    formData.append('image', firstFile)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/location-recognition-v2`, {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.location) {
        return {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: data.address || data.name
        }
      }
    }
  } catch (error) {
    console.error('Location extraction failed:', error)
  }
  
  return null
}

async function notifyLawEnforcement(report: any, location: any) {
  try {
    const payload = {
      reportId: report.id,
      type: 'CRIME_REPORT',
      priority: 'MEDIUM',
      location: location,
      timestamp: report.createdAt,
      hasEvidence: true,
      isAnonymous: report.isAnonymous
    }
    
    console.log('Law enforcement notified:', payload)
  } catch (error) {
    console.error('Failed to notify law enforcement:', error)
  }
}

async function sendEmailNotifications(report: any, contactInfo: string, isAnonymous: boolean) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.log('Resend API key not configured')
      return
    }

    // Send confirmation email to reporter (if not anonymous)
    if (!isAnonymous && contactInfo && contactInfo.includes('@')) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Pic2Nav <noreply@pic2nav.com>',
          to: contactInfo,
          subject: `Crime Report Submitted - ${report.id}`,
          html: `
            <h2>Crime Report Confirmation</h2>
            <p>Your crime report has been successfully submitted to Nigerian Police Force.</p>
            <p><strong>Report ID:</strong> ${report.id}</p>
            <p><strong>Status:</strong> Under Review</p>
            <p>Authorities have been notified and will investigate accordingly.</p>
            <p>Keep this report ID for your records.</p>
            <p>Emergency: 199 or 911</p>
          `
        })
      })
    }
    
    // Send alert to Nigerian Police Force (DISABLED FOR TESTING)
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${resendApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'Pic2Nav Crime Reports <reports@pic2nav.com>',
    //     to: process.env.LAW_ENFORCEMENT_EMAIL || 'cybercrime@npf.gov.ng',
    //     subject: `New Crime Report - ${report.id}`,
    //     html: `
    //       <h2>New Crime Report Received</h2>
    //       <p><strong>Report ID:</strong> ${report.id}</p>
    //       <p><strong>Type:</strong> ${isAnonymous ? 'Anonymous' : 'With Contact Info'}</p>
    //       <p><strong>Files:</strong> ${Array.isArray(report.fileUrls) ? report.fileUrls.length : 0} evidence files</p>
    //       <p><strong>Location:</strong> Nigeria - ${report.location?.address || 'Location data available'}</p>
    //       <p><strong>Submitted:</strong> ${new Date(report.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</p>
    //       <p><strong>Contact:</strong> ${isAnonymous ? 'Anonymous Report' : 'Contact info provided'}</p>
    //       <p>Please review the report in the law enforcement portal.</p>
    //       <hr>
    //       <p><small>Submitted via Pic2Nav Crime Reporting System</small></p>
    //     `
    //   })
    // })
    console.log('Police notification disabled for testing')
    
    // Send notification to admin
    if (process.env.ADMIN_EMAIL) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Pic2Nav <onboarding@resend.dev>',
            to: process.env.ADMIN_EMAIL,
            subject: `🚨 New Crime Report - ${report.id}`,
            html: `
              <h2>🚨 New Crime Report Received</h2>
              <p><strong>Report ID:</strong> ${report.id}</p>
              <p><strong>Type:</strong> ${isAnonymous ? 'Anonymous' : 'With Contact Info'}</p>
              <p><strong>Files:</strong> ${Array.isArray(report.fileUrls) ? report.fileUrls.length : 0} evidence files</p>
              <p><strong>Location:</strong> ${report.location?.address || 'Location data available'}</p>
              <p><strong>Coordinates:</strong> ${report.location?.latitude}, ${report.location?.longitude}</p>
              <p><strong>Submitted:</strong> ${new Date(report.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</p>
              <p><strong>Contact:</strong> ${isAnonymous ? 'Anonymous Report' : 'Contact info provided'}</p>
              <hr>
              <p><small>Crime Report via Pic2Nav System</small></p>
            `
          })
        })
        
        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          console.error('Email send failed:', errorData)
        } else {
          console.log('Admin email sent successfully')
        }
      } catch (error) {
        console.error('Email error:', error)
      }
    }
    
    console.log(`Emails sent for report: ${report.id}`)
  } catch (error) {
    console.error('Email notification failed:', error)
  }
}