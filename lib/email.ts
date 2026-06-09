import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
const FROM    = 'StoryForge <onboarding@resend.dev>'

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your StoryForge password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#6366f1;">Reset your password</h2>
        <p>You requested a password reset for your StoryForge account.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        <p style="color:#888;font-size:12px;">Or copy this URL: ${resetUrl}</p>
      </div>
    `,
  })
}

export async function sendNewChapterEmail(opts: {
  to:           string
  authorName:   string
  storyTitle:   string
  chapterTitle: string
  chapterId:    number
  storyId:      number
}) {
  const { to, authorName, storyTitle, chapterTitle, chapterId, storyId } = opts
  const chapterUrl = `${APP_URL}/stories/${storyId}/chapters/${chapterId}`
  const unsubUrl   = `${APP_URL}/settings`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `New chapter: ${chapterTitle} — ${storyTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#030712;color:#e5e7eb;border-radius:12px;">
        <p style="color:#6366f1;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:.08em;">New Chapter</p>
        <h2 style="margin:0 0 4px;font-size:22px;color:#fff;">${storyTitle}</h2>
        <p style="margin:0 0 20px;color:#9ca3af;font-size:15px;">by ${authorName}</p>
        <div style="background:#111827;border:1px solid #1f2937;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">New Chapter</p>
          <p style="margin:0;font-size:17px;color:#e5e7eb;font-weight:600;">${chapterTitle}</p>
        </div>
        <a href="${chapterUrl}"
           style="display:inline-block;background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
          Read Now →
        </a>
        <p style="margin:28px 0 0;color:#4b5563;font-size:12px;">
          You're receiving this because you follow ${authorName} on StoryForge.<br>
          <a href="${unsubUrl}" style="color:#6366f1;">Manage notification preferences</a>
        </p>
      </div>
    `,
  })
}
