import mongoose from "mongoose"

import ProgramAssignment from "../models/ProgramAssignment.js"
import Program from "../models/Program.js"
import User from "../models/User.js"

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const isValidObjectId = (
  value,
) => {
  return mongoose.Types.ObjectId.isValid(
    value,
  )
}

const normalizeDate = (
  value,
) => {
  if (!value) {
    return null
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  date.setHours(
    0,
    0,
    0,
    0,
  )

  return date
}

const getDayName = (
  date,
) => {
  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    },
  )
}

/*
|--------------------------------------------------------------------------
| Populate assignment
|--------------------------------------------------------------------------
*/

const populateAssignment = (
  query,
) => {
  return query
    .populate({
      path: "member",
      select:
        "firstName lastName email phone role isActive fitnessGoal profilePhoto",
    })
    .populate({
      path: "assignedBy",
      select:
        "firstName lastName email role",
    })
    .populate({
      path: "program",
      populate: {
        path: "exercises.exercise",
        select:
          "name category description muscleGroup equipment difficulty defaultSets defaultReps defaultDuration defaultRest caloriesEstimate imageUrl videoUrl",
      },
    })
}

/*
|--------------------------------------------------------------------------
| CREATE PROGRAM ASSIGNMENT
|--------------------------------------------------------------------------
*/

