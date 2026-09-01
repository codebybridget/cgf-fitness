import mongoose from "mongoose"

const programAssignmentSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Member
      |--------------------------------------------------------------------------
      */

      member: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Program
      |--------------------------------------------------------------------------
      */

      program: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Program",
        required: true,
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Assigned By
      |--------------------------------------------------------------------------
      */

      assignedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Training Day
      |--------------------------------------------------------------------------
      |
      | This tells the system which day of the member's weekly schedule
      | this assignment belongs to.
      |
      */

      dayOfWeek: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        required: true,
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Assignment Start Date
      |--------------------------------------------------------------------------
      */

      startDate: {
        type: Date,
        required: true,
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Assignment End Date
      |--------------------------------------------------------------------------
      */

      endDate: {
        type: Date,
        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | Status
      |--------------------------------------------------------------------------
      */

      status: {
        type: String,
        enum: [
          "active",
          "completed",
          "cancelled",
        ],
        default: "active",
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Notes
      |--------------------------------------------------------------------------
      */

      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
    },
  )

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
|
| These indexes make it fast to find a member's workout for a particular
| day and date.
|
*/

programAssignmentSchema.index({
  member: 1,
  dayOfWeek: 1,
  status: 1,
  startDate: 1,
})

programAssignmentSchema.index({
  member: 1,
  status: 1,
  startDate: 1,
})

programAssignmentSchema.index({
  program: 1,
  status: 1,
})

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const ProgramAssignment =
  mongoose.model(
    "ProgramAssignment",
    programAssignmentSchema,
  )

export default ProgramAssignment