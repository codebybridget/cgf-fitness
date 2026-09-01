import mongoose from "mongoose"
import User from "../models/User.js"

/*
|--------------------------------------------------------------------------
| Get Members
|--------------------------------------------------------------------------
*/

const getMembers = async (
  req,
  res,
) => {
  try {
    const {
      search,
      active,
    } = req.query

    const filter = {
      role: "member",
    }

    if (
      active !== undefined
    ) {
      filter.isActive =
        active === "true"
    }

    if (
      search?.trim()
    ) {
      const searchValue =
        search.trim()

      filter.$or = [
        {
          firstName: {
            $regex:
              searchValue,
            $options: "i",
          },
        },

        {
          lastName: {
            $regex:
              searchValue,
            $options: "i",
          },
        },

        {
          email: {
            $regex:
              searchValue,
            $options: "i",
          },
        },

        {
          phone: {
            $regex:
              searchValue,
            $options: "i",
          },
        },
      ]
    }

    const members =
      await User.find(filter)
        .select("-password")
        .sort({
          createdAt: -1,
        })

    return res.status(200).json({
      success: true,

      count:
        members.length,

      members,
    })
  } catch (error) {
    console.error(
      "Get members error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve members.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| Get One Member
|--------------------------------------------------------------------------
*/

const getMemberById =
  async (
    req,
    res,
  ) => {
    try {
      const {
        memberId,
      } = req.params

      if (
        !mongoose.Types.ObjectId.isValid(
          memberId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID.",
        })
      }

      const member =
        await User.findOne({
          _id:
            memberId,

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
        "Get member error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve member.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Update Member Status
|--------------------------------------------------------------------------
*/

const updateMemberStatus =
  async (
    req,
    res,
  ) => {
    try {
      const {
        memberId,
      } = req.params

      const {
        isActive,
      } = req.body

      if (
        !mongoose.Types.ObjectId.isValid(
          memberId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID.",
        })
      }

      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false.",
        })
      }

      const member =
        await User.findOneAndUpdate(
          {
            _id:
              memberId,

            role: "member",
          },

          {
            isActive,
          },

          {
            new: true,
            runValidators: true,
          },
        ).select(
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

        message:
          isActive
            ? "Member account activated."
            : "Member account deactivated.",

        member,
      })
    } catch (error) {
      console.error(
        "Update member status error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to update member status.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Get Trainers
|--------------------------------------------------------------------------
*/

const getTrainers =
  async (
    req,
    res,
  ) => {
    try {
      const trainers =
        await User.find({
          role: "trainer",
        })
          .select("-password")
          .sort({
            firstName: 1,
            lastName: 1,
          })

      return res.status(200).json({
        success: true,

        count:
          trainers.length,

        trainers,
      })
    } catch (error) {
      console.error(
        "Get trainers error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve trainers.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Create Trainer
|--------------------------------------------------------------------------
*/

const createTrainer =
  async (
    req,
    res,
  ) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phone,
      } = req.body

      if (
        !firstName?.trim() ||
        !lastName?.trim() ||
        !email?.trim() ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "First name, last name, email and password are required.",
        })
      }

      if (
        password.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        })
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase()

      const existingUser =
        await User.findOne({
          email:
            normalizedEmail,
        })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        })
      }

      const trainer =
        await User.create({
          firstName:
            firstName.trim(),

          lastName:
            lastName.trim(),

          email:
            normalizedEmail,

          password,

          phone:
            phone?.trim() || "",

          role: "trainer",
        })

      const safeTrainer =
        await User.findById(
          trainer._id,
        ).select(
          "-password",
        )

      return res.status(201).json({
        success: true,

        message:
          "Trainer account created successfully.",

        trainer:
          safeTrainer,
      })
    } catch (error) {
      console.error(
        "Create trainer error:",
        error,
      )

      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        })
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to create trainer account.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Update User Role
|--------------------------------------------------------------------------
|
| Allowed roles:
|
| member
| trainer
| admin
|
|--------------------------------------------------------------------------
*/

const updateUserRole =
  async (
    req,
    res,
  ) => {
    try {
      const {
        userId,
      } = req.params

      const {
        role,
      } = req.body

      const validRoles = [
        "member",
        "trainer",
        "admin",
      ]

      /*
      |--------------------------------------------------------------------------
      | Validate role
      |--------------------------------------------------------------------------
      */

      if (
        !validRoles.includes(
          role,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role. Allowed roles are member, trainer and admin.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Validate user ID
      |--------------------------------------------------------------------------
      */

      if (
        !mongoose.Types.ObjectId.isValid(
          userId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent self-demotion
      |--------------------------------------------------------------------------
      */

      if (
        String(
          req.user?._id,
        ) ===
          String(
            userId,
          ) &&
        role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot remove your own admin role.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Find target user
      |--------------------------------------------------------------------------
      */

      const targetUser =
        await User.findById(
          userId,
        )

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent changing another admin
      |--------------------------------------------------------------------------
      |
      | Admin accounts should be managed deliberately.
      | This endpoint cannot demote another admin.
      |
      */

      if (
        targetUser.role ===
          "admin" &&
        role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "An administrator cannot be demoted through this endpoint.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | Update Role
      |--------------------------------------------------------------------------
      */

      targetUser.role =
        role

      await targetUser.save()

      const safeUser =
        await User.findById(
          targetUser._id,
        ).select(
          "-password",
        )

      return res.status(200).json({
        success: true,

        message:
          `User role updated to ${role}.`,

        user:
          safeUser,
      })
    } catch (error) {
      console.error(
        "Update user role error:",
        error,
      )

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        })
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to update user role.",
      })
    }
  }

export {
  getMembers,
  getMemberById,
  updateMemberStatus,
  getTrainers,
  createTrainer,
  updateUserRole,
}