import {
  Bell,
  Check,
  Clock3,
  Dumbbell,
  Globe2,
  LockKeyhole,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react"
import { useEffect, useState } from "react"

const STORAGE_KEY = "cgf_admin_settings"

const DEFAULT_SETTINGS = {
  gymName: "CGF Fitness Management",
  contactEmail: "",
  phone: "",
  location: "",
  timezone: "Africa/Lagos",
  defaultWorkoutDuration: "60",
  defaultRestSeconds: "60",
  emailNotifications: true,
  workoutReminders: true,
  progressAlerts: true,
  memberRegistrationAlerts: true,
  requireAdminConfirmation: true,
  autoLogoutMinutes: "60",
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) return DEFAULT_SETTINGS

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(stored),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-bold text-white outline-none placeholder:text-gray-700 focus:border-lime-400"
      />
    </div>
  )
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-5 rounded-2xl border border-white/10 bg-black p-4 text-left transition hover:border-white/20"
    >
      <div className="min-w-0">
        <p className="text-sm font-black">{label}</p>
        <p className="mt-1 text-xs leading-5 text-gray-600">
          {description}
        </p>
      </div>

      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-lime-400" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full transition ${
            checked
              ? "left-6 bg-black"
              : "left-1 bg-gray-500"
          }`}
        />
      </span>
    </button>
  )
}

function Section({ icon: Icon, eyebrow, title, description, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-black">
          <Icon size={20} />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-lime-400">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-black">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-600">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  )
}

function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const update = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
    setSaved(false)
  }

  const saveSettings = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings),
    )

    setSaved(true)

    window.setTimeout(() => {
      setSaved(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <main className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-lime-400">
              <SettingsIcon size={18} />
              <span className="text-xs font-black uppercase tracking-widest">
                CGF Admin
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Manage the gym administration preferences and default
              operating behaviour.
            </p>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
          >
            {saved ? <Check size={17} /> : <Save size={17} />}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </header>

        {saved ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/5 px-4 py-3 text-sm font-bold text-lime-400">
            <Check size={17} />
            Your settings have been saved.
          </div>
        ) : null}

        <div className="mt-7 space-y-5">
          <Section
            icon={UserRound}
            eyebrow="Gym profile"
            title="Organisation details"
            description="Basic information displayed and used throughout the administration area."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Gym name"
                value={settings.gymName}
                onChange={(value) => update("gymName", value)}
                placeholder="CGF Fitness Management"
              />

              <Field
                label="Contact email"
                type="email"
                value={settings.contactEmail}
                onChange={(value) =>
                  update("contactEmail", value)
                }
                placeholder="admin@example.com"
              />

              <Field
                label="Phone number"
                value={settings.phone}
                onChange={(value) => update("phone", value)}
                placeholder="+234..."
              />

              <Field
                label="Location"
                value={settings.location}
                onChange={(value) => update("location", value)}
                placeholder="Kaduna, Nigeria"
              />
            </div>
          </Section>

          <Section
            icon={Globe2}
            eyebrow="Regional"
            title="Time & regional preferences"
            description="Control the timezone used when displaying dates and training schedules."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Timezone
                </label>

                <select
                  value={settings.timezone}
                  onChange={(event) =>
                    update("timezone", event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-lime-400"
                >
                  <option value="Africa/Lagos">
                    Africa/Lagos — Nigeria
                  </option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">
                    Europe/London
                  </option>
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-4">
                <div className="flex items-center gap-3">
                  <Clock3 size={18} className="text-lime-400" />
                  <div>
                    <p className="text-sm font-black">
                      Current application timezone
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {settings.timezone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section
            icon={Dumbbell}
            eyebrow="Training defaults"
            title="Workout preferences"
            description="Default values used when trainers create or assign workouts."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Default workout duration (minutes)"
                type="number"
                value={settings.defaultWorkoutDuration}
                onChange={(value) =>
                  update("defaultWorkoutDuration", value)
                }
                placeholder="60"
              />

              <Field
                label="Default rest between sets (seconds)"
                type="number"
                value={settings.defaultRestSeconds}
                onChange={(value) =>
                  update("defaultRestSeconds", value)
                }
                placeholder="60"
              />
            </div>
          </Section>

          <Section
            icon={Bell}
            eyebrow="Notifications"
            title="Administration alerts"
            description="Choose which operational notifications should be enabled."
          >
            <div className="space-y-3">
              <Toggle
                label="Email notifications"
                description="Allow the administration system to send email notifications."
                checked={settings.emailNotifications}
                onChange={(value) =>
                  update("emailNotifications", value)
                }
              />

              <Toggle
                label="Workout reminders"
                description="Enable reminders related to assigned member workouts."
                checked={settings.workoutReminders}
                onChange={(value) =>
                  update("workoutReminders", value)
                }
              />

              <Toggle
                label="Progress alerts"
                description="Surface important workout completion and progress events."
                checked={settings.progressAlerts}
                onChange={(value) =>
                  update("progressAlerts", value)
                }
              />

              <Toggle
                label="New member alerts"
                description="Notify administrators when a new member is registered."
                checked={settings.memberRegistrationAlerts}
                onChange={(value) =>
                  update("memberRegistrationAlerts", value)
                }
              />
            </div>
          </Section>

          <Section
            icon={ShieldCheck}
            eyebrow="Security"
            title="Administrator security"
            description="Set basic safeguards for sensitive administration actions."
          >
            <div className="space-y-3">
              <Toggle
                label="Require confirmation for sensitive actions"
                description="Ask for confirmation before actions such as status changes or destructive operations."
                checked={settings.requireAdminConfirmation}
                onChange={(value) =>
                  update("requireAdminConfirmation", value)
                }
              />

              <div className="rounded-2xl border border-white/10 bg-black p-4">
                <div className="flex items-start gap-3">
                  <LockKeyhole
                    size={18}
                    className="mt-0.5 shrink-0 text-lime-400"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-black">
                      Automatic logout
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      End inactive administrator sessions after the
                      selected period.
                    </p>

                    <div className="mt-4 max-w-xs">
                      <Field
                        label="Minutes"
                        type="number"
                        value={settings.autoLogoutMinutes}
                        onChange={(value) =>
                          update("autoLogoutMinutes", value)
                        }
                        placeholder="60"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-gray-400">
                <Smartphone size={20} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                  System
                </p>
                <h2 className="mt-1 text-lg font-black">
                  Administration environment
                </h2>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  CGF Admin is running in the local development
                  environment.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black p-4">
              <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <span className="font-bold text-gray-600">
                  Environment
                </span>
                <span className="font-black text-lime-400">
                  Development
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-3 border-t border-white/5 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <span className="font-bold text-gray-600">
                  Admin access
                </span>
                <span className="font-black text-lime-400">
                  Protected
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={saveSettings}
            className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
          >
            {saved ? <Check size={17} /> : <Save size={17} />}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </main>
    </div>
  )
}

export default Settings
