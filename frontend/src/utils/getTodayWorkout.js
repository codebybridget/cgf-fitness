import {
  getMyTodayWorkout,
} from "../api/api.js"

/*
|--------------------------------------------------------------------------
| Get today's workout
|--------------------------------------------------------------------------
|
| This function now gets the member's real assigned workout
| from the backend instead of using the hard-coded weekly schedule.
|
*/

async function getTodayWorkout() {
  try {
    const response =
      await getMyTodayWorkout()

    /*
    |--------------------------------------------------------------------------
    | No workout assigned
    |--------------------------------------------------------------------------
    */

    if (
      !response?.hasWorkout ||
      !response?.workout
    ) {
      return {
        hasWorkout: false,

        day:
          response?.day ||
          new Date().toLocaleDateString(
            "en-US",
            {
              weekday:
                "long",
            },
          ),

        date:
          response?.date ||
          new Date()
            .toISOString()
            .split("T")[0],

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

    /*
    |--------------------------------------------------------------------------
    | Real backend workout
    |--------------------------------------------------------------------------
    */

    const workout =
      response.workout

    const program =
      workout.program || {}

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

    return {
      hasWorkout: true,

      date:
        response.date,

      day:
        response.day,

      workout,

      assignmentId:
        workout.assignmentId,

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
        workout.notes ||
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
        Boolean(
          workout.assignmentId,
        ),

      notes:
        workout.notes ||
        program.trainerNotes ||
        "",
    }
  } catch (error) {
    console.error(
      "Get today's workout error:",
      error,
    )

    /*
    |--------------------------------------------------------------------------
    | Do not crash the dashboard
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
        new Date()
          .toISOString()
          .split("T")[0],

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