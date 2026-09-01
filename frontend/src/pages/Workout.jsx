import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  Play,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useLocation,
  useNavigate,
} from "react-router-dom"

import {
  getMyPrograms,
  getMyTodayWorkout,
} from "../api/api.js"

import api from "../api/api.js"

function Workout() {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  /*
  |--------------------------------------------------------------------------
  | Read workout information from both:
  |
  | 1. React Router state
  | 2. URL query parameters
  |
  | This allows the workout page to work whether the user came from:
  |
  | Home
  | Weekly Schedule
  | Direct URL
  |--------------------------------------------------------------------------
  */

  const queryParams = useMemo(
    () =>
      new URLSearchParams(
        location.search,
      ),
    [location.search],
  )

  const routeState =
    location.state || {}

  const stateWorkout =
    routeState.workout || null

  const assignmentId =
    queryParams.get(
      "assignmentId",
    ) ||
    routeState.assignmentId ||
    stateWorkout?.assignmentId ||
    null

  const requestedDate =
    queryParams.get(
      "date",
    ) ||
    routeState.date ||
    null

  const [assignment, setAssignment] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [
    completedSets,
    setCompletedSets,
  ] = useState({})

  const [
    actualValues,
    setActualValues,
  ] = useState({})

  const [
    workoutCompleted,
    setWorkoutCompleted,
  ] = useState(false)

  const [
    caloriesBurned,
    setCaloriesBurned,
  ] = useState(0)

  const [
    savingSet,
    setSavingSet,
  ] = useState("")

  const [
    completingWorkout,
    setCompletingWorkout,
  ] = useState(false)

  /*
  |--------------------------------------------------------------------------
  | Load assigned workout
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    const loadWorkout =
      async () => {
        try {
          setLoading(true)
          setError("")

          /*
          |--------------------------------------------------------------------------
          | If Home already supplied the complete workout,
          | use it immediately.
          |--------------------------------------------------------------------------
          */

          if (
            stateWorkout?.program
          ) {
            const localAssignment =
              normalizeWorkoutAssignment(
                stateWorkout,
              )

            if (mounted) {
              setAssignment(
                localAssignment,
              )
            }

            /*
            |--------------------------------------------------------------------------
            | Try to retrieve the existing workout log.
            |--------------------------------------------------------------------------
            */

            await restoreExistingLog(
              localAssignment,
              mounted,
              setCompletedSets,
              setActualValues,
              setWorkoutCompleted,
              setCaloriesBurned,
            )

            return
          }

          /*
          |--------------------------------------------------------------------------
          | Today's workout endpoint
          |--------------------------------------------------------------------------
          */

          let selectedAssignment =
            null

          try {
            const todayResponse =
              await getMyTodayWorkout()

            selectedAssignment =
              extractAssignment(
                todayResponse,
              )
          } catch (
            todayError
          ) {
            console.warn(
              "Today's workout endpoint could not be loaded:",
              todayError,
            )
          }

          /*
          |--------------------------------------------------------------------------
          | Get all member assignments.
          |
          | This is important for:
          |
          | - Tomorrow
          | - Future dates
          | - Weekly schedule
          |--------------------------------------------------------------------------
          */

          const programsResponse =
            await getMyPrograms()

          const assignments =
            extractAssignments(
              programsResponse,
            )

          /*
          |--------------------------------------------------------------------------
          | Exact assignment ID
          |--------------------------------------------------------------------------
          */

          if (
            assignmentId &&
            assignments.length > 0
          ) {
            const exactAssignment =
              assignments.find(
                (item) =>
                  String(
                    item?._id,
                  ) ===
                    String(
                      assignmentId,
                    ) ||
                  String(
                    item?.id,
                  ) ===
                    String(
                      assignmentId,
                    ),
              )

            if (
              exactAssignment
            ) {
              selectedAssignment =
                exactAssignment
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Requested date
          |--------------------------------------------------------------------------
          */

          if (
            requestedDate &&
            assignments.length > 0
          ) {
            const dateAssignment =
              findAssignmentForDate(
                assignments,
                requestedDate,
              )

            if (
              dateAssignment
            ) {
              selectedAssignment =
                dateAssignment
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Final current assignment fallback
          |--------------------------------------------------------------------------
          */

          if (
            !selectedAssignment &&
            assignments.length > 0
          ) {
            selectedAssignment =
              findCurrentAssignment(
                assignments,
              )
          }

          /*
          |--------------------------------------------------------------------------
          | No assignment
          |--------------------------------------------------------------------------
          */

          if (!mounted) {
            return
          }

          if (
            !selectedAssignment
          ) {
            setAssignment(null)

            setError(
              "No workout has been assigned to you for this date.",
            )

            return
          }

          /*
          |--------------------------------------------------------------------------
          | Normalize assignment
          |--------------------------------------------------------------------------
          */

          selectedAssignment =
            normalizeWorkoutAssignment(
              selectedAssignment,
            )

          setAssignment(
            selectedAssignment,
          )

          /*
          |--------------------------------------------------------------------------
          | Restore existing log
          |--------------------------------------------------------------------------
          */

          await restoreExistingLog(
            selectedAssignment,
            mounted,
            setCompletedSets,
            setActualValues,
            setWorkoutCompleted,
            setCaloriesBurned,
          )
        } catch (error) {
          console.error(
            "Unable to load workout:",
            error,
          )

          if (mounted) {
            setError(
              error?.response?.data
                ?.message ||
                "Unable to load your workout.",
            )
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }

    loadWorkout()

    return () => {
      mounted = false
    }
  }, [
    assignmentId,
    requestedDate,
    stateWorkout,
  ])

  /*
  |--------------------------------------------------------------------------
  | Program
  |--------------------------------------------------------------------------
  */

  const program =
    assignment?.program || null

  const exercises =
    Array.isArray(
      program?.exercises,
    )
      ? [
          ...program.exercises,
        ].sort(
          (
            first,
            second,
          ) =>
            Number(
              first?.order || 0,
            ) -
            Number(
              second?.order || 0,
            ),
        )
      : []

  /*
  |--------------------------------------------------------------------------
  | Total sets
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Completed sets
  |--------------------------------------------------------------------------
  */

  const completedSetCount =
    Object.values(
      completedSets,
    ).filter(Boolean).length

  /*
  |--------------------------------------------------------------------------
  | Completion percentage
  |--------------------------------------------------------------------------
  */

  const completionPercentage =
    totalSets > 0
      ? Math.min(
          Math.round(
            (completedSetCount /
              totalSets) *
              100,
          ),
          100,
        )
      : 0

  /*
  |--------------------------------------------------------------------------
  | Toggle set
  |--------------------------------------------------------------------------
  */

  const toggleSet =
    async (
      exercise,
      setNumber,
    ) => {
      const exerciseId =
        getExerciseId(
          exercise,
        )

      if (!exerciseId) {
        setError(
          "This exercise does not have a valid ID.",
        )

        return
      }

      const key =
        `${exerciseId}-${setNumber}`

      const currentlyCompleted =
        Boolean(
          completedSets[key],
        )

      const repsValue =
        actualValues[
          `${key}-reps`
        ]

      const weightValue =
        actualValues[
          `${key}-weight`
        ]

      setSavingSet(key)
      setError("")

      try {
        /*
        |--------------------------------------------------------------------------
        | Uncomplete
        |--------------------------------------------------------------------------
        */

        if (
          currentlyCompleted
        ) {
          await api.post(
            "/workout-logs/set/uncomplete",
            {
              exerciseId,
              setNumber,

              workoutDate:
                requestedDate ||
                getWorkoutDate(
                  assignment,
                ),
            },
          )

          setCompletedSets(
            (current) => ({
              ...current,
              [key]: false,
            }),
          )

          return
        }

        /*
        |--------------------------------------------------------------------------
        | Complete
        |--------------------------------------------------------------------------
        */

        await api.post(
          "/workout-logs/set/complete",
          {
            exerciseId,

            setNumber,

            actualReps:
              repsValue === "" ||
              repsValue ===
                undefined ||
              repsValue === null
                ? null
                : Number(
                    repsValue,
                  ),

            actualWeight:
              weightValue ||
              getTargetWeight(
                exercise,
              ),

            workoutDate:
              requestedDate ||
              getWorkoutDate(
                assignment,
              ),
          },
        )

        setCompletedSets(
          (current) => ({
            ...current,
            [key]: true,
          }),
        )
      } catch (error) {
        console.error(
          "Unable to update set:",
          error,
        )

        setError(
          error?.response?.data
            ?.message ||
            "Unable to save this set.",
        )
      } finally {
        setSavingSet("")
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Actual performance values
  |--------------------------------------------------------------------------
  */

  const updateActualValue =
    (
      exercise,
      setNumber,
      field,
      value,
    ) => {
      const exerciseId =
        getExerciseId(
          exercise,
        )

      const key =
        `${exerciseId}-${setNumber}-${field}`

      setActualValues(
        (current) => ({
          ...current,
          [key]: value,
        }),
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Complete workout
  |--------------------------------------------------------------------------
  */

  const handleCompleteWorkout =
    async () => {
      if (!assignment) {
        return
      }

      if (
        totalSets > 0 &&
        completedSetCount <
          totalSets
      ) {
        setError(
          `Please complete all ${totalSets} workout sets before finishing the workout.`,
        )

        return
      }

      try {
        setCompletingWorkout(
          true,
        )

        setError("")

        const response =
          await api.post(
            "/workout-logs/complete",
            {
              assignmentId:
                assignment._id ||
                assignment.id,

              programId:
                program?._id ||
                program?.id,

              workoutDate:
                requestedDate ||
                getWorkoutDate(
                  assignment,
                ),
            },
          )

        const completedLog =
          response?.data
            ?.workoutLog ||
          response?.data?.log

        const calculatedCalories =
          Number(
            response?.data
              ?.caloriesBurned ||
              completedLog?.caloriesBurned ||
              calculateCalories(
                program,
                exercises,
              ),
          )

        setCaloriesBurned(
          calculatedCalories,
        )

        setWorkoutCompleted(
          true,
        )
      } catch (error) {
        console.error(
          "Unable to complete workout:",
          error,
        )

        setError(
          error?.response?.data
            ?.message ||
            "Unable to complete your workout.",
        )
      } finally {
        setCompletingWorkout(
          false,
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <WorkoutHeader
          title="Workout"
          onBack={() =>
            navigate(
              "/dashboard",
            )
          }
        />

        <main className="mx-auto max-w-md px-5 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-lime-400" />
            </div>

            <p className="mt-4 text-center text-sm font-bold text-gray-500">
              Loading your workout...
            </p>
          </div>
        </main>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | No assignment
  |--------------------------------------------------------------------------
  */

  if (!assignment) {
    return (
      <div className="min-h-screen bg-black text-white">
        <WorkoutHeader
          title="Workout"
          onBack={() =>
            navigate(
              "/dashboard",
            )
          }
        />

        <main className="mx-auto max-w-md px-5 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-black">
              <Dumbbell
                size={28}
              />
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No Workout Assigned
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {error ||
                "Your trainer has not assigned a workout for this date yet."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/weekly-schedule",
                )
              }
              className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black"
            >
              VIEW WEEKLY SCHEDULE
            </button>
          </div>
        </main>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | No exercises
  |--------------------------------------------------------------------------
  */

  if (
    exercises.length === 0
  ) {
    return (
      <div className="min-h-screen bg-black text-white">
        <WorkoutHeader
          title={
            program?.name ||
            "Workout"
          }
          onBack={() =>
            navigate(
              "/dashboard",
            )
          }
        />

        <main className="mx-auto max-w-md px-5 py-10">
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-6 text-center">
            <Dumbbell
              size={32}
              className="mx-auto text-yellow-400"
            />

            <h2 className="mt-4 text-xl font-black">
              Exercises Not Added
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This program has been assigned,
              but no exercises have been added
              to it yet.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard",
                )
              }
              className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black"
            >
              BACK TO DASHBOARD
            </button>
          </div>
        </main>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Main workout
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-black pb-32 text-white">
      <WorkoutHeader
        title={
          program?.name ||
          "Workout"
        }
        onBack={() =>
          navigate(
            "/dashboard",
          )
        }
      />

      <main className="mx-auto w-full max-w-md px-5 py-6">
        {/* ---------------------------------------------------------------- */}
        {/* Workout header */}
        {/* ---------------------------------------------------------------- */}

        <section className="rounded-3xl bg-white p-5 text-black">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-lime-400 px-3 py-1 text-[9px] font-black text-black">
                <CheckCircle2
                  size={11}
                />
                ASSIGNED
              </span>

              <h2 className="mt-3 text-2xl font-black">
                {program?.name}
              </h2>

              {program?.description && (
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  {program.description}
                </p>
              )}
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-yellow-400">
              <Dumbbell
                size={23}
              />
            </div>
          </div>

          {/* Workout information */}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <InfoBox
              label="Difficulty"
              value={
                program?.difficulty ||
                "Beginner"
              }
            />

            <InfoBox
              label="Duration"
              value={
                program?.estimatedDuration
                  ? `${program.estimatedDuration} min`
                  : "Not specified"
              }
            />

            <InfoBox
              label="Exercises"
              value={
                exercises.length
              }
            />

            <InfoBox
              label="Sets"
              value={totalSets}
            />
          </div>

          {/* Progress */}

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-500">
                Workout progress
              </span>

              <span className="text-lime-600">
                {completedSetCount} /{" "}
                {totalSets} sets
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-lime-400 transition-all duration-500"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>

            <p className="mt-2 text-right text-[10px] font-bold text-gray-500">
              {completionPercentage}%
              complete
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Error */}
        {/* ---------------------------------------------------------------- */}

        {error && (
          <section className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
            <p className="text-xs font-bold leading-5 text-red-300">
              {error}
            </p>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Exercises */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Today's Training
            </p>

            <h2 className="mt-1 text-lg font-black">
              Complete Your Exercises
            </h2>
          </div>

          <div className="space-y-4">
            {exercises.map(
              (
                programExercise,
                index,
              ) => {
                const exercise =
                  programExercise?.exercise ||
                  {}

                const exerciseId =
                  getExerciseId(
                    programExercise,
                  )

                const sets =
                  Number(
                    programExercise?.sets ||
                      0,
                  )

                const reps =
                  programExercise?.reps

                const duration =
                  programExercise?.duration

                const rest =
                  programExercise?.rest

                const targetWeight =
                  getTargetWeight(
                    programExercise,
                  )

                return (
                  <article
                    key={
                      programExercise?._id ||
                      exerciseId ||
                      index
                    }
                    className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                  >
                    {/* Exercise visual */}

                    <div className="aspect-video bg-white/10">
                      {exercise?.image ||
                      exercise?.imageUrl ? (
                        <img
                          src={
                            exercise.image ||
                            exercise.imageUrl
                          }
                          alt={
                            exercise?.name ||
                            `Exercise ${
                              index + 1
                            }`
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black">
                              <Play
                                size={20}
                                fill="currentColor"
                              />
                            </div>

                            <p className="mt-2 text-xs font-semibold text-gray-500">
                              Exercise demonstration
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-yellow-400">
                            EXERCISE{" "}
                            {index + 1}
                          </p>

                          <h3 className="mt-1 text-lg font-black">
                            {exercise?.name ||
                              "Exercise"}
                          </h3>

                          {exercise?.description && (
                            <p className="mt-2 text-xs leading-5 text-gray-500">
                              {
                                exercise.description
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-500">
                          <Dumbbell
                            size={19}
                          />
                        </div>
                      </div>

                      {/* Target information */}

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <InfoBox
                          label="Sets"
                          value={sets}
                        />

                        <InfoBox
                          label="Reps"
                          value={
                            reps ||
                            (duration
                              ? `${duration} sec`
                              : "As assigned")
                          }
                        />

                        <InfoBox
                          label="Target Weight"
                          value={
                            targetWeight ||
                            "Bodyweight"
                          }
                          highlight
                        />

                        <InfoBox
                          label="Rest"
                          value={
                            rest !==
                            undefined
                              ? `${rest} sec`
                              : "60 sec"
                          }
                          icon={
                            <Clock3
                              size={14}
                            />
                          }
                        />
                      </div>

                      {/* Trainer notes */}

                      {programExercise?.notes && (
                        <div className="mt-4 rounded-2xl bg-black p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                            Trainer Instructions
                          </p>

                          <p className="mt-2 text-xs leading-5 text-gray-400">
                            {
                              programExercise.notes
                            }
                          </p>
                        </div>
                      )}

                      {/* Sets */}

                      <div className="mt-5">
                        <p className="mb-3 text-sm font-bold">
                          Complete your sets
                        </p>

                        <div className="space-y-3">
                          {Array.from(
                            {
                              length:
                                sets,
                            },
                            (
                              _,
                              setIndex,
                            ) => {
                              const setNumber =
                                setIndex +
                                1

                              const key =
                                `${exerciseId}-${setNumber}`

                              const isCompleted =
                                Boolean(
                                  completedSets[
                                    key
                                  ],
                                )

                              const repsKey =
                                `${key}-reps`

                              const weightKey =
                                `${key}-weight`

                              const isSaving =
                                savingSet ===
                                key

                              return (
                                <div
                                  key={
                                    key
                                  }
                                  className={`rounded-2xl border p-4 transition ${
                                    isCompleted
                                      ? "border-lime-400/30 bg-lime-400/10"
                                      : "border-white/10 bg-white/5"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-black">
                                        Set{" "}
                                        {
                                          setNumber
                                        }
                                      </p>

                                      <p className="mt-0.5 text-[10px] text-gray-500">
                                        Target:{" "}
                                        {reps ||
                                          duration ||
                                          "—"}{" "}
                                        {duration
                                          ? "seconds"
                                          : "reps"}{" "}
                                        ×{" "}
                                        {targetWeight ||
                                          "Bodyweight"}
                                      </p>
                                    </div>

                                    <div
                                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                        isCompleted
                                          ? "bg-lime-400 text-black"
                                          : "border border-white/10 text-gray-600"
                                      }`}
                                    >
                                      {isCompleted && (
                                        <Check
                                          size={
                                            18
                                          }
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Actual performance */}

                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    <label className="block">
                                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-gray-600">
                                        Actual Reps
                                      </span>

                                      <input
                                        type="number"
                                        min="0"
                                        value={
                                          actualValues[
                                            repsKey
                                          ] ??
                                          ""
                                        }
                                        onChange={(
                                          event,
                                        ) =>
                                          updateActualValue(
                                            programExercise,
                                            setNumber,
                                            "reps",
                                            event
                                              .target
                                              .value,
                                          )
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm font-bold text-white outline-none focus:border-lime-400"
                                        placeholder={
                                          reps ||
                                          "Reps"
                                        }
                                      />
                                    </label>

                                    <label className="block">
                                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-gray-600">
                                        Actual Weight
                                      </span>

                                      <input
                                        type="text"
                                        value={
                                          actualValues[
                                            weightKey
                                          ] ??
                                          ""
                                        }
                                        onChange={(
                                          event,
                                        ) =>
                                          updateActualValue(
                                            programExercise,
                                            setNumber,
                                            "weight",
                                            event
                                              .target
                                              .value,
                                          )
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-3 text-sm font-bold text-white outline-none focus:border-lime-400"
                                        placeholder={
                                          targetWeight ||
                                          "e.g. 20 kg"
                                        }
                                      />
                                    </label>
                                  </div>

                                  {/* Complete set */}

                                  <button
                                    type="button"
                                    disabled={
                                      isSaving ||
                                      !exerciseId
                                    }
                                    onClick={() =>
                                      toggleSet(
                                        programExercise,
                                        setNumber,
                                      )
                                    }
                                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black transition ${
                                      isCompleted
                                        ? "bg-white/10 text-white"
                                        : "bg-lime-400 text-black hover:bg-lime-300"
                                    }`}
                                  >
                                    {isSaving ? (
                                      <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                                        SAVING...
                                      </>
                                    ) : isCompleted ? (
                                      <>
                                        <Check
                                          size={
                                            15
                                          }
                                        />

                                        SET COMPLETED
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2
                                          size={
                                            15
                                          }
                                        />

                                        COMPLETE SET
                                      </>
                                    )}
                                  </button>
                                </div>
                              )
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Calories */}
        {/* ---------------------------------------------------------------- */}

        {workoutCompleted && (
          <section className="mt-6 rounded-3xl bg-yellow-400 p-5 text-black">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-yellow-400">
                <Flame
                  size={24}
                  fill="currentColor"
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-black/50">
                  Estimated Calories Burned
                </p>

                <p className="mt-1 text-2xl font-black">
                  {Math.round(
                    caloriesBurned,
                  )}{" "}
                  kcal
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-black/60">
              Calories are estimated from your
              completed workout and available
              workout information.
            </p>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Complete workout */}
        {/* ---------------------------------------------------------------- */}

        {!workoutCompleted && (
          <section className="mt-6">
            <button
              type="button"
              disabled={
                completingWorkout ||
                completedSetCount <
                  totalSets
              }
              onClick={
                handleCompleteWorkout
              }
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition ${
                completedSetCount >=
                totalSets
                  ? "bg-lime-400 text-black hover:bg-lime-300"
                  : "cursor-not-allowed bg-white/10 text-gray-600"
              }`}
            >
              {completingWorkout ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />

                  SAVING WORKOUT...
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={18}
                  />

                  COMPLETE WORKOUT
                </>
              )}
            </button>

            {completedSetCount <
              totalSets && (
              <p className="mt-3 text-center text-[10px] font-bold text-gray-600">
                Complete all{" "}
                {totalSets} sets to
                finish this workout.
              </p>
            )}
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Completed message */}
        {/* ---------------------------------------------------------------- */}

        {workoutCompleted && (
          <section className="mt-6 rounded-3xl border border-lime-400/20 bg-lime-400/5 p-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime-400 text-black">
              <CheckCircle2
                size={28}
              />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-wider text-lime-400">
              Workout Completed
            </p>

            <h2 className="mt-1 text-xl font-black">
              Excellent Work!
            </h2>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Your completed workout has
              been recorded. Your training
              team can now see your progress.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard",
                )
              }
              className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-black"
            >
              BACK TO DASHBOARD
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Header
|--------------------------------------------------------------------------
*/

function WorkoutHeader({
  title,
  onBack,
}) {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-md items-center gap-4 px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          aria-label="Go back"
        >
          <ArrowLeft
            size={20}
          />
        </button>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            CGF Training
          </p>

          <h1 className="truncate text-xl font-black">
            {title}
          </h1>
        </div>
      </div>
    </header>
  )
}

/*
|--------------------------------------------------------------------------
| Info Box
|--------------------------------------------------------------------------
*/

function InfoBox({
  label,
  value,
  highlight = false,
  icon,
}) {
  return (
    <div className="rounded-2xl bg-black p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p
        className={`mt-1 flex items-center gap-1 text-sm font-black ${
          highlight
            ? "text-yellow-400"
            : "text-white"
        }`}
      >
        {icon}
        {value ?? "—"}
      </p>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Extract assignment
|--------------------------------------------------------------------------
*/

function extractAssignment(
  response,
) {
  if (!response) {
    return null
  }

  /*
  |--------------------------------------------------------------------------
  | Standard assignment response
  |--------------------------------------------------------------------------
  */

  if (response.assignment) {
    return response.assignment
  }

  if (
    response.programAssignment
  ) {
    return response.programAssignment
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  |
  | Your backend's /my-today response puts the assignment
  | information inside response.workout.
  |--------------------------------------------------------------------------
  */

  if (response.workout) {
    if (
      response.workout.assignment
    ) {
      return response.workout.assignment
    }

    if (
      response.workout.program
    ) {
      return {
        _id:
          response.workout
            .assignmentId,

        id:
          response.workout
            .assignmentId,

        program:
          response.workout
            .program,

        startDate:
          response.workout
            .startDate,

        endDate:
          response.workout
            .endDate,

        notes:
          response.workout
            .notes,

        status:
          "active",
      }
    }
  }

  if (
    response.data?.assignment
  ) {
    return response.data.assignment
  }

  if (
    response.data
      ?.programAssignment
  ) {
    return response.data
      .programAssignment
  }

  if (
    response.data?.workout
      ?.assignment
  ) {
    return response.data.workout
      .assignment
  }

  if (
    response.data?.workout
      ?.program
  ) {
    const workout =
      response.data.workout

    return {
      _id:
        workout.assignmentId,

      id:
        workout.assignmentId,

      program:
        workout.program,

      startDate:
        workout.startDate,

      endDate:
        workout.endDate,

      notes:
        workout.notes,

      status:
        "active",
    }
  }

  return null
}

/*
|--------------------------------------------------------------------------
| Extract assignments
|--------------------------------------------------------------------------
*/

function extractAssignments(
  response,
) {
  if (!response) {
    return []
  }

  if (
    Array.isArray(
      response.assignments,
    )
  ) {
    return response.assignments
  }

  if (
    Array.isArray(
      response.programAssignments,
    )
  ) {
    return response.programAssignments
  }

  if (
    Array.isArray(
      response.data
        ?.assignments,
    )
  ) {
    return response.data
      .assignments
  }

  if (
    Array.isArray(
      response.data
        ?.programAssignments,
    )
  ) {
    return response.data
      .programAssignments
  }

  return []
}

/*
|--------------------------------------------------------------------------
| Normalize assignment
|--------------------------------------------------------------------------
*/

function normalizeWorkoutAssignment(
  value,
) {
  if (!value) {
    return null
  }

  if (
    value.program
  ) {
    return value
  }

  if (
    value.workout?.program
  ) {
    return {
      _id:
        value.workout
          .assignmentId,

      id:
        value.workout
          .assignmentId,

      program:
        value.workout
          .program,

      startDate:
        value.workout
          .startDate,

      endDate:
        value.workout
          .endDate,

      notes:
        value.workout
          .notes,

      status:
        "active",
    }
  }

  return value
}

/*
|--------------------------------------------------------------------------
| Restore existing workout log
|--------------------------------------------------------------------------
*/

async function restoreExistingLog(
  assignment,
  mounted,
  setCompletedSets,
  setActualValues,
  setWorkoutCompleted,
  setCaloriesBurned,
) {
  if (!assignment) {
    return
  }

  try {
    const workoutDate =
      getWorkoutDate(
        assignment,
      )

    const response =
      await api.get(
        "/workout-logs/me",
        {
          params: {
            date: workoutDate,
          },
        },
      )

    if (!mounted) {
      return
    }

    const log =
      response?.data
        ?.workoutLog ||
      response?.data?.log ||
      response?.data

    if (!log) {
      return
    }

    restoreWorkoutLog(
      log,
      setCompletedSets,
      setActualValues,
    )

    setWorkoutCompleted(
      Boolean(
        log.completed,
      ),
    )

    setCaloriesBurned(
      Number(
        log.caloriesBurned ||
          0,
      ),
    )
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | A missing log is normal before the member starts the workout.
    |--------------------------------------------------------------------------
    */

    if (
      error?.response?.status !==
      404
    ) {
      console.warn(
        "Unable to restore workout log:",
        error,
      )
    }
  }
}

/*
|--------------------------------------------------------------------------
| Exercise ID
|--------------------------------------------------------------------------
*/

function getExerciseId(
  programExercise,
) {
  const exercise =
    programExercise?.exercise

  return (
    exercise?._id ||
    exercise?.id ||
    programExercise?.exerciseId ||
    ""
  )
}

/*
|--------------------------------------------------------------------------
| Target weight
|--------------------------------------------------------------------------
*/

function getTargetWeight(
  exercise,
) {
  return (
    exercise?.weight ||
    exercise?.targetWeight ||
    exercise?.actualWeight ||
    ""
  )
}

/*
|--------------------------------------------------------------------------
| Workout date
|--------------------------------------------------------------------------
*/

function getWorkoutDate(
  assignment,
) {
  return (
    assignment?.workoutDate ||
    assignment?.date ||
    assignment?.startDate ||
    new Date()
      .toISOString()
      .split("T")[0]
  )
}

/*
|--------------------------------------------------------------------------
| Find assignment for date
|--------------------------------------------------------------------------
*/

function findAssignmentForDate(
  assignments,
  requestedDate,
) {
  const target =
    startOfDay(
      new Date(
        requestedDate,
      ),
    )

  if (
    Number.isNaN(
      target.getTime(),
    )
  ) {
    return null
  }

  const matching =
    assignments.filter(
      (assignment) => {
        if (!assignment) {
          return false
        }

        if (
          assignment.status &&
          assignment.status !==
            "active"
        ) {
          return false
        }

        const startDate =
          assignment.startDate
            ? startOfDay(
                new Date(
                  assignment.startDate,
                ),
              )
            : null

        const endDate =
          assignment.endDate
            ? startOfDay(
                new Date(
                  assignment.endDate,
                ),
              )
            : null

        if (
          !startDate ||
          Number.isNaN(
            startDate.getTime(),
          )
        ) {
          return false
        }

        if (
          startDate > target
        ) {
          return false
        }

        if (
          endDate &&
          endDate < target
        ) {
          return false
        }

        return true
      },
    )

  matching.sort(
    (
      first,
      second,
    ) =>
      new Date(
        second.startDate,
      ).getTime() -
      new Date(
        first.startDate,
      ).getTime(),
  )

  return (
    matching[0] ||
    null
  )
}

/*
|--------------------------------------------------------------------------
| Find current assignment
|--------------------------------------------------------------------------
*/

function findCurrentAssignment(
  assignments,
) {
  const now =
    startOfDay(
      new Date(),
    )

  const active =
    assignments.filter(
      (assignment) => {
        if (!assignment) {
          return false
        }

        if (
          assignment.status &&
          assignment.status !==
            "active"
        ) {
          return false
        }

        const startDate =
          assignment.startDate
            ? startOfDay(
                new Date(
                  assignment.startDate,
                ),
              )
            : null

        const endDate =
          assignment.endDate
            ? startOfDay(
                new Date(
                  assignment.endDate,
                ),
              )
            : null

        if (
          !startDate ||
          Number.isNaN(
            startDate.getTime(),
          )
        ) {
          return false
        }

        if (
          startDate > now
        ) {
          return false
        }

        if (
          endDate &&
          endDate < now
        ) {
          return false
        }

        return true
      },
    )

  active.sort(
    (
      first,
      second,
    ) =>
      new Date(
        second.startDate,
      ).getTime() -
      new Date(
        first.startDate,
      ).getTime(),
  )

  return (
    active[0] ||
    assignments[0] ||
    null
  )
}

/*
|--------------------------------------------------------------------------
| Restore workout log
|--------------------------------------------------------------------------
*/

function restoreWorkoutLog(
  log,
  setCompletedSets,
  setActualValues,
) {
  const completed = {}
  const actual = {}

  const exercises =
    Array.isArray(
      log?.exercises,
    )
      ? log.exercises
      : []

  exercises.forEach(
    (exerciseLog) => {
      const exerciseId =
        exerciseLog?.exercise?._id ||
        exerciseLog?.exercise ||
        exerciseLog?.exerciseId

      if (!exerciseId) {
        return
      }

      const sets =
        Array.isArray(
          exerciseLog?.sets,
        )
          ? exerciseLog.sets
          : []

      sets.forEach(
        (set) => {
          const key =
            `${exerciseId}-${set.setNumber}`

          completed[key] =
            Boolean(
              set.completed,
            )

          if (
            set.actualReps !==
              null &&
            set.actualReps !==
              undefined
          ) {
            actual[
              `${key}-reps`
            ] =
              set.actualReps
          }

          if (
            set.actualWeight
          ) {
            actual[
              `${key}-weight`
            ] =
              set.actualWeight
          }
        },
      )
    },
  )

  setCompletedSets(
    completed,
  )

  setActualValues(
    actual,
  )
}

/*
|--------------------------------------------------------------------------
| Calories
|--------------------------------------------------------------------------
*/

function calculateCalories(
  program,
  exercises,
) {
  const duration =
    Number(
      program?.estimatedDuration ||
        0,
    )

  if (duration <= 0) {
    return 0
  }

  const caloriesPerMinute =
    7

  const exerciseFactor =
    Math.max(
      0.75,
      Math.min(
        1.25,
        exercises.length /
          8,
      ),
    )

  return Math.round(
    duration *
      caloriesPerMinute *
      exerciseFactor,
  )
}

/*
|--------------------------------------------------------------------------
| Date helper
|--------------------------------------------------------------------------
*/

function startOfDay(
  date,
) {
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

export default Workout