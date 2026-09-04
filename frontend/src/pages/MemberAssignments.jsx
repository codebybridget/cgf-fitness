import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Loader2,
  Trash2,
  User,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  cancelProgramAssignment,
  getProgramAssignments,
} from "../../api/api.js"

function formatDate(value) {
  if (!value) {
    return "No date"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  )
}

function normalizeWorkoutType(value) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")

  if (normalized === "lower body") {
    return "Lower Body"
  }

  if (normalized === "upper body") {
    return "Upper Body"
  }

  if (normalized === "crossfit") {
    return "CrossFit"
  }

  if (normalized === "tabata") {
    return "Tabata"
  }

  return value || "Workout"
}

function getMemberName(member) {
  if (!member) {
    return "Member"
  }

  return (
    `${member.firstName || ""} ${
      member.lastName || ""
    }`.trim() || "Member"
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg white/[0.02] p-10 text-center">
      <Dumbbell
        size={32}
        className="mx-auto text-gray-700"
      />

      <p className="mt-4 text-sm font-black text-gray-400">
        No active workout assignments
      </p>

      <p className="mt-2 text-xs font-medium text-gray-600">
        This member currently has no active programs assigned.
      </p>
    </div>
  )
}

function AssignmentCard({
  assignment,
  onCancel,
  cancellingId,
}) {
  const program =
    assignment?.program || {}

  const workoutType =
    normalizeWorkoutType(
      program?.workoutType,
    )

  const isCancelling =
    cancellingId === assignment?._id

  return (
    <div className="rounded-3xl border border-white/10 bg white/[0.03] p-5 transition hover:border-white/20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Program information */}
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-400/10 text-lime-400">
              <Dumbbell size={22} />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-white">
                {program?.name ||
                  "Workout Program"}
              </h3>

              <p className="mt-1 text-xs font-bold text-gray-500">
                {workoutType}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
              <CalendarDays
                size={13}
                className="text-gray-500"
              />

              <span className="text-[10px] font-bold text-gray-400">
                Start:{" "}
                {formatDate(
                  assignment?.startDate,
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-lime-400/10 px-3 py-2">
              <CheckCircle2
                size={13}
                className="text-lime-400"
              />

              <span className="text-[10px] font-black uppercase text-lime-400">
                {assignment?.status ||
                  "active"}
              </span>
            </div>

            {assignment?.endDate && (
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                <CalendarDays
                  size={13}
                  className="text-gray-500"
                />

                <span className="text-[10px] font-bold text-gray-400">
                  End:{" "}
                  {formatDate(
                    assignment.endDate,
                  )}
                </span>
              </div>
            )}
          </div>

          {assignment?.notes && (
            <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                Notes
              </p>

              <p className="mt-1 text-xs font-medium leading-5 text-gray-400">
                {assignment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Cancel button */}
        <button
          type="button"
          onClick={() =>
            onCancel(assignment)
          }
          disabled={isCancelling}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCancelling ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={15} />
          )}

          {isCancelling
            ? "Cancelling..."
            : "Cancel Assignment"}
        </button>
      </div>
    </div>
  )
}

export default function MemberAssignments({
  memberId,
  onBack,
}) {
  const [assignments, setAssignments] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const [cancellingId, setCancellingId] =
    useState("")

  const loadAssignments =
    async () => {
      try {
        setLoading(true)
        setError("")

        const response =
          await getProgramAssignments({
            memberId,
            status: "active",
          })

        const loadedAssignments =
          Array.isArray(
            response?.assignments,
          )
            ? response.assignments
            : []

        setAssignments(
          loadedAssignments,
        )
      } catch (err) {
        console.error(
          "Unable to load member assignments:",
          err,
        )

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load member assignments.",
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    if (memberId) {
      loadAssignments()
    }
  }, [memberId])

  const member =
    assignments?.[0]?.member || null

  const memberName =
    getMemberName(member)

  const memberEmail =
    member?.email || ""

  const assignmentCount =
    assignments.length

  const workoutTypes =
    useMemo(() => {
      return [
        ...new Set(
          assignments
            .map(
              (assignment) =>
                normalizeWorkoutType(
                  assignment?.program
                    ?.workoutType,
                ),
            )
            .filter(Boolean),
        ),
      ]
    }, [assignments])

  const handleCancel =
    async (assignment) => {
      if (!assignment?._id) {
        return
      }

      const programName =
        assignment?.program?.name ||
        "this workout"

      const confirmed =
        window.confirm(
          `Are you sure you want to cancel "${programName}" for ${memberName}?`,
        )

      if (!confirmed) {
        return
      }

      try {
        setCancellingId(
          assignment._id,
        )

        setError("")
        setSuccess("")

        const response =
          await cancelProgramAssignment(
            assignment._id,
          )

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to cancel assignment.",
          )
        }

        setAssignments(
          (current) =>
            current.filter(
              (item) =>
                item._id !==
                assignment._id,
            ),
        )

        setSuccess(
          response.message ||
            "Program assignment cancelled.",
        )
      } catch (err) {
        console.error(
          "Unable to cancel assignment:",
          err,
        )

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to cancel assignment.",
        )
      } finally {
        setCancellingId("")
      }
    }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-black text-white">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-lime-400"
          />

          <p className="mt-4 text-xs font-black uppercase tracking-wider text-gray-600">
            Loading member assignments...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-400 transition hover:border-white/20 hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to Assignments
        </button>

        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg -white/[0.03] p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lime-400/10 text-lime-400">
                <User size={25} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Member Assignments
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {memberName}
                </h1>

                {memberEmail && (
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {memberEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                  Active Programs
                </p>

                <p className="mt-1 text-2xl font-black text-lime-400">
                  {assignmentCount}
                </p>
              </div>

              {workoutTypes.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                    Workout Types
                  </p>

                  <p className="mt-1 text-sm font-black text-white">
                    {workoutTypes.join(
                      " • ",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-xs font-bold text-lime-400">
            {success}
          </div>
        )}

        {/* Assignments */}
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <Dumbbell
              size={18}
              className="text-yellow-400"
            />

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                MongoDB Assignments
              </p>

              <h2 className="mt-1 text-xl font-black text-white">
                Active Programs
              </h2>
            </div>
          </div>

          <div className="mt-5">
            {assignments.length ===
            0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {assignments.map(
                  (assignment) => (
                    <AssignmentCard
                      key={
                        assignment._id
                      }
                      assignment={
                        assignment
                      }
                      onCancel={
                        handleCancel
                      }
                      cancellingId={
                        cancellingId
                      }
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Loader2,
  Trash2,
  User,
} from "lucide-react"

import { useEffect, useState } from "react"

import {
  cancelProgramAssignment,
  getMemberById,
  getProgramAssignments,
} from "../../api/api.js"

function formatDate(value) {
  if (!value) return "No date"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getWorkoutType(program) {
  return (
    program?.workoutType ||
    program?.type ||
    program?.category ||
    "Workout"
  )
}

export default function MemberAssignments({ memberId, onBack }) {
  const [member, setMember] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancellingId, setCancellingId] = useState("")

  useEffect(() => {
    if (!memberId) return
    loadMemberAssignments()
  }, [memberId])

  const loadMemberAssignments = async () => {
    try {
      setLoading(true)
      setError("")

      const [memberResponse, assignmentResponse] =
        await Promise.all([
          getMemberById(memberId),
          getProgramAssignments({
            memberId,
            status: "active",
          }),
        ])

      setMember(
        memberResponse?.member ||
          memberResponse?.data?.member ||
          memberResponse?.data ||
          null,
      )

      setAssignments(
        Array.isArray(assignmentResponse?.assignments)
          ? assignmentResponse.assignments
          : [],
      )
    } catch (err) {
      console.error("Unable to load member assignments:", err)
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load member assignments.",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (assignmentId) => {
    const confirmed = window.confirm(
      "Cancel this program assignment?",
    )

    if (!confirmed) return

    try {
      setCancellingId(assignmentId)
      setError("")

      await cancelProgramAssignment(assignmentId)

      setAssignments((current) =>
        current.filter(
          (assignment) =>
            String(assignment._id) !== String(assignmentId),
        ),
      )
    } catch (err) {
      console.error("Unable to cancel assignment:", err)
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to cancel program assignment.",
      )
    } finally {
      setCancellingId("")
    }
  }

  const memberName =
    member?.fullName ||
    `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
    assignments[0]?.member?.fullName ||
    `${assignments[0]?.member?.firstName || ""} ${assignments[0]?.member?.lastName || ""}`.trim() ||
    "Member"

  const memberEmail =
    member?.email || assignments[0]?.member?.email || ""

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
              Loading member programs...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-7xl px-5 py-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm font-black text-gray-400 transition hover:text-lime-400"
        >
          <ArrowLeft size={17} />
          Back to Assignments
        </button>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400 text-black">
                <User size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-black">
                  {memberName}
                </h1>
                {memberEmail && (
                  <p className="mt-1 text-sm text-gray-500">
                    {memberEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Active Programs
              </p>
              <p className="mt-1 text-2xl font-black text-lime-400">
                {assignments.length}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
            {error}
          </div>
        )}

        <section className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-lime-400" />
            <h2 className="text-lg font-black">
              Assigned Programs
            </h2>
          </div>

          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <Dumbbell
                size={30}
                className="mx-auto text-gray-700"
              />
              <p className="mt-3 text-sm font-bold text-gray-500">
                No active programs are assigned to this member.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {assignments.map((assignment) => {
                const program = assignment.program || {}
                const workoutType = getWorkoutType(program)

                return (
                  <article
                    key={assignment._id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
                          <Dumbbell size={18} />
                        </div>

                        <div>
                          <h3 className="text-lg font-black">
                            {program.name || "Workout Program"}
                          </h3>
                          <p className="mt-1 text-xs font-bold text-lime-400">
                            {workoutType}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-lime-400/10 px-3 py-1 text-[9px] font-black uppercase text-lime-400">
                        {assignment.status || "active"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-black px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarDays size={14} />
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            Start Date
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold">
                          {formatDate(assignment.startDate)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarDays size={14} />
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            End Date
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold">
                          {formatDate(assignment.endDate)}
                        </p>
                      </div>
                    </div>

                    {assignment.notes && (
                      <div className="mt-4 rounded-2xl bg-black px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
                          Notes
                        </p>
                        <p className="mt-1 text-xs leading-5 text-gray-400">
                          {assignment.notes}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCancel(assignment._id)}
                      disabled={cancellingId === assignment._id}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-black text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancellingId === assignment._id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      {cancellingId === assignment._id
                        ? "Cancelling..."
                        : "Cancel Assignment"}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
