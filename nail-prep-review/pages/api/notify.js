import { Resend } from 'resend'
import twilio from 'twilio'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, issues } = req.body

  try {
    // Email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Nail Prep Review <onboarding@resend.dev>',
      to: process.env.YOUR_EMAIL,
      subject: `New submission from ${name}`,
      html: `
        <div style="font-family: DM Sans, sans-serif; max-width: 480px; padding: 24px;">
          <h2 style="font-size: 20px; margin-bottom: 8px;">New prep video submitted</h2>
          <p style="color: #5C5C5C; margin-bottom: 16px;">Someone submitted their nail prep video for review.</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #9A9A9A; width: 140px;">Name</td><td style="padding: 8px 0; font-weight: 500;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #9A9A9A;">Email</td><td style="padding: 8px 0;">${email}</td></tr>
            <tr><td style="padding: 8px 0; color: #9A9A9A;">Issues flagged</td><td style="padding: 8px 0;">${issues?.join(', ') || '—'}</td></tr>
          </table>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/review" style="display: inline-block; margin-top: 20px; padding: 12px 20px; background: #1A1A1A; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">
            Open Review Dashboard →
          </a>
        </div>
      `
    })

    // SMS via Twilio
    const sms = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await sms.messages.create({
      body: `New nail prep submission from ${name} (${issues?.join(', ') || 'no issues flagged'}). Open your dashboard to review.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.YOUR_PHONE,
    })

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Notification error:', e)
    res.status(500).json({ error: e.message })
  }
}
