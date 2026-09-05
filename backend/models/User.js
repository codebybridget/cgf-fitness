import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    relationship: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
  },
  { _id: true },
)

const medicalProfileSchema = new mongoose.Schema(
  {
    hasMedicalCondition: { type: Boolean, default: false },
    conditions: { type: String, trim: true, default: "" },
    medications: { type: String, trim: true, default: "" },
    allergies: { type: String, trim: true, default: "" },
    injuries: { type: String, trim: true, default: "" },
    additionalInformation: { type: String, trim: true, default: "" },
  },
  { _id: false },
)

const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["1_month", "3_months", "6_months", "12_months"],
      default: null,
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "expired", "pending", "cancelled"],
      default: "expired",
    },

    paymentReference: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: { type: String, trim: true, default: "" },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "trainer", "member"],
      default: "member",
    },

    dateOfBirth: { type: Date, default: null },
    age: { type: Number, min: 1, max: 120, default: null },

    height: {
      value: { type: Number, default: null },
      unit: { type: String, enum: ["cm", "ft"], default: "cm" },
    },

    weight: {
      value: { type: Number, default: null },
      unit: { type: String, enum: ["kg", "lb"], default: "kg" },
    },

    address: { type: String, trim: true, default: "" },

    fitnessGoal: {
      type: String,
      enum: ["lose_weight", "keep_fit", "gain_weight", "become_trainer"],
      default: "keep_fit",
    },

    medicalProfile: medicalProfileSchema,

    emergencyContacts: {
      type: [emergencyContactSchema],
      default: [],
    },

    profilePhoto: { type: String, default: "" },

    isActive: { type: Boolean, default: true },

    emailVerified: { type: Boolean, default: false },

    lastLogin: { type: Date, default: null },

    // Member subscription information
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
)

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }

  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password)
}

const User = mongoose.model("User", userSchema)

export default User