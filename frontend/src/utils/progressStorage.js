const PROGRESS_STORAGE_KEY =
  "cgf_progress_data"

const defaultProgress = {
  startingWeight: 78,
  currentWeight: 76,
  targetWeight: 70,
  height: 175,
  weightHistory: [
    {
      date: "2026-08-15",
      weight: 78,
    },
    {
      date: "2026-08-17",
      weight: 77.5,
    },
    {
      date: "2026-08-19",
      weight: 77,
    },
    {
      date: "2026-08-21",
      weight: 76,
    },
  ],
}

function getProgressData() {
  try {
    const storedData =
      localStorage.getItem(
        PROGRESS_STORAGE_KEY,
      )

    if (!storedData) {
      return defaultProgress
    }

    const parsedData =
      JSON.parse(storedData)

    return {
      ...defaultProgress,
      ...parsedData,
    }
  } catch (error) {
    console.error(
      "Unable to load progress data:",
      error,
    )

    return defaultProgress
  }
}

function saveProgressData(data) {
  localStorage.setItem(
    PROGRESS_STORAGE_KEY,
    JSON.stringify(data),
  )

  return data
}

function addWeightEntry(weight) {
  const progress =
    getProgressData()

  const numericWeight =
    Number(weight)

  if (
    !Number.isFinite(
      numericWeight,
    ) ||
    numericWeight <= 0
  ) {
    return progress
  }

  const today =
    new Date()
      .toISOString()
      .split("T")[0]

  const updatedHistory = [
    ...(progress.weightHistory || []),
  ]

  const existingIndex =
    updatedHistory.findIndex(
      (entry) =>
        entry.date === today,
    )

  if (existingIndex >= 0) {
    updatedHistory[
      existingIndex
    ] = {
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
    currentWeight:
      numericWeight,
    weightHistory:
      updatedHistory,
  }

  return saveProgressData(
    updatedProgress,
  )
}

export {
  getProgressData,
  saveProgressData,
  addWeightEntry,
}