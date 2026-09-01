import { useMemo } from "react"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
  getWorkoutHistory,
  getWorkoutStatistics,
} from "../utils/workoutStorage"

function WorkoutHistory() {
  const navigate = useNavigate()

  const history = useMemo(
    () => getWorkoutHistory(),
    [],
  )

  const statistics = useMemo(
    () => getWorkoutStatistics(),
    [],
  )

  return (
    <div className="min-h-screen bg-black pb-28 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-md items-center gap-4 px-5 py-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              My Activity
            </p>

            <h1 className="text-xl font-black">
              Workout History
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 py-6">
        <section className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Dumbbell}
            label="Workouts"
            value={
              statistics.totalWorkouts
            }
          />

          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${statistics.currentStreak} days`}
          />

          <StatCard
            icon={CheckCircle2}
            label="Sets Completed"
            value={
              statistics.totalSets
            }
          />

          <StatCard
            icon={Clock3}
            label="Training Time"
            value={formatTotalDuration(
              statistics.totalDurationSeconds,
            )}
          />
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Training activity
            </p>

            <h2 className="mt-1 text-lg font-black">
              Completed Workouts
            </h2>
          </div>

          {history.length === 0 ? (
            <EmptyHistory
              onStart={() =>
                navigate("/workout")
              }
            />
          ) : (
            <div className="space-y-3">
              {history.map(
                (session) => (
                  <WorkoutHistoryCard
                    key={session.id}
                    session={session}
                  />
                ),
              )}
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black">
        <Icon size={18} />
      </div>

      <p className="mt-4 text-xl font-black">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-600">
        {label}
      </p>
    </div>
  )
}

function WorkoutHistoryCard({
  session,
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-400 text-black">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <h3 className="text-base font-black">
              {session.programName}
            </h3>

            <p className="mt-1 text-xs text-gray-600">
              {formatDate(session.date)}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-lime-400/10 px-3 py-1 text-[9px] font-black text-lime-400">
          COMPLETED
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <HistoryValue
          label="Duration"
          value={formatDuration(
            session.durationSeconds,
          )}
        />

        <HistoryValue
          label="Sets"
          value={`${session.completedSets}/${session.totalSets}`}
        />

        <HistoryValue
          label="Progress"
          value={`${session.completionPercentage}%`}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
        <CalendarDays size={14} />

        {session.day}
      </div>
    </article>
  )
}

function HistoryValue({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-black p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-white">
        {value}
      </p>
    </div>
  )
}

function EmptyHistory({
  onStart,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-gray-600">
        <Dumbbell size={24} />
      </div>

      <h3 className="mt-5 text-lg font-black">
        No workouts yet
      </h3>

      <p className="mt-2 text-xs leading-5 text-gray-600">
        Complete your first CGF workout and your training history will
        appear here.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="mt-5 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black"
      >
        START TODAY'S WORKOUT
      </button>
    </div>
  )
}

function BottomNavigation() {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-3 px-5 py-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <CalendarDays size={19} />

          <span className="text-[10px] font-bold">
            Home
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/workout-history")
          }
          className="flex flex-col items-center gap-1 text-yellow-400"
        >
          <Flame size={19} />

          <span className="text-[10px] font-bold">
            Progress
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/profile")
          }
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <Dumbbell size={19} />

          <span className="text-[10px] font-bold">
            Profile
          </span>
        </button>
      </div>
    </nav>
  )
}

function formatDate(dateString) {
  if (!dateString) {
    return "Unknown date"
  }

  const date = new Date(
    `${dateString}T00:00:00`,
  )

  return date.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  )
}

function formatDuration(totalSeconds) {
  const seconds =
    Number(totalSeconds) || 0

  const hours = Math.floor(
    seconds / 3600,
  )

  const minutes = Math.floor(
    (seconds % 3600) / 60,
  )

  const remainingSeconds =
    seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${remainingSeconds}s`
}

function formatTotalDuration(
  totalSeconds,
) {
  const seconds =
    Number(totalSeconds) || 0

  const hours = Math.floor(
    seconds / 3600,
  )

  const minutes = Math.floor(
    (seconds % 3600) / 60,
  )

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

export default WorkoutHistory