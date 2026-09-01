const STORAGE_KEY = "cgf_workout_history"

function getWorkoutHistory() {
  try {
    const storedHistory =
      localStorage.getItem(STORAGE_KEY)

    if (!storedHistory) {
      return []
    }

    const parsedHistory =
      JSON.parse(storedHistory)

    if (!Array.isArray(parsedHistory)) {
      return []
    }

    return parsedHistory
  } catch (error) {
    console.error(
      "Unable to load workout history:",
      error,
    )

    return []
  }
}

function saveWorkoutSession(session) {
  const currentHistory =
    getWorkoutHistory()

  const updatedHistory = [
    session,
    ...currentHistory,
  ]

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedHistory),
  )

  return session
}

function getWorkoutStatistics() {
  const history =
    getWorkoutHistory()

  const completedWorkouts =
    history.filter(
      (session) =>
        session.completed === true,
    )

  const totalDuration =
    completedWorkouts.reduce(
      (total, session) =>
        total +
        Number(
          session.durationSeconds || 0,
        ),
      0,
    )

  const totalSets =
    completedWorkouts.reduce(
      (total, session) =>
        total +
        Number(
          session.completedSets || 0,
        ),
      0,
    )

  return {
    totalWorkouts:
      completedWorkouts.length,

    totalDurationSeconds:
      totalDuration,

    totalSets,

    currentStreak:
      calculateStreak(
        completedWorkouts,
      ),
  }
}

function calculateStreak(
  completedWorkouts,
) {
  if (
    completedWorkouts.length === 0
  ) {
    return 0
  }

  const dates = [
    ...new Set(
      completedWorkouts.map(
        (session) =>
          session.date,
      ),
    ),
  ].sort(
    (a, b) =>
      new Date(b) -
      new Date(a),
  )

  let streak = 0

  let currentDate =
    new Date()

  for (const date of dates) {
    const completedDate =
      new Date(date)

    const difference =
      Math.floor(
        (startOfDay(currentDate) -
          startOfDay(
            completedDate,
          )) /
          86400000,
      )

    if (
      difference === 0 ||
      difference === 1
    ) {
      streak += 1

      currentDate =
        completedDate
    } else {
      break
    }
  }

  return streak
}

function startOfDay(date) {
  const result =
    new Date(date)

  result.setHours(
    0,
    0,
    0,
    0,
  )

  return result
}

function clearWorkoutHistory() {
  localStorage.removeItem(
    STORAGE_KEY,
  )
}

export {
  getWorkoutHistory,
  saveWorkoutSession,
  getWorkoutStatistics,
  clearWorkoutHistory,
}