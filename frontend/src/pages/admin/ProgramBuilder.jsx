import {
  CalendarDays,
  Dumbbell,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  createProgram,
  deleteProgram,
  getPrograms,
  updateProgram,
} from "../../api/api.js"
import {
  useLocation,
  useNavigate,
} from "react-router-dom"


function Programs() {
  const [
    programs,
    setPrograms,
  ] = useState([])

  const [
    selectedProgramId,
    setSelectedProgramId,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  const [success, setSuccess] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  /*
  |--------------------------------------------------------------------------
  | Load programs from MongoDB
  |--------------------------------------------------------------------------
  */

  const loadPrograms =
    async () => {
      try {
        setLoading(true)
        setError("")

        const response =
          await getPrograms()

        const loadedPrograms =
          Array.isArray(
            response?.programs,
          )
            ? response.programs
            : []

        const activePrograms =
          loadedPrograms.filter(
            (program) =>
              program?.isActive !==
              false,
          )

        setPrograms(
          activePrograms,
        )

        /*
        |--------------------------------------------------------------------------
        | Select first available program
        |--------------------------------------------------------------------------
        */

        if (
          activePrograms.length >
          0
        ) {
          setSelectedProgramId(
            (current) => {
              const stillExists =
                activePrograms.some(
                  (program) =>
                    getProgramId(
                      program,
                    ) === current,
                )

              return stillExists
                ? current
                : getProgramId(
                    activePrograms[0],
                  )
            },
          )
        } else {
          setSelectedProgramId("")
        }
      } catch (error) {
        console.error(
          "Load programs error:",
          error,
        )

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to load workout programs.",
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadPrograms()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Selected program
  |--------------------------------------------------------------------------
  */

  const selectedProgram =
    useMemo(
      () =>
        programs.find(
          (program) =>
            getProgramId(
              program,
            ) ===
            selectedProgramId,
        ) || null,
      [
        programs,
        selectedProgramId,
      ],
    )

  /*
  |--------------------------------------------------------------------------
  | Program selection
  |--------------------------------------------------------------------------
  */

  const handleProgramChange =
    (event) => {
      setSelectedProgramId(
        event.target.value,
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Update program
  |--------------------------------------------------------------------------
  */

  const handleUpdateProgram =
    async (
      changes,
    ) => {
      if (
        !selectedProgram
      ) {
        return
      }

      try {
        setSaving(true)
        setError("")
        setSuccess("")

        const programId =
          getProgramId(
            selectedProgram,
          )

        const response =
          await updateProgram(
            programId,
            changes,
          )

        const updatedProgram =
          response?.program

        if (
          updatedProgram
        ) {
          setPrograms(
            (current) =>
              current.map(
                (program) =>
                  getProgramId(
                    program,
                  ) === programId
                    ? updatedProgram
                    : program,
              ),
          )
        } else {
          await loadPrograms()
        }

        setSuccess("Program updated successfully.")
      } catch (error) {
        console.error(
          "Update program error:",
          error,
        )

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to update workout program.",
        )
      } finally {
        setSaving(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Update exercise
  |--------------------------------------------------------------------------
  */

  const handleUpdateExercise =
    async (
      exerciseId,
      changes,
    ) => {
      if (
        !selectedProgram
      ) {
        return
      }

      const currentExercises =
        Array.isArray(
          selectedProgram.exercises,
        )
          ? selectedProgram.exercises
          : []

      const updatedExercises =
        currentExercises.map(
          (exercise, index) => {
            const id =
              getExerciseId(
                exercise,
              )

            const updatedExercise =
              id === exerciseId
                ? {
                    ...exercise,
                    ...changes,
                  }
                : exercise

            const exerciseIdValue =
              getExerciseId(
                updatedExercise,
              )

            return {
              exercise: exerciseIdValue,
              order: Number(
                updatedExercise.order ??
                  index + 1,
              ),
              sets: Number(
                updatedExercise.sets ??
                  3,
              ),
              reps:
                updatedExercise.reps ==
                  null ||
                updatedExercise.reps ===
                  ""
                  ? null
                  : Number(
                      updatedExercise.reps,
                    ),
              duration:
                updatedExercise.duration ==
                  null ||
                updatedExercise.duration ===
                  ""
                  ? null
                  : Number(
                      updatedExercise.duration,
                    ),
              rest:
                updatedExercise.rest === null ||
                updatedExercise.rest === undefined ||
                updatedExercise.rest === ""
                  ? 0
                  : Number(updatedExercise.rest),
              weight:
                updatedExercise.weight === null ||
                updatedExercise.weight === undefined ||
                updatedExercise.weight === ""
                  ? null
                  : updatedExercise.weight,
              workInterval:
                updatedExercise.workInterval === null ||
                updatedExercise.workInterval === undefined ||
                updatedExercise.workInterval === ""
                  ? null
                  : Number(updatedExercise.workInterval),
              restInterval:
                updatedExercise.restInterval === null ||
                updatedExercise.restInterval === undefined ||
                updatedExercise.restInterval === ""
                  ? null
                  : Number(updatedExercise.restInterval),
              rounds:
                updatedExercise.rounds === null ||
                updatedExercise.rounds === undefined ||
                updatedExercise.rounds === ""
                  ? null
                  : Number(updatedExercise.rounds),
              notes:
                updatedExercise.notes ??
                "",
            }
          },
        )
        .filter(
          (exercise) =>
            Boolean(exercise.exercise),
        )

      await handleUpdateProgram(
        {
          exercises:
            updatedExercises,
        },
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Remove exercise
  |--------------------------------------------------------------------------
  */

  const handleRemoveExercise =
    async (
      exerciseId,
    ) => {
      if (
        !selectedProgram
      ) {
        return
      }

      const currentExercises =
        Array.isArray(
          selectedProgram.exercises,
        )
          ? selectedProgram.exercises
          : []

      const updatedExercises =
        currentExercises
          .filter(
            (exercise) =>
              getExerciseId(
                exercise,
              ) !== exerciseId,
          )
          .map((exercise, index) => ({
            exercise: getExerciseId(
              exercise,
            ),
            order: Number(
              exercise.order ??
                index + 1,
            ),
            sets: Number(
              exercise.sets ??
                3,
            ),
            reps:
              exercise.reps == null ||
              exercise.reps === ""
                ? null
                : Number(exercise.reps),
            duration:
              exercise.duration == null ||
              exercise.duration === ""
                ? null
                : Number(exercise.duration),
            rest:
              exercise.rest === null ||
              exercise.rest === undefined ||
              exercise.rest === ""
                ? 0
                : Number(exercise.rest),
            weight:
              exercise.weight === null ||
              exercise.weight === undefined ||
              exercise.weight === ""
                ? null
                : exercise.weight,
            workInterval:
              exercise.workInterval === null ||
              exercise.workInterval === undefined ||
              exercise.workInterval === ""
                ? null
                : Number(exercise.workInterval),
            restInterval:
              exercise.restInterval === null ||
              exercise.restInterval === undefined ||
              exercise.restInterval === ""
                ? null
                : Number(exercise.restInterval),
            rounds:
              exercise.rounds === null ||
              exercise.rounds === undefined ||
              exercise.rounds === ""
                ? null
                : Number(exercise.rounds),
            notes:
              exercise.notes ??
              "",
          }))
          .filter(
            (exercise) =>
              Boolean(exercise.exercise),
          )

      await handleUpdateProgram(
        {
          exercises:
            updatedExercises,
        },
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Create program
  |--------------------------------------------------------------------------
  |
  | A program must be created from real exercises. The Exercise Library
  | owns exercise selection, so NEW PROGRAM starts that workflow instead
  | of sending an empty exercises array to the backend.
  */

  const handleCreateProgram =
    () => {
      setError("")
      setSuccess("")

      navigate(
        "/admin/exercises",
        {
          state: {
            createProgram: true,
          },
        },
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Select program returned from Exercise Library
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const createdProgramId =
      location.state?.createdProgramId

    if (!createdProgramId || loading) {
      return
    }

    const exists = programs.some(
      (program) =>
        String(getProgramId(program)) ===
        String(createdProgramId),
    )

    if (exists) {
      setSelectedProgramId(
        String(createdProgramId),
      )
    }

    navigate(location.pathname, {
      replace: true,
      state: {},
    })
  }, [
    location.pathname,
    location.state,
    loading,
    navigate,
    programs,
  ])

  /*
  |--------------------------------------------------------------------------
  | Deactivate program
  |--------------------------------------------------------------------------
  */

  const handleDeleteProgram =
    async () => {
      if (
        !selectedProgram
      ) {
        return
      }

      try {
        setSaving(true)
        setError("")

        await deleteProgram(
          getProgramId(
            selectedProgram,
          ),
        )

        const remaining =
          programs.filter(
            (program) =>
              getProgramId(
                program,
              ) !==
              getProgramId(
                selectedProgram,
              ),
          )

        setPrograms(
          remaining,
        )

        setSelectedProgramId(
          remaining.length
            ? getProgramId(
                remaining[0],
              )
            : "",
        )
        setShowDeleteModal(false)
        setSuccess("Program removed successfully.")
      } catch (error) {
        console.error(
          "Delete program error:",
          error,
        )

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to remove workout program.",
        )
      } finally {
        setSaving(false)
      }
    }

  return (
    <div className="min-h-screen bg-black text-white">

      <main className="mx-auto max-w-6xl px-5 py-8">

        {/* HEADER */}

        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="flex items-center gap-2 text-lime-400">

              <CalendarDays
                size={18}
              />

              <span className="text-xs font-black uppercase tracking-widest">
                CGF Training Programs
              </span>

            </div>

            <h1 className="mt-2 text-3xl font-black">
              Program Builder
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Build the training programs that trainers will assign to CGF members.
            </p>

          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={handleCreateProgram}
              className="flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3.5 text-sm font-black text-black disabled:opacity-50"
            >

              <Plus
                size={17}
              />

              NEW PROGRAM

            </button>


          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-bold text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-lime-400/20 bg-lime-400/10 p-4 text-sm font-bold text-lime-400">
            {success}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-12 text-center">

            <p className="text-sm font-bold text-gray-500">
              Loading programs from MongoDB...
            </p>

          </div>
        ) : programs.length ===
          0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">

            <Dumbbell
              size={32}
              className="mx-auto text-gray-700"
            />

            <h2 className="mt-4 text-lg font-black">
              No workout programs found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              Create your first program so it can later be assigned to members.
            </p>

            <button
              type="button"
              onClick={handleCreateProgram}
              className="mt-5 rounded-2xl bg-yellow-400 px-5 py-3 text-xs font-black text-black"
            >
              CREATE FIRST PROGRAM
            </button>

          </div>
        ) : (
          <>
            {/* PROGRAM SELECTOR */}

            <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">

              <label
                htmlFor="program-selector"
                className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600"
              >
                Select Program
              </label>

              <select
                id="program-selector"
                value={
                  selectedProgramId
                }
                onChange={
                  handleProgramChange
                }
                className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm font-black text-white outline-none focus:border-lime-400"
              >

                {programs.map(
                  (
                    program,
                  ) => (
                    <option
                      key={getProgramId(
                        program,
                      )}
                      value={getProgramId(
                        program,
                      )}
                    >
                      {program.name ||
                        "Unnamed Program"}
                      {program.workoutType
                        ? ` — ${program.workoutType}`
                        : ""}
                    </option>
                  ),
                )}

              </select>

            </section>

            {/* PROGRAM CARDS */}

            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

              {programs.map(
                (
                  program,
                ) => {
                  const active =
                    getProgramId(
                      program,
                    ) ===
                    selectedProgramId

                  return (
                    <button
                      key={getProgramId(
                        program,
                      )}
                      type="button"
                      onClick={() =>
                        setSelectedProgramId(
                          getProgramId(
                            program,
                          ),
                        )
                      }
                      className={`rounded-3xl border p-5 text-left transition ${
                        active
                          ? "border-lime-400/40 bg-lime-400/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >

                      <div className="flex items-start justify-between">

                        <div>

                          <p
                            className={`text-xs font-black uppercase tracking-wider ${
                              active
                                ? "text-lime-400"
                                : "text-gray-500"
                            }`}
                          >
                            {program.workoutType ||
                              "Workout"}
                          </p>

                          <h2 className="mt-1 text-lg font-black">
                            {program.name ||
                              "Unnamed Program"}
                          </h2>

                        </div>

                        <div className="rounded-xl bg-black p-2">

                          <Dumbbell
                            size={17}
                            className={
                              active
                                ? "text-yellow-400"
                                : "text-gray-600"
                            }
                          />

                        </div>

                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs">

                        <span className="text-gray-600">
                          {program.exercises
                            ?.length ||
                            0}{" "}
                          exercises
                        </span>

                        <span className="text-yellow-400">
                          {program.isActive ===
                          false
                            ? "Inactive"
                            : "Active"}
                        </span>

                      </div>

                    </button>
                  )
                },
              )}

            </section>

            {/* SELECTED PROGRAM */}

            {selectedProgram && (
              <section className="mt-8">

                {/* PROGRAM DETAILS */}

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">

                  <div className="grid gap-4 md:grid-cols-3">

                    <Field
                      label="Program Name"
                      value={
                        selectedProgram.name ||
                        ""
                      }
                      onChange={(
                        value,
                      ) =>
                        handleUpdateProgram(
                          {
                            name: value,
                          },
                        )
                      }
                    />

                    <Field
                      label="Workout Type"
                      value={
                        selectedProgram.workoutType ||
                        ""
                      }
                      onChange={(
                        value,
                      ) =>
                        handleUpdateProgram(
                          {
                            workoutType:
                              value,
                          },
                        )
                      }
                    />

                    <Field
                      label="Class Time"
                      value={
                        selectedProgram.time ||
                        ""
                      }
                      placeholder="Optional"
                      onChange={(
                        value,
                      ) =>
                        handleUpdateProgram(
                          {
                            time: value,
                          },
                        )
                      }
                    />

                  </div>

                </div>

                {/* EXERCISES */}

                <div className="mt-6 flex items-center justify-between">

                  <div>

                    <h2 className="text-xl font-black">
                      Assigned Exercises
                    </h2>

                    <p className="mt-1 text-xs text-gray-600">
                      {selectedProgram
                        .exercises
                        ?.length ||
                        0}{" "}
                      exercises in this workout
                    </p>

                  </div>

                  <span className="rounded-full bg-yellow-400/10 px-3 py-2 text-[10px] font-black uppercase text-yellow-400">
                    {selectedProgram.workoutType ||
                      "Workout"}
                  </span>

                </div>

                <div className="mt-4 space-y-3">

                  {selectedProgram
                    .exercises
                    ?.length === 0 ||
                  !selectedProgram
                    .exercises ? (
                    <EmptyProgram />
                  ) : (
                    selectedProgram.exercises.map(
                      (
                        exercise,
                        index,
                      ) => (
                        <ProgramExercise
                          key={
                            getExerciseId(
                              exercise,
                            ) ||
                            index
                          }
                          exercise={
                            exercise
                          }
                          index={
                            index
                          }
                          onUpdate={(
                            changes,
                          ) =>
                            handleUpdateExercise(
                              getExerciseId(
                                exercise,
                              ),
                              changes,
                            )
                          }
                          onRemove={() =>
                            handleRemoveExercise(
                              getExerciseId(
                                exercise,
                              ),
                            )
                          }
                        />
                      ),
                    )
                  )}

                </div>

                {/* ADD EXERCISE INFORMATION */}

                <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">

                  <Plus
                    size={24}
                    className="mx-auto text-gray-700"
                  />

                  <p className="mt-3 text-sm font-black">
                    Add exercises from the Exercise Library
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Open Admin → Exercises and use "Add to Program".
                  </p>

                </div>

                {/* DELETE PROGRAM */}

                <div className="mt-6 flex justify-end">

                  <button
                    type="button"
                    onClick={() => {
                      setError("")
                      setSuccess("")
                      setShowDeleteModal(true)
                    }}
                    disabled={
                      saving
                    }
                    className="flex items-center gap-2 rounded-2xl bg-red-400/10 px-4 py-3 text-xs font-black text-red-400 disabled:opacity-50"
                  >

                    <Trash2
                      size={15}
                    />

                    REMOVE PROGRAM

                  </button>

                </div>

              </section>
            )}

          </>
        )}

        {showDeleteModal && selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6">
              <h2 className="text-xl font-black">Remove Program?</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Remove "{selectedProgram.name}" from the active program list?
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-2xl bg-white/5 px-5 py-3 text-xs font-black text-gray-400"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProgram}
                  disabled={saving}
                  className="rounded-2xl bg-red-400/10 px-5 py-3 text-xs font-black text-red-400 disabled:opacity-50"
                >
                  {saving ? "REMOVING..." : "REMOVE PROGRAM"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Program Exercise
|--------------------------------------------------------------------------
*/

function ProgramExercise({
  exercise,
  index,
  onUpdate,
  onRemove,
}) {
  const isTabata =
    String(
      exercise.category ||
        exercise.workoutType ||
        exercise.exercise?.category ||
        exercise.exercise?.workoutType ||
        "",
    ).toLowerCase() === "tabata"

  const exerciseData =
    typeof exercise.exercise === "object"
      ? exercise.exercise
      : exercise

  const exerciseName =
    exercise.name ||
    exerciseData?.name ||
    "Unnamed Exercise"

  const imageUrl =
    exercise.imageUrl ||
    exerciseData?.imageUrl ||
    exercise.image?.url ||
    exerciseData?.image?.url ||
    exercise.image ||
    exerciseData?.image ||
    ""

  const muscleGroup =
    exercise.muscleGroup ||
    exerciseData?.muscleGroup ||
    "Muscle group"

  const equipment =
    exercise.equipment ??
    exerciseData?.equipment

  const equipmentText =
    Array.isArray(equipment)
      ? equipment.join(", ")
      : equipment || "No equipment"

  const [draft, setDraft] = useState(() => ({
    sets: exercise.sets ?? 3,
    reps: exercise.reps ?? "",
    weight: exercise.weight ?? "",
    rest: exercise.rest ?? "",
    notes: exercise.notes ?? "",
    workInterval: exercise.workInterval ?? "",
    restInterval: exercise.restInterval ?? "",
    rounds: exercise.rounds ?? "",
  }))

  const [saveState, setSaveState] = useState("saved")
  const timerRef = useRef(null)
  const latestDraftRef = useRef(draft)
  const lastSavedValuesRef = useRef({
    sets: exercise.sets ?? 3,
    reps: exercise.reps ?? "",
    weight: exercise.weight ?? "",
    rest: exercise.rest ?? "",
    notes: exercise.notes ?? "",
    workInterval: exercise.workInterval ?? "",
    restInterval: exercise.restInterval ?? "",
    rounds: exercise.rounds ?? "",
  })

  useEffect(() => {
    const serverValues = {
      sets: exercise.sets ?? 3,
      reps: exercise.reps ?? "",
      weight: exercise.weight ?? "",
      rest: exercise.rest ?? "",
      notes: exercise.notes ?? "",
      workInterval: exercise.workInterval ?? "",
      restInterval: exercise.restInterval ?? "",
      rounds: exercise.rounds ?? "",
    }

    const lastSaved = lastSavedValuesRef.current

    // Only sync server values into the input when the server actually changed
    // independently of our current local draft. This prevents autosave responses
    // from erasing text while the user is typing.
    const serverChanged =
      JSON.stringify(serverValues) !==
      JSON.stringify(lastSaved)

    if (serverChanged) {
      latestDraftRef.current = serverValues
      lastSavedValuesRef.current = serverValues
      setDraft(serverValues)
      setSaveState("saved")
    }
  }, [
    exercise.sets,
    exercise.reps,
    exercise.weight,
    exercise.rest,
    exercise.notes,
    exercise.workInterval,
    exercise.restInterval,
    exercise.rounds,
  ])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const scheduleSave = (changes, nextValues) => {
    const merged = {
      ...latestDraftRef.current,
      ...nextValues,
    }

    latestDraftRef.current = merged
    setDraft(merged)
    setSaveState("saving")

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      try {
        await onUpdate(changes)
        lastSavedValuesRef.current = {
          ...latestDraftRef.current,
        }
        setSaveState("saved")
      } catch (error) {
        console.error("Exercise autosave error:", error)
        setSaveState("error")
      }
    }, 700)
  }

  const handleNumberChange = (field, value) => {
    const nextValue =
      value === "" ? "" : Number(value)

    scheduleSave(
      {
        [field]:
          nextValue === "" ? null : nextValue,
      },
      {
        [field]: nextValue,
      },
    )
  }

  const handleTextChange = (field, value) => {
    scheduleSave(
      { [field]: value },
      { [field]: value },
    )
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="flex items-start gap-4 p-5">
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-black">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={exerciseName}
              className="h-full w-full object-cover"
              onError={(event) => {
                const image = event.currentTarget
                image.style.display = "none"

                const fallback =
                  image.parentElement?.querySelector(
                    "[data-program-exercise-image-fallback]",
                  )

                if (fallback) {
                  fallback.classList.remove("hidden")
                }
              }}
            />
          ) : null}

          <div
            data-program-exercise-image-fallback
            className={`${
              imageUrl ? "hidden " : ""
            }absolute inset-0 flex flex-col items-center justify-center bg-slate-900`}
          >
            <Dumbbell
              size={28}
              className="text-gray-600"
            />

            <span className="mt-1 text-[8px] font-black uppercase tracking-wider text-gray-700">
              No Image
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-yellow-400">
              EXERCISE {index + 1}
            </span>

            <span className="rounded-full bg-lime-400/10 px-2 py-1 text-[9px] font-black uppercase text-lime-400">
              {exercise.category ||
                exerciseData?.category ||
                "Exercise"}
            </span>
          </div>

          <h3 className="mt-1 text-base font-black">
            {exerciseName}
          </h3>

          <p className="mt-1 text-xs text-gray-600">
            {muscleGroup}
            {" · "}
            {equipmentText}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-400 transition hover:bg-red-400/20"
          aria-label={`Remove ${exerciseName}`}
          title="Remove exercise"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="border-t border-white/10 px-5 pb-5">
        {isTabata ? (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <NumberField
              label="Work Seconds"
              value={draft.workInterval}
              onChange={(value) =>
                handleNumberChange(
                  "workInterval",
                  value,
                )
              }
            />

            <NumberField
              label="Rest Seconds"
              value={draft.restInterval}
              onChange={(value) =>
                handleNumberChange(
                  "restInterval",
                  value,
                )
              }
            />

            <NumberField
              label="Rounds"
              value={draft.rounds}
              onChange={(value) =>
                handleNumberChange(
                  "rounds",
                  value,
                )
              }
            />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumberField
              label="Sets"
              value={draft.sets}
              onChange={(value) =>
                handleNumberChange(
                  "sets",
                  value,
                )
              }
            />

            <NumberField
              label="Reps"
              value={draft.reps}
              onChange={(value) =>
                handleNumberChange(
                  "reps",
                  value,
                )
              }
            />

            <TextField
              label="Weight"
              value={draft.weight}
              placeholder="e.g. 20 kg"
              onChange={(value) =>
                handleTextChange(
                  "weight",
                  value,
                )
              }
            />

            <TextField
              label="Rest"
              value={draft.rest}
              placeholder="e.g. 60 sec"
              onChange={(value) =>
                handleTextChange(
                  "rest",
                  value,
                )
              }
            />
          </div>
        )}

        <TextField
          label="Trainer Notes"
          value={draft.notes}
          placeholder="Optional instructions for members"
          onChange={(value) =>
            handleTextChange(
              "notes",
              value,
            )
          }
        />

        <div className="mt-3 flex min-h-4 justify-end">
          {saveState === "saving" ? (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-yellow-400">
              <Loader2
                size={11}
                className="animate-spin"
              />
              Saving...
            </span>
          ) : saveState === "error" ? (
            <span className="text-[9px] font-black uppercase tracking-wider text-red-400">
              Save failed
            </span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-wider text-lime-400/70">
              Saved
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}) {
  return (
    <div>

      <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
        {label}
      </label>

      <input
        value={
          value ?? ""
        }
        disabled={
          disabled
        }
        placeholder={
          placeholder
        }
        onChange={(
          event,
        ) =>
          onChange?.(
            event.target
              .value,
          )
        }
        className={`w-full rounded-2xl border border-white/10 px-4 py-3.5 text-xs font-bold outline-none ${
          disabled
            ? "bg-black/50 text-gray-600"
            : "bg-black text-white focus:border-lime-400"
        }`}
      />

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Text Field
|--------------------------------------------------------------------------
*/

function TextField({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="mt-3">

      <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
        {label}
      </label>

      <input
        value={
          value ?? ""
        }
        placeholder={
          placeholder
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-gray-700 focus:border-lime-400"
      />

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Number Field
|--------------------------------------------------------------------------
*/

function NumberField({
  label,
  value,
  onChange,
}) {
  return (
    <div>

      <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-600">
        {label}
      </label>

      <input
        type="number"
        min="0"
        value={
          value ?? ""
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs font-black text-yellow-400 outline-none focus:border-lime-400"
      />

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Empty Program
|--------------------------------------------------------------------------
*/

function EmptyProgram() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">

      <Dumbbell
        size={30}
        className="mx-auto text-gray-700"
      />

      <h3 className="mt-4 text-sm font-black">
        No exercises assigned yet
      </h3>

      <p className="mt-2 text-xs text-gray-600">
        Add exercises from the Exercise Library to build this workout.
      </p>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getProgramId(
  program,
) {
  return (
    program?._id ||
    program?.id ||
    ""
  )
}

function getExerciseId(
  exercise,
) {
  if (
    typeof exercise?.exercise ===
    "object"
  ) {
    return (
      exercise.exercise?._id ||
      exercise.exercise?.id ||
      exercise._id ||
      exercise.id ||
      ""
    )
  }

  return (
    exercise?.exercise ||
    exercise?._id ||
    exercise?.id ||
    ""
  )
}

export default Programs