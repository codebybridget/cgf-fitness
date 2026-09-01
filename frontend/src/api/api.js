import axios from "axios"

/*
|--------------------------------------------------------------------------
| API BASE URL
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
   "http://localhost:5000/api"

/*
|--------------------------------------------------------------------------
| Backend Base URL
|--------------------------------------------------------------------------
|
| Used for uploaded images/videos that are returned as relative paths.
|
*/

const BACKEND_BASE_URL =
  API_BASE_URL.replace(/\/api\/?$/, "")

/*
|--------------------------------------------------------------------------
| Axios instance
|--------------------------------------------------------------------------
*/

const api =
  axios.create({
    baseURL:
      API_BASE_URL,

    headers: {
      Accept:
        "application/json",
    },
  })

/*
|--------------------------------------------------------------------------
| Get authentication token
|--------------------------------------------------------------------------
*/

function getAuthToken() {
  return (
    localStorage.getItem(
      "token",
    ) ||
    localStorage.getItem(
      "accessToken",
    )
  )
}

/*
|--------------------------------------------------------------------------
| Build media URL
|--------------------------------------------------------------------------
*/

export function buildMediaUrl(
  mediaUrl,
) {
  if (!mediaUrl) {
    return ""
  }

  const value =
    String(mediaUrl).trim()

  if (!value) {
    return ""
  }

  if (
    value.startsWith(
      "http://",
    ) ||
    value.startsWith(
      "https://",
    ) ||
    value.startsWith(
      "blob:",
    ) ||
    value.startsWith(
      "data:",
    )
  ) {
    return value
  }

  if (
    value.startsWith("//")
  ) {
    return `${
      window.location.protocol
    }${value}`
  }

  if (
    value.startsWith("/")
  ) {
    return `${BACKEND_BASE_URL}${value}`
  }

  return `${BACKEND_BASE_URL}/${value}`
}

/*
|--------------------------------------------------------------------------
| Attach authentication token
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    const token =
      getAuthToken()

    if (token) {
      config.headers =
        config.headers || {}

      config.headers.Authorization =
        `Bearer ${token}`
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT: FormData uploads
    |--------------------------------------------------------------------------
    */

    if (
      config.data instanceof
      FormData
    ) {
      if (
        config.headers
      ) {
        delete config.headers[
          "Content-Type"
        ]

        delete config.headers[
          "content-type"
        ]
      }
    } else {
      config.headers =
        config.headers || {}

      if (
        !config.headers[
          "Content-Type"
        ] &&
        !config.headers[
          "content-type"
        ]
      ) {
        config.headers[
          "Content-Type"
        ] =
          "application/json"
      }
    }

    return config
  },

  (error) => {
    return Promise.reject(
      error,
    )
  },
)

/*
|--------------------------------------------------------------------------
| Handle authentication errors
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => {
    return response
  },

  (error) => {
    if (
      error.response?.status ===
      401
    ) {
      localStorage.removeItem(
        "token",
      )

      localStorage.removeItem(
        "accessToken",
      )

      localStorage.removeItem(
        "user",
      )
    }

    return Promise.reject(
      error,
    )
  },
)

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const loginUser =
  async (
    email,
    password,
  ) => {
    const response =
      await api.post(
        "/auth/login",
        {
          email,
          password,
        },
      )

    const data =
      response.data

    if (data?.token) {
      localStorage.setItem(
        "token",
        data.token,
      )

      localStorage.setItem(
        "accessToken",
        data.token,
      )
    }

    if (data?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user,
        ),
      )
    }

    return data
  }

/*
|--------------------------------------------------------------------------
| Get current authenticated user
|--------------------------------------------------------------------------
*/

