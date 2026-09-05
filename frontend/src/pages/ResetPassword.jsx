import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { resetPassword } from "../api/passwordReset.js"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const role = searchParams.get("role") === "admin" ? "admin" : "member"
  const isAdmin = role === "admin"
  const minimumLength = isAdmin ? 8 : 6

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!token) {
      setError("This password reset link is invalid or incomplete.")
      return
    }

    if (password.length < minimumLength) {
      setError(
        isAdmin
          ? "Admin password must be at least 8 characters."
          : "Password must be at least 6 characters.",
      )
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    try {
      setLoading(true)
      const result = await resetPassword({ token, role, password })
      setMessage(
        result?.message ||
          "Your password has been reset successfully. You can now sign in.",
      )
    } catch (resetError) {
      console.error("Reset password error:", resetError)
      setError(
        resetError?.response?.data?.message ||
          resetError?.message ||
          "Unable to reset your password.",
      )
    } finally {
      setLoading(false)
    }
  }

  const loginPath = isAdmin ? "/admin-login" : "/login"

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black ${
                isAdmin
                  ? "bg-lime-400 text-slate-950"
                  : "bg-white text-slate-950"
              }`}
            >
              CGF
            </div>

            <p
              className={`text-xs font-black uppercase tracking-[0.2em] ${
                isAdmin ? "text-lime-400" : "text-slate-400"
              }`}
            >
              {isAdmin ? "Administrator" : "Member"}
            </p>
            <h1 className="mt-2 text-3xl font-bold">Reset Password</h1>
            <p className="mt-2 text-sm text-slate-400">
              Choose a new password for your CGF account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your new password"
                autoComplete="new-password"
                disabled={loading || Boolean(message)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="mt-2 text-xs text-slate-500">
                Minimum {minimumLength} characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                disabled={loading || Boolean(message)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-300">
                {message}
              </div>
            )}

            {!message ? (
              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-xl px-4 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isAdmin
                    ? "bg-lime-400 text-slate-950 hover:bg-lime-300"
                    : "bg-white text-slate-950 hover:bg-slate-200"
                }`}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(loginPath, { replace: true })}
                className={`w-full rounded-xl px-4 py-3 font-bold transition ${
                  isAdmin
                    ? "bg-lime-400 text-slate-950 hover:bg-lime-300"
                    : "bg-white text-slate-950 hover:bg-slate-200"
                }`}
              >
                Go to {isAdmin ? "Admin Login" : "Member Login"}
              </button>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              to={loginPath}
              className="font-semibold text-white underline underline-offset-4 hover:text-slate-300"
            >
              ← Back to {isAdmin ? "Admin Login" : "Member Login"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
