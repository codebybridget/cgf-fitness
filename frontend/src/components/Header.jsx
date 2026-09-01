import { Bell } from "lucide-react"

function Header() {
  return (
    <header className="border-b border-white/10 bg-black">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
        <div>
          <p className="text-2xl font-black tracking-tight text-white">
            CGF
          </p>

          <p className="text-xs font-semibold text-lime-400">
            Complete Gym & Fitness
          </p>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
        >
          <Bell size={20} strokeWidth={2} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow-400" />
        </button>
      </div>
    </header>
  )
}

export default Header