export const getMe =
  async () => {
    const response =
      await api.get(
        "/auth/me",
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| Register member
|--------------------------------------------------------------------------
*/

export const registerUser =
  async (
    data,
  ) => {
    const response =
      await api.post(
        "/auth/register",
        data,
      )

    const result =
      response.data

    if (result?.token) {
      localStorage.setItem(
        "token",
        result.token,
      )

      localStorage.setItem(
        "accessToken",
        result.token,
      )
    }

    if (result?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          result.user,
        ),
      )
    }

    return result
  }
    /*
|--------------------------------------------------------------------------
| MEMBER PROFILE
|--------------------------------------------------------------------------
*/

/*
 * Get the currently authenticated
 * member profile from MongoDB.
 *
 * GET /api/profile/me
 */

export const getMyProfile =
  async () => {
    const response =
      await api.get(
        "/profile/me",
      )

    const data =
      response.data

    /*
     * Keep the locally cached user
     * synchronized with the backend.
     */

    if (data?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user,
        ),
      )
    }

    return data
  }


/*
|--------------------------------------------------------------------------
| Update Member Profile
|--------------------------------------------------------------------------
*/

export const updateMyProfile =
  async (
    data,
  ) => {
    const response =
      await api.put(
        "/profile/me",
        data,
      )

    const result =
      response.data

    /*
     * Keep local authentication
     * user information synchronized.
     */

    if (result?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          result.user,
        ),
      )
    }

    return result
  }


/*
|--------------------------------------------------------------------------
| Upload Profile Photo
|--------------------------------------------------------------------------
|
| PUT /api/profile/me/photo
|
| Sends the selected image as
| multipart/form-data.
|
*/

export const uploadProfilePhoto =
  async (
    file,
  ) => {
    if (!file) {
      throw new Error(
        "Please select a profile photo.",
      )
    }

    if (
      !file.type?.startsWith(
        "image/",
      )
    ) {
      throw new Error(
        "Only image files are allowed.",
      )
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      throw new Error(
        "Profile photo must be 5 MB or smaller.",
      )
    }

    const formData =
      new FormData()

    formData.append(
      "photo",
      file,
    )

    const response =
      await api.put(
        "/profile/me/photo",
        formData,
      )

    const result =
      response.data

    /*
     * Keep cached authentication
     * user synchronized.
     */

    if (result?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          result.user,
        ),
      )
    }

    return result
  }

/*
|--------------------------------------------------------------------------
| Update medical profile
|--------------------------------------------------------------------------
*/

export const updateMedicalProfile =
  async (
    data,
  ) => {
    const response =
      await api.put(
        "/profile/me/medical",
        data,
      )

    const result =
      response.data

    if (result?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          result.user,
        ),
      )
    }

    return result
  }

/*
|--------------------------------------------------------------------------
| Update fitness goal
|--------------------------------------------------------------------------
*/

export const updateFitnessGoal =
  async (
    fitnessGoal,
  ) => {
    const response =
      await api.put(
        "/profile/me/fitness-goal",
        {
          fitnessGoal,
        },
      )

    const result =
      response.data

    if (result?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          result.user,
        ),
      )
    }

    return result
  }

/*
|--------------------------------------------------------------------------
| EXERCISES
|--------------------------------------------------------------------------
*/

function normalizeExerciseMedia(
  exercise,
) {
  if (!exercise) {
    return exercise
  }

  return {
    ...exercise,

    imageUrl:
      buildMediaUrl(
        exercise.imageUrl,
      ),

    videoUrl:
      buildMediaUrl(
        exercise.videoUrl,
      ),
  }
}

function normalizeExerciseResponse(
  data,
) {
  if (!data) {
    return data
  }

  if (
    Array.isArray(
      data.exercises,
    )
  ) {
    return {
      ...data,

      exercises:
        data.exercises.map(
          normalizeExerciseMedia,
        ),
    }
  }

  if (data.exercise) {
    return {
      ...data,

      exercise:
        normalizeExerciseMedia(
          data.exercise,
        ),
    }
  }

  return data
}

/*
|--------------------------------------------------------------------------
| MEMBERSHIP
|--------------------------------------------------------------------------
*/

/*
 * Get active membership plans.
 *
 * GET /api/membership
 */