const createProgramAssignment =
  async (req, res) => {
    try {
      const {
        memberId,
        programId,

        member: legacyMember,
        program: legacyProgram,

        dayOfWeek,
        startDate,
        endDate,
        notes,
      } = req.body

      const member =
        memberId ||
        legacyMember

      const program =
        programId ||
        legacyProgram

      if (
        !member ||
        !program ||
        !startDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Member, program and start date are required.",
        })
      }

      if (
        !isValidObjectId(
          member,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID.",
        })
      }

      if (
        !isValidObjectId(
          program,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid program ID.",
        })
      }

      const normalizedStartDate =
        normalizeDate(
          startDate,
        )

      if (!normalizedStartDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid start date.",
        })
      }

      let normalizedEndDate =
        null

      if (endDate) {
        normalizedEndDate =
          normalizeDate(
            endDate,
          )

        if (!normalizedEndDate) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid end date.",
          })
        }

        if (
          normalizedEndDate <
          normalizedStartDate
        ) {
          return res.status(400).json({
            success: false,
            message:
              "End date cannot be before start date.",
          })
        }
      }

      let normalizedDay =
        dayOfWeek

      if (!normalizedDay) {
        normalizedDay =
          getDayName(
            normalizedStartDate,
          )
      }

      if (
        !VALID_DAYS.includes(
          normalizedDay,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout day.",
        })
      }

      const memberUser =
        await User.findOne({
          _id: member,
          role: "member",
        })

      if (!memberUser) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        })
      }

      if (!memberUser.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot assign a workout to an inactive member.",
        })
      }

      const programDocument =
        await Program.findOne({
          _id: program,
          $or: [
            {
              isActive: true,
            },
            {
              isActive: {
                $exists: false,
              },
            },
          ],
        })

      if (!programDocument) {
        return res.status(404).json({
          success: false,
          message:
            "Active program not found.",
        })
      }

      const overlapFilter = {
        member,

        dayOfWeek:
          normalizedDay,

        status: "active",

        startDate: {
          $lte:
            normalizedEndDate ||
            normalizedStartDate,
        },

        $or: [
          {
            endDate: null,
          },
          {
            endDate: {
              $gte:
                normalizedStartDate,
            },
          },
        ],
      }

      const existingAssignment =
        await ProgramAssignment.findOne(
          overlapFilter,
        )

      if (existingAssignment) {
        return res.status(409).json({
          success: false,
          message:
            `This member already has an active workout assigned for ${normalizedDay} during this date range.`,
        })
      }

      const assignment =
        await ProgramAssignment.create({
          member,

          program,

          assignedBy:
            req.user._id,

          dayOfWeek:
            normalizedDay,

          startDate:
            normalizedStartDate,

          endDate:
            normalizedEndDate,

          status: "active",

          notes:
            notes?.trim() || "",
        })

      const populatedAssignment =
        await populateAssignment(
          ProgramAssignment.findById(
            assignment._id,
          ),
        )

      return res.status(201).json({
        success: true,

        message:
          "Program assigned successfully.",

        assignment:
          populatedAssignment,
      })
    } catch (error) {
      console.error(
        "Create program assignment error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to create program assignment.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| GET ALL PROGRAM ASSIGNMENTS
|--------------------------------------------------------------------------
*/

const getProgramAssignments =
  async (req, res) => {
    try {
      const {
        member,
        program,
        status,
        dayOfWeek,
      } = req.query

      const filter = {}

      if (member) {
        if (
          !isValidObjectId(
            member,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid member ID.",
          })
        }

        filter.member =
          member
      }

      if (program) {
        if (
          !isValidObjectId(
            program,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid program ID.",
          })
        }

        filter.program =
          program
      }

      if (status) {
        filter.status =
          status
      }

      if (dayOfWeek) {
        if (
          !VALID_DAYS.includes(
            dayOfWeek,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid workout day.",
          })
        }

        filter.dayOfWeek =
          dayOfWeek
      }

      const assignments =
        await populateAssignment(
          ProgramAssignment.find(
            filter,
          ).sort({
            startDate: 1,
            dayOfWeek: 1,
            createdAt: -1,
          }),
        )

      return res.status(200).json({
        success: true,
        count:
          assignments.length,
        assignments,
      })
    } catch (error) {
      console.error(
        "Get program assignments error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve program assignments.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| GET ASSIGNMENT BY ID
|--------------------------------------------------------------------------
*/

const getProgramAssignmentById =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assignment ID.",
        })
      }

      const assignment =
        await populateAssignment(
          ProgramAssignment.findById(
            id,
          ),
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "Program assignment not found.",
        })
      }

      return res.status(200).json({
        success: true,
        assignment,
      })
    } catch (error) {
      console.error(
        "Get program assignment error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve program assignment.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| UPDATE PROGRAM ASSIGNMENT
|--------------------------------------------------------------------------
*/

const updateProgramAssignment =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assignment ID.",
        })
      }

      const assignment =
        await ProgramAssignment.findById(
          id,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "Program assignment not found.",
        })
      }

      const {
        memberId,
        programId,

        member: legacyMember,
        program: legacyProgram,

        dayOfWeek,
        startDate,
        endDate,
        status,
        notes,
      } = req.body

      const member =
        memberId ||
        legacyMember

      const program =
        programId ||
        legacyProgram

      if (
        member !== undefined
      ) {
        if (
          !isValidObjectId(
            member,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid member ID.",
          })
        }

        const memberUser =
          await User.findOne({
            _id: member,
            role: "member",
          })

        if (!memberUser) {
          return res.status(404).json({
            success: false,
            message:
              "Member not found.",
          })
        }

        assignment.member =
          member
      }

      if (
        program !== undefined
      ) {
        if (
          !isValidObjectId(
            program,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid program ID.",
          })
        }

        const programDocument =
          await Program.findOne({
            _id: program,
            $or: [
              {
                isActive: true,
              },
              {
                isActive: {
                  $exists: false,
                },
              },
            ],
          })

        if (!programDocument) {
          return res.status(404).json({
            success: false,
            message:
              "Active program not found.",
          })
        }

        assignment.program =
          program
      }

      if (
        dayOfWeek !==
        undefined
      ) {
        if (
          !VALID_DAYS.includes(
            dayOfWeek,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid workout day.",
          })
        }

        assignment.dayOfWeek =
          dayOfWeek
      }

      if (
        startDate !==
        undefined
      ) {
        const parsedStart =
          normalizeDate(
            startDate,
          )

        if (!parsedStart) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid start date.",
          })
        }

        assignment.startDate =
          parsedStart
      }

      if (
        endDate !==
        undefined
      ) {
        if (
          endDate === null ||
          endDate === ""
        ) {
          assignment.endDate =
            null
        } else {
          const parsedEnd =
            normalizeDate(
              endDate,
            )

          if (!parsedEnd) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid end date.",
            })
          }

          assignment.endDate =
            parsedEnd
        }
      }

      if (
        assignment.endDate &&
        assignment.endDate <
          assignment.startDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "End date cannot be before start date.",
        })
      }

      if (
        status !==
        undefined
      ) {
        const validStatuses = [
          "active",
          "completed",
          "cancelled",
        ]

        if (
          !validStatuses.includes(
            status,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid assignment status.",
          })
        }

        assignment.status =
          status
      }

      if (
        notes !==
        undefined
      ) {
        assignment.notes =
          String(
            notes,
          ).trim()
      }

      await assignment.save()

      const updatedAssignment =
        await populateAssignment(
          ProgramAssignment.findById(
            assignment._id,
          ),
        )

      return res.status(200).json({
        success: true,
        message:
          "Program assignment updated successfully.",
        assignment:
          updatedAssignment,
      })
    } catch (error) {
      console.error(
        "Update program assignment error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to update program assignment.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| CANCEL PROGRAM ASSIGNMENT
|--------------------------------------------------------------------------
*/

const cancelProgramAssignment =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assignment ID.",
        })
      }

      const assignment =
        await ProgramAssignment.findById(
          id,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "Program assignment not found.",
        })
      }

      assignment.status =
        "cancelled"

      await assignment.save()

      const updatedAssignment =
        await populateAssignment(
          ProgramAssignment.findById(
            assignment._id,
          ),
        )

      return res.status(200).json({
        success: true,
        message:
          "Program assignment cancelled successfully.",
        assignment:
          updatedAssignment,
      })
    } catch (error) {
      console.error(
        "Cancel program assignment error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to cancel program assignment.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| GET MEMBER'S TODAY WORKOUT
|--------------------------------------------------------------------------
*/

const getMyTodayWorkout =
  async (req, res) => {
    try {
      const today =
        normalizeDate(
          new Date(),
        )

      const todayDay =
        getDayName(today)

      const assignment =
        await populateAssignment(
          ProgramAssignment.findOne({
            member:
              req.user._id,

            dayOfWeek:
              todayDay,

            status: "active",

            startDate: {
              $lte: today,
            },

            $or: [
              {
                endDate: null,
              },
              {
                endDate: {
                  $gte: today,
                },
              },
            ],
          }).sort({
            startDate: -1,
            createdAt: -1,
          }),
        )

      if (!assignment) {
        return res.status(200).json({
          success: true,
          assigned: false,
          assignment: null,
          workout: null,
          message:
            "No workout assigned for today.",
        })
      }

      return res.status(200).json({
        success: true,
        assigned: true,
        assignment,
        workout:
          assignment.program,
      })
    } catch (error) {
      console.error(
        "Get today's workout error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve today's workout.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| GET ALL MEMBER PROGRAM ASSIGNMENTS
|--------------------------------------------------------------------------
*/

const getMyProgramAssignments =
  async (req, res) => {
    try {
      const assignments =
        await populateAssignment(
          ProgramAssignment.find({
            member:
              req.user._id,
          }).sort({
            startDate: 1,
            dayOfWeek: 1,
            createdAt: -1,
          }),
        )

      const today =
        normalizeDate(
          new Date(),
        )

      const formattedAssignments =
        assignments.map(
          (assignment) => {
            const start =
              normalizeDate(
                assignment.startDate,
              )

            const end =
              assignment.endDate
                ? normalizeDate(
                    assignment.endDate,
                  )
                : null

            const isWithinDateRange =
              Boolean(
                start &&
                  start <=
                    today &&
                  (!end ||
                    end >=
                      today),
              )

            return {
              ...assignment.toObject(),

              isCurrent:
                assignment.status ===
                  "active" &&
                isWithinDateRange,

              workoutDay:
                assignment.dayOfWeek,

              workoutType:
                assignment.program
                  ?.workoutType ||
                "",

              programName:
                assignment.program
                  ?.name ||
                "",
            }
          },
        )

      return res.status(200).json({
        success: true,
        count:
          formattedAssignments.length,
        assignments:
          formattedAssignments,
      })
    } catch (error) {
      console.error(
        "Get member program assignments error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve your assigned programs.",
      })
    }
  }

export {
  createProgramAssignment,
  getProgramAssignments,
  getProgramAssignmentById,
  updateProgramAssignment,
  cancelProgramAssignment,
  getMyTodayWorkout,
  getMyProgramAssignments,
}