import crypto from "crypto"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"
import User from "../models/User.js"

const RESET_TOKEN_MINUTES = 30

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase()
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function getFrontendBaseUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "")
}

function createMailer() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587)
  const user =
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER
  const pass =
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

function getFromAddress() {
  return (
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    "CGF Gym <no-reply@cgf-gym.local>"
  )
}

async function sendResetEmail({ user, token, role }) {
  const resetUrl = `${getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}&role=${encodeURIComponent(role)}`
  const mailer = createMailer()

  if (!mailer) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("CGF password reset email is not configured.")
      console.warn(`CGF LOCAL RESET LINK: ${resetUrl}`)
      return { delivered: false, resetUrl }
    }

    throw new Error("Password reset email service is not configured.")
  }

  await mailer.sendMail({
    from: getFromAddress(),
    to: user.email,
    subject: "CGF Gym — Reset Your Password",
    text: [
      `Hello ${user.firstName || ""}`.trim() + ",",
      "",
      "We received a request to reset your CGF Gym password.",
      `Use this link to choose a new password: ${resetUrl}`,
      "",
      `This link expires in ${RESET_TOKEN_MINUTES} minutes and can only be used once.`,
      "",
      "If you did not request this, you can safely ignore this email.",
      "",
      "CGF Gym",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:auto">
        <h2 style="margin-bottom:8px">CGF Gym Password Reset</h2>
        <p>Hello ${user.firstName || ""},</p>
        <p>We received a request to reset your CGF Gym password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#a3e635;color:#111827;text-decoration:none;font-weight:700;border-radius:8px">
            Reset Password
          </a>
        </p>
        <p>This link expires in ${RESET_TOKEN_MINUTES} minutes and can only be used once.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>CGF Gym</p>
      </div>
    `,
  })

  return { delivered: true, resetUrl }
}

async function requestPasswordReset(req, res, expectedRole) {
  try {
    const email = normalizeEmail(req.body?.email)

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      })
    }

    const user = await User.findOne({ email }).select("+password")

    // Do not reveal whether an account exists.
    if (!user || user.role !== expectedRole || !user.isActive) {
      return res.status(200).json({
        success: true,
        message: "If an account matches that email, a password reset link has been sent.",
      })
    }

    const rawToken = crypto.randomBytes(32).toString("hex")
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000)

    await User.collection.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetToken: tokenHash,
          passwordResetExpires: expiresAt,
          passwordResetRole: expectedRole,
        },
      },
    )

    try {
      const mailResult = await sendResetEmail({
        user,
        token: rawToken,
        role: expectedRole,
      })

      return res.status(200).json({
        success: true,
        message: "If an account matches that email, a password reset link has been sent.",
        ...(mailResult.delivered
          ? {}
          : process.env.NODE_ENV !== "production"
            ? { developmentResetUrl: mailResult.resetUrl }
            : {}),
      })
    } catch (emailError) {
      await User.collection.updateOne(
        { _id: user._id },
        {
          $unset: {
            passwordResetToken: "",
            passwordResetExpires: "",
            passwordResetRole: "",
          },
        },
      )

      console.error("CGF password reset email error:", emailError)

      return res.status(503).json({
        success: false,
        message: "We could not send the password reset email. Please try again later.",
      })
    }
  } catch (error) {
    console.error("Password reset request error:", error)
    return res.status(500).json({
      success: false,
      message: "Unable to process the password reset request.",
    })
  }
}

const requestMemberPasswordReset = (req, res) =>
  requestPasswordReset(req, res, "member")

const requestAdminPasswordReset = (req, res) =>
  requestPasswordReset(req, res, "admin")

const resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim()
    const role = String(req.body?.role || "member").trim().toLowerCase()
    const password = String(req.body?.password || "")

    if (!token || !["member", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid.",
      })
    }

    if (password.length < (role === "admin" ? 8 : 6)) {
      return res.status(400).json({
        success: false,
        message:
          role === "admin"
            ? "Admin password must be at least 8 characters."
            : "Password must be at least 6 characters.",
      })
    }

    const tokenHash = hashToken(token)
    const now = new Date()

    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetRole: role,
      passwordResetExpires: { $gt: now },
      role,
      isActive: true,
    }).select("+password")

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired.",
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await User.collection.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: {
          passwordResetToken: "",
          passwordResetExpires: "",
          passwordResetRole: "",
        },
      },
    )

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully. You can now sign in with your new password.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return res.status(500).json({
      success: false,
      message: "Unable to reset your password.",
    })
  }
}

export {
  requestMemberPasswordReset,
  requestAdminPasswordReset,
  resetPassword,
}
