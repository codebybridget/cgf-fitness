import {
  CalendarDays,
  Check,
  Clock3,
  Dumbbell,
  MapPin,
  Save,
} from "lucide-react"
import { useState } from "react"

import {
  getAdminSchedule,
  saveAdminSchedule,
} from "../../utils/adminScheduleStorage"

const workoutTypes = [
  {
    value: "lower_body",
    label: "Lower Body",
  },
  {
    value: "upper_body",
    label: "Upper Body",
  },
  {
    value: "crossfit",
    label: "CrossFit",
  },
  {
    value: "tabata",
    label: "Tabata",
  },
  {
    value: "rest",
    label: "Rest Day",
  },
]

function WeeklyScheduleAdmin() {
  const [schedule, setSchedule] =
    useState(() =>
      getAdminSchedule(),
    )

  const [selectedId, setSelectedId] =
    useState(1)

  const [saved, setSaved] =
    useState(false)

  const selectedDay =
    schedule.find(
      (item) =>
        item.id === selectedId,
    )

  const updateSelectedDay = (
    field,
    value,
  ) => {
    setSchedule((current) =>
      current.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )

    setSaved(false)
  }

  const handleSave = () => {
    saveAdminSchedule(
      schedule,
    )

    setSaved(true)

    setTimeout(() => {
      setSaved(false)
    }, 3000)
  }

  if (!selectedDay) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lime-400">
              <CalendarDays
                size={18}
              />

              <span className="text-xs font-black uppercase tracking-widest">
                Trainer Control
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black">
              Weekly Schedule
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Set the training schedule that
              members will see in their CGF
              member app.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-black text-black"
          >
            {saved ? (
              <>
                <Check size={17} />
                SAVED
              </>
            ) : (
              <>
                <Save size={17} />
                SAVE SCHEDULE
              </>
            )}
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                Training Days
              </p>

              <h2 className="mt-1 text-lg font-black">
                Weekly Plan
              </h2>
            </div>

            <div className="space-y-2">
              {schedule.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        item.id,
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      selectedId ===
                      item.id
                        ? "border-yellow-400 bg-yellow-400/10"
                        : "border-white/10 bg-black hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
                        item.workoutType ===
                        "rest"
                          ? "bg-white/5 text-gray-600"
                          : "bg-lime-400 text-black"
                      }`}
                    >
                      {
                        item.shortDay
                      }
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black">
                        {item.title}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-gray-600">
                        {item.startTime
                          ? `${item.startTime} – ${item.endTime}`
                          : "Recovery"}
                      </p>
                    </div>
                  </button>
                ),
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start gap-4 border-b border-white/10 pb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                <Dumbbell size={24} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                  {selectedDay.day}
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Edit Workout
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field
                label="Workout Name"
                value={
                  selectedDay.title
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "title",
                    value,
                  )
                }
              />

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Workout Type
                </label>

                <select
                  value={
                    selectedDay.workoutType
                  }
                  onChange={(event) =>
                    updateSelectedDay(
                      "workoutType",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-lime-400"
                >
                  {workoutTypes.map(
                    (type) => (
                      <option
                        key={
                          type.value
                        }
                        value={
                          type.value
                        }
                      >
                        {
                          type.label
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>

              <Field
                label="Start Time"
                value={
                  selectedDay.startTime
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "startTime",
                    value,
                  )
                }
              />

              <Field
                label="End Time"
                value={
                  selectedDay.endTime
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "endTime",
                    value,
                  )
                }
              />

              <Field
                label="Location"
                value={
                  selectedDay.location
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "location",
                    value,
                  )
                }
              />

              <Field
                label="Duration"
                value={
                  selectedDay.duration
                }
                onChange={(value) =>
                  updateSelectedDay(
                    "duration",
                    value,
                  )
                }
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                Workout Description
              </label>

              <textarea
                rows={5}
                value={
                  selectedDay.description
                }
                onChange={(event) =>
                  updateSelectedDay(
                    "description",
                    event.target.value,
                  )
                }
                className="w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm leading-6 text-white outline-none focus:border-lime-400"
              />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <InfoCard
                icon={CalendarDays}
                label="Day"
                value={
                  selectedDay.day
                }
              />

              <InfoCard
                icon={Clock3}
                label="Time"
                value={
                  selectedDay.startTime
                    ? `${selectedDay.startTime} – ${selectedDay.endTime}`
                    : "Rest"
                }
              />

              <InfoCard
                icon={MapPin}
                label="Location"
                value={
                  selectedDay.location ||
                  "Not set"
                }
              />
            </div>

            <div className="mt-6 rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4">
              <p className="text-xs font-black text-lime-400">
                MEMBER VIEW
              </p>

              <p className="mt-2 text-sm font-black">
                Members will see:
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                {selectedDay.day} ·{" "}
                {selectedDay.title} ·{" "}
                {selectedDay.startTime || "Rest Day"}
                {selectedDay.endTime
                  ? ` – ${selectedDay.endTime}`
                  : ""}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-lime-400"
      />
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-black p-4">
      <Icon
        size={16}
        className="text-yellow-400"
      />

      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-1 text-xs font-black">
        {value}
      </p>
    </div>
  )
}

export default WeeklyScheduleAdmin