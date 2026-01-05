import { createClient } from '@/lib/supabase/server'

interface EmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  try {
    const supabase = await createClient()
    
    // Get user by email to check if they exist
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', to)
      .single()

    if (!userData) {
      console.error('User not found:', to)
      return { success: false, error: 'User not found' }
    }

    // Supabase doesn't have a direct email API, so we'll use their auth email system
    // For custom transactional emails, we'll need to use a service like Resend
    // For now, we'll log the email (you can integrate Resend/SendGrid later)
    
    console.log('Email to send:', {
      to,
      subject,
      html
    })

    // TODO: Integrate with Resend or SendGrid for production
    // Example with Resend:
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'notifications@yourdomain.com',
    //     to: [to],
    //     subject,
    //     html,
    //   }),
    // })

    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Email templates
export const emailTemplates = {
  assessmentInvitation: (data: {
    inviterName: string
    assessmentName: string
    role: string
    assessmentUrl: string
  }) => ({
    subject: `You've been invited to assess ${data.assessmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Assessment Team Invitation</h2>
        <p>Hi there,</p>
        <p><strong>${data.inviterName}</strong> has invited you to join the assessment team for <strong>${data.assessmentName}</strong>.</p>
        <p>Your role: <strong>${data.role}</strong></p>
        <div style="margin: 30px 0;">
          <a href="${data.assessmentUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Assessment
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you have any questions, please contact the assessment team.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          Threat Assessment Platform - Preserving agricultural biodiversity for future generations
        </p>
      </div>
    `,
  }),

  reviewRequested: (data: {
    assessorName: string
    assessmentName: string
    assessmentUrl: string
  }) => ({
    subject: `Review requested: ${data.assessmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Assessment Ready for Review</h2>
        <p>Hi there,</p>
        <p><strong>${data.assessorName}</strong> has submitted <strong>${data.assessmentName}</strong> for your review.</p>
        <p>Please review the assessment and provide your feedback.</p>
        <div style="margin: 30px 0;">
          <a href="${data.assessmentUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Assessment
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          You can approve the assessment or return it to the assessor with comments.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          Threat Assessment Platform
        </p>
      </div>
    `,
  }),

  reviewReturned: (data: {
    reviewerName: string
    assessmentName: string
    assessmentUrl: string
  }) => ({
    subject: `Assessment returned: ${data.assessmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Assessment Returned for Revision</h2>
        <p>Hi there,</p>
        <p><strong>${data.reviewerName}</strong> has returned <strong>${data.assessmentName}</strong> for revisions.</p>
        <p>Please review the comments and make necessary changes.</p>
        <div style="margin: 30px 0;">
          <a href="${data.assessmentUrl}" 
             style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Comments
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Once you've made the revisions, you can resubmit for review.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          Threat Assessment Platform
        </p>
      </div>
    `,
  }),

  assessmentApproved: (data: {
    reviewerName: string
    assessmentName: string
    assessmentUrl: string
  }) => ({
    subject: `Assessment approved: ${data.assessmentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Assessment Approved! 🎉</h2>
        <p>Hi there,</p>
        <p>Great news! <strong>${data.reviewerName}</strong> has approved <strong>${data.assessmentName}</strong>.</p>
        <p>Your assessment is now complete and published.</p>
        <div style="margin: 30px 0;">
          <a href="${data.assessmentUrl}" 
             style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Assessment
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Thank you for your contribution to preserving agricultural biodiversity!
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          Threat Assessment Platform
        </p>
      </div>
    `,
  }),
}
