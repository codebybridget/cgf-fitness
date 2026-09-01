import {
  useEffect,
  useState,
} from "react"

import {
  ArrowRight,
  CalendarDays,
  Flame,
  Loader2,
  UserRound,
} from "lucide-react"

import {
  useNavigate,
} from "react-router-dom"

import TodayWorkoutCard from "../components/TodayWorkoutCard"

import getTodayWorkout from "../utils/getTodayWorkout"

import {
  getWorkoutStatistics,
} from "../utils/workoutStorage"

import {
  useAuth,
} from "../context/AuthContext.jsx"

function Home() {
  const navigate =
    useNavigate()

  const {
    user,
  } = useAuth()

  const [
    todayWorkout,
    setTodayWorkout,
  ] = useState(null)

  const [
    workoutLoading,
    setWorkoutLoading,
  ] = useState(true)

  const [
    workoutError,
    setWorkoutError,
  ] = useState("")

  const [
    statistics,
    setStatistics,
  ] = useState({
    currentStreak: 0,
    totalWorkouts: 0,
  })

  /*
  |--------------------------------------------------------------------------
  | Member name
  |--------------------------------------------------------------------------
  */

  const firstName =
    user?.firstName ||
    user?.firstname ||
    user?.name
      ?.trim()
      ?.split(" ")[0] ||
    user?.fullName
      ?.trim()
      ?.split(" ")[0] ||
    "Member"

  /*
  |--------------------------------------------------------------------------
  | Load today's workout from backend
  |--------------------------------------------------------------------------
  */

  const loadTodayWorkout =
    async () => {
      try {
        setWorkoutLoading(
          true,
        )

        setWorkoutError("")

        const result =
          await getTodayWorkout()

        console.log(
          "TODAY WORKOUT:",
          result,
        )

        setTodayWorkout(
          result,
        )
      } catch (error) {
        console.error(
          "Unable to load today's workout:",
          error,
        )

        setWorkoutError(
          error?.message ||
            "Unable to load today's workout.",
        )

        setTodayWorkout(null)
      } finally {
        setWorkoutLoading(
          false,
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Load workout on page open
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    const load = async () => {
      if (!mounted) {
        return
      }

      await loadTodayWorkout()
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Load statistics
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const stored =
        getWorkoutStatistics()

      setStatistics({
        currentStreak:
          Number(
            stored?.currentStreak,
          ) || 0,

        totalWorkouts:
          Number(
            stored?.totalWorkouts,
          ) || 0,
      })
    } catch (error) {
      console.error(
        "Unable to load statistics:",
        error,
      )
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Start workout
  |--------------------------------------------------------------------------
  */

  const handleStartWorkout =
    () => {
      console.log(
        "START TODAY'S WORKOUT CLICKED",
      )

      console.log(
        "Workout being passed:",
        todayWorkout,
      )

      /*
      |--------------------------------------------------------------------------
      | Make sure an actual workout exists
      |--------------------------------------------------------------------------
      */

      if (
        !todayWorkout?.hasWorkout ||
        !todayWorkout?.workout
      ) {
        console.warn(
          "No assigned workout available.",
        )

        return
      }

      /*
      |--------------------------------------------------------------------------
      | Navigate to workout page.
      |
      | We pass BOTH:
      |
      | - React Router state
      | - Query parameters
      |
      | This makes the workout page reliable even if the
      | navigation state is lost during refresh.
      |--------------------------------------------------------------------------
      */

      const assignmentId =
        todayWorkout
          ?.assignmentId ||
        todayWorkout
          ?.workout
          ?.assignmentId

      const programId =
        todayWorkout
          ?.program
          ?._id ||
        todayWorkout
          ?.workout
          ?.program
          ?._id

      const date =
        todayWorkout?.date ||
        todayWorkout
          ?.workout
          ?.workoutDate ||
        new Date()
          .toISOString()
          .split("T")[0]

      /*
      |--------------------------------------------------------------------------
      | Build URL
      |--------------------------------------------------------------------------
      */

      const params =
        new URLSearchParams()

      if (assignmentId) {
        params.set(
          "assignmentId",
          assignmentId,
        )
      }

      if (programId) {
        params.set(
          "programId",
          programId,
        )
      }

      if (date) {
        params.set(
          "date",
          date,
        )
      }

      const query =
        params.toString()

      const workoutUrl =
        query
          ? `/workout?${query}`
          : "/workout"

      console.log(
        "Navigating to:",
        workoutUrl,
      )

      /*
      |--------------------------------------------------------------------------
      | Navigate
      |--------------------------------------------------------------------------
      */

      navigate(
        workoutUrl,
        {
          replace: false,

          state: {
            date,

            assignmentId,

            programId,

            workout:
              todayWorkout.workout,

            program:
              todayWorkout.program,
          },
        },
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-black pb-28 text-white">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}

      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
          <div>
            <p className="text-2xl font-black tracking-tight">
              CGF
            </p>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-400">
              Fitness
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/profile",
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Open profile"
          >
            <UserRound
              size={19}
            />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 py-6">
        {/* ---------------------------------------------------------------- */}
        {/* Welcome */}
        {/* ---------------------------------------------------------------- */}

        <section className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-black">
            {firstName}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Here's your CGF training plan for today.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Workout */}
        {/* ---------------------------------------------------------------- */}

        {workoutLoading ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2
                size={28}
                className="animate-spin text-lime-400"
              />

              <p className="mt-4 text-sm font-bold text-white">
                Loading today's workout...
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Checking your assigned training plan.
              </p>
            </div>
          </section>
        ) : workoutError ? (
          <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="text-sm font-black text-red-300">
              Unable to load workout
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              {workoutError}
            </p>

            <button
              type="button"
              onClick={
                loadTodayWorkout
              }
              className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-black text-black transition hover:bg-gray-200"
            >
              TRY AGAIN
            </button>
          </section>
        ) : (
          <TodayWorkoutCard
            workout={
              todayWorkout
            }
            onStart={
              handleStartWorkout
            }
          />
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Statistics */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/workout-history",
              )
            }
            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-yellow-400/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black">
              <Flame size={18} />
            </div>

            <p className="mt-4 text-2xl font-black">
              {
                statistics.currentStreak
              }
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Day streak
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/progress",
              )
            }
            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-lime-400/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
              <CalendarDays
                size={18}
              />
            </div>

            <p className="mt-4 text-2xl font-black">
              {
                statistics.totalWorkouts
              }
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Workouts completed
            </p>
          </button>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Weekly training */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Weekly training
              </p>

              <h2 className="mt-1 text-lg font-black">
                Your CGF week
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/weekly-schedule",
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 transition hover:bg-white/10"
              aria-label="View weekly schedule"
            >
              <ArrowRight
                size={16}
              />
            </button>
          </div>

          <div className="mt-5 space-y-2">
            <ScheduleRow
              day="Mon"
              workout="View schedule"
            />

            <ScheduleRow
              day="Tue"
              workout="View schedule"
            />

            <ScheduleRow
              day="Wed"
              workout="View schedule"
            />

            <ScheduleRow
              day="Thu"
              workout="View schedule"
            />

            <ScheduleRow
              day="Fri"
              workout="View schedule"
            />

            <ScheduleRow
              day="Sat"
              workout="View schedule"
            />

            <ScheduleRow
              day="Sun"
              workout="View schedule"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/weekly-schedule",
              )
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-black transition hover:bg-gray-200"
          >
            VIEW FULL SCHEDULE

            <ArrowRight
              size={14}
            />
          </button>
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Schedule Row
|--------------------------------------------------------------------------
*/

function ScheduleRow({
  day,
  workout,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
      <p className="w-10 text-xs font-black text-gray-500">
        {day}
      </p>

      <p className="flex-1 text-xs font-bold text-gray-400">
        {workout}
      </p>

      <ArrowRight
        size={14}
        className="text-gray-700"
      />
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Bottom Navigation
|--------------------------------------------------------------------------
*/

function BottomNavigation() {
  const navigate =
    useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-3 px-5 py-3">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard",
            )
          }
          className="flex flex-col items-center gap-1 text-yellow-400"
        >
          <CalendarDays
            size={19}
          />

          <span className="text-[10px] font-bold">
            Home
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/progress",
            )
          }
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <Flame size={19} />

          <span className="text-[10px] font-bold">
            Progress
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/profile",
            )
          }
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <UserRound
            size={19}
          />

          <span className="text-[10px] font-bold">
            Profile
          </span>
        </button>
      </div>
    </nav>
  )
}

export default Home