import {
  useEffect,
} from "react"
import {
  useNavigate,
} from "react-router-dom"

import {
  SignUpButton,
  useAuth as useClerkAuth,
} from "@clerk/react"

import {
  useAuth,
} from "../context/AuthContext.jsx"

export default function Register() {
  const navigate =
    useNavigate()

  const {
    isAuthenticated,
    user,
    loading,
  } = useAuth()

  const {
    isLoaded: clerkLoaded,
    isSignedIn,
  } = useClerkAuth()

  useEffect(() => {
    if (
      !loading &&
      clerkLoaded &&
      isSignedIn &&
      isAuthenticated &&
      user
    ) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true })
      } else if (user.role === "trainer") {
        navigate("/trainer", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    }
  }, [
    loading,
    clerkLoaded,
    isSignedIn,
    isAuthenticated,
    user,
    navigate,
  ])

  if (loading || !clerkLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white">
        <p className="text-sm text-slate-400">
          Checking your CGF session...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-950">
            CGF
          </div>

          <h1 className="text-3xl font-bold">
            Create Your Account
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Create your CGF Gym member account with secure Clerk authentication.
          </p>

          <SignUpButton mode="modal">
            <button
              type="button"
              className="mt-8 w-full rounded-xl bg-lime-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-lime-300"
            >
              Create an Account
            </button>
          </SignUpButton>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-5 text-sm font-semibold text-slate-300 underline underline-offset-4 hover:text-white"
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
