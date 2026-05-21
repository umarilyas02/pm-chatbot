// Email sender using nodemailer over SMTP.
// Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
// In dev (vars absent) emails are logged to the console.

import nodemailer from 'nodemailer'

// APP_URL must be set in your deployment env (Vercel → Settings → Environment Variables).
// Falls back to NEXT_PUBLIC_APP_URL, then localhost for local dev only.
const APP_URL =
  process.env.APP_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://localhost:3000'
const FROM = process.env.EMAIL_FROM ?? 'CreateX <noreply@localhost>'

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

  if (!SMTP_HOST) return null

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT ?? '587', 10),
    secure: SMTP_PORT === '465',       // true for port 465 (SSL), false → STARTTLS
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  })
}

async function send({ to, subject, html }) {
  const transport = getTransport()

  if (!transport) {
    console.log(`\n[EMAIL – dev mode]\nTo: ${to}\nSubject: ${subject}\n${html}\n`)
    return
  }

  await transport.sendMail({ from: FROM, to, subject, html })
}

function baseLayout(content) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#020617;font-family:sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#0f172a;border-radius:12px;padding:40px;border:1px solid rgba(255,255,255,0.08)">
    <div style="margin-bottom:32px;text-align:center">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;background:#22c55e;border-radius:10px;margin-bottom:12px">
        <span style="color:white;font-size:20px;font-weight:bold">&#9889;</span>
      </div>
      <div style="color:#22c55e;font-weight:700;font-size:18px;font-family:monospace">CreateX</div>
    </div>
    ${content}
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);color:#475569;font-size:12px;text-align:center">
      If you didn't request this email you can safely ignore it.
    </div>
  </div>
</body>
</html>`
}

export async function sendVerificationEmail(to, token) {
  const url = `${APP_URL}/verify-email?token=${token}`
  await send({
    to,
    subject: 'Verify your CreateX email',
    html: baseLayout(`
      <h2 style="color:#f8fafc;font-size:20px;margin:0 0 12px">Verify your email</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
        Click the button below to verify your CreateX account. This link expires in 24 hours.
      </p>
      <a href="${url}"
         style="display:inline-block;background:#22c55e;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Verify Email
      </a>
      <p style="color:#475569;font-size:12px;margin:24px 0 0">
        Or copy this link: <span style="color:#94a3b8">${url}</span>
      </p>
    `),
  })
}

export async function sendWorkspaceInviteEmail(to, { inviterName, workspaceName, token }) {
  const url = `${APP_URL}/accept-invite?token=${token}`
  await send({
    to,
    subject: `${inviterName} invited you to ${workspaceName} on CreateX`,
    html: baseLayout(`
      <h2 style="color:#f8fafc;font-size:20px;margin:0 0 12px">You're invited!</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
        <strong style="color:#f8fafc">${inviterName}</strong> has invited you to join
        <strong style="color:#f8fafc">${workspaceName}</strong> on CreateX.
        Click below to accept — this invite expires in 7 days.
      </p>
      <a href="${url}"
         style="display:inline-block;background:#22c55e;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Accept invite
      </a>
      <p style="color:#475569;font-size:12px;margin:24px 0 0">
        Or copy this link: <span style="color:#94a3b8">${url}</span>
      </p>
    `),
  })
}

export async function sendPasswordResetEmail(to, token) {
  const url = `${APP_URL}/reset-password?token=${token}`
  await send({
    to,
    subject: 'Reset your CreateX password',
    html: baseLayout(`
      <h2 style="color:#f8fafc;font-size:20px;margin:0 0 12px">Reset your password</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
        Click the button below to set a new password. This link expires in 1 hour and can only be used once.
      </p>
      <a href="${url}"
         style="display:inline-block;background:#22c55e;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
        Reset Password
      </a>
      <p style="color:#475569;font-size:12px;margin:24px 0 0">
        Or copy this link: <span style="color:#94a3b8">${url}</span>
      </p>
    `),
  })
}