export const getMembershipPlans =
  async () => {
    const response =
      await api.get(
        "/membership",
      )

    return response.data
  }


/*
 * Get all membership plans.
 *
 * Admin only.
 *
 * GET /api/membership/all
 */

export const getAllMembershipPlans =
  async () => {
    const response =
      await api.get(
        "/membership/all",
      )

    return response.data
  }


/*
 * Create membership plan.
 *
 * Admin only.
 *
 * POST /api/membership
 */

export const createMembershipPlan =
  async (
    planData,
  ) => {
    const response =
      await api.post(
        "/membership",
        planData,
      )

    return response.data
  }


/*
 * Update membership plan.
 *
 * Admin only.
 *
 * PUT /api/membership/:id
 */

export const updateMembershipPlan =
  async (
    id,
    planData,
  ) => {
    const response =
      await api.put(
        `/membership/${id}`,
        planData,
      )

    return response.data
  }


/*
 * Deactivate membership plan.
 *
 * Admin only.
 *
 * DELETE /api/membership/:id
 */

export const deleteMembershipPlan =
  async (
    id,
  ) => {
    const response =
      await api.delete(
        `/membership/${id}`,
      )

    return response.data
  }
/*
|--------------------------------------------------------------------------
| Get exercises
|--------------------------------------------------------------------------
*/

export const getExercises =
  async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/exercises",
        {
          params,
        },
      )

    return normalizeExerciseResponse(
      response.data,
    )
  }

/*
|--------------------------------------------------------------------------
| Get exercise by ID
|--------------------------------------------------------------------------
*/

export const getExerciseById =
  async (
    id,
  ) => {
    const response =
      await api.get(
        `/exercises/${id}`,
      )

    return normalizeExerciseResponse(
      response.data,
    )
  }

/*
|--------------------------------------------------------------------------
| Create Exercise With Media
|--------------------------------------------------------------------------
*/


  export const createExerciseWithMedia =
  async (
    data,
  ) => {
    const formData =
      new FormData()

    formData.append(
      "name",
      data.name || "",
    )

    formData.append(
      "category",
      data.category || "",
    )

    formData.append(
      "muscleGroup",
      data.muscleGroup || "",
    )

    formData.append(
      "secondaryMuscles",
      JSON.stringify(
        Array.isArray(
          data.secondaryMuscles,
        )
          ? data.secondaryMuscles
          : [],
      ),
    )

    formData.append(
      "targetGender",
      JSON.stringify(
        Array.isArray(
          data.targetGender,
        )
          ? data.targetGender
          : [
              "Male",
              "Female",
            ],
      ),
    )

    formData.append(
      "fitnessGoals",
      JSON.stringify(
        Array.isArray(
          data.fitnessGoals,
        )
          ? data.fitnessGoals
          : [],
      ),
    )

    formData.append(
      "description",
      data.description || "",
    )

    formData.append(
      "difficulty",
      data.difficulty ||
        "Beginner",
    )

    formData.append(
      "defaultSets",
      data.defaultSets ??
        3,
    )

    formData.append(
      "defaultReps",
      data.defaultReps ??
        "",
    )

    formData.append(
      "defaultDuration",
      data.defaultDuration ??
        "",
    )

    formData.append(
      "defaultRest",
      data.defaultRest ??
        60,
    )

    formData.append(
      "caloriesEstimate",
      data.caloriesEstimate ??
        "",
    )

    formData.append(
      "instructions",
      JSON.stringify(
        Array.isArray(
          data.instructions,
        )
          ? data.instructions
          : [],
      ),
    )

    formData.append(
      "safetyTips",
      JSON.stringify(
        Array.isArray(
          data.safetyTips,
        )
          ? data.safetyTips
          : [],
      ),
    )

    formData.append(
      "equipment",
      JSON.stringify(
        Array.isArray(
          data.equipment,
        )
          ? data.equipment
          : [],
      ),
    )

    if (
      data.image instanceof
      File
    ) {
      formData.append(
        "image",
        data.image,
      )
    }

    if (
      data.video instanceof
      File
    ) {
      formData.append(
        "video",
        data.video,
      )
    }

    const response =
      await api.post(
        "/exercises",
        formData,
      )

    return normalizeExerciseResponse(
      response.data,
    )
  }

