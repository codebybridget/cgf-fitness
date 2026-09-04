import mongoose from "mongoose"

const programAssignmentSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Member
    |--------------------------------------------------------------------------
    */

    member: {
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Workout Date
    |--------------------------------------------------------------------------
    |
    | This is the exact date on which the member should see and perform
    | this workout.
    |
    | Example:
    | workoutDate = September 2, 2026
    | dayOfWeek   = Wednesday
    |
    */

    workoutDate: {
      type: Date,
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Day Of Week
    |--------------------------------------------------------------------------
    |
    | Automatically derived from workoutDate.
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
| These indexes support:
|
| 1. Finding a member's workout for a specific date.
| 2. Listing a member's assignments.
| 3. Finding assignments for a particular program.
|
*/

programAssignmentSchema.index({
  member: 1,
  workoutDate: 1,
  status: 1,
})

programAssignmentSchema.index({
  member: 1,
  status: 1,
  workoutDate: 1,
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

const ProgramAssignment = mongoose.model(
  "ProgramAssignment",
  programAssignmentSchema,
)

export default ProgramAssignment