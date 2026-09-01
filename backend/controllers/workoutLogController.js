import WorkoutLog from "../models/WorkoutLog.js"
import ProgramAssignment from "../models/ProgramAssignment.js"
import Exercise from "../models/Exercise.js"
import User from "../models/User.js"

/*
|--------------------------------------------------------------------------
| DATE HELPERS
|--------------------------------------------------------------------------
*/

const getStartOfDay = (date) => {
  const result = new Date(date)

  result.setHours(
    0,
    0,
    0,
    0,
  )

  return result
}

const getEndOfDay = (date) => {
  const result = new Date(date)

  result.setHours(
    23,
    59,
    59,
    999,
  )

  return result
}

const parseWorkoutDate = (
  value,
) => {
  const date = value
    ? new Date(value)
    : new Date()

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  return date
}

/*
|--------------------------------------------------------------------------
| FIND MEMBER ASSIGNMENT FOR DATE
|--------------------------------------------------------------------------
*/

const getAssignmentForDate =
  async (
    memberId,
    workoutDate,
  ) => {
    const startOfDay =
      getStartOfDay(
        workoutDate,
      )

    const endOfDay =
      getEndOfDay(
        workoutDate,
      )

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

/*
|--------------------------------------------------------------------------
| GET OR CREATE WORKOUT LOG
|--------------------------------------------------------------------------
*/

const getOrCreateWorkoutLog =
  async (
    memberId,
    programId,
    workoutDate,
  ) => {
    const startOfDay =
      getStartOfDay(
        workoutDate,
      )

    const endOfDay =
      getEndOfDay(
        workoutDate,
      )

    let workoutLog =
      await WorkoutLog.findOne({
        member: memberId,

        program: programId,

        workoutDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })

    if (workoutLog) {
      return workoutLog
    }

    workoutLog =
      await WorkoutLog.create({
        member: memberId,

        program: programId,

        workoutDate:
          startOfDay,

        exercises: [],

        completed: false,

        completedAt: null,

        caloriesBurned: 0,

        notes: "",
      })

    return workoutLog
  }

/*
|--------------------------------------------------------------------------
| CALCULATE CALORIES
|--------------------------------------------------------------------------
*/

const calculateCaloriesBurned =
  async (
    workoutLog,
  ) => {
    if (
      !workoutLog?.exercises?.length
    ) {
      return 0
    }

    const exerciseIds =
      workoutLog.exercises
        .map(
          (item) =>
            item.exercise,
        )
        .filter(Boolean)

    if (!exerciseIds.length) {
      return 0
    }

    const exercises =
      await Exercise.find({
        _id: {
          $in: exerciseIds,
        },
      }).select(
        "caloriesEstimate",
      )

    const calorieMap =
      new Map(
        exercises.map(
          (exercise) => [
            exercise._id.toString(),
            Number(
              exercise.caloriesEstimate,
            ) || 0,
          ],
        ),
      )

    let calories = 0

    for (
      const workoutExercise of
        workoutLog.exercises
    ) {
      const exerciseId =
        workoutExercise.exercise?.toString()

      const caloriesPerSet =
        calorieMap.get(
          exerciseId,
        ) || 0

      const completedSets =
        workoutExercise.sets.filter(
          (set) =>
            set.completed,
        ).length

      calories +=
        caloriesPerSet *
        completedSets
    }

    return Math.round(
      calories,
    )
  }

/*
|--------------------------------------------------------------------------
| GET MY WORKOUT LOG
|--------------------------------------------------------------------------
*/

const getMyWorkoutLog =
  async (req, res) => {
    try {
      const workoutDate =
        parseWorkoutDate(
          req.query.date,
        )

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          workoutDate,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "No workout is assigned for this date.",
        })
      }

      const workoutLog =
        await getOrCreateWorkoutLog(
          req.user._id,
          assignment.program._id,
          workoutDate,
        )

      await workoutLog.populate({
        path:
          "exercises.exercise",
      })

      return res.status(200).json({
        success: true,

        workoutLog,

        program:
          assignment.program,

        assignment: {
          _id:
            assignment._id,

          member:
            assignment.member,

          program:
            assignment.program,

          startDate:
            assignment.startDate,

          endDate:
            assignment.endDate,

          status:
            assignment.status,

          notes:
            assignment.notes,
        },
      })
    } catch (error) {
      console.error(
        "Get workout log error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve workout progress.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| COMPLETE ONE SET
|--------------------------------------------------------------------------
*/

const completeSet =
  async (req, res) => {
    try {
      const {
        date,
        workoutDate:
          bodyWorkoutDate,
        exerciseId,
        setNumber,
        actualReps,
        actualWeight,
      } = req.body

      /*
      |--------------------------------------------------------------------------
      | Use either "date" or "workoutDate".
      |--------------------------------------------------------------------------
      */

      const requestedWorkoutDate =
        date ||
        bodyWorkoutDate

      if (!exerciseId) {
        return res.status(400).json({
          success: false,
          message:
            "Exercise ID is required.",
        })
      }

      if (
        setNumber === undefined ||
        setNumber === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Set number is required.",
        })
      }

      const numericSetNumber =
        Number(setNumber)

      if (
        !Number.isInteger(
          numericSetNumber,
        ) ||
        numericSetNumber < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid set number.",
        })
      }

      const workoutDate =
        parseWorkoutDate(
          requestedWorkoutDate,
        )

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find assignment
      |--------------------------------------------------------------------------
      */

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          workoutDate,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "No active workout assignment found for this date.",
        })
      }

      if (!assignment.program) {
        return res.status(404).json({
          success: false,
          message:
            "The assigned program could not be found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find exercise inside assigned program
      |--------------------------------------------------------------------------
      */

      const programExercises =
        Array.isArray(
          assignment.program
            .exercises,
        )
          ? assignment.program
              .exercises
          : []

      const programExercise =
        programExercises.find(
          (item) => {
            const assignedExerciseId =
              item?.exercise?._id ||
              item?.exercise

            return (
              String(
                assignedExerciseId,
              ) ===
              String(
                exerciseId,
              )
            )
          },
        )

      if (!programExercise) {
        return res.status(404).json({
          success: false,
          message:
            "This exercise is not part of the assigned workout.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Validate number of sets
      |--------------------------------------------------------------------------
      */

      const requiredSets =
        Number(
          programExercise.sets,
        ) || 1

      if (
        numericSetNumber >
        requiredSets
      ) {
        return res.status(400).json({
          success: false,
          message:
            `This exercise only has ${requiredSets} assigned sets.`,
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Validate actual reps
      |--------------------------------------------------------------------------
      */

      let parsedActualReps =
        null

      if (
        actualReps !==
          undefined &&
        actualReps !== null &&
        actualReps !== ""
      ) {
        parsedActualReps =
          Number(
            actualReps,
          )

        if (
          !Number.isFinite(
            parsedActualReps,
          ) ||
          parsedActualReps < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Actual reps must be a valid non-negative number.",
          })
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Get or create log
      |--------------------------------------------------------------------------
      */

      const workoutLog =
        await getOrCreateWorkoutLog(
          req.user._id,
          assignment.program._id,
          workoutDate,
        )

      /*
      |--------------------------------------------------------------------------
      | Find exercise log
      |--------------------------------------------------------------------------
      */

      let exerciseLog =
        workoutLog.exercises.find(
          (item) =>
            String(
              item.exercise,
            ) ===
            String(
              exerciseId,
            ),
        )

      if (!exerciseLog) {
        workoutLog.exercises.push({
          exercise:
            exerciseId,

          sets: [],
        })

        exerciseLog =
          workoutLog.exercises[
            workoutLog.exercises
              .length - 1
          ]
      }

      /*
      |--------------------------------------------------------------------------
      | Find set log
      |--------------------------------------------------------------------------
      */

      let setLog =
        exerciseLog.sets.find(
          (item) =>
            Number(
              item.setNumber,
            ) ===
            numericSetNumber,
        )

      if (!setLog) {
        exerciseLog.sets.push({
          setNumber:
            numericSetNumber,

          completed: true,

          actualReps:
            parsedActualReps,

          actualWeight:
            actualWeight !==
              undefined &&
            actualWeight !== null
              ? String(
                  actualWeight,
                ).trim()
              : "",

          completedAt:
            new Date(),
        })

        setLog =
          exerciseLog.sets[
            exerciseLog.sets
              .length - 1
          ]
      } else {
        setLog.completed =
          true

        if (
          actualReps !==
            undefined
        ) {
          setLog.actualReps =
            parsedActualReps
        }

        if (
          actualWeight !==
            undefined
        ) {
          setLog.actualWeight =
            String(
              actualWeight,
            ).trim()
        }

        setLog.completedAt =
          new Date()
      }

      /*
      |--------------------------------------------------------------------------
      | A newly completed set means the workout
      | must be recalculated.
      |--------------------------------------------------------------------------
      */

      workoutLog.completed =
        false

      workoutLog.completedAt =
        null

      workoutLog.caloriesBurned =
        await calculateCaloriesBurned(
          workoutLog,
        )

      await workoutLog.save()

      await workoutLog.populate({
        path:
          "exercises.exercise",
      })

      return res.status(200).json({
        success: true,

        message:
          `Set ${numericSetNumber} completed.`,

        caloriesBurned:
          workoutLog.caloriesBurned,

        workoutLog,
      })
    } catch (error) {
      console.error(
        "Complete set error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to save completed set.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| UNCOMPLETE ONE SET
|--------------------------------------------------------------------------
*/

const uncompleteSet =
  async (req, res) => {
    try {
      const {
        date,
        workoutDate:
          bodyWorkoutDate,
        exerciseId,
        setNumber,
      } = req.body

      const requestedWorkoutDate =
        date ||
        bodyWorkoutDate

      if (!exerciseId) {
        return res.status(400).json({
          success: false,
          message:
            "Exercise ID is required.",
        })
      }

      if (
        setNumber === undefined ||
        setNumber === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Set number is required.",
        })
      }

      const numericSetNumber =
        Number(setNumber)

      if (
        !Number.isInteger(
          numericSetNumber,
        ) ||
        numericSetNumber < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid set number.",
        })
      }

      const workoutDate =
        parseWorkoutDate(
          requestedWorkoutDate,
        )

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Verify member has assignment
      |--------------------------------------------------------------------------
      */

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          workoutDate,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "No active workout assignment found for this date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find workout log
      |--------------------------------------------------------------------------
      */

      const workoutLog =
        await WorkoutLog.findOne({
          member:
            req.user._id,

          program:
            assignment.program._id,

          workoutDate: {
            $gte:
              getStartOfDay(
                workoutDate,
              ),

            $lte:
              getEndOfDay(
                workoutDate,
              ),
          },
        })

      if (!workoutLog) {
        return res.status(404).json({
          success: false,
          message:
            "Workout progress not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find exercise
      |--------------------------------------------------------------------------
      */

      const exerciseLog =
        workoutLog.exercises.find(
          (item) =>
            String(
              item.exercise,
            ) ===
            String(
              exerciseId,
            ),
        )

      if (!exerciseLog) {
        return res.status(404).json({
          success: false,
          message:
            "Exercise progress not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find set
      |--------------------------------------------------------------------------
      */

      const setLog =
        exerciseLog.sets.find(
          (item) =>
            Number(
              item.setNumber,
            ) ===
            numericSetNumber,
        )

      if (!setLog) {
        return res.status(404).json({
          success: false,
          message:
            "Set progress not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Mark incomplete
      |--------------------------------------------------------------------------
      */

      setLog.completed =
        false

      setLog.completedAt =
        null

      workoutLog.completed =
        false

      workoutLog.completedAt =
        null

      workoutLog.caloriesBurned =
        await calculateCaloriesBurned(
          workoutLog,
        )

      await workoutLog.save()

      await workoutLog.populate({
        path:
          "exercises.exercise",
      })

      return res.status(200).json({
        success: true,

        message:
          "Set marked as incomplete.",

        caloriesBurned:
          workoutLog.caloriesBurned,

        workoutLog,
      })
    } catch (error) {
      console.error(
        "Uncomplete set error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to update set progress.",
      })
    }
  }
  /*
|--------------------------------------------------------------------------
| COMPLETE ENTIRE WORKOUT
|--------------------------------------------------------------------------
*/

const completeWorkout =
  async (req, res) => {
    try {
      const {
        date,
        workoutDate:
          bodyWorkoutDate,
        assignmentId,
        programId,
      } = req.body

      const requestedWorkoutDate =
        date ||
        bodyWorkoutDate

      const parsedDate =
        parseWorkoutDate(
          requestedWorkoutDate,
        )

      if (!parsedDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find active assignment
      |--------------------------------------------------------------------------
      */

      const assignment =
        await getAssignmentForDate(
          req.user._id,
          parsedDate,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "No active workout assignment found for this date.",
        })
      }

      if (!assignment.program) {
        return res.status(404).json({
          success: false,
          message:
            "The assigned program could not be found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Verify assignment when supplied
      |--------------------------------------------------------------------------
      */

      if (
        assignmentId &&
        String(
          assignment._id,
        ) !==
          String(
            assignmentId,
          )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected workout assignment does not match this date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Verify program when supplied
      |--------------------------------------------------------------------------
      */

      if (
        programId &&
        String(
          assignment.program._id,
        ) !==
          String(
            programId,
          )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected program does not belong to this assignment.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find workout log
      |--------------------------------------------------------------------------
      */

      const workoutLog =
        await WorkoutLog.findOne({
          member:
            req.user._id,

          program:
            assignment.program._id,

          workoutDate: {
            $gte:
              getStartOfDay(
                parsedDate,
              ),

            $lte:
              getEndOfDay(
                parsedDate,
              ),
          },
        })

      if (!workoutLog) {
        return res.status(404).json({
          success: false,
          message:
            "Workout progress not found. Complete the assigned sets first.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Validate every assigned exercise
      |--------------------------------------------------------------------------
      */

      const incompleteExercises =
        []

      const assignedExercises =
        Array.isArray(
          assignment.program
            .exercises,
        )
          ? assignment.program
              .exercises
          : []

      /*
      |--------------------------------------------------------------------------
      | No exercises
      |--------------------------------------------------------------------------
      */

      if (
        assignedExercises.length ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This workout has no exercises assigned.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Check every exercise
      |--------------------------------------------------------------------------
      */

      for (
        const programExercise of
          assignedExercises
      ) {
        const assignedExerciseId =
          programExercise?.exercise
            ?._id ||
          programExercise?.exercise

        const exerciseId =
          String(
            assignedExerciseId,
          )

        const requiredSets =
          Number(
            programExercise?.sets,
          ) || 1

        const exerciseLog =
          workoutLog.exercises.find(
            (item) =>
              String(
                item.exercise,
              ) === exerciseId,
          )

        const completedSetCount =
          exerciseLog
            ? exerciseLog.sets.filter(
                (set) =>
                  set.completed,
              ).length
            : 0

        if (
          completedSetCount <
          requiredSets
        ) {
          incompleteExercises.push({
            exerciseId,

            exerciseName:
              programExercise
                ?.exercise?.name ||
              "Exercise",

            requiredSets,

            completedSets:
              completedSetCount,

            remainingSets:
              Math.max(
                requiredSets -
                  completedSetCount,
                0,
              ),
          })
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent completion if sets remain
      |--------------------------------------------------------------------------
      */

      if (
        incompleteExercises.length >
        0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Complete all assigned exercises and sets before finishing the workout.",

          incompleteExercises,
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Calculate calories
      |--------------------------------------------------------------------------
      */

      const caloriesBurned =
        await calculateCaloriesBurned(
          workoutLog,
        )

      /*
      |--------------------------------------------------------------------------
      | Complete workout
      |--------------------------------------------------------------------------
      */

      workoutLog.completed =
        true

      workoutLog.completedAt =
        new Date()

      workoutLog.caloriesBurned =
        caloriesBurned

      await workoutLog.save()

      await workoutLog.populate({
        path:
          "exercises.exercise",
      })

      return res.status(200).json({
        success: true,

        message:
          "Workout completed successfully.",

        caloriesBurned,

        workoutLog,
      })
    } catch (error) {
      console.error(
        "Complete workout error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to complete workout.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| ADMIN — GET ALL MEMBER WORKOUT PROGRESS
|--------------------------------------------------------------------------
*/

const getAdminWorkoutProgress =
  async (req, res) => {
    try {
      const {
        date,
        memberId,
        status,
      } = req.query

      const workoutDate =
        parseWorkoutDate(
          date,
        )

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      const startOfDay =
        getStartOfDay(
          workoutDate,
        )

      const endOfDay =
        getEndOfDay(
          workoutDate,
        )

      /*
      |--------------------------------------------------------------------------
      | Find members
      |--------------------------------------------------------------------------
      */

      const memberFilter = {
        role: "member",
      }

      if (memberId) {
        memberFilter._id =
          memberId
      }

      const members =
        await User.find(
          memberFilter,
        )
          .select(
            "firstName lastName email phone fitnessGoal weight isActive profilePhoto",
          )
          .sort({
            firstName: 1,
            lastName: 1,
          })

      const progress = []

      /*
      |--------------------------------------------------------------------------
      | Process each member
      |--------------------------------------------------------------------------
      */

      for (
        const member of members
      ) {
        const assignment =
          await ProgramAssignment.findOne(
            {
              member:
                member._id,

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
                path:
                  "exercises.exercise",
              },
            })

        /*
        |--------------------------------------------------------------------------
        | MEMBER HAS NO ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        if (!assignment) {
          const item = {
            member,

            workout: {
              status:
                "not_assigned",

              date:
                workoutDate,

              completed:
                false,

              completedAt:
                null,

              caloriesBurned:
                0,

              totalSets: 0,

              completedSets: 0,

              progressPercent: 0,

              exercises: [],
            },
          }

          if (
            !status ||
            status ===
              "not_assigned"
          ) {
            progress.push(item)
          }

          continue
        }

        /*
        |--------------------------------------------------------------------------
        | Find workout log
        |--------------------------------------------------------------------------
        */

        const workoutLog =
          await WorkoutLog.findOne({
            member:
              member._id,

            program:
              assignment.program._id,

            workoutDate: {
              $gte:
                startOfDay,

              $lte:
                endOfDay,
            },
          }).populate({
            path:
              "exercises.exercise",
          })

        /*
        |--------------------------------------------------------------------------
        | Calculate set progress
        |--------------------------------------------------------------------------
        */

        let totalSets = 0
        let completedSets = 0

        const assignedExercises =
          assignment.program
            ?.exercises || []

        for (
          const assignedExercise of
            assignedExercises
        ) {
          const requiredSets =
            Number(
              assignedExercise.sets,
            ) || 1

          totalSets +=
            requiredSets

          const assignedExerciseId =
            assignedExercise
              ?.exercise?._id ||
            assignedExercise?.exercise

          const exerciseId =
            String(
              assignedExerciseId,
            )

          const loggedExercise =
            workoutLog?.exercises?.find(
              (item) =>
                String(
                  item.exercise,
                ) === exerciseId,
            )

          if (loggedExercise) {
            completedSets +=
              loggedExercise.sets.filter(
                (set) =>
                  set.completed,
              ).length
          }
        }

        /*
        |--------------------------------------------------------------------------
        | Determine status
        |--------------------------------------------------------------------------
        */

        let workoutStatus =
          "not_started"

        if (
          workoutLog?.completed
        ) {
          workoutStatus =
            "completed"
        } else if (
          completedSets > 0
        ) {
          workoutStatus =
            "in_progress"
        }

        /*
        |--------------------------------------------------------------------------
        | Calculate percentage
        |--------------------------------------------------------------------------
        */

        const progressPercent =
          totalSets > 0
            ? Math.min(
                Math.round(
                  (completedSets /
                    totalSets) *
                    100,
                ),
                100,
              )
            : 0

        /*
        |--------------------------------------------------------------------------
        | Build response
        |--------------------------------------------------------------------------
        */

        const item = {
          member,

          assignment: {
            id:
              assignment._id,

            startDate:
              assignment.startDate,

            endDate:
              assignment.endDate,

            status:
              assignment.status,
          },

          program:
            assignment.program,

          workout: {
            status:
              workoutStatus,

            date:
              workoutDate,

            completed:
              Boolean(
                workoutLog?.completed,
              ),

            completedAt:
              workoutLog?.completedAt ||
              null,

            caloriesBurned:
              workoutLog
                ?.caloriesBurned ||
              0,

            totalSets,

            completedSets,

            progressPercent,

            exercises:
              workoutLog
                ?.exercises ||
              [],
          },
        }

        /*
        |--------------------------------------------------------------------------
        | Apply optional status filter
        |--------------------------------------------------------------------------
        */

        if (
          !status ||
          status ===
            workoutStatus
        ) {
          progress.push(item)
        }
      }

      return res.status(200).json({
        success: true,

        date:
          workoutDate
            .toISOString()
            .split("T")[0],

        count:
          progress.length,

        progress,
      })
    } catch (error) {
      console.error(
        "Get admin workout progress error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          "Unable to retrieve member workout progress.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| ADMIN — GET ONE MEMBER'S WORKOUT PROGRESS
|--------------------------------------------------------------------------
*/

const getAdminMemberWorkoutProgress =
  async (req, res) => {
    try {
      const {
        memberId,
      } = req.params

      const {
        date,
      } = req.query

      const workoutDate =
        parseWorkoutDate(
          date,
        )

      if (!workoutDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid workout date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find member
      |--------------------------------------------------------------------------
      */

      const member =
        await User.findOne({
          _id: memberId,

          role: "member",
        }).select(
          "-password",
        )

      if (!member) {
        return res.status(404).json({
          success: false,

          message:
            "Member not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find assignment
      |--------------------------------------------------------------------------
      */

      const assignment =
        await getAssignmentForDate(
          memberId,
          workoutDate,
        )

      if (!assignment) {
        return res.status(404).json({
          success: false,

          message:
            "No active program is assigned to this member for this date.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find workout log
      |--------------------------------------------------------------------------
      */

      const workoutLog =
        await WorkoutLog.findOne({
          member: memberId,

          program:
            assignment.program._id,

          workoutDate: {
            $gte:
              getStartOfDay(
                workoutDate,
              ),

            $lte:
              getEndOfDay(
                workoutDate,
              ),
          },
        }).populate({
          path:
            "exercises.exercise",
        })

      /*
      |--------------------------------------------------------------------------
      | Calculate progress
      |--------------------------------------------------------------------------
      */

      let totalSets = 0
      let completedSets = 0

      for (
        const assignedExercise of
          assignment.program
            .exercises || []
      ) {
        const requiredSets =
          Number(
            assignedExercise.sets,
          ) || 1

        totalSets +=
          requiredSets

        const assignedExerciseId =
          assignedExercise
            ?.exercise?._id ||
          assignedExercise?.exercise

        const exerciseId =
          String(
            assignedExerciseId,
          )

        const loggedExercise =
          workoutLog?.exercises?.find(
            (item) =>
              String(
                item.exercise,
              ) === exerciseId,
          )

        if (loggedExercise) {
          completedSets +=
            loggedExercise.sets.filter(
              (set) =>
                set.completed,
            ).length
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Determine workout status
      |--------------------------------------------------------------------------
      */

      let workoutStatus =
        "not_started"

      if (
        workoutLog?.completed
      ) {
        workoutStatus =
          "completed"
      } else if (
        completedSets > 0
      ) {
        workoutStatus =
          "in_progress"
      }

      /*
      |--------------------------------------------------------------------------
      | Progress percentage
      |--------------------------------------------------------------------------
      */

      const progressPercent =
        totalSets > 0
          ? Math.min(
              Math.round(
                (completedSets /
                  totalSets) *
                  100,
              ),
              100,
            )
          : 0

      return res.status(200).json({
        success: true,

        member,

        program:
          assignment.program,

        assignment: {
          id:
            assignment._id,

          startDate:
            assignment.startDate,

          endDate:
            assignment.endDate,

          status:
            assignment.status,
        },

        workout: {
          status:
            workoutStatus,

          date:
            workoutDate,

          completed:
            Boolean(
              workoutLog?.completed,
            ),

          completedAt:
            workoutLog?.completedAt ||
            null,

          caloriesBurned:
            workoutLog
              ?.caloriesBurned ||
            0,

          totalSets,

          completedSets,

          progressPercent,

          exercises:
            workoutLog?.exercises ||
            [],
        },
      })
    } catch (error) {
      console.error(
        "Get admin member workout progress error:",
        error,
      )

      return res.status(500).json({
        success: false,

        message:
          "Unable to retrieve member workout details.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

export {
  getMyWorkoutLog,
  completeSet,
  uncompleteSet,
  completeWorkout,
  getAdminWorkoutProgress,
  getAdminMemberWorkoutProgress,
}