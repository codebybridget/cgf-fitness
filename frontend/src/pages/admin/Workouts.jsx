import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  Check,
  Dumbbell,
  Edit3,
  Image,
  Plus,
  Search,
  Trash2,
  Video,
  X,
} from "lucide-react"

import {
  createExercise,
  deleteExercise as deleteExerciseApi,
  getExercises,
  updateExercise,
} from "../../api/api.js"

/*
|--------------------------------------------------------------------------
| Categories
|--------------------------------------------------------------------------
*/

const categories = [
  "Upper Body",
  "Lower Body",
  "Core",
  "CrossFit",
  "Tabata",
]

/*
|--------------------------------------------------------------------------
| Recommendation Options
|--------------------------------------------------------------------------
*/

const genderOptions = [
  "Male",
  "Female",
]

const fitnessGoalOptions = [
  "Lose Weight",
  "Keep Fit",
  "Gain Weight",
  "Train to Become a Trainer",
]

const difficultyOptions = [
  "Beginner",
  "Intermediate",
  "Advanced",
]

/*
|--------------------------------------------------------------------------
| Empty Exercise
|--------------------------------------------------------------------------
*/

const emptyExercise = {
  name: "",
  category: "Upper Body",
  muscleGroup: "",
  secondaryMuscles: [],
  targetGender: [
    "Male",
    "Female",
  ],
  fitnessGoals: [
    "Keep Fit",
  ],
  difficulty: "Beginner",
  equipment: [],
  description: "",
  instructions: "",
  safetyTips: "",
  sets: 3,
  reps: 10,
  weight: "",
  duration: "",
  rest: "60 sec",
  caloriesEstimate: "",
  mediaType: "image",
  mediaUrl: "",
  status: "Active",
}

/*
|--------------------------------------------------------------------------
| Workouts
|--------------------------------------------------------------------------
*/

