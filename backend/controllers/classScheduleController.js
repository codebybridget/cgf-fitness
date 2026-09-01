import ClassSchedule from "../models/ClassSchedule.js"

const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
}

const getSchedule =
  async (req, res) => {
    try {
      const schedules =
        await ClassSchedule.find({
          isActive: true,
        })
          .populate(
            "createdBy",
            "firstName lastName role",
          )
          .populate(
            "updatedBy",
            "firstName lastName role",
          )

      schedules.sort(
        (a, b) =>
          DAY_ORDER[
            a.dayOfWeek
          ] -
          DAY_ORDER[
            b.dayOfWeek
          ],
      )

      return res.status(200).json({
        success: true,
        count:
          schedules.length,
        schedules,
      })
    } catch (error) {
      console.error(
        "Get class schedule error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve class schedule.",
      })
    }
  }

const createSchedule =
  async (req, res) => {
    try {
      const {
        dayOfWeek,
        workoutType,
        title,
        startTime,
        endTime,
        description,
      } = req.body

      if (
        !dayOfWeek ||
        !workoutType ||
        !title?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Day, workout type and title are required.",
        })
      }

      const existingSchedule =
        await ClassSchedule.findOne({
          dayOfWeek,
        })

      if (existingSchedule) {
        return res.status(409).json({
          success: false,
          message:
            `A schedule already exists for ${dayOfWeek}.`,
        })
      }

      const schedule =
        await ClassSchedule.create({
          dayOfWeek,

          workoutType,

          title:
            title.trim(),

          startTime:
            startTime?.trim() ||
            "",

          endTime:
            endTime?.trim() ||
            "",

          description:
            description?.trim() ||
            "",

          createdBy:
            req.user._id,

          updatedBy:
            req.user._id,
        })

      return res.status(201).json({
        success: true,
        message:
          "Class schedule created successfully.",
        schedule,
      })
    } catch (error) {
      console.error(
        "Create class schedule error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to create class schedule.",
      })
    }
  }

const updateSchedule =
  async (req, res) => {
    try {
      const allowedFields = [
        "dayOfWeek",
        "workoutType",
        "title",
        "startTime",
        "endTime",
        "description",
        "isActive",
      ]

      const updates = {}

      for (
        const field of allowedFields
      ) {
        if (
          req.body[field] !==
          undefined
        ) {
          updates[field] =
            req.body[field]
        }
      }

      if (
        updates.title !==
        undefined
      ) {
        updates.title =
          String(
            updates.title,
          ).trim()
      }

      if (
        updates.startTime !==
        undefined
      ) {
        updates.startTime =
          String(
            updates.startTime,
          ).trim()
      }

      if (
        updates.endTime !==
        undefined
      ) {
        updates.endTime =
          String(
            updates.endTime,
          ).trim()
      }

      updates.updatedBy =
        req.user._id

      const schedule =
        await ClassSchedule.findByIdAndUpdate(
          req.params.id,
          updates,
          {
            new: true,
            runValidators: true,
          },
        )

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message:
            "Class schedule not found.",
        })
      }

      return res.status(200).json({
        success: true,
        message:
          "Class schedule updated successfully.",
        schedule,
      })
    } catch (error) {
      console.error(
        "Update class schedule error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to update class schedule.",
      })
    }
  }

const seedDefaultSchedule =
  async (req, res) => {
    try {
      const defaults = [
        {
          dayOfWeek:
            "Monday",
          workoutType:
            "Lower Body",
          title:
            "Lower Body",
          startTime: "",
          endTime: "",
          description:
            "Lower body training.",
        },

        {
          dayOfWeek:
            "Tuesday",
          workoutType:
            "Upper Body",
          title:
            "Upper Body",
          startTime: "",
          endTime: "",
          description:
            "Upper body training.",
        },

        {
          dayOfWeek:
            "Wednesday",
          workoutType:
            "Lower Body",
          title:
            "Lower Body",
          startTime: "",
          endTime: "",
          description:
            "Lower body training.",
        },

        {
          dayOfWeek:
            "Thursday",
          workoutType:
            "Upper Body",
          title:
            "Upper Body",
          startTime: "",
          endTime: "",
          description:
            "Upper body training.",
        },

        {
          dayOfWeek:
            "Friday",
          workoutType:
            "CrossFit",
          title:
            "CrossFit",
          startTime: "",
          endTime: "",
          description:
            "General full-body CrossFit training.",
        },

        {
          dayOfWeek:
            "Saturday",
          workoutType:
            "Tabata",
          title:
            "Saturday Tabata",
          startTime:
            "08:00",
          endTime:
            "09:00",
          description:
            "One-hour Tabata class.",
        },

        {
          dayOfWeek:
            "Sunday",
          workoutType:
            "Rest",
          title:
            "Rest Day",
          startTime: "",
          endTime: "",
          description:
            "Recovery and rest.",
        },
      ]

      const created = []

      for (
        const item of defaults
      ) {
        const existing =
          await ClassSchedule.findOne(
            {
              dayOfWeek:
                item.dayOfWeek,
            },
          )

        if (!existing) {
          const schedule =
            await ClassSchedule.create(
              {
                ...item,

                createdBy:
                  req.user._id,

                updatedBy:
                  req.user._id,
              },
            )

          created.push(
            schedule,
          )
        }
      }

      return res.status(201).json({
        success: true,
        message:
          created.length > 0
            ? "Default weekly schedule created."
            : "Default weekly schedule already exists.",
        createdCount:
          created.length,
        schedules:
          created,
      })
    } catch (error) {
      console.error(
        "Seed schedule error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to create default schedule.",
      })
    }
  }

export {
  getSchedule,
  createSchedule,
  updateSchedule,
  seedDefaultSchedule,
}