const STORAGE_PREFIX = "cgf_progress_data"
const LEGACY_STORAGE_KEY = "cgf_progress_data"

const defaultProgress = {
  startingWeight: 0,
  currentWeight: 0,
  targetWeight: 70,
  height: 0,
  weightHistory: [],
}

function getCurrentUserId() {
  try {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) return null

    const user = JSON.parse(storedUser)
    return user?._id || user?.id || user?.userId || null
  } catch (error) {
    console.error("Unable to determine current user:", error)
    return null
  }
}

function getStorageKey(userId = getCurrentUserId()) {
  return userId ? `${STORAGE_PREFIX}:${userId}` : null
}

function createDefaultProgress() {
  return {
    ...defaultProgress,
    weightHistory: [],
  }
}

function getProgressData() {
  const storageKey = getStorageKey()
  if (!storageKey) return createDefaultProgress()

  try {
    const storedData = localStorage.getItem(storageKey)
    if (!storedData) return createDefaultProgress()

    const parsedData = JSON.parse(storedData)

    return {
      ...createDefaultProgress(),
      ...parsedData,
      weightHistory: Array.isArray(parsedData?.weightHistory)
        ? parsedData.weightHistory
        : [],
    }
  } catch (error) {
    console.error("Unable to load progress data:", error)
    return createDefaultProgress()
  }
}

function saveProgressData(data) {
  const storageKey = getStorageKey()
  if (!storageKey) return data

  localStorage.setItem(storageKey, JSON.stringify(data))
  return data
}

function addWeightEntry(weight) {
  const progress = getProgressData()
  const numericWeight = Number(weight)

  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    return progress
  }

  const today = new Date().toISOString().split("T")[0]
  const updatedHistory = [...(progress.weightHistory || [])]
  const existingIndex = updatedHistory.findIndex(
    (entry) => entry.date === today,
  )

  if (existingIndex >= 0) {
    updatedHistory[existingIndex] = {
      date: today,
      weight: numericWeight,
    }
  } else {
    updatedHistory.push({
      date: today,
      weight: numericWeight,
    })
  }

  const updatedProgress = {
    ...progress,
    startingWeight:
      Number(progress.startingWeight) > 0
        ? Number(progress.startingWeight)
        : numericWeight,
    currentWeight: numericWeight,
    weightHistory: updatedHistory,
  }

  return saveProgressData(updatedProgress)
}

function clearProgressData() {
  const storageKey = getStorageKey()
  if (storageKey) localStorage.removeItem(storageKey)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export {
  getProgressData,
  saveProgressData,
  addWeightEntry,
  clearProgressData,
}
