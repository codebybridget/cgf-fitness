const PROFILE_STORAGE_KEY =
  "cgf_member_profile"

const defaultProfile = {
  fullName: "CGF Member",
  email: "",
  phone: "",
  age: "",
  height: "",
  weight: "",
  address: "",
  goal: "keep_fit",
  medicalInfo: "",
  emergencyContact: {
    name: "",
    relationship: "",
    phone: "",
  },
}

const fitnessGoals = {
  lose_weight: "Lose Weight",
  keep_fit: "Keep Fit",
  gain_weight: "Gain Weight",
  become_trainer:
    "Train to Become a Trainer",
}

function getProfile() {
  try {
    const stored =
      localStorage.getItem(
        PROFILE_STORAGE_KEY,
      )

    if (!stored) {
      return {
        ...defaultProfile,
        emergencyContact: {
          ...defaultProfile.emergencyContact,
        },
      }
    }

    const parsed =
      JSON.parse(stored)

    return {
      ...defaultProfile,
      ...parsed,
      emergencyContact: {
        ...defaultProfile.emergencyContact,
        ...(parsed.emergencyContact ||
          {}),
      },
    }
  } catch (error) {
    console.error(
      "Unable to load member profile:",
      error,
    )

    return {
      ...defaultProfile,
      emergencyContact: {
        ...defaultProfile.emergencyContact,
      },
    }
  }
}

function saveProfile(profile) {
  localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(profile),
  )

  return profile
}

function updateProfile(changes) {
  const currentProfile =
    getProfile()

  const updatedProfile = {
    ...currentProfile,
    ...changes,
    emergencyContact: {
      ...currentProfile.emergencyContact,
      ...(changes.emergencyContact ||
        {}),
    },
  }

  return saveProfile(
    updatedProfile,
  )
}

function getFitnessGoalLabel(
  goal,
) {
  return (
    fitnessGoals[goal] ||
    "Keep Fit"
  )
}

function getFitnessGoals() {
  return {
    ...fitnessGoals,
  }
}

export {
  getProfile,
  saveProfile,
  updateProfile,
  getFitnessGoalLabel,
  getFitnessGoals,
}