function Workouts() {
  const [
    exercises,
    setExercises,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("")

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all")

  const [
    showForm,
    setShowForm,
  ] = useState(false)

  const [
    editingExercise,
    setEditingExercise,
  ] = useState(null)

  const [
    formData,
    setFormData,
  ] = useState({
    ...emptyExercise,
  })

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null)

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("")

  const fileInputRef =
    useRef(null)

  /*
  |--------------------------------------------------------------------------
  | Load exercises
  |--------------------------------------------------------------------------
  */

  const loadExercises =
    async () => {
      try {
        setLoading(true)

        const response =
          await getExercises()

        const data =
          response?.data ||
          response

        const serverExercises =
          data?.exercises ||
          []

        setExercises(
          serverExercises.map(
            normalizeExercise,
          ),
        )
      } catch (error) {
        console.error(
          "Unable to load exercises:",
          error,
        )

        window.alert(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to load exercises.",
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadExercises()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Normalize backend exercise
  |--------------------------------------------------------------------------
  */

  function normalizeExercise(
    exercise,
  ) {
    const hasVideo =
      Boolean(
        exercise.videoUrl,
      )

    const hasImage =
      Boolean(
        exercise.imageUrl,
      )

    const mediaType =
      hasVideo
        ? "video"
        : "image"

    const mediaUrl =
      hasVideo
        ? exercise.videoUrl
        : exercise.imageUrl

    return {
      ...exercise,

      id:
        exercise._id ||
        exercise.id,

      sets:
        exercise.defaultSets ??
        3,

      reps:
        exercise.defaultReps ??
        10,

      weight:
        exercise.weight ||
        "",

      duration:
        exercise.defaultDuration ??
        "",

      caloriesEstimate:
        exercise.caloriesEstimate ??
        "",

      rest:
        exercise.defaultRest !=
        null
          ? `${exercise.defaultRest} sec`
          : "60 sec",

      instructions:
        Array.isArray(
          exercise.instructions,
        )
          ? exercise.instructions.join(
              "\n",
            )
          : exercise.instructions ||
            "",

      safetyTips:
        Array.isArray(
          exercise.safetyTips,
        )
          ? exercise.safetyTips.join(
              "\n",
            )
          : exercise.safetyTips ||
            "",

      secondaryMuscles:
        Array.isArray(
          exercise.secondaryMuscles,
        )
          ? exercise.secondaryMuscles
          : [],

      targetGender:
        Array.isArray(
          exercise.targetGender,
        ) &&
        exercise.targetGender.length
          ? exercise.targetGender
          : [
              "Male",
              "Female",
            ],

      fitnessGoals:
        Array.isArray(
          exercise.fitnessGoals,
        )
          ? exercise.fitnessGoals
          : [],

      equipment:
        Array.isArray(
          exercise.equipment,
        )
          ? exercise.equipment
          : [],

      difficulty:
        exercise.difficulty ||
        "Beginner",

      description:
        exercise.description ||
        "",

      mediaType,

      mediaUrl,

      status:
        exercise.isActive ===
        false
          ? "Inactive"
          : "Active",
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Filter exercises
  |--------------------------------------------------------------------------
  */

  const filteredExercises =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase()

      return exercises.filter(
        (exercise) => {
          const matchesSearch =
            !search ||
            exercise.name
              ?.toLowerCase()
              .includes(search) ||
            exercise.muscleGroup
              ?.toLowerCase()
              .includes(search) ||
            exercise.secondaryMuscles
              ?.join(" ")
              ?.toLowerCase()
              .includes(search)

          const matchesCategory =
            categoryFilter ===
              "all" ||
            exercise.category ===
              categoryFilter

          return (
            matchesSearch &&
            matchesCategory
          )
        },
      )
    }, [
      exercises,
      searchTerm,
      categoryFilter,
    ])

  /*
  |--------------------------------------------------------------------------
  | Create form
  |--------------------------------------------------------------------------
  */

  const openCreateForm =
    () => {
      setEditingExercise(null)

      setFormData({
        ...emptyExercise,

        secondaryMuscles: [],

        targetGender: [
          "Male",
          "Female",
        ],

        fitnessGoals: [
          "Keep Fit",
        ],

        equipment: [],
      })

      setSelectedFile(null)

      setPreviewUrl("")

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          ""
      }

      setShowForm(true)
    }

  /*
  |--------------------------------------------------------------------------
  | Edit form
  |--------------------------------------------------------------------------
  */

  const openEditForm = (
    exercise,
  ) => {
    setEditingExercise(
      exercise,
    )

    setFormData({
      name:
        exercise.name ||
        "",

      category:
        exercise.category ||
        "Upper Body",

      muscleGroup:
        exercise.muscleGroup ||
        "",

      secondaryMuscles:
        Array.isArray(
          exercise.secondaryMuscles,
        )
          ? exercise.secondaryMuscles
          : [],

      targetGender:
        Array.isArray(
          exercise.targetGender,
        ) &&
        exercise.targetGender.length
          ? exercise.targetGender
          : [
              "Male",
              "Female",
            ],

      fitnessGoals:
        Array.isArray(
          exercise.fitnessGoals,
        )
          ? exercise.fitnessGoals
          : [],

      difficulty:
        exercise.difficulty ||
        "Beginner",

      equipment:
        Array.isArray(
          exercise.equipment,
        )
          ? exercise.equipment
          : [],

      description:
        exercise.description ||
        "",

      instructions:
        Array.isArray(
          exercise.instructions,
        )
          ? exercise.instructions.join(
              "\n",
            )
          : exercise.instructions ||
            "",

      safetyTips:
        Array.isArray(
          exercise.safetyTips,
        )
          ? exercise.safetyTips.join(
              "\n",
            )
          : exercise.safetyTips ||
            "",

      sets:
        exercise.defaultSets ??
        exercise.sets ??
        3,

      reps:
        exercise.defaultReps ??
        exercise.reps ??
        10,

      weight:
        exercise.weight ||
        "",

      duration:
        exercise.defaultDuration ??
        exercise.duration ??
        "",

      rest:
        exercise.defaultRest !=
        null
          ? `${exercise.defaultRest} sec`
          : exercise.rest ||
            "60 sec",

      caloriesEstimate:
        exercise.caloriesEstimate ??
        "",

      mediaType:
        exercise.videoUrl
          ? "video"
          : "image",

      mediaUrl:
        exercise.videoUrl ||
        exercise.imageUrl ||
        "",

      status:
        exercise.isActive ===
        false
          ? "Inactive"
          : "Active",
    })

    setSelectedFile(null)

    setPreviewUrl(
      exercise.videoUrl ||
        exercise.imageUrl ||
        "",
    )

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        ""
    }

    setShowForm(true)
  }

  /*
  |--------------------------------------------------------------------------
  | Close form
  |--------------------------------------------------------------------------
  */

  const closeForm = () => {
    setShowForm(false)

    setEditingExercise(
      null,
    )

    setFormData({
      ...emptyExercise,
    })

    setSelectedFile(null)

    setPreviewUrl("")

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        ""
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Form changes
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      }),
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Toggle array option
  |--------------------------------------------------------------------------
  */

  const toggleArrayValue = (
    field,
    value,
  ) => {
    setFormData(
      (current) => {
        const currentValues =
          Array.isArray(
            current[field],
          )
            ? current[field]
            : []

        const exists =
          currentValues.includes(
            value,
          )

        return {
          ...current,

          [field]: exists
            ? currentValues.filter(
                (item) =>
                  item !== value,
              )
            : [
                ...currentValues,
                value,
              ],
        }
      },
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Secondary muscles
  |--------------------------------------------------------------------------
  */

  const handleSecondaryMusclesChange =
    (event) => {
      const values =
        event.target.value
          .split(",")
          .map(
            (item) =>
              item.trim(),
          )
          .filter(Boolean)

      setFormData(
        (current) => ({
          ...current,
          secondaryMuscles:
            values,
        }),
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Equipment
  |--------------------------------------------------------------------------
  */

  const handleEquipmentChange =
    (event) => {
      const values =
        event.target.value
          .split(",")
          .map(
            (item) =>
              item.trim(),
          )
          .filter(Boolean)

      setFormData(
        (current) => ({
          ...current,
          equipment:
            values,
        }),
      )
    }

  /*
  |--------------------------------------------------------------------------
  | Media type
  |--------------------------------------------------------------------------
  */

  const handleMediaTypeChange =
    (type) => {
      setFormData(
        (current) => ({
          ...current,

          mediaType:
            type,

          mediaUrl:
            editingExercise
              ? type ===
                "video"
                ? editingExercise.videoUrl ||
                  ""
                : editingExercise.imageUrl ||
                  ""
              : "",
        }),
      )

      setSelectedFile(null)

      if (
        editingExercise
      ) {
        setPreviewUrl(
          type === "video"
            ? editingExercise.videoUrl ||
                ""
            : editingExercise.imageUrl ||
                "",
        )
      } else {
        setPreviewUrl("")
      }

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          ""
      }
    }

  /*
  |--------------------------------------------------------------------------
  | File picker
  |--------------------------------------------------------------------------
  */

  const openFilePicker =
    () => {
      fileInputRef.current?.click()
    }

  /*
  |--------------------------------------------------------------------------
  | File selection
  |--------------------------------------------------------------------------
  */

  const handleFileChange = (
    event,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    if (
      formData.mediaType ===
      "image"
    ) {
      if (
        !file.type.startsWith(
          "image/",
        )
      ) {
        window.alert(
          "Please select an image file.",
        )

        event.target.value =
          ""

        return
      }
    }

    if (
      formData.mediaType ===
      "video"
    ) {
      if (
        !file.type.startsWith(
          "video/",
        )
      ) {
        window.alert(
          "Please select a video file.",
        )

        event.target.value =
          ""

        return
      }
    }

    /*
    |--------------------------------------------------------------------------
    | File size validation
    |--------------------------------------------------------------------------
    */

    const maxSize =
      formData.mediaType ===
      "video"
        ? 50 *
          1024 *
          1024
        : 5 *
          1024 *
          1024

    if (
      file.size >
      maxSize
    ) {
      window.alert(
        formData.mediaType ===
          "video"
          ? "Video must be 50 MB or less."
          : "Image must be 5 MB or less.",
      )

      event.target.value =
        ""

      return
    }

    /*
    |--------------------------------------------------------------------------
    | Revoke previous blob URL
    |--------------------------------------------------------------------------
    */

    if (
      previewUrl?.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        previewUrl,
      )
    }

    setSelectedFile(
      file,
    )

    const objectUrl =
      URL.createObjectURL(
        file,
      )

    setPreviewUrl(
      objectUrl,
    )

    /*
    |--------------------------------------------------------------------------
    | Do not save blob URL
    |--------------------------------------------------------------------------
    */

    setFormData(
      (current) => ({
        ...current,
        mediaUrl: "",
      }),
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Clean preview URL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (
        previewUrl?.startsWith(
          "blob:",
        )
      ) {
        URL.revokeObjectURL(
          previewUrl,
        )
      }
    }
  }, [previewUrl])

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      event,
    ) => {
      event.preventDefault()

      if (
        !formData.name.trim()
      ) {
        window.alert(
          "Please enter an exercise name.",
        )

        return
      }

      if (
        !formData.muscleGroup?.trim()
      ) {
        window.alert(
          "Please enter the primary muscle group.",
        )

        return
      }

      if (
        !formData.targetGender ||
        formData.targetGender.length ===
          0
      ) {
        window.alert(
          "Please select at least one target gender.",
        )

        return
      }

      if (
        !formData.fitnessGoals ||
        formData.fitnessGoals.length ===
          0
      ) {
        window.alert(
          "Please select at least one fitness goal.",
        )

        return
      }

      try {
        setSaving(true)

        /*
        |--------------------------------------------------------------------------
        | Build API payload
        |--------------------------------------------------------------------------
        */

        const payload = {
          name:
            formData.name.trim(),

          category:
            formData.category,

          muscleGroup:
            formData.muscleGroup.trim(),

          secondaryMuscles:
            Array.isArray(
              formData.secondaryMuscles,
            )
              ? formData.secondaryMuscles
              : [],

          targetGender:
            Array.isArray(
              formData.targetGender,
            )
              ? formData.targetGender
              : [
                  "Male",
                  "Female",
                ],

          fitnessGoals:
            Array.isArray(
              formData.fitnessGoals,
            )
              ? formData.fitnessGoals
              : [],

          difficulty:
            formData.difficulty ||
            "Beginner",

          equipment:
            Array.isArray(
              formData.equipment,
            )
              ? formData.equipment
              : [],

          description:
            formData.description?.trim() ||
            "",

          instructions:
            formData.instructions
              ? formData.instructions
                  .split("\n")
                  .map(
                    (item) =>
                      item.trim(),
                  )
                  .filter(Boolean)
              : [],

          safetyTips:
            formData.safetyTips
              ? formData.safetyTips
                  .split("\n")
                  .map(
                    (item) =>
                      item.trim(),
                  )
                  .filter(Boolean)
              : [],

          defaultSets:
            Number(
              formData.sets || 3,
            ),

          defaultReps:
            formData.reps !== "" &&
            formData.reps !== null &&
            formData.reps !==
              undefined
              ? Number(
                  formData.reps,
                )
              : null,

          defaultDuration:
            formData.duration !==
              "" &&
            formData.duration !==
              null &&
            formData.duration !==
              undefined
              ? Number(
                  formData.duration,
                )
              : null,

          defaultRest:
            parseRest(
              formData.rest,
            ),

          caloriesEstimate:
            formData.caloriesEstimate !==
              "" &&
            formData.caloriesEstimate !==
              null &&
            formData.caloriesEstimate !==
              undefined
              ? Number(
                  formData.caloriesEstimate,
                )
              : null,

          isActive:
            formData.status !==
            "Inactive",
        }

        /*
        |--------------------------------------------------------------------------
        | Media
        |--------------------------------------------------------------------------
        */

        if (
          selectedFile
        ) {
          if (
            formData.mediaType ===
            "video"
          ) {
            payload.video =
              selectedFile
          } else {
            payload.image =
              selectedFile
          }
        } else if (
          editingExercise
        ) {
          if (
            formData.mediaType ===
            "video"
          ) {
            payload.videoUrl =
              editingExercise.videoUrl ||
              ""
          } else {
            payload.imageUrl =
              editingExercise.imageUrl ||
              ""
          }
        }

        /*
        |--------------------------------------------------------------------------
        | API request
        |--------------------------------------------------------------------------
        */

        let response

        if (
          !editingExercise
        ) {
          response =
            await createExercise(
              payload,
            )
        } else {
          response =
            await updateExercise(
              editingExercise.id,
              payload,
            )
        }

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        const data =
          response?.data ||
          response

        if (
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to save exercise.",
          )
        }

        /*
        |--------------------------------------------------------------------------
        | Reload database data
        |--------------------------------------------------------------------------
        */

        await loadExercises()

        closeForm()

        window.alert(
          editingExercise
            ? "Exercise updated successfully."
            : "Exercise created successfully.",
        )
      } catch (error) {
        console.error(
          "Save exercise error:",
          error,
        )

        window.alert(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to save exercise.",
        )
      } finally {
        setSaving(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Delete / deactivate exercise
  |--------------------------------------------------------------------------
  */

  const handleDeleteExercise =
    async (
      id,
    ) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to deactivate this exercise?",
        )

      if (!confirmed) {
        return
      }

      try {
        const response =
          await deleteExerciseApi(
            id,
          )

        const data =
          response?.data ||
          response

        if (
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to deactivate exercise.",
          )
        }

        await loadExercises()
      } catch (error) {
        console.error(
          "Delete exercise error:",
          error,
        )

        window.alert(
          error.response?.data
            ?.message ||
            error.message ||
            "Unable to deactivate exercise.",
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-black px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-lime-400">
              CGF Admin
            </p>

            <h1 className="mt-1 text-3xl font-black text-white">
              Workouts
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Create and manage exercises used in CGF training programs.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreateForm
            }
            className="flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
          >
            <Plus
              size={18}
            />

            ADD EXERCISE
          </button>
        </div>

        {/* SEARCH */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 md:flex-row">

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
              />

              <input
                type="search"
                value={
                  searchTerm
                }
                onChange={(
                  event,
                ) =>
                  setSearchTerm(
                    event.target
                      .value,
                  )
                }
                placeholder="Search exercises..."
                className="w-full rounded-2xl border border-white/10 bg-black py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-700 focus:border-yellow-400"
              />
            </div>

            <select
              value={
                categoryFilter
              }
              onChange={(
                event,
              ) =>
                setCategoryFilter(
                  event.target
                    .value,
                )
              }
              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400"
            >
              <option value="all">
                All categories
              </option>

              {categories.map(
                (
                  category,
                ) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {
                      category
                    }
                  </option>
                ),
              )}
            </select>

          </div>
        </section>

        {/* EXERCISES */}

        {loading ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-sm font-bold text-gray-500">
              Loading exercises...
            </p>
          </div>
        ) : (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {filteredExercises.map(
              (
                exercise,
              ) => (
                <article
                  key={
                    exercise.id
                  }
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                >

                  {/* MEDIA */}

                  <div className="aspect-[9/16] w-full bg-black">

                    {exercise.mediaUrl ? (
                      exercise.mediaType ===
                      "video" ? (
                        <video
                          src={
                            exercise.mediaUrl
                          }
                          controls
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <img
                          src={
                            exercise.mediaUrl
                          }
                          alt={
                            exercise.name
                          }
                          className="h-full w-full object-contain"
                        />
                      )
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black">

                          {exercise.mediaType ===
                          "video" ? (
                            <Video
                              size={21}
                            />
                          ) : (
                            <Image
                              size={21}
                            />
                          )}

                        </div>

                        <p className="mt-3 text-xs font-semibold text-gray-600">
                          No demonstration uploaded
                        </p>
                      </div>
                    )}

                  </div>

                  {/* DETAILS */}

                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                          {
                            exercise.category
                          }
                        </p>

                        <h2 className="mt-1 text-lg font-black text-white">
                          {
                            exercise.name
                          }
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                          {
                            exercise.muscleGroup
                          }
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          exercise.status ===
                          "Active"
                            ? "bg-lime-400/10 text-lime-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {
                          exercise.status
                        }
                      </span>

                    </div>

                    {/* STATS */}

                    <div className="mt-4 grid grid-cols-2 gap-2">

                      <div className="rounded-2xl bg-black p-3">
                        <p className="text-[10px] text-gray-600">
                          Sets
                        </p>

                        <p className="mt-1 text-sm font-black text-white">
                          {
                            exercise.sets
                          }
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black p-3">
                        <p className="text-[10px] text-gray-600">
                          Reps
                        </p>

                        <p className="mt-1 text-sm font-black text-white">
                          {
                            exercise.reps
                          }
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black p-3">
                        <p className="text-[10px] text-gray-600">
                          Difficulty
                        </p>

                        <p className="mt-1 text-sm font-black text-yellow-400">
                          {
                            exercise.difficulty ||
                            "Beginner"
                          }
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black p-3">
                        <p className="text-[10px] text-gray-600">
                          Rest
                        </p>

                        <p className="mt-1 text-sm font-black text-white">
                          {
                            exercise.rest
                          }
                        </p>
                      </div>

                    </div>

                    {/* TARGET */}

                    <div className="mt-4 rounded-2xl bg-black p-3">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                        Recommended For
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">

                        {exercise.targetGender?.length ? (
                          exercise.targetGender.map(
                            (
                              gender,
                            ) => (
                              <span
                                key={
                                  gender
                                }
                                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white"
                              >
                                {gender}
                              </span>
                            ),
                          )
                        ) : (
                          <span className="text-xs font-bold text-white">
                            All members
                          </span>
                        )}

                      </div>

                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                        Fitness Goals
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">

                        {exercise.fitnessGoals?.length ? (
                          exercise.fitnessGoals.map(
                            (
                              goal,
                            ) => (
                              <span
                                key={
                                  goal
                                }
                                className="rounded-full bg-lime-400 px-2.5 py-1 text-[10px] font-black text-black"
                              >
                                {goal}
                              </span>
                            ),
                          )
                        ) : (
                          <span className="text-xs text-gray-400">
                            No goals assigned
                          </span>
                        )}

                      </div>

                    </div>

                    {/* MEDIA LABEL */}

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">

                      {exercise.mediaType ===
                      "video" ? (
                        <Video
                          size={14}
                        />
                      ) : (
                        <Image
                          size={14}
                        />
                      )}

                      {exercise.mediaType ===
                      "video"
                        ? "Video demonstration"
                        : "Image demonstration"}

                    </div>

                    {/* ACTIONS */}

                    <div className="mt-4 flex gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            exercise,
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-xs font-bold text-white transition hover:bg-yellow-400 hover:text-black"
                      >
                        <Edit3
                          size={15}
                        />

                        EDIT
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExercise(
                            exercise.id,
                          )
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-400 transition hover:bg-red-400 hover:text-white"
                        aria-label={`Delete ${exercise.name}`}
                      >
                        <Trash2
                          size={16}
                        />
                      </button>

                    </div>

                  </div>
                </article>
              ),
            )}

          </section>
        )}

        {/* EMPTY */}

        {!loading &&
          filteredExercises.length ===
            0 && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-12 text-center">

              <Dumbbell
                size={30}
                className="mx-auto text-gray-700"
              />

              <p className="mt-4 text-sm font-bold text-white">
                No exercises found
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Try a different search or category.
              </p>

            </div>
          )}

      </div>

      {/* ================================================================== */}
      {/* ADD / EDIT MODAL */}
      {/* ================================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-6 text-black sm:rounded-3xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Exercise Library
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {editingExercise
                    ? "Edit Exercise"
                    : "Add Exercise"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
              >
                <X
                  size={18}
                />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 space-y-5"
            >

              {/* BASIC INFORMATION */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-xs font-bold text-gray-600"
                >
                  Exercise name
                </label>

                <input
                  id="name"
                  name="name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Barbell Bench Press"
                  required
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                />

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* CATEGORY */}

                <div>

                  <label
                    htmlFor="category"
                    className="mb-2 block text-xs font-bold text-gray-600"
                  >
                    Category
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={
                      formData.category
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                  >
                    {categories.map(
                      (
                        category,
                      ) => (
                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {
                            category
                          }
                        </option>
                      ),
                    )}
                  </select>

                </div>

                {/* PRIMARY MUSCLE */}

                <div>

                  <label
                    htmlFor="muscleGroup"
                    className="mb-2 block text-xs font-bold text-gray-600"
                  >
                    Primary muscle group
                  </label>

                  <input
                    id="muscleGroup"
                    name="muscleGroup"
                    value={
                      formData.muscleGroup
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Chest"
                    required
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                  />

                </div>

              </div>

              {/* SECONDARY MUSCLES */}

              <div>

                <label
                  htmlFor="secondaryMuscles"
                  className="mb-2 block text-xs font-bold text-gray-600"
                >
                  Secondary muscles
                </label>

                <input
                  id="secondaryMuscles"
                  value={(
                    formData.secondaryMuscles ||
                    []
                  ).join(
                    ", ",
                  )}
                  onChange={
                    handleSecondaryMusclesChange
                  }
                  placeholder="e.g. Triceps, Shoulders, Core"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Separate muscle groups with commas.
                </p>

              </div>

              {/* RECOMMENDATION TARGET */}

              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-gray-500">
                    Recommendation Target
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Choose which CGF members should receive this exercise when the Admin creates a workout recommendation.
                  </p>
                </div>

                {/* GENDER */}

                <div className="mt-5">

                  <label className="mb-2 block text-xs font-bold text-gray-600">
                    Target gender
                  </label>

                  <div className="grid grid-cols-2 gap-2">

                    {genderOptions.map(
                      (
                        gender,
                      ) => {
                        const selected =
                          formData.targetGender?.includes(
                            gender,
                          )

                        return (
                          <button
                            key={
                              gender
                            }
                            type="button"
                            onClick={() =>
                              toggleArrayValue(
                                "targetGender",
                                gender,
                              )
                            }
                            className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                              selected
                                ? "border-black bg-black text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:border-black"
                            }`}
                          >
                            {selected
                              ? "✓ "
                              : ""}

                            {gender}
                          </button>
                        )
                      },
                    )}

                  </div>

                </div>

                {/* FITNESS GOALS */}

                <div className="mt-5">

                  <label className="mb-2 block text-xs font-bold text-gray-600">
                    Fitness goals
                  </label>

                  <div className="grid gap-2 sm:grid-cols-2">

                    {fitnessGoalOptions.map(
                      (
                        goal,
                      ) => {
                        const selected =
                          formData.fitnessGoals?.includes(
                            goal,
                          )

                        return (
                          <button
                            key={
                              goal
                            }
                            type="button"
                            onClick={() =>
                              toggleArrayValue(
                                "fitnessGoals",
                                goal,
                              )
                            }
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                              selected
                                ? "border-lime-400 bg-lime-400 text-black"
                                : "border-gray-200 bg-white text-gray-700 hover:border-black"
                            }`}
                          >
                            {selected
                              ? "✓ "
                              : ""}

                            {goal}
                          </button>
                        )
                      },
                    )}

                  </div>

                </div>

              </div>

              {/* DIFFICULTY / EQUIPMENT */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label
                    htmlFor="difficulty"
                    className="mb-2 block text-xs font-bold text-gray-600"
                  >
                    Difficulty
                  </label>

                  <select
                    id="difficulty"
                    name="difficulty"
                    value={
                      formData.difficulty
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                  >
                    {difficultyOptions.map(
                      (
                        difficulty,
                      ) => (
                        <option
                          key={
                            difficulty
                          }
                          value={
                            difficulty
                          }
                        >
                          {
                            difficulty
                          }
                        </option>
                      ),
                    )}
                  </select>

                </div>

                <div>

                  <label
                    htmlFor="equipment"
                    className="mb-2 block text-xs font-bold text-gray-600"
                  >
                    Equipment
                  </label>

                  <input
                    id="equipment"
                    value={(
                      formData.equipment ||
                      []
                    ).join(
                      ", ",
                    )}
                    onChange={
                      handleEquipmentChange
                    }
                    placeholder="e.g. Dumbbells, Bench"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                  />

                  <p className="mt-1 text-xs text-gray-400">
                    Separate equipment with commas.
                  </p>

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label
                  htmlFor="description"
                  className="mb-2 block text-xs font-bold text-gray-600"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  rows="3"
                  placeholder="Briefly describe the exercise..."
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-black"
                />

              </div>

              {/* WORKOUT DEFAULTS */}

              <div>

                <p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">
                  Workout defaults
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                  {/* SETS */}

                  <div>

                    <label
                      htmlFor="sets"
                      className="mb-2 block text-xs font-bold text-gray-600"
                    >
                      Sets
                    </label>

                    <input
                      id="sets"
                      name="sets"
                      type="number"
                      min="1"
                      value={
                        formData.sets
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                    />

                  </div>

                  {/* REPS */}

                  <div>

                    <label
                      htmlFor="reps"
                      className="mb-2 block text-xs font-bold text-gray-600"
                    >
                      Reps
                    </label>

                    <input
                      id="reps"
                      name="reps"
                      type="number"
                      min="1"
                      value={
                        formData.reps
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                    />

                  </div>

                  {/* DURATION */}

                  <div>

                    <label
                      htmlFor="duration"
                      className="mb-2 block text-xs font-bold text-gray-600"
                    >
                      Duration (seconds)
                    </label>

                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      value={
                        formData.duration
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 30"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                    />

                  </div>

                  {/* WEIGHT */}

                  <div>

                    <label
                      htmlFor="weight"
                      className="mb-2 block text-xs font-bold text-gray-600"
                    >
                      Weight
                    </label>

                    <input
                      id="weight"
                      name="weight"
                      value={
                        formData.weight
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 40 kg"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                    />

                  </div>

                  {/* REST */}

                  <div>

                    <label
                      htmlFor="rest"
                      className="mb-2 block text-xs font-bold text-gray-600"
                    >
                      Rest
                    </label>

                    <input
                      id="rest"
                      name="rest"
                      value={
                        formData.rest
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="60 sec"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                    />

                  </div>

                  {/* CALORIES */}

                  <div>

                    <label
                      htmlFor="caloriesEstimate"
                      className="mb-2 block text-xs font-bold text-gray-600"
                    >
                      Calories estimate
                    </label>

                    <input
                      id="caloriesEstimate"
                      name="caloriesEstimate"
                      type="number"
                      min="0"
                      value={
                        formData.caloriesEstimate
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 120"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                    />

                  </div>

                </div>

              </div>

              {/* INSTRUCTIONS */}

              <div>

                <label
                  htmlFor="instructions"
                  className="mb-2 block text-xs font-bold text-gray-600"
                >
                  Exercise instructions
                </label>

                <textarea
                  id="instructions"
                  name="instructions"
                  value={
                    formData.instructions
                  }
                  onChange={
                    handleChange
                  }
                  rows="5"
                  placeholder={
                    "Write one instruction per line...\nExample: Stand with your feet shoulder-width apart.\nLower your body slowly.\nPush through your heels to return."
                  }
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-black"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Put each instruction on a separate line.
                </p>

              </div>

              {/* SAFETY TIPS */}

              <div>

                <label
                  htmlFor="safetyTips"
                  className="mb-2 block text-xs font-bold text-gray-600"
                >
                  Safety tips
                </label>

                <textarea
                  id="safetyTips"
                  name="safetyTips"
                  value={
                    formData.safetyTips
                  }
                  onChange={
                    handleChange
                  }
                  rows="4"
                  placeholder={
                    "Write one safety tip per line...\nExample: Keep your back neutral.\nUse a weight appropriate for your ability."
                  }
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-black"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Put each safety tip on a separate line.
                </p>

              </div>

              {/* MEDIA */}

              <div className="rounded-3xl border border-gray-200 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-yellow-400">
                    {formData.mediaType ===
                    "video" ? (
                      <Video
                        size={18}
                      />
                    ) : (
                      <Image
                        size={18}
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-black">
                      Demonstration media
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Add a picture or video showing the exercise.
                    </p>
                  </div>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      handleMediaTypeChange(
                        "image",
                      )
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black ${
                      formData.mediaType ===
                      "image"
                        ? "bg-black text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    <Image
                      size={15}
                    />
                    IMAGE
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleMediaTypeChange(
                        "video",
                      )
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black ${
                      formData.mediaType ===
                      "video"
                        ? "bg-black text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    <Video
                      size={15}
                    />
                    VIDEO
                  </button>

                </div>

                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept={
                    formData.mediaType ===
                    "video"
                      ? "video/*"
                      : "image/*"
                  }
                  onChange={
                    handleFileChange
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={
                    openFilePicker
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-5 text-sm font-black transition hover:border-black hover:bg-gray-100"
                >
                  {formData.mediaType ===
                  "video" ? (
                    <Video
                      size={20}
                    />
                  ) : (
                    <Image
                      size={20}
                    />
                  )}

                  {selectedFile
                    ? "CHANGE FILE"
                    : formData.mediaType ===
                        "video"
                      ? "CHOOSE VIDEO"
                      : "CHOOSE IMAGE"}
                </button>

                {selectedFile && (
                  <div className="mt-3 rounded-2xl bg-gray-100 p-3">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Selected file
                    </p>

                    <p className="mt-1 break-all text-sm font-bold">
                      {
                        selectedFile.name
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(
                        2,
                      )}{" "}
                      MB
                    </p>

                  </div>
                )}

                {previewUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-black">

                    <div className="px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Preview
                      </p>
                    </div>

                    <div className="aspect-[9/16] w-full">

                      {formData.mediaType ===
                      "video" ? (
                        <video
                          src={
                            previewUrl
                          }
                          controls
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <img
                          src={
                            previewUrl
                          }
                          alt="Exercise demonstration preview"
                          className="h-full w-full object-contain"
                        />
                      )}

                    </div>

                  </div>
                )}

                {!selectedFile &&
                  !previewUrl &&
                  !editingExercise && (
                    <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">
                        Select an image or video from your computer.
                      </p>
                    </div>
                  )}

              </div>

              {/* STATUS */}

              <div>

                <label
                  htmlFor="status"
                  className="mb-2 block text-xs font-bold text-gray-600"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={
                    formData.status
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-black"
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>

              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="flex-1 rounded-2xl bg-gray-100 px-5 py-4 text-sm font-black disabled:opacity-50"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check
                    size={18}
                  />

                  {saving
                    ? "SAVING..."
                    : editingExercise
                      ? "SAVE CHANGES"
                      : "CREATE EXERCISE"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Parse rest time
|--------------------------------------------------------------------------
*/

function parseRest(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 60
  }

  const match =
    String(value).match(
      /\d+/,
    )

  if (!match) {
    return 60
  }

  return Number(
    match[0],
  )
}

export default Workouts