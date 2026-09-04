        import {
        ArrowLeft,
        CalendarDays,
        ChevronLeft,
        ChevronRight,
        Dumbbell,
        Edit3,
        Loader2,
        Save,
        Trash2,
        User,
        X,
        } from "lucide-react"

        import { useEffect, useMemo, useState } from "react"

        import {
        cancelProgramAssignment,
        getProgramAssignments,
        getPrograms,
        updateProgramAssignment,
        } from "../../api/api.js"

        function getLocalDateKey(date = new Date()) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
        }

        function parseCalendarDate(value) {
        if (!value) return null

        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)

        if (match) {
            const date = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            )

            if (
            date.getFullYear() === Number(match[1]) &&
            date.getMonth() === Number(match[2]) - 1 &&
            date.getDate() === Number(match[3])
            ) {
            return date
            }
        }

        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? null : date
        }

        function formatDate(value) {
        const date = parseCalendarDate(value)
        if (!date) return "No date"

        return date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        })
        }

        function formatWeekRange(date) {
        const start = new Date(date)
        const end = new Date(date)
        end.setDate(start.getDate() + 6)

        return `${start.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        })} – ${end.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        })}`
        }

        function getMonday(date = new Date()) {
        const result = new Date(date)
        result.setHours(0, 0, 0, 0)

        const day = result.getDay()
        const diff = day === 0 ? -6 : 1 - day
        result.setDate(result.getDate() + diff)

        return result
        }

        function getProgramId(program) {
        return program?._id || program?.id || program || ""
        }

        function getMemberName(member) {
        return (
            member?.fullName ||
            `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
            "Member"
        )
        }

        export default function MemberAssignments({ memberId, onBack }) {
        const [member, setMember] = useState(null)
        const [assignments, setAssignments] = useState([])
        const [programs, setPrograms] = useState([])
        const [weekStart, setWeekStart] = useState(() => getMonday())
        const [loading, setLoading] = useState(true)
        const [error, setError] = useState("")
        const [success, setSuccess] = useState("")
        const [editingId, setEditingId] = useState("")
        const [savingId, setSavingId] = useState("")
        const [deletingId, setDeletingId] = useState("")
        const [editForm, setEditForm] = useState({
            programId: "",
            workoutDate: "",
            notes: "",
        })

        const loadData = async () => {
            try {
            setLoading(true)
            setError("")

            const [assignmentResponse, programResponse] = await Promise.all([
                getProgramAssignments({
                memberId,
                status: "active",
                }),
                getPrograms(),
            ])

            const loadedAssignments = Array.isArray(
                assignmentResponse?.assignments,
            )
                ? assignmentResponse.assignments
                : []

            let loadedPrograms = []

            if (Array.isArray(programResponse)) {
                loadedPrograms = programResponse
            } else if (Array.isArray(programResponse?.programs)) {
                loadedPrograms = programResponse.programs
            } else if (Array.isArray(programResponse?.data?.programs)) {
                loadedPrograms = programResponse.data.programs
            } else if (Array.isArray(programResponse?.data)) {
                loadedPrograms = programResponse.data
            }

            setAssignments(loadedAssignments)
            setPrograms(
                loadedPrograms.filter((program) => program?.isActive !== false),
            )

            if (loadedAssignments[0]?.member) {
                setMember(loadedAssignments[0].member)
            }
            } catch (err) {
            console.error("Unable to load member assignments:", err)
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load member assignments.",
            )
            } finally {
            setLoading(false)
            }
        }

        useEffect(() => {
            if (memberId) loadData()
        }, [memberId])

        const weekDays = useMemo(() => {
            return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(weekStart)
            date.setDate(weekStart.getDate() + index)

            return {
                date,
                key: getLocalDateKey(date),
            }
            })
        }, [weekStart])

        const assignmentsByDate = useMemo(() => {
            const map = new Map()

            assignments.forEach((assignment) => {
            const key = getLocalDateKey(
                parseCalendarDate(assignment.workoutDate) || new Date("invalid"),
            )

            if (!map.has(key)) map.set(key, [])
            map.get(key).push(assignment)
            })

            return map
        }, [assignments])

        const changeWeek = (amount) => {
            setWeekStart((current) => {
            const next = new Date(current)
            next.setDate(current.getDate() + amount * 7)
            return next
            })
        }

        const goToCurrentWeek = () => {
            setWeekStart(getMonday())
        }

        const startEdit = (assignment) => {
            setError("")
            setSuccess("")
            setEditingId(assignment._id)
            setEditForm({
            programId: getProgramId(assignment.program),
            workoutDate: getLocalDateKey(
                parseCalendarDate(assignment.workoutDate) || new Date(),
            ),
            notes: assignment.notes || "",
            })
        }

        const cancelEdit = () => {
            setEditingId("")
            setEditForm({
            programId: "",
            workoutDate: "",
            notes: "",
            })
        }

        const saveEdit = async (assignment) => {
            if (!editForm.programId) {
            setError("Please select a workout program.")
            return
            }

            if (!editForm.workoutDate) {
            setError("Please select a workout date.")
            return
            }

            try {
            setSavingId(assignment._id)
            setError("")
            setSuccess("")

            const response = await updateProgramAssignment(assignment._id, {
                memberId,
                programId: editForm.programId,
                workoutDate: editForm.workoutDate,
                notes: editForm.notes.trim(),
            })

            if (response?.success === false) {
                throw new Error(
                response?.message || "Unable to update workout assignment.",
                )
            }

            const updated = response?.assignment

            setAssignments((current) =>
                current.map((item) =>
                String(item._id) === String(assignment._id)
                    ? updated || {
                        ...item,
                        program:
                        programs.find(
                            (program) =>
                            String(program._id) === String(editForm.programId),
                        ) || item.program,
                        workoutDate: editForm.workoutDate,
                        notes: editForm.notes.trim(),
                    }
                    : item,
                ),
            )

            setSuccess("Workout assignment updated successfully.")
            cancelEdit()
            } catch (err) {
            console.error("Unable to update assignment:", err)
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to update workout assignment.",
            )
            } finally {
            setSavingId("")
            }
        }

        const deleteAssignment = async (assignment) => {
            const programName = assignment?.program?.name || "this workout"

            if (
            !window.confirm(
                `Delete the "${programName}" workout assignment for ${getMemberName(
                member,
                )}?`,
            )
            ) {
            return
            }

            try {
            setDeletingId(assignment._id)
            setError("")
            setSuccess("")

            const response = await cancelProgramAssignment(assignment._id)

            if (response?.success === false) {
                throw new Error(
                response?.message || "Unable to delete workout assignment.",
                )
            }

            setAssignments((current) =>
                current.filter(
                (item) => String(item._id) !== String(assignment._id),
                ),
            )

            if (String(editingId) === String(assignment._id)) {
                cancelEdit()
            }

            setSuccess("Workout assignment deleted successfully.")
            } catch (err) {
            console.error("Unable to delete assignment:", err)
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to delete workout assignment.",
            )
            } finally {
            setDeletingId("")
            }
        }

        const memberName = getMemberName(member || assignments[0]?.member)
        const memberEmail = member?.email || assignments[0]?.member?.email || ""

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
                    Loading member schedule...
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
                className="mb-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 transition hover:text-lime-400"
                >
                <ArrowLeft size={16} />
                Back to Members
                </button>

                <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-lime-400">
                        Member Workout Schedule
                        </p>
                        <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                        {memberName}
                        </h1>
                        {memberEmail ? (
                        <p className="mt-1 text-sm text-gray-600">{memberEmail}</p>
                        ) : null}
                    </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                        Active Workouts
                    </p>
                    <p className="mt-1 text-2xl font-black text-lime-400">
                        {assignments.length}
                    </p>
                    </div>
                </div>
                </header>

                {error ? (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
                    {error}
                </div>
                ) : null}

                {success ? (
                <div className="mt-5 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-5 py-4 text-sm font-bold text-lime-400">
                    {success}
                </div>
                ) : null}

                <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                    <div className="flex items-center gap-2 text-yellow-400">
                        <CalendarDays size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">
                        Seven-Day Schedule
                        </span>
                    </div>
                    <h2 className="mt-2 text-xl font-black">
                        {formatWeekRange(weekStart)}
                    </h2>
                    </div>

                    <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => changeWeek(-1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black text-gray-400 transition hover:text-white"
                        aria-label="Previous week"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={goToCurrentWeek}
                        className="rounded-xl border border-white/10 bg-black px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-gray-400 transition hover:text-white"
                    >
                        This Week
                    </button>

                    <button
                        type="button"
                        onClick={() => changeWeek(1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black text-gray-400 transition hover:text-white"
                        aria-label="Next week"
                    >
                        <ChevronRight size={18} />
                    </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 lg:grid-cols-7">
                    {weekDays.map(({ date, key }) => {
                    const dayAssignments = assignmentsByDate.get(key) || []
                    const isToday = key === getLocalDateKey()

                    return (
                        <div
                        key={key}
                        className={`min-h-52 rounded-2xl border p-3 ${
                            isToday
                            ? "border-lime-400/30 bg-lime-400/5"
                            : "border-white/10 bg-black"
                        }`}
                        >
                        <div className="border-b border-white/5 pb-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                            {date.toLocaleDateString(undefined, { weekday: "long" })}
                            </p>
                            <p
                            className={`mt-1 text-sm font-black ${
                                isToday ? "text-lime-400" : "text-white"
                            }`}
                            >
                            {formatDate(key)}
                            </p>
                        </div>

                        {dayAssignments.length === 0 ? (
                            <div className="flex min-h-28 items-center justify-center text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                                Rest Day
                            </p>
                            </div>
                        ) : (
                            <div className="mt-3 space-y-2">
                            {dayAssignments.map((assignment) => {
                                const isEditing =
                                String(editingId) === String(assignment._id)
                                const isDeleting =
                                String(deletingId) === String(assignment._id)
                                const isSaving =
                                String(savingId) === String(assignment._id)

                                return (
                                <div
                                    key={assignment._id}
                                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                                >
                                    {isEditing ? (
                                    <div className="space-y-3">
                                        <select
                                        value={editForm.programId}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                            ...current,
                                            programId: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-[10px] font-bold text-white outline-none focus:border-lime-400"
                                        >
                                        <option value="">Select program</option>
                                        {programs.map((program) => (
                                            <option
                                            key={program._id}
                                            value={program._id}
                                            >
                                            {program.name}
                                            </option>
                                        ))}
                                        </select>

                                        <input
                                        type="date"
                                        value={editForm.workoutDate}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                            ...current,
                                            workoutDate: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-[10px] font-bold text-white outline-none focus:border-lime-400"
                                        />

                                        <textarea
                                        value={editForm.notes}
                                        onChange={(event) =>
                                            setEditForm((current) => ({
                                            ...current,
                                            notes: event.target.value,
                                            }))
                                        }
                                        rows={2}
                                        placeholder="Notes"
                                        className="w-full resize-none rounded-xl border border-white/10 bg-black px-3 py-2 text-[10px] text-white outline-none placeholder:text-gray-700 focus:border-lime-400"
                                        />

                                        <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => saveEdit(assignment)}
                                            disabled={isSaving}
                                            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-lime-400 px-2 py-2 text-[9px] font-black uppercase text-black disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                            <Loader2
                                                size={12}
                                                className="animate-spin"
                                            />
                                            ) : (
                                            <Save size={12} />
                                            )}
                                            Save
                                        </button>

                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            disabled={isSaving}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black text-gray-500 hover:text-white"
                                            aria-label="Cancel edit"
                                        >
                                            <X size={13} />
                                        </button>
                                        </div>
                                    </div>
                                    ) : (
                                    <>
                                                                        <div className="flex min-w-0 items-start gap-2">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-black">
                                            <Dumbbell size={14} />
                                        </div>

                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <p className="break words text-[10px] font-black leading-4 text-white">
                                            {assignment.program?.name ||
                                                "Workout Program"}
                                            </p>

                                            <p className="mt-1 break words text-[9px] leading-4 text-gray-600">
                                            {assignment.program?.workoutType ||
                                                "Training"}
                                            </p>
                                        </div>
                                        </div>

                                        {assignment.notes ? (
                                        <p className="mt-2 text-[9px] leading-4 text-gray-600">
                                            {assignment.notes}
                                        </p>
                                        ) : null}
                                                                <div className="mt-3 flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(assignment)}
                                        disabled={isDeleting}
                                        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-black px-2 text-[9px] font-black uppercase text-gray-400 transition hover:border-lime-400/30 hover:text-lime-400 disabled:opacity-50"
                                    >
                                        <Edit3 size={13} />
                                        <span>Edit</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => deleteAssignment(assignment)}
                                        disabled={isDeleting}
                                        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-2 text-[9px] font-black uppercase text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-50"
                                        aria-label="Delete workout"
                                    >
                                        {isDeleting ? (
                                        <Loader2
                                            size={13}
                                            className="animate-spin"
                                        />
                                        ) : (
                                        <Trash2 size={13} />
                                        )}
                                        <span>Delete</span>
                                    </button>
                                        </div>

                                        </>
                                        )}
                                    </div>
                                    )
                                })}
                                </div>
                            )}
                            </div>
                        )
                        })}
                    </div>
                    </section>
                </main>
                </div>
            )
            }
