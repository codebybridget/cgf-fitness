import User from "../models/User.js"
import TrainerAssignment from "../models/TrainerAssignment.js"

const getTrainerMembers =
  async (req, res) => {
    try {
      const {
        search,
        active,
      } = req.query

      const assignmentFilter = {
        trainer:
          req.user._id,

        status:
          "active",
      }

      const assignments =
        await TrainerAssignment.find(
          assignmentFilter,
        ).select("member")

      const memberIds =
        assignments.map(
          (assignment) =>
            assignment.member,
        )

      if (
        memberIds.length ===
        0
      ) {
        return res.status(200).json({
          success: true,
          count: 0,
          members: [],
        })
      }

      const filter = {
        _id: {
          $in: memberIds,
        },

        role: "member",
      }

      if (active !== undefined) {
        filter.isActive =
          active === "true"
      }

      if (search?.trim()) {
        const value =
          search.trim()

        filter.$or = [
          {
            firstName: {
              $regex: value,
              $options: "i",
            },
          },
          {
            lastName: {
              $regex: value,
              $options: "i",
            },
          },
          {
            email: {
              $regex: value,
              $options: "i",
            },
          },
          {
            phone: {
              $regex: value,
              $options: "i",
            },
          },
        ]
      }

      const members =
        await User.find(filter)
          .select("-password")
          .sort({
            firstName: 1,
            lastName: 1,
          })

      return res.status(200).json({
        success: true,
        count: members.length,
        members,
      })
    } catch (error) {
      console.error(
        "Get trainer members error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve assigned members.",
      })
    }
  }

const getTrainerMemberById =
  async (req, res) => {
    try {
      const assignment =
        await TrainerAssignment.findOne(
          {
            trainer:
              req.user._id,

            member:
              req.params.memberId,

            status:
              "active",
          },
        )

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message:
            "You are not assigned to this member.",
        })
      }

      const member =
        await User.findOne({
          _id:
            req.params.memberId,

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

      return res.status(200).json({
        success: true,
        member,
      })
    } catch (error) {
      console.error(
        "Get trainer member error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve member.",
      })
    }
  }

export {
  getTrainerMembers,
  getTrainerMemberById,
}