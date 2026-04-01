import { supabaseAdmin } from '../../lib/supabase'
import { Resend } from 'resend'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { submissionId, timestamps, overallFeedback, rating, techEmail, techName } = req.body

  try {
    const db = supabaseAdmin()

    const { error } = await db.from('submissions').update({
      timestamps,
      overall_feedback: overallFeedback,
      rating,
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
    }).eq('id', submissionId)

    if (error) throw error

    // Email feedback to tech
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Nail Prep Review <feedback@yourdomain.com>',
      to: techEmail,
      subject: `Your nail prep feedback is ready`,
      html: buildFeedbackEmail(techName, timestamps, overallFeedback, rating),
    })

    res.status(200).json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}

function buildFeedbackEmail(name, timestamps, overall, rating) {
  const tsRows = timestamps?.map(t => `
    <div style="padding: 12px 14px; background: #F5EDD6; border-left: 3px solid #B8952A; border-radius: 0 8px 8px 0; margin-bottom: 10px;">
      <div style="font-size: 12px; font-weight: 600; color: #B8952A; margin-bottom: 4px;">${t.time} — ${t.category}</div>
      <div style="font-size: 14px; color: #1A1A1A; line-height: 1.5;">${t.note}</div>
    </div>
  `).join('') || ''

  return `
    <div style="font-family: DM Sans, sans-serif; max-width: 560px; padding: 32px 24px;">
      <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 400; margin-bottom: 8px;">Hi ${name},</h1>
      <p style="color: #5C5C5C; font-size: 14px; line-height: 1.7; margin-bottom: 28px;">Your nail prep video review is ready. Here's a breakdown of my timestamped notes followed by an overall assessment.</p>

      ${timestamps?.length ? `<h2 style="font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #B8952A; margin-bottom: 12px;">Timestamped notes</h2>${tsRows}` : ''}

      <h2 style="font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #B8952A; margin: 24px 0 12px;">Overall feedback</h2>
      <div style="font-size: 14px; color: #1A1A1A; line-height: 1.75; white-space: pre-wrap;">${overall}</div>

      ${rating ? `<div style="margin-top: 20px; font-size: 13px; color: #5C5C5C;">Overall prep rating: <strong style="color: #1A1A1A;">${rating}/5</strong></div>` : ''}

      <div style="margin-top: 32px; padding-top: 20px; border-top: 0.5px solid rgba(0,0,0,0.1); font-size: 12px; color: #9A9A9A;">
        Nail Prep Review · Questions? Reply to this email.
      </div>
    </div>
  `
}
