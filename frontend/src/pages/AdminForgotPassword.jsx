import { useState } from "react"
import { Link } from "react-router-dom"
import { requestAdminPasswordReset } from "../api/passwordReset.js"

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!email.trim()) {
      setError("Please enter the administrator email address.")
      return
    }

    try {
      setLoading(true)
      const result = await requestAdminPasswordReset(email.trim())
      setMessage(
        result?.message ||
          "If an account matches that email, a password reset link has been sent.",
      )
    } catch (requestError) {
      console.error("Admin password reset request error:", requestError)
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to process your request.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-400 text-xl font-black text-black">
              CGF
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">
              Administrator
            </p>
            <h1 className="mt-2 text-3xl font-black">Forgot Password?</h1>
            <p className="mt-2 text-sm text-gray-500">
              Enter your administrator email and we&apos;ll send you a secure password reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-reset-email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Administrator Email
              </label>
              <input
                id="admin-reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter admin email"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-lime-400 px-4 py-3 font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              to="/admin-login"
              className="font-semibold text-white underline underline-offset-4 hover:text-gray-300"
            >
              ← Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
