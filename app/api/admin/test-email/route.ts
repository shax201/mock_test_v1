import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    // 🔐 Verify admin authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 📧 Parse input
    const { testEmail } = await request.json()
    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      )
    }

    // 🔑 Environment variables
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing RESEND_API_KEY' },
        { status: 500 }
      )
    }

    // 🧩 Determine environment (test or production)
    const isLocal = process.env.NODE_ENV !== 'production'
    const resend = new Resend(apiKey)

    // 🧪 Use Resend’s test domain if local
    const from = isLocal
      ? 'onboarding@resend.dev' // Works without verification
      : process.env.EMAIL_FROM || 'noreply@yourdomain.com' // Must be verified in production

    // 📤 Send test email
    const { data, error } = await resend.emails.send({
      from,
      to: testEmail,
      subject: isLocal
        ? '🧪 Local Test Email (Resend)'
        : '📨 Production Email (Resend)',
      html: `
        <div style="font-family:sans-serif;line-height:1.6">
          <h2>Hello 👋</h2>
          <p>This is a ${
            isLocal ? '<strong>local test</strong>' : '<strong>production</strong>'
          } email sent via <b>Resend API</b>.</p>
          <p>Environment: <code>${isLocal ? 'Localhost' : 'Production'}</code></p>
          <p>If you received this, your email system works perfectly 🎉</p>
        </div>
      `,
    })

    // 🧾 Handle response
    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Test email sent successfully!',
      id: data?.id,
      environment: isLocal ? 'local' : 'production',
      to: testEmail,
    })
  } catch (err: any) {
    console.error('Error sending test email:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
