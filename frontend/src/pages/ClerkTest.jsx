import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/react"

export default function ClerkTest() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-bold uppercase tracking-wider text-lime-400">
          CGF Fitness
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Clerk Authentication Test
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          This is a temporary test page. We are not replacing the real CGF
          login system yet.
        </p>

        <div className="mt-8">
          <Show when="signed-out">
            <div className="flex flex-col gap-3">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-xl bg-lime-400 px-5 py-3 font-bold text-slate-950"
                >
                  Sign in with Clerk
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-bold text-white"
                >
                  Create Clerk Account
                </button>
              </SignUpButton>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-5">
              <p className="font-bold text-lime-400">
                Clerk authentication is working.
              </p>

              <p className="mt-2 text-sm text-slate-300">
                You are signed in. Use the avatar below to test Clerk's account
                controls and sign out.
              </p>

              <div className="mt-5">
                <UserButton />
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
