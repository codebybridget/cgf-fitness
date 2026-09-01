import {
  ArrowDown,
  ArrowUp,
  Check,
  Dumbbell,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  createProgram,
  getExercises,
  getPrograms,
  updateProgram,
} from "../../api/api.js"

const workoutTypes = [
  {
    value: "Lower Body",
    label: "Lower Body",
  },
  {
    value: "Upper Body",
    label: "Upper Body",
  },
  {
    value: "CrossFit",
    label: "CrossFit",
  },
  {
    value: "Tabata",
    label: "Tabata",
  },
]

const emptyProgram = (
  workoutType,
) => ({
  _id: null,
  name:
    `${workoutType} Program`,
  description:
    `Build the ${workoutType} program.`,
  workoutType,
  difficulty:
    "Beginner",
  estimatedDuration:
    null,
  exercises: [],
  trainerNotes: "",
})

function ProgramBuilder() {
  const [selectedType, setSelectedType] =
    useState("Lower Body")

  const [programs, setPrograms] =
    useState([])

  const [libraryExercises, setLibraryExercises] =
    useState([])

  const [program, setProgram] =
    useState(
      emptyProgram(
        "Lower Body",
      ),
    )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [saved, setSaved] =
    useState(false)

  const [error, setError] =
    useState("")

  /*
  |--------------------------------------------------------------------------
  | Load programs and exercises from MongoDB
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadBuilderData()
  }, [])

  const loadBuilderData =
    async () => {
      try {
        setLoading(true)
        setError("")

        const [
          exerciseResponse,
          programResponse,
        ] = await Promise.all([
          getExercises({
            active: true,
          }),

          getPrograms({
            active: true,
          }),
        ])

        setLibraryExercises(
          Array.isArray(
            exerciseResponse?.exercises,
          )
            ? exerciseResponse.exercises
            : [],
        )

        setPrograms(
          Array.isArray(
            programResponse?.programs,
          )
            ? programResponse.programs
            : [],
        )

        const firstProgram =
          programResponse?.programs?.find(
            (item) =>
              item.workoutType ===
              "Lower Body",
          )

        if (firstProgram) {
          setProgram(
            normalizeProgram(
              firstProgram,
            ),
          )
        }
      } catch (err) {
        console.error(
          "Unable to load program builder data:",
          err,
        )

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to load program data.",
        )
      } finally {
        setLoading(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Change workout type
  |--------------------------------------------------------------------------
  */

  const changeProgram = (
    workoutType,
  ) => {
    setSelectedType(
      workoutType,
    )

    setSaved(false)
    setError("")

    const existingProgram =
      programs.find(
        (item) =>
          item.workoutType ===
          workoutType,
      )

    if (existingProgram) {
      setProgram(
        normalizeProgram(
          existingProgram,
        ),
      )

      return
    }

    setProgram(
      emptyProgram(
        workoutType,
      ),
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Available exercises
  |--------------------------------------------------------------------------
  */

  const availableExercises =
    useMemo(() => {
      return libraryExercises.filter(
        (exercise) =>
          exercise.category ===
          selectedType,
      )
    }, [
      libraryExercises,
      selectedType,
    ])

  /*
  |--------------------------------------------------------------------------
  | Check if exercise is already added
  |--------------------------------------------------------------------------
  */

  const isAdded = (
    exerciseId,
  ) => {
    return program.exercises.some(
      (item) =>
        String(
          item.exercise?._id ||
            item.exercise ||
            "",
        ) ===
        String(exerciseId),
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Add exercise
  |--------------------------------------------------------------------------
  */

  const addExercise = (
    exercise,
  ) => {
    if (
      isAdded(
        exercise._id,
      )
    ) {
      return
    }

    const programExercise = {
      exercise:
        exercise._id,

      order:
        program.exercises.length +
        1,

      sets:
        exercise.defaultSets ??
        3,

      reps:
        exercise.defaultReps ??
        null,

      duration:
        exercise.defaultDuration ??
        null,

      rest:
        exercise.defaultRest ??
        60,

      notes: "",
    }

    setProgram(
      (current) => ({
        ...current,

        exercises: [
          ...current.exercises,
          programExercise,
        ],
      }),
    )

    setSaved(false)
  }

  /*
  |--------------------------------------------------------------------------
  | Remove exercise
  |--------------------------------------------------------------------------
  */

  const removeExercise = (
    index,
  ) => {
    setProgram(
      (current) => ({
        ...current,

        exercises:
          current.exercises
            .filter(
              (_, itemIndex) =>
                itemIndex !==
                index,
            )
            .map(
              (
                item,
                itemIndex,
              ) => ({
                ...item,
                order:
                  itemIndex +
                  1,
              }),
            ),
      }),
    )

    setSaved(false)
  }

  /*
  |--------------------------------------------------------------------------
  | Update program exercise
  |--------------------------------------------------------------------------
  */

  const updateExercise = (
    index,
    field,
    value,
  ) => {
    setProgram(
      (current) => ({
        ...current,

        exercises:
          current.exercises.map(
            (
              exercise,
              itemIndex,
            ) =>
              itemIndex ===
              index
                ? {
                    ...exercise,
                    [field]:
                      normalizeExerciseField(
                        field,
                        value,
                      ),
                  }
                : exercise,
          ),
      }),
    )

    setSaved(false)
  }

  /*
  |--------------------------------------------------------------------------
  | Move exercise
  |--------------------------------------------------------------------------
  */

  const moveExercise = (
    index,
    direction,
  ) => {
    const newIndex =
      index + direction

    if (
      newIndex < 0 ||
      newIndex >=
        program.exercises.length
    ) {
      return
    }

    const exercises = [
      ...program.exercises,
    ]

    const current =
      exercises[index]

    exercises[index] =
      exercises[newIndex]

    exercises[newIndex] =
      current

    const reordered =
      exercises.map(
        (
          item,
          itemIndex,
        ) => ({
          ...item,
          order:
            itemIndex + 1,
        }),
      )

    setProgram(
      (currentProgram) => ({
        ...currentProgram,
        exercises:
          reordered,
      }),
    )

    setSaved(false)
  }

  /*
  |--------------------------------------------------------------------------
  | Save program
  |--------------------------------------------------------------------------
  */

  const handleSave =
    async () => {
      try {
        setSaving(true)
        setSaved(false)
        setError("")

        if (
          !program.name.trim()
        ) {
          setError(
            "Program name is required.",
          )

          return
        }

        if (
          !program.workoutType
        ) {
          setError(
            "Workout type is required.",
          )

          return
        }

        if (
          program.exercises
            .length === 0
        ) {
          setError(
            "A program must contain at least one exercise.",
          )

          return
        }

        const payload = {
          name:
            program.name.trim(),

          description:
            program.description?.trim() ||
            "",

          workoutType:
            program.workoutType,

          difficulty:
            program.difficulty ||
            "Beginner",

          estimatedDuration:
            program.estimatedDuration
              ? Number(
                  program.estimatedDuration,
                )
              : null,

          exercises:
            program.exercises.map(
              (
                item,
                index,
              ) => ({
                exercise:
                  item.exercise?._id ||
                  item.exercise,

                order:
                  index + 1,

                sets:
                  Number(
                    item.sets,
                  ),

                reps:
                  item.reps ===
                    null ||
                  item.reps ===
                    undefined ||
                  item.reps ===
                    ""
                    ? null
                    : Number(
                        item.reps,
                      ),

                duration:
                  item.duration ===
                    null ||
                  item.duration ===
                    undefined ||
                  item.duration ===
                    ""
                    ? null
                    : Number(
                        item.duration,
                      ),

                rest:
                  Number(
                    item.rest ?? 60,
                  ),

                notes:
                  item.notes?.trim() ||
                  "",
              }),
            ),

          trainerNotes:
            program.trainerNotes?.trim() ||
            "",
        }

        let response

        if (program._id) {
          response =
            await updateProgram(
              program._id,
              payload,
            )
        } else {
          response =
            await createProgram(
              payload,
            )
        }

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Unable to save program.",
          )
        }

        const savedProgram =
          response.program

        setProgram(
          normalizeProgram(
            savedProgram,
          ),
        )

        setPrograms(
          (current) => {
            const exists =
              current.some(
                (item) =>
                  String(
                    item._id,
                  ) ===
                  String(
                    savedProgram._id,
                  ),
              )

            if (exists) {
              return current.map(
                (item) =>
                  String(
                    item._id,
                  ) ===
                  String(
                    savedProgram._id,
                  )
                    ? savedProgram
                    : item,
              )
            }

            return [
              ...current,
              savedProgram,
            ]
          },
        )

        setSaved(true)

        setTimeout(() => {
          setSaved(false)
        }, 3000)
      } catch (err) {
        console.error(
          "Save program error:",
          err,
        )

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to save program.",
        )
      } finally {
        setSaving(false)
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
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2
              size={30}
              className="mx-auto animate-spin text-lime-400"
            />

            <p className="mt-4 text-sm font-bold text-gray-500">
              Loading program builder...
            </p>
          </div>
        </div>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-7xl px-5 py-8">
        <header>
          <div className="flex items-center gap-2 text-lime-400">
            <Dumbbell size={18} />

            <span className="text-xs font-black uppercase tracking-widest">
              Trainer Control
            </span>
          </div>

          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black">
                Program Builder
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Build the exact workout
                members will perform by
                selecting exercises from
                the CGF exercise library.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  SAVING...
                </>
              ) : saved ? (
                <>
                  <Check size={17} />
                  PROGRAM SAVED
                </>
              ) : (
                <>
                  <Save size={17} />
                  SAVE PROGRAM
                </>
              )}
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
            {error}
          </div>
        )}

        <section className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4">
          {workoutTypes.map(
            (type) => {
              const typeProgram =
                programs.find(
                  (item) =>
                    item.workoutType ===
                    type.value,
                )

              return (
                <button
                  key={
                    type.value
                  }
                  type="button"
                  onClick={() =>
                    changeProgram(
                      type.value,
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedType ===
                    type.value
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <p
                    className={`text-xs font-black ${
                      selectedType ===
                      type.value
                        ? "text-yellow-400"
                        : "text-gray-500"
                    }`}
                  >
                    {
                      type.label
                    }
                  </p>

                  <p className="mt-2 text-[10px] text-gray-600">
                    {
                      typeProgram
                        ?.exercises
                        ?.length ||
                      0
                    }{" "}
                    exercises
                  </p>
                </button>
              )
            },
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                  Current Program
                </p>

                <input
                  value={
                    program.name
                  }
                  onChange={(
                    event,
                  ) => {
                    setProgram(
                      (
                        current,
                      ) => ({
                        ...current,
                        name:
                          event
                            .target
                            .value,
                      }),
                    )

                    setSaved(
                      false,
                    )
                  }}
                  className="mt-2 w-full border-b border-white/10 bg-transparent pb-2 text-2xl font-black text-white outline-none focus:border-lime-400"
                  placeholder="Program name"
                />

                <textarea
                  rows={3}
                  value={
                    program.description ||
                    ""
                  }
                  onChange={(
                    event,
                  ) => {
                    setProgram(
                      (
                        current,
                      ) => ({
                        ...current,
                        description:
                          event
                            .target
                            .value,
                      }),
                    )

                    setSaved(
                      false,
                    )
                  }}
                  className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs leading-5 text-gray-400 outline-none focus:border-lime-400"
                  placeholder="Program description..."
                />
              </div>

              <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                <Dumbbell size={20} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SelectField
                label="Difficulty"
                value={
                  program.difficulty ||
                  "Beginner"
                }
                onChange={(
                  value,
                ) => {
                  setProgram(
                    (
                      current,
                    ) => ({
                      ...current,
                      difficulty:
                        value,
                    }),
                  )

                  setSaved(
                    false,
                  )
                }}
                options={[
                  "Beginner",
                  "Intermediate",
                  "Advanced",
                ]}
              />

              <NumberField
                label="Duration (min)"
                value={
                  program.estimatedDuration ??
                  ""
                }
                onChange={(
                  value,
                ) => {
                  setProgram(
                    (
                      current,
                    ) => ({
                      ...current,
                      estimatedDuration:
                        value,
                    }),
                  )

                  setSaved(
                    false,
                  )
                }}
              />
            </div>

            <div className="mt-6">
              {program.exercises
                .length === 0 ? (
                <EmptyProgram />
              ) : (
                <div className="space-y-3">
                  {program.exercises.map(
                    (
                      exercise,
                      index,
                    ) => (
                      <ProgramExercise
                        key={`${exercise.exercise?._id || exercise.exercise}-${index}`}
                        exercise={
                          exercise
                        }
                        index={
                          index
                        }
                        total={
                          program
                            .exercises
                            .length
                        }
                        onChange={
                          updateExercise
                        }
                        onMove={
                          moveExercise
                        }
                        onRemove={
                          removeExercise
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-gray-700">
                Trainer Notes
              </label>

              <textarea
                rows={3}
                value={
                  program.trainerNotes ||
                  ""
                }
                onChange={(
                  event,
                ) => {
                  setProgram(
                    (
                      current,
                    ) => ({
                      ...current,
                      trainerNotes:
                        event
                          .target
                          .value,
                    }),
                  )

                  setSaved(
                    false,
                  )
                }}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400 outline-none focus:border-lime-400"
                placeholder="Optional trainer notes..."
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                Exercise Library
              </p>

              <h2 className="mt-1 text-xl font-black">
                Add Exercises
              </h2>

              <p className="mt-2 text-xs leading-5 text-gray-600">
                Showing exercises for{" "}
                {
                  selectedType
                }
                .
              </p>
            </div>

            <div className="mt-5 space-y-2">
              {availableExercises.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center">
                  <Dumbbell
                    size={25}
                    className="mx-auto text-gray-700"
                  />

                  <p className="mt-3 text-xs font-bold text-gray-500">
                    No exercises in
                    this category.
                  </p>

                  <p className="mt-1 text-[10px] text-gray-700">
                    Create one in
                    the Exercise
                    Library.
                  </p>
                </div>
              ) : (
                availableExercises.map(
                  (
                    exercise,
                  ) => (
                    <LibraryExercise
                      key={
                        exercise._id
                      }
                      exercise={
                        exercise
                      }
                      added={isAdded(
                        exercise._id,
                      )}
                      onAdd={() =>
                        addExercise(
                          exercise,
                        )
                      }
                    />
                  ),
                )
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Normalize program returned from MongoDB
|--------------------------------------------------------------------------
*/

function normalizeProgram(
  program,
) {
  if (!program) {
    return emptyProgram(
      "Lower Body",
    )
  }

  return {
    _id:
      program._id ||
      null,

    name:
      program.name ||
      "Workout Program",

    description:
      program.description ||
      "",

    workoutType:
      program.workoutType ||
      "Lower Body",

    difficulty:
      program.difficulty ||
      "Beginner",

    estimatedDuration:
      program.estimatedDuration ??
      null,

    exercises:
      Array.isArray(
        program.exercises,
      )
        ? program.exercises.map(
            (
              item,
              index,
            ) => ({
              exercise:
                item.exercise,

              order:
                item.order ??
                index + 1,

              sets:
                item.sets ?? 3,

              reps:
                item.reps ??
                null,

              duration:
                item.duration ??
                null,

              rest:
                item.rest ??
                60,

              notes:
                item.notes ||
                "",
            }),
          )
        : [],

    trainerNotes:
      program.trainerNotes ||
      "",
  }
}

/*
|--------------------------------------------------------------------------
| Normalize exercise fields
|--------------------------------------------------------------------------
*/

function normalizeExerciseField(
  field,
  value,
) {
  if (
    field === "sets" ||
    field === "reps" ||
    field === "duration" ||
    field === "rest"
  ) {
    if (value === "") {
      return null
    }

    return Number(value)
  }

  return value
}

/*
|--------------------------------------------------------------------------
| Empty program
|--------------------------------------------------------------------------
*/

function EmptyProgram() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
      <Dumbbell
        size={32}
        className="mx-auto text-gray-700"
      />

      <h3 className="mt-4 text-sm font-black">
        No exercises added
      </h3>

      <p className="mt-1 text-xs leading-5 text-gray-600">
        Select exercises from
        the library on the right
        to build this program.
      </p>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Exercise library item
|--------------------------------------------------------------------------
*/

function LibraryExercise({
  exercise,
  added,
  onAdd,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">
            {exercise.name}
          </p>

          <p className="mt-1 text-[10px] text-gray-600">
            {exercise.defaultSets ??
              3}{" "}
            sets
            {" · "}
            {exercise.defaultReps ??
              "-"}{" "}
            reps
            {" · "}
            {exercise.defaultRest ??
              60}
            s rest
          </p>
        </div>

        <button
          type="button"
          disabled={added}
          onClick={
            onAdd
          }
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            added
              ? "bg-lime-400/10 text-lime-400"
              : "bg-yellow-400 text-black"
          }`}
          aria-label={
            added
              ? "Exercise already added"
              : `Add ${exercise.name}`
          }
        >
          {added ? (
            <Check size={16} />
          ) : (
            <Plus size={16} />
          )}
        </button>
      </div>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Program exercise
|--------------------------------------------------------------------------
*/

function ProgramExercise({
  exercise,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}) {
  const exerciseName =
    exercise.exercise?.name ||
    "Exercise"

  return (
    <article className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 text-gray-700">
          <GripVertical
            size={18}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                Exercise{" "}
                {index + 1}
              </p>

              <h3 className="mt-1 text-sm font-black">
                {
                  exerciseName
                }
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                onRemove(
                  index,
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400"
              aria-label={`Remove ${exerciseName}`}
            >
              <Trash2
                size={14}
              />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniField
              label="Sets"
              value={
                exercise.sets ??
                ""
              }
              type="number"
              onChange={(
                value,
              ) =>
                onChange(
                  index,
                  "sets",
                  value,
                )
              }
            />

            <MiniField
              label="Reps"
              value={
                exercise.reps ??
                ""
              }
              type="number"
              onChange={(
                value,
              ) =>
                onChange(
                  index,
                  "reps",
                  value,
                )
              }
            />

            <MiniField
              label="Duration"
              value={
                exercise.duration ??
                ""
              }
              type="number"
              onChange={(
                value,
              ) =>
                onChange(
                  index,
                  "duration",
                  value,
                )
              }
            />

            <MiniField
              label="Rest"
              value={
                exercise.rest ??
                ""
              }
              type="number"
              onChange={(
                value,
              ) =>
                onChange(
                  index,
                  "rest",
                  value,
                )
              }
            />
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-700">
              Notes
            </label>

            <textarea
              rows={2}
              value={
                exercise.notes ||
                ""
              }
              onChange={(
                event,
              ) =>
                onChange(
                  index,
                  "notes",
                  event.target
                    .value,
                )
              }
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400 outline-none focus:border-lime-400"
              placeholder="Exercise notes..."
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={
                index === 0
              }
              onClick={() =>
                onMove(
                  index,
                  -1,
                )
              }
              className="flex h-8 items-center gap-1 rounded-lg bg-white/5 px-3 text-[10px] font-black text-gray-500 disabled:opacity-20"
            >
              <ArrowUp
                size={12}
              />
              UP
            </button>

            <button
              type="button"
              disabled={
                index ===
                total - 1
              }
              onClick={() =>
                onMove(
                  index,
                  1,
                )
              }
              className="flex h-8 items-center gap-1 rounded-lg bg-white/5 px-3 text-[10px] font-black text-gray-500 disabled:opacity-20"
            >
              <ArrowDown
                size={12}
              />
              DOWN
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

/*
|--------------------------------------------------------------------------
| Mini field
|--------------------------------------------------------------------------
*/

function MiniField({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div>
      <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-700">
        {label}
      </label>

      <input
        type={type}
        min={
          type === "number"
            ? 0
            : undefined
        }
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-lime-400"
      />
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Select field
|--------------------------------------------------------------------------
*/

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-lime-400"
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </select>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Number field
|--------------------------------------------------------------------------
*/

function NumberField({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-gray-700">
        {label}
      </label>

      <input
        type="number"
        min="1"
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-lime-400"
        placeholder="Optional"
      />
    </div>
  )
}

export default ProgramBuilder