/*
|--------------------------------------------------------------------------
| Update Exercise With Media
|--------------------------------------------------------------------------
*/

export const updateExerciseWithMedia =
  async (
    id,
    data,
  ) => {
    const formData =
      new FormData()

    formData.append(
      "name",
      data.name || "",
    )

    formData.append(
      "category",
      data.category || "",
    )

    formData.append(
      "muscleGroup",
      data.muscleGroup || "",
    )

    formData.append(
      "description",
      data.description || "",
    )

    formData.append(
      "difficulty",
      data.difficulty ||
        "Beginner",
    )

    formData.append(
      "defaultSets",
      data.defaultSets ??
        3,
    )

    formData.append(
      "defaultReps",
      data.defaultReps ??
        "",
    )

    formData.append(
      "defaultDuration",
      data.defaultDuration ??
        "",
    )

    formData.append(
      "defaultRest",
      data.defaultRest ??
        60,
    )

    formData.append(
      "caloriesEstimate",
      data.caloriesEstimate ??
        "",
    )

    formData.append(
      "instructions",
      JSON.stringify(
        Array.isArray(
          data.instructions,
        )
          ? data.instructions
          : [],
      ),
    )

    formData.append(
      "equipment",
      JSON.stringify(
        Array.isArray(
          data.equipment,
        )
          ? data.equipment
          : [],
      ),
    )

    if (
      data.image instanceof
      File
    ) {
      formData.append(
        "image",
        data.image,
      )
    }

    if (
      data.video instanceof
      File
    ) {
      formData.append(
        "video",
        data.video,
      )
    }

    const response =
      await api.put(
        `/exercises/${id}`,
        formData,
      )

    return normalizeExerciseResponse(
      response.data,
    )
  }

/*
|--------------------------------------------------------------------------
| Backward-compatible Create Exercise
|--------------------------------------------------------------------------
*/

export const createExercise =
  async (
    data,
  ) => {
    if (
      data instanceof
      FormData
    ) {
      const response =
        await api.post(
          "/exercises",
          data,
        )

      return normalizeExerciseResponse(
        response.data,
      )
    }

    return createExerciseWithMedia(
      data,
    )
  }

/*
|--------------------------------------------------------------------------
| Backward-compatible Update Exercise
|--------------------------------------------------------------------------
*/

export const updateExercise =
  async (
    id,
    data,
  ) => {
    if (
      data instanceof
      FormData
    ) {
      const response =
        await api.put(
          `/exercises/${id}`,
          data,
        )

      return normalizeExerciseResponse(
        response.data,
      )
    }

    return updateExerciseWithMedia(
      id,
      data,
    )
  }

/*
|--------------------------------------------------------------------------
| Delete / deactivate exercise
|--------------------------------------------------------------------------
*/

export const deleteExercise =
  async (
    id,
  ) => {
    const response =
      await api.delete(
        `/exercises/${id}`,
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| PROGRAMS
|--------------------------------------------------------------------------
*/

export const getPrograms =
  async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/programs",
        {
          params,
        },
      )

    return response.data
  }

export const getProgramById =
  async (
    id,
  ) => {
    const response =
      await api.get(
        `/programs/${id}`,
      )

    return response.data
  }

export const createProgram =
  async (
    data,
  ) => {
    const response =
      await api.post(
        "/programs",
        data,
      )

    return response.data
  }

export const updateProgram =
  async (
    id,
    data,
  ) => {
    const response =
      await api.put(
        `/programs/${id}`,
        data,
      )

    return response.data
  }

export const deleteProgram =
  async (
    id,
  ) => {
    const response =
      await api.delete(
        `/programs/${id}`,
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| ADMIN MEMBERS
|--------------------------------------------------------------------------
*/

export const getMembers =
  async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/admin/members",
        {
          params,
        },
      )

    return response.data
  }

