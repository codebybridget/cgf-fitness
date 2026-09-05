import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext.jsx"

export default function Login() {
  const navigate = useNavigate()

  const { login, isAuthenticated, user } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const redirectByRole = (loggedInUser) => {
    const role = loggedInUser?.role

    console.log("LOGIN ROLE:", role)
    console.log("LOGIN USER:", loggedInUser)

    if (role === "admin") {
      navigate("/admin", { replace: true })
      return
    }

    if (role === "trainer") {
      navigate("/trainer", { replace: true })
      return
    }

    if (role === "member") {
      navigate("/dashboard", { replace: true })
      return
    }

    setError(
      "Your account does not have a valid role. Please contact CGF administration.",
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }

    try {
      setLoading(true)

      const result = await login(email.trim(), password)
      const loggedInUser = result?.user

      if (!loggedInUser) {
        throw new Error(
          "Login succeeded, but no user information was returned.",
        )
      }

      redirectByRole(loggedInUser)
    } catch (loginError) {
      console.error("Login error:", loginError)
      setError(loginError?.message || "Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-bold text-white">You are already signed in</h1>
          <p className="mt-3 text-sm text-slate-400">Signed in as {user.email}</p>
          <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">
            Role: {user.role || "unknown"}
          </p>
          <button
            type="button"
            onClick={() => redirectByRole(user)}
            className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-950">
              CGF
            </div>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to your CGF Gym account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-white/30 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-slate-300 underline underline-offset-4 hover:text-white"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-4 py-3 font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-slate-400">
              Don't have a CGF Gym account?
            </p>

            <Link
              to="/register"
              className="mt-2 inline-block text-base font-bold text-lime-400 underline underline-offset-4 transition hover:text-lime-300"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
