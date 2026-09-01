import ProgramAssignment from "../models/ProgramAssignment.js"
import Program from "../models/Program.js"

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const getDayName = (date) => {
  return DAY_NAMES[date.getDay()]
}

const getDateAtMidnight = (
  date,
) => {
  const result = new Date(date)

  result.setHours(
    0,
    0,
    0,
    0,
  )

  return result
}

const getEndOfDay = (
  date,
) => {
  const result = new Date(date)

  result.setHours(
    23,
    59,
    59,
    999,
  )

  return result
}

const getAssignmentForDate =
  async (
    memberId,
    date,
  ) => {
    const startOfDay =
      getDateAtMidnight(date)

    const endOfDay =
      getEndOfDay(date)

    return ProgramAssignment.findOne(
      {
        member: memberId,

        status: "active",

        startDate: {
          $lte: endOfDay,
        },

        $or: [
          {
            endDate: null,
          },
          {
            endDate: {
              $gte: startOfDay,
            },
          },
        ],
      },
    )
      .sort({
        startDate: -1,
      })
      .populate({
        path: "program",
        populate: {
          path: "exercises.exercise",
        },
      })
  }

const getWorkoutForDate =
  async (req, res) => {
    try {
      const dateValue =
        req.query.date

      const requestedDate =
        dateValue
          ? new Date(dateValue)
          : new Date()

      if (
        Number.isNaN(
          requestedDate.getTime(),
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid date.",
        })
      }

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          requestedDate,
        )

      if (!assignment) {
        return res.status(200).json({
          success: true,
          hasWorkout: false,
          date:
            requestedDate
              .toISOString()
              .split("T")[0],
          day:
            getDayName(
              requestedDate,
            ),
          workout: null,
        })
      }

      return res.status(200).json({
        success: true,
        hasWorkout: true,
        date:
          requestedDate
            .toISOString()
            .split("T")[0],
        day:
          getDayName(
            requestedDate,
          ),
        workout: {
          assignmentId:
            assignment._id,

          program:
            assignment.program,

          startDate:
            assignment.startDate,

          endDate:
            assignment.endDate,

          notes:
            assignment.notes,
        },
      })
    } catch (error) {
      console.error(
        "Get workout error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve workout.",
      })
    }
  }

const getTodayWorkout =
  async (req, res) => {
    try {
      const today =
        new Date()

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          today,
        )

      if (!assignment) {
        return res.status(200).json({
          success: true,
          hasWorkout: false,
          date:
            today
              .toISOString()
              .split("T")[0],
          day:
            getDayName(today),
          workout: null,
        })
      }

      return res.status(200).json({
        success: true,
        hasWorkout: true,
        date:
          today
            .toISOString()
            .split("T")[0],
        day:
          getDayName(today),
        workout: {
          assignmentId:
            assignment._id,

          program:
            assignment.program,

          notes:
            assignment.notes,
        },
      })
    } catch (error) {
      console.error(
        "Get today workout error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve today's workout.",
      })
    }
  }

const getTomorrowWorkout =
  async (req, res) => {
    try {
      const tomorrow =
        new Date()

      tomorrow.setDate(
        tomorrow.getDate() +
          1,
      )

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          tomorrow,
        )

      if (!assignment) {
        return res.status(200).json({
          success: true,
          hasWorkout: false,
          date:
            tomorrow
              .toISOString()
              .split("T")[0],
          day:
            getDayName(tomorrow),
          workout: null,
        })
      }

      return res.status(200).json({
        success: true,
        hasWorkout: true,
        date:
          tomorrow
            .toISOString()
            .split("T")[0],
        day:
            getDayName(
              tomorrow,
            ),
        workout: {
          assignmentId:
            assignment._id,

          program:
            assignment.program,

          notes:
            assignment.notes,
        },
      })
    } catch (error) {
      console.error(
        "Get tomorrow workout error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve tomorrow's workout.",
      })
    }
  }

const getWeeklySchedule =
  async (req, res) => {
    try {
      const today =
        new Date()

      const week = []

      for (
        let offset = 0;
        offset < 7;
        offset += 1
      ) {
        const date =
          new Date(today)

        date.setDate(
          today.getDate() +
            offset,
        )

        const assignment =
          await getAssignmentForDate(
            req.user._id,
            date,
          )

        week.push({
          date:
            date
              .toISOString()
              .split("T")[0],

          day:
            getDayName(date),

          hasWorkout:
            Boolean(
              assignment,
            ),

          workout:
            assignment
              ? {
                  assignmentId:
                    assignment._id,

                  program:
                    assignment.program,

                  notes:
                    assignment.notes,
                }
              : null,
        })
      }

      return res.status(200).json({
        success: true,
        week,
      })
    } catch (error) {
      console.error(
        "Get weekly schedule error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve weekly schedule.",
      })
    }
  }

export {
  getWorkoutForDate,
  getTodayWorkout,
  getTomorrowWorkout,
  getWeeklySchedule,
}