export const getMemberById =
  async (
    memberId,
  ) => {
    const response =
      await api.get(
        `/admin/members/${memberId}`,
      )

    return response.data
  }

export const updateMemberStatus =
  async (
    memberId,
    isActive,
  ) => {
    const response =
      await api.patch(
        `/admin/members/${memberId}/status`,
        {
          isActive,
        },
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| ADMIN TRAINERS
|--------------------------------------------------------------------------
*/

export const getTrainers =
  async () => {
    const response =
      await api.get(
        "/admin/trainers",
      )

    return response.data
  }

export const createTrainer =
  async (
    data,
  ) => {
    const response =
      await api.post(
        "/admin/trainers",
        data,
      )

    return response.data
  }

export const updateUserRole =
  async (
    userId,
    role,
  ) => {
    const response =
      await api.patch(
        `/admin/users/${userId}/role`,
        {
          role,
        },
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| MEMBER TODAY'S WORKOUT
|--------------------------------------------------------------------------
*/

export const getMyTodayWorkout =
  async () => {
    const response =
      await api.get(
        "/program-assignments/my-today",
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| MEMBER PROGRAM ASSIGNMENTS
|--------------------------------------------------------------------------
*/

export const getMyPrograms =
  async () => {
    const response =
      await api.get(
        "/program-assignments/my-programs",
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| ADMIN PROGRAM ASSIGNMENTS
|--------------------------------------------------------------------------
*/

export const getProgramAssignments =
  async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/program-assignments",
        {
          params,
        },
      )

    return response.data
  }

export const createProgramAssignment =
  async (
    data,
  ) => {
    const response =
      await api.post(
        "/program-assignments",
        data,
      )

    return response.data
  }

export const updateProgramAssignment =
  async (
    id,
    data,
  ) => {
    const response =
      await api.put(
        `/program-assignments/${id}`,
        data,
      )

    return response.data
  }

export const cancelProgramAssignment =
  async (
    id,
  ) => {
    const response =
      await api.delete(
        `/program-assignments/${id}`,
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| WORKOUT LOGS
|--------------------------------------------------------------------------
*/

export const getMyWorkoutLog =
  async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/workout-logs/me",
        {
          params,
        },
      )

    return response.data
  }

export const completeSet =
  async (
    data,
  ) => {
    const response =
      await api.post(
        "/workout-logs/set/complete",
        data,
      )

    return response.data
  }

export const uncompleteSet =
  async (
    data,
  ) => {
    const response =
      await api.post(
        "/workout-logs/set/uncomplete",
        data,
      )

    return response.data
  }

export const completeWorkout =
  async (
    data = {},
  ) => {
    const response =
      await api.post(
        "/workout-logs/complete",
        data,
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| ADMIN WORKOUT PROGRESS
|--------------------------------------------------------------------------
*/

export const getAdminWorkoutProgress =
  async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/workout-logs/admin/progress",
        {
          params,
        },
      )

    return response.data
  }

export const getAdminMemberWorkoutProgress =
  async (
    memberId,
    params = {},
  ) => {
    const response =
      await api.get(
        `/workout-logs/admin/members/${memberId}/progress`,
        {
          params,
        },
      )

    return response.data
  }

  export const initializePayment = async (
  planId,
) => {
  if (!planId) {
    throw new Error(
      "Membership plan is required.",
    )
  }

  const response =
    await api.post(
      "/payments/initialize",
      {
        planId,
      },
    )

  return response.data
}
/*
|--------------------------------------------------------------------------
| WEEKLY SCHEDULE
|--------------------------------------------------------------------------
*/

export const getWeeklySchedule =
  async (
    params = {},
  ) => {
    const response =
      await api.get(
        "/class-schedule",
        {
          params,
        },
      )

    return response.data
  }

/*
|--------------------------------------------------------------------------
| Export Axios instance
|--------------------------------------------------------------------------
*/

export default api
