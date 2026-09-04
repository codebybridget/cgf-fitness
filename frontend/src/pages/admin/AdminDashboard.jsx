import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Dumbbell,
  RefreshCw,
  Settings,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  getAdminWorkoutProgress,
  getMembers,
} from "../../api/api.js"

function formatToday() {
  return new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function memberName(member) {
  if (!member) return "Unknown member"

  return (
    member.fullName ||
    `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
    member.name ||
    member.email ||
    "Unknown member"
  )
}

function initials(member) {
  return memberName(member)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  iconClass = "bg-yellow-400 text-black",
}) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon size={21} strokeWidth={2.2} />
        </div>

        <TrendingUp
          size={17}
          className="text-gray-700 transition group-hover:text-lime-400"
        />
      </div>

      <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-white">
        {value}
      </p>

      {detail ? (
        <p className="mt-1 text-xs text-gray-600">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    completed: {
      label: "Completed",
      className:
        "border-lime-400/20 bg-lime-400/10 text-lime-400",
      icon: CheckCircle2,
    },
    in_progress: {
      label: "In progress",
      className:
        "border-yellow-400/20 bg-yellow-400/10 text-yellow-400",
      icon: Activity,
    },
    not_started: {
      label: "Not started",
      className:
        "border-white/10 bg-white/5 text-gray-500",
      icon: Clock3,
    },
  }

  const meta = config[status] || config.not_started
  const Icon = meta.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${meta.className}`}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  )
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
  accent = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
        accent
          ? "border-lime-400/20 bg -lime-400/[0.06] hover:bg -lime-400/[0.10]"
          : "border-white/10 bg-black hover:border-white/20 hover:bg -white/[0.03]"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          accent
            ? "bg-lime-400 text-black"
            : "bg-white/5 text-yellow-400"
        }`}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-white">
          {title}
        </p>
        <p className="mt-1 text-xs text-gray-600">
          {description}
        </p>
      </div>

      <ArrowRight
        size={17}
        className="shrink-0 text-gray-600"
      />
    </button>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError("")

      const today = new Date()
      const date = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-")

      const [membersResponse, progressResponse] =
        await Promise.all([
          getMembers(),
          getAdminWorkoutProgress({ date }),
        ])

      setMembers(
        Array.isArray(membersResponse?.members)
          ? membersResponse.members
          : [],
      )

      setProgress(
        Array.isArray(progressResponse?.progress)
          ? progressResponse.progress
          : [],
      )

      setLastUpdated(new Date())
    } catch (err) {
      console.error(
        "Load admin dashboard error:",
        err,
      )

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load dashboard data.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const summary = useMemo(() => {
    const totalMembers = members.length

    const activeMembers = members.filter(
      (member) => member.isActive !== false,
    ).length

    const completed = progress.filter(
      (item) =>
        item.workout?.status === "completed" ||
        item.workout?.completed === true,
    ).length

    const inProgress = progress.filter(
      (item) =>
        item.workout?.status === "in_progress",
    ).length

    const pending = progress.filter(
      (item) =>
        !item.workout?.status ||
        item.workout?.status === "not_started",
    ).length

    const calories = progress.reduce(
      (sum, item) =>
        sum +
        Number(
          item.workout?.caloriesBurned || 0,
        ),
      0,
    )

    const averageProgress =
      progress.length > 0
        ? Math.round(
            progress.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.workout?.progressPercent || 0,
                ),
              0,
            ) / progress.length,
          )
        : 0

    return {
      totalMembers,
      activeMembers,
      completed,
      inProgress,
      pending,
      calories,
      averageProgress,
    }
  }, [members, progress])

  const recentActivity = useMemo(() => {
    return [...progress]
      .sort((a, b) => {
        const aDate =
          a.workout?.completedAt ||
          a.workout?.date ||
          a.createdAt ||
          ""
        const bDate =
          b.workout?.completedAt ||
          b.workout?.date ||
          b.createdAt ||
          ""

        return (
          new Date(bDate).getTime() -
          new Date(aDate).getTime()
        )
      })
      .slice(0, 5)
  }, [progress])

  const topMembers = useMemo(() => {
    return [...members]
      .sort((a, b) => {
        const aDate = new Date(
          a.createdAt || 0,
        ).getTime()
        const bDate = new Date(
          b.createdAt || 0,
        ).getTime()

        return bDate - aDate
      })
      .slice(0, 4)
  }, [members])

  const activeRate =
    summary.totalMembers > 0
      ? Math.round(
          (summary.activeMembers /
            summary.totalMembers) *
            100,
        )
      : 0

  return (
    <div className="min-h-full bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lime-400">
              <Activity size={17} />
              <span className="text-[11px] font-black uppercase tracking-[0.18em]">
                CGF Admin
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Your live overview of members, training
              activity and CGF operations.
            </p>

            <p className="mt-2 text-xs font-medium text-gray-700">
              {formatToday()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated ? (
              <span className="hidden text-[10px] text-gray-700 sm:block">
                Updated{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-NG",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            ) : null}

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black text-gray-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </header>

        {/* Error */}
        {error ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total Members"
            value={
              loading
                ? "—"
                : summary.totalMembers
            }
            detail={
              summary.totalMembers === 1
                ? "1 registered member"
                : `${summary.totalMembers} registered members`
            }
          />

          <StatCard
            icon={UserPlus}
            label="Active Members"
            value={
              loading
                ? "—"
                : summary.activeMembers
            }
            detail={`${activeRate}% of registered members`}
            iconClass="bg-lime-400 text-black"
          />

          <StatCard
            icon={Dumbbell}
            label="Today's Workouts"
            value={
              loading
                ? "—"
                : progress.length
            }
            detail={`${summary.completed} completed · ${summary.inProgress} in progress`}
          />

          <StatCard
            icon={Activity}
            label="Training Progress"
            value={
              loading
                ? "—"
                : `${summary.averageProgress}%`
            }
            detail={`${summary.calories.toLocaleString()} calories recorded`}
            iconClass="bg-white text-black"
          />
        </section>

        {/* Main grid */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          {/* Today's activity */}
          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                  Live overview
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Today&apos;s Training Activity
                </h2>

                <p className="mt-1 text-xs text-gray-600">
                  Monitor how members are progressing
                  through assigned workouts.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/progress")
                }
                className="hidden items-center gap-1.5 text-xs font-black text-lime-400 transition hover:text-lime-300 sm:flex"
              >
                View progress
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-black p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                  Completed
                </p>
                <p className="mt-2 text-2xl font-black text-lime-400">
                  {summary.completed}
                </p>
              </div>

              <div className="rounded-2xl bg-black p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                  In progress
                </p>
                <p className="mt-2 text-2xl font-black text-yellow-400">
                  {summary.inProgress}
                </p>
              </div>

              <div className="rounded-2xl bg-black p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                  Pending
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {summary.pending}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {loading ? (
                <div className="rounded-2xl border border-white/5 bg-black p-6 text-center text-xs text-gray-600">
                  Loading training activity...
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black p-8 text-center">
                  <Dumbbell
                    size={25}
                    className="mx-auto text-gray-700"
                  />
                  <p className="mt-3 text-sm font-black text-gray-400">
                    No workout activity yet
                  </p>
                  <p className="mt-1 text-xs text-gray-700">
                    Assigned workouts will appear here
                    when members begin training.
                  </p>
                </div>
              ) : (
                recentActivity.map((item, index) => {
                  const member =
                    item.member ||
                    members.find(
                      (currentMember) =>
                        String(
                          currentMember._id ||
                            currentMember.id,
                        ) ===
                        String(
                          item.member?._id ||
                            item.member?.id,
                        ),
                    )

                  const name = memberName(member)
                  const percent = Math.max(
                    0,
                    Math.min(
                      100,
                      Number(
                        item.workout
                          ?.progressPercent || 0,
                      ),
                    ),
                  )

                  return (
                    <div
                      key={`${item.member?._id || index}-${item.workout?.date || index}`}
                      className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-black p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-xs font-black text-black">
                          {initials(member)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-gray-600">
                            {item.program?.name ||
                              "Assigned workout"}
                          </p>
                        </div>
                      </div>

                      <div className="w-full sm:max-w- [190px]">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-600">
                            {percent}% complete
                          </span>
                          <StatusBadge
                            status={
                              item.workout?.status
                            }
                          />
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-lime-400 transition-all"
                            style={{
                              width: `${percent}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/progress")
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-black text-gray-400 transition hover:border-white/20 hover:text-white sm:hidden"
            >
              Open full progress
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Quick actions */}
          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
              Quick actions
            </p>

            <h2 className="mt-1 text-xl font-black">
              Manage CGF
            </h2>

            <div className="mt-5 space-y-3">
              <QuickAction
                icon={CalendarDays}
                title="Manage Schedule"
                description="Create and manage weekly training sessions."
                onClick={() =>
                  navigate("/admin/schedule")
                }
                accent
              />

              <QuickAction
                icon={Users}
                title="View Members"
                description="Review member profiles and account status."
                onClick={() =>
                  navigate("/admin/members")
                }
              />

              <QuickAction
                icon={Dumbbell}
                title="Manage Workouts"
                description="Create and maintain your exercise library."
                onClick={() =>
                  navigate("/admin/workouts")
                }
              />

              <QuickAction
                icon={ClipboardCheck}
                title="Attendance"
                description="View member attendance, yearly records and gift eligibility."
                onClick={() =>
                  navigate("/admin/attendance")
                }
              />

              <QuickAction
                icon={Settings}
                title="Admin Settings"
                description="Configure CGF administration preferences."
                onClick={() =>
                  navigate("/admin/settings")
                }
              />
            </div>
          </div>
        </section>

        {/* Members + system status */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                  Membership
                </p>
                <h2 className="mt-1 text-xl font-black">
                  Recent Members
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/members")
                }
                className="flex items-center gap-1.5 text-xs font-black text-lime-400"
              >
                All members
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="mt-5">
              {topMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black p-7 text-center text-xs text-gray-700">
                  No members registered yet.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {topMembers.map((member) => (
                    <div
                      key={
                        member._id ||
                        member.id ||
                        member.email
                      }
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-xs font-black text-black">
                        {initials(member)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">
                          {memberName(member)}
                        </p>
                        <p className="truncate text-xs text-gray-600">
                          {member.email ||
                            "No email available"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${
                          member.isActive === false
                            ? "border-red-400/20 bg-red-400/5 text-red-400"
                            : "border-lime-400/20 bg-lime-400/10 text-lime-400"
                        }`}
                      >
                        {member.isActive === false
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-lime-400/15 bg -lime-400/[0.025] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-black">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-lime-400">
                  System status
                </p>
                <h2 className="mt-1 text-xl font-black">
                  CGF is operational
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-black/50 px-4 py-3">
                <span className="text-xs text-gray-500">
                  Member records
                </span>
                <span className="text-xs font-black text-lime-400">
                  {summary.totalMembers}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-black/50 px-4 py-3">
                <span className="text-xs text-gray-500">
                  Active accounts
                </span>
                <span className="text-xs font-black text-lime-400">
                  {summary.activeMembers}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-black/50 px-4 py-3">
                <span className="text-xs text-gray-500">
                  Workout records today
                </span>
                <span className="text-xs font-black text-yellow-400">
                  {progress.length}
                </span>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-gray-600">
              Dashboard figures are loaded from the CGF
              backend and update when you refresh the
              dashboard.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AdminDashboard
