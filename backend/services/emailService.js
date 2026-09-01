import nodemailer from "nodemailer"

const smtpHost = process.env.SMTP_HOST
const smtpPort = Number(
  process.env.SMTP_PORT || 587,
)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const mailFrom =
  process.env.MAIL_FROM ||
  smtpUser ||
  "no-reply@cgfitness.com"

let transporter = null

function getTransporter() {
  if (
    !smtpHost ||
    !smtpUser ||
    !smtpPass
  ) {
    console.warn(
      "CGF email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.",
    )
    return null
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure:
        smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  }

  return transporter
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}) {
  if (!to) {
    return {
      sent: false,
      reason: "missing_recipient",
    }
  }

  const mailer =
    getTransporter()

  if (!mailer) {
    return {
      sent: false,
      reason: "smtp_not_configured",
    }
  }

  await mailer.sendMail({
    from: mailFrom,
    to,
    subject,
    text,
    html,
  })

  return {
    sent: true,
  }
}

export function workoutCompletedEmail({
  firstName,
  programName,
  workoutDate,
}) {
  const safeName =
    firstName || "Member"

  const safeProgram =
    programName || "today's workout"

  const dateText =
    workoutDate
      ? new Date(
          workoutDate,
        ).toLocaleDateString(
          "en-NG",
          {
            dateStyle:
              "full",
          },
        )
      : "today"

  return {
    subject:
      "CGF Workout Completed",
    text:
      `Hi ${safeName},\n\nGreat job! You successfully completed ${safeProgram} on ${dateText}.\n\nKeep up the consistency.\n\nCGF Fitness`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#ffffff;padding:32px">
        <div style="max-width:560px;margin:auto;background:#151515;border-radius:20px;padding:28px">
          <div style="font-size:14px;font-weight:800;color:#a3ff00;letter-spacing:2px">CGF FITNESS</div>
          <h1 style="margin:16px 0 8px">Workout Completed 🎉</h1>
          <p style="color:#b8b8b8;line-height:1.7">Hi ${safeName},</p>
          <p style="color:#b8b8b8;line-height:1.7">
            Great job! You successfully completed
            <strong style="color:#ffffff">${safeProgram}</strong>
            on ${dateText}.
          </p>
          <p style="color:#a3ff00;font-weight:800">Keep up the consistency.</p>
        </div>
      </div>
    `,
  }
}

export function workoutReminderEmail({
  firstName,
  programName,
  workoutDate,
}) {
  const safeName =
    firstName || "Member"

  const safeProgram =
    programName || "your scheduled workout"

  const dateText =
    workoutDate
      ? new Date(
          workoutDate,
        ).toLocaleDateString(
          "en-NG",
          {
            dateStyle:
              "full",
          },
        )
      : "today"

  return {
    subject:
      "CGF Workout Reminder",
    text:
      `Hi ${safeName},\n\nYou did not complete ${safeProgram} scheduled for ${dateText}.\n\nDon't worry. Get back on track with your next CGF session.\n\nCGF Fitness`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#ffffff;padding:32px">
        <div style="max-width:560px;margin:auto;background:#151515;border-radius:20px;padding:28px">
          <div style="font-size:14px;font-weight:800;color:#a3ff00;letter-spacing:2px">CGF FITNESS</div>
          <h1 style="margin:16px 0 8px">Workout Reminder</h1>
          <p style="color:#b8b8b8;line-height:1.7">Hi ${safeName},</p>
          <p style="color:#b8b8b8;line-height:1.7">
            You did not complete
            <strong style="color:#ffffff">${safeProgram}</strong>
            scheduled for ${dateText}.
          </p>
          <p style="color:#a3ff00;font-weight:800">Don't worry. Get back on track with your next session.</p>
        </div>
      </div>
    `,
  }
}
