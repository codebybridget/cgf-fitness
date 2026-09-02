import {
  getMyTodayWorkout,
  getMyPrograms,
} from "../api/api.js"

/*
|--------------------------------------------------------------------------
| Get today's workout
|--------------------------------------------------------------------------
|
| The Dashboard uses the same MongoDB assignment source as the
| Weekly Schedule.
|
| We first try the dedicated /my-today endpoint.
| If that endpoint says there is no workout, we fall back to
| /my-programs and determine today's assignment on the client
| using the user's actual calendar date.
|
*/

function getTodayDateString() {
  const now = new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(2, "0")

  const day =
    String(
      now.getDate(),
    ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/*
|--------------------------------------------------------------------------
| Convert a date value to YYYY-MM-DD
|--------------------------------------------------------------------------
|
| Important:
| We intentionally use the calendar date represented by the value.
| This prevents timezone shifts from causing today's assignment
| to appear as tomorrow/yesterday.
|
*/

function parseDateOnly(value) {
  if (!value) {
    return null
  }

  const stringValue =
    String(value)

  /*
  |--------------------------------------------------------------------------
  | ISO date already in YYYY-MM-DD format
  |--------------------------------------------------------------------------
  */

  const match =
    stringValue.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    )

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0")

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/*
|--------------------------------------------------------------------------
| Check whether assignment covers today
|--------------------------------------------------------------------------
*/

function assignmentCoversToday(
  assignment,
  today,
) {
  if (!assignment) {
    return false
  }

  /*
  |--------------------------------------------------------------------------
  | Only active assignments
  |--------------------------------------------------------------------------
  */

  if (
    assignment.status &&
    assignment.status !==
      "active"
  ) {
    return false
  }

  const startDate =
    parseDateOnly(
      assignment.startDate,
    )

  if (!startDate) {
    return false
  }

  /*
  |--------------------------------------------------------------------------
  | Assignment has not started
  |--------------------------------------------------------------------------
  */

  if (
    startDate >
    today
  ) {
    return false
  }

  /*
  |--------------------------------------------------------------------------
  | Assignment has ended
  |--------------------------------------------------------------------------
  */

  const endDate =
    parseDateOnly(
      assignment.endDate,
    )

  if (
    endDate &&
    endDate <
      today
  ) {
    return false
  }

  return true
}

/*
|--------------------------------------------------------------------------
| Find today's assignment
|--------------------------------------------------------------------------
*/

function findTodayAssignment(
  assignments,
  today,
) {
  if (
    !Array.isArray(
      assignments,
    )
  ) {
    return null
  }

  const matching =
    assignments.filter(
      (assignment) =>
        assignmentCoversToday(
          assignment,
          today,
        ),
    )

  if (
    matching.length ===
    0
  ) {
    return null
  }

  /*
  |--------------------------------------------------------------------------
  | If multiple assignments somehow exist,
  | use the newest start date.
  |--------------------------------------------------------------------------
  */

  matching.sort(
    (
      first,
      second,
    ) => {
      const firstDate =
        parseDateOnly(
          first.startDate,
        ) || ""

      const secondDate =
        parseDateOnly(
          second.startDate,
        ) || ""

      return secondDate.localeCompare(
        firstDate,
      )
    },
  )

  return matching[0]
}

/*
|--------------------------------------------------------------------------
| Build normalized workout
|--------------------------------------------------------------------------
*/

function buildWorkoutResult(
  assignment,
  today,
) {
  if (!assignment) {
    return {
      hasWorkout: false,

      day:
        new Date().toLocaleDateString(
          "en-US",
          {
            weekday:
              "long",
          },
        ),

      date:
        today,

      workout: null,

      workoutType:
        "rest",

      title:
        "Rest Day",

      description:
        "No workout has been assigned for today.",

      startTime: "",

      endTime: "",

      location:
        "CGF Gym",

      duration: "",

      trainerAssigned:
        false,
    }
  }

  const program =
    assignment.program ||
    {}

  const exercises =
    Array.isArray(
      program.exercises,
    )
      ? program.exercises
      : []

  const totalSets =
    exercises.reduce(
      (
        total,
        exercise,
      ) =>
        total +
        (Number(
          exercise?.sets,
        ) || 0),
      0,
    )

  const workout = {
    assignmentId:
      assignment._id ||
      assignment.id,

    startDate:
      assignment.startDate,

    endDate:
      assignment.endDate,

    notes:
      assignment.notes ||
      "",

    program,
  }

  return {
    hasWorkout: true,

    date:
      today,

    day:
      new Date().toLocaleDateString(
        "en-US",
        {
          weekday:
            "long",
        },
      ),

    workout,

    assignmentId:
      assignment._id ||
      assignment.id,

    program,

    workoutType:
      program.workoutType ||
      "Workout",

    title:
      program.name ||
      program.workoutType ||
      "Today's Workout",

    description:
      program.description ||
      assignment.notes ||
      "Complete your assigned training session.",

    duration:
      program.estimatedDuration
        ? `${program.estimatedDuration} min`
        : "60 min",

    totalExercises:
      exercises.length,

    totalSets,

    difficulty:
      program.difficulty ||
      "Beginner",

    startTime: "",

    endTime: "",

    location:
      "CGF Gym",

    trainerAssigned:
      true,

    notes:
      assignment.notes ||
      program.trainerNotes ||
      "",
  }
}

/*
|--------------------------------------------------------------------------
| Get today's workout
|--------------------------------------------------------------------------
*/

async function getTodayWorkout() {
  const today =
    getTodayDateString()

  /*
  |--------------------------------------------------------------------------
  | FIRST: Try the dedicated backend endpoint
  |--------------------------------------------------------------------------
  */

  try {
    const response =
      await getMyTodayWorkout()

    console.log(
      "TODAY WORKOUT API RESPONSE:",
      response,
    )

    /*
    |--------------------------------------------------------------------------
    | Backend returned a workout
    |--------------------------------------------------------------------------
    */

    if (
      response?.hasWorkout &&
      response?.workout
    ) {
      const workout =
        response.workout

      const assignment = {
        _id:
          workout.assignmentId,

        id:
          workout.assignmentId,

        startDate:
          workout.startDate,

        endDate:
          workout.endDate,

        notes:
          workout.notes,

        program:
          workout.program,
      }

      return buildWorkoutResult(
        assignment,
        response.date ||
          today,
      )
    }

    console.warn(
      "Dedicated today-workout endpoint returned no workout. Falling back to member assignments.",
    )
  } catch (error) {
    console.warn(
      "Today's workout endpoint failed. Falling back to member assignments.",
      error,
    )
  }

  /*
  |--------------------------------------------------------------------------
  | SECOND: Use the same source as Weekly Schedule
  |--------------------------------------------------------------------------
  */

  try {
    const response =
      await getMyPrograms()

    console.log(
      "MEMBER PROGRAM ASSIGNMENTS:",
      response,
    )

    const assignments =
      Array.isArray(
        response?.assignments,
      )
        ? response.assignments
        : []

    const assignment =
      findTodayAssignment(
        assignments,
        today,
      )

    if (assignment) {
      console.log(
        "TODAY'S ASSIGNMENT FOUND:",
        assignment,
      )

      return buildWorkoutResult(
        assignment,
        today,
      )
    }

    /*
    |--------------------------------------------------------------------------
    | No assignment for today
    |--------------------------------------------------------------------------
    */

    console.log(
      "No assignment covers today's date:",
      today,
    )

    return {
      hasWorkout: false,

      day:
        new Date().toLocaleDateString(
          "en-US",
          {
            weekday:
              "long",
          },
        ),

      date:
        today,

      workout: null,

      workoutType:
        "rest",

      title:
        "Rest Day",

      description:
        "No workout has been assigned for today.",

      startTime: "",

      endTime: "",

      location:
        "CGF Gym",

      duration: "",

      trainerAssigned:
        false,
    }
  } catch (error) {
    console.error(
      "Unable to retrieve today's workout from member assignments:",
      error,
    )

    /*
    |--------------------------------------------------------------------------
    | Do not crash Dashboard
    |--------------------------------------------------------------------------
    */

    return {
      hasWorkout: false,

      day:
        new Date().toLocaleDateString(
          "en-US",
          {
            weekday:
              "long",
          },
        ),

      date:
        today,

      workout: null,

      workoutType:
        "rest",

      title:
        "Workout Unavailable",

      description:
        "We could not retrieve today's workout. Please try again.",

      startTime: "",

      endTime: "",

      location:
        "CGF Gym",

      duration: "",

      trainerAssigned:
        false,

      error: true,
    }
  }
}

export default getTodayWorkout