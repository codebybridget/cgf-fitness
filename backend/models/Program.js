import mongoose from "mongoose"

const programExerciseSchema =
  new mongoose.Schema(
    {
      exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
        required: true,
      },

      order: {
        type: Number,
        required: true,
        min: 1,
      },

      sets: {
        type: Number,
        default: 3,
        min: 1,
      },

      reps: {
        type: Number,
        default: null,
        min: 1,
      },

      duration: {
        type: Number,
        default: null,
        min: 1,
      },

      rest: {
        type: Number,
        default: 60,
        min: 0,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      _id: true,
    },
  )

const programSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      workoutType: {
        type: String,
        required: true,
        enum: [
          "Upper Body",
          "Lower Body",
          "CrossFit",
          "Tabata",
        ],
      },

      difficulty: {
        type: String,
        enum: [
          "Beginner",
          "Intermediate",
          "Advanced",
        ],
        default: "Beginner",
      },

      estimatedDuration: {
        type: Number,
        default: null,
        min: 1,
      },

      exercises: {
        type: [
          programExerciseSchema,
        ],
        default: [],
      },

      trainerNotes: {
        type: String,
        default: "",
        trim: true,
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    {
      timestamps: true,
    },
  )

programSchema.index({
  workoutType: 1,
  isActive: 1,
})

programSchema.index({
  name: "text",
  description: "text",
})

const Program =
  mongoose.model(
    "Program",
    programSchema,
  )

export default Program