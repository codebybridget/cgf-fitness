import User from "../models/User.js"
import Exercise from "../models/Exercise.js"
import Program from "../models/Program.js"
import ProgramAssignment from "../models/ProgramAssignment.js"

const getDashboardStats =
  async (req, res) => {
    try {
      const [
        totalMembers,
        activeMembers,
        inactiveMembers,
        totalTrainers,
        totalExercises,
        totalPrograms,
        activeAssignments,
      ] = await Promise.all([
        User.countDocuments({
          role: "member",
        }),

        User.countDocuments({
          role: "member",
          isActive: true,
        }),

        User.countDocuments({
          role: "member",
          isActive: false,
        }),

        User.countDocuments({
          role: "trainer",
        }),

        Exercise.countDocuments({
          isActive: true,
        }),

        Program.countDocuments({
          isActive: true,
        }),

        ProgramAssignment.countDocuments(
          {
            status: "active",
          },
        ),
      ])

      return res.status(200).json({
        success: true,

        stats: {
          totalMembers,
          activeMembers,
          inactiveMembers,
          totalTrainers,
          totalExercises,
          totalPrograms,
          activeAssignments,
        },
      })
    } catch (error) {
      console.error(
        "Dashboard stats error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve dashboard statistics.",
      })
    }
  }

export {
  getDashboardStats,
}