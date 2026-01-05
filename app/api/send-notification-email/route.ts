import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, html } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user profile to verify email exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('email', to)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // For development: Log the email
    console.log('📧 Email Notification:', {
      to: profile.email,
      name: profile.name,
      subject,
      timestamp: new Date().toISOString()
    })

    // TODO: Production - Send actual email via Resend/SendGrid
    // Uncomment when you add RESEND_API_KEY to environment variables
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Threat Assessment Platform <notifications@yourdomain.com>',
        to: [to],
        subject,
        html,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }
    */

    return NextResponse.json({ 
      success: true,
      message: 'Email notification queued',
      // In production: emailId: data.id 
    })

  } catch (error: any) {
    console.error('Error sending email notification:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
