import {
  useEffect,
  useState,
} from "react"

import {
  useLocation,
  useNavigate,
} from "react-router-dom"

import {
  useAuth,
} from "../context/AuthContext.jsx"

export default function AdminLogin() {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const {
    login,
    logout,
    isAdmin,
    loading: authLoading,
  } = useAuth()

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [error, setError] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  /*
  |--------------------------------------------------------------------------
  | If an admin is already authenticated,
  | go directly to the admin dashboard.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !authLoading &&
      isAdmin
    ) {
      navigate(
        "/admin",
        {
          replace: true,
        },
      )
    }
  }, [
    authLoading,
    isAdmin,
    navigate,
  ])

  /*
  |--------------------------------------------------------------------------
  | Admin Login
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (event) => {
      event.preventDefault()

      setError("")

      if (
        !email.trim() ||
        !password
      ) {
        setError(
          "Please enter the administrator email and password.",
        )

        return
      }

      try {
        setLoading(true)

        /*
        |--------------------------------------------------------------------------
        | Important:
        | login() replaces the existing member authentication
        | with the newly authenticated account.
        |--------------------------------------------------------------------------
        */

        const result =
          await login(
            email.trim(),
            password,
          )

        const loggedInUser =
          result?.user

        /*
        |--------------------------------------------------------------------------
        | Security check:
        | The account MUST actually be an admin.
        |--------------------------------------------------------------------------
        */

        if (
          loggedInUser?.role !==
          "admin"
        ) {
          /*
          |--------------------------------------------------------------------------
          | Remove the member session if somebody entered
          | a member account here.
          |--------------------------------------------------------------------------
          */

          logout()

          setError(
            "This account is not an administrator account.",
          )

          return
        }

        /*
        |--------------------------------------------------------------------------
        | Admin authenticated successfully.
        |--------------------------------------------------------------------------
        */

        const destination =
          location.state?.from ||
          "/admin"

        navigate(
          destination,
          {
            replace: true,
          },
        )
      } catch (loginError) {
        console.error(
          "Admin login error:",
          loginError,
        )

        setError(
          loginError.message ||
            "Unable to sign in as administrator.",
        )
      } finally {
        setLoading(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm text-gray-500">
          Loading...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">

      <div className="mx-auto flex min-h-[85vh] w-full max-w-md items-center justify-center">

        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">

          {/* ============================================================ */}
          {/* HEADER                                                        */}
          {/* ============================================================ */}

          <div className="mb-8 text-center">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-400 text-xl font-black text-black">
              CGF
            </div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">
              Administrator
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Admin Login
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Sign in to access the CGF admin dashboard.
            </p>

          </div>

          {/* ============================================================ */}
          {/* FORM                                                          */}
          {/* ============================================================ */}

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-5"
          >

            {/* Email */}

            <div>

              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Administrator Email
              </label>

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="Enter admin email"
                autoComplete="username"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* Password */}

            <div>

              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Password
              </label>

              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter admin password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* Error */}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-lime-400 px-4 py-3 font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing in..."
                : "ADMIN SIGN IN"}
            </button>

          </form>

          {/* ============================================================ */}
          {/* MEMBER LOGIN                                                   */}
          {/* ============================================================ */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/login",
              )
            }
            className="mt-6 w-full text-center text-xs font-bold text-gray-500 transition hover:text-white"
          >
            ← Back to Member Login
          </button>

        </div>

      </div>

    </div>
  )
}