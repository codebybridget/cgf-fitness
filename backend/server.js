import dotenv from "dotenv"

dotenv.config()

import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import path from "path"
import { fileURLToPath } from "url"

import connectDB from "./config/db.js"

import authRoutes from "./routes/authRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"
import adminAuthRoutes from "./routes/adminAuthRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import trainerRoutes from "./routes/trainerRoutes.js"
import trainerAssignmentRoutes from "./routes/trainerAssignmentRoutes.js"
import exerciseRoutes from "./routes/exerciseRoutes.js"
import programRoutes from "./routes/programRoutes.js"
import profileRoutes from "./routes/profileRoutes.js"
import paymentVerificationRoutes from "./routes/paymentVerificationRoutes.js"
import emergencyContactRoutes from "./routes/emergencyContactRoutes.js"
import programAssignmentRoutes from "./routes/programAssignmentRoutes.js"
import workoutRoutes from "./routes/workoutRoutes.js"
import workoutLogRoutes from "./routes/workoutLogRoutes.js"
import classScheduleRoutes from "./routes/classScheduleRoutes.js"
import membershipRoutes from "./routes/membershipRoutes.js"
import subscriptionRoutes from "./routes/subscriptionRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"

import {
  startWorkoutNotificationJobs,
} from "./services/workoutNotificationService.js"

import {
  protect,
} from "./middleware/authMiddleware.js"
import requireActiveSubscription from "./middleware/requireActiveSubscription.js"

const app = express()

const PORT =
  process.env.PORT || 5000

/*
|--------------------------------------------------------------------------
| File / Directory Setup
|--------------------------------------------------------------------------
*/

const __filename =
  fileURLToPath(
    import.meta.url,
  )

const __dirname =
  path.dirname(
    __filename,
  )

/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
)

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
|
| Production frontend:
| https://cgf-fitness-a.onrender.com
|
| Local development:
| http://localhost:5173
|
*/

const allowedOrigins = [
  "https://cgf-fitness-a.onrender.com",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      /*
       * Allow requests that do not have an Origin header.
       * This includes some server-to-server requests,
       * health checks and direct API requests.
       */
      if (!origin) {
        return callback(null, true)
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true)
      }

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`,
        ),
      )
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
)

/*
|--------------------------------------------------------------------------
| Body Parsing
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "1mb",
  }),
)

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
)

/*
|--------------------------------------------------------------------------
| Uploaded Media
|--------------------------------------------------------------------------
*/

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads",
    ),
    {
      setHeaders: (
        response,
        filePath,
      ) => {
        response.setHeader(
          "Access-Control-Allow-Origin",
          process.env.CLIENT_URL ||
            "https://cgf-fitness-a.onrender.com",
        )

        response.setHeader(
          "Cross-Origin-Resource-Policy",
          "cross-origin",
        )

        if (
          /\.(mp4|webm|mov|avi|mpeg)$/i.test(
            filePath,
          )
        ) {
          response.setHeader(
            "Accept-Ranges",
            "bytes",
          )
        }
      },
    },
  ),
)

/*
|--------------------------------------------------------------------------
| API Rate Limiting
|--------------------------------------------------------------------------
*/

const apiLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 300,

    standardHeaders: true,

    legacyHeaders: false,
  })

app.use(
  "/api",
  apiLimiter,
)

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

app.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success: true,

      message:
        "CGF Gym API is running.",
    })
  },
)

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,

      message:
        "CGF Gym API is healthy.",
    })
  },
)

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

app.use(
  "/api/auth",
  authRoutes,
)

app.use(
  "/api/payments",
  paymentRoutes,
)
app.use(
  "/api/subscriptions",
  subscriptionRoutes,
)
app.use(
  "/api/payment-verification",
  paymentVerificationRoutes,
)

app.use(
  "/api/admin-auth",
  adminAuthRoutes,
)

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

app.use(
  "/api/admin",
  adminRoutes,
)

app.use(
  "/api/dashboard",
  protect,
  requireActiveSubscription,
  dashboardRoutes,
)

/*
|--------------------------------------------------------------------------
| Trainer
|--------------------------------------------------------------------------
*/

app.use(
  "/api/trainer",
  trainerRoutes,
)

app.use(
  "/api/trainer-assignments",
  trainerAssignmentRoutes,
)

/*
|--------------------------------------------------------------------------
| Exercises
|--------------------------------------------------------------------------
*/

app.use(
  "/api/exercises",
  protect,
  requireActiveSubscription,
  exerciseRoutes,
)

/*
|--------------------------------------------------------------------------
| Programs
|--------------------------------------------------------------------------
*/

app.use(
  "/api/programs",
  protect,
  requireActiveSubscription,
  programRoutes,
)

/*
|--------------------------------------------------------------------------
| Profile
|--------------------------------------------------------------------------
*/

app.use(
  "/api/profile",
  protect,
  requireActiveSubscription,
  profileRoutes,
)

app.use(
  "/api/membership",
  membershipRoutes,
)

/*
|--------------------------------------------------------------------------
| Emergency Contacts
|--------------------------------------------------------------------------
*/

app.use(
  "/api/emergency-contacts",
  protect,
  requireActiveSubscription,
  emergencyContactRoutes,
)

/*
|--------------------------------------------------------------------------
| Program Assignments
|--------------------------------------------------------------------------
*/

app.use(
  "/api/program-assignments",
  protect,
  requireActiveSubscription,
  programAssignmentRoutes,
)

/*
|--------------------------------------------------------------------------
| Workouts
|--------------------------------------------------------------------------
*/

app.use(
  "/api/workouts",
  protect,
  requireActiveSubscription,
  workoutRoutes,
)

/*
|--------------------------------------------------------------------------
| Workout Logs
|--------------------------------------------------------------------------
*/

app.use(
  "/api/workout-logs",
  protect,
  requireActiveSubscription,
  workoutLogRoutes,
)

/*
|--------------------------------------------------------------------------
| Weekly Class Schedule
|--------------------------------------------------------------------------
*/

app.use(
  "/api/class-schedule",
  protect,
  requireActiveSubscription,
  classScheduleRoutes,
)

/*
|--------------------------------------------------------------------------
| Notifications
|--------------------------------------------------------------------------
*/

app.use(
  "/api/notifications",
  protect,
  requireActiveSubscription,
  notificationRoutes,
)

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,

      message:
        "API route not found.",
    })
  },
)

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use(
  (
    error,
    req,
    res,
    next,
  ) => {
    console.error(
      "Server error:",
      error,
    )

    /*
    |--------------------------------------------------------------------------
    | CORS Errors
    |--------------------------------------------------------------------------
    */

    if (
      error?.message?.startsWith(
        "CORS blocked origin:",
      )
    ) {
      return res.status(403).json({
        success: false,

        message:
          "CORS policy blocked this request.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Multer Errors
    |--------------------------------------------------------------------------
    */

    if (
      error?.name ===
      "MulterError"
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Uploaded file is too large. Images must be 5 MB or less and videos must be 50 MB or less.",
        })
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Too many files were uploaded.",
        })
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Unexpected upload field. Please use the exercise image and video upload controls.",
        })
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to process uploaded file.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | General Upload / File Errors
    |--------------------------------------------------------------------------
    */

    if (
      error?.message
        ?.toLowerCase?.()
        .includes(
          "invalid image",
        )
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      })
    }

    if (
      error?.message
        ?.toLowerCase?.()
        .includes(
          "invalid video",
        )
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      })
    }

    return res.status(
      error.status || 500,
    ).json({
      success: false,

      message:
        error.message ||
        "Internal server error.",
    })
  },
)

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const startServer =
  async () => {
    try {
      await connectDB()

      /*
      |--------------------------------------------------------------------------
      | Workout Notification Jobs
      |--------------------------------------------------------------------------
      */

      startWorkoutNotificationJobs()

      app.listen(
        PORT,
        () => {
          console.log(
            `CGF Gym API running on port ${PORT}`,
          )

          console.log(
            `CGF uploads available at /uploads`,
          )

          console.log(
            "Allowed CORS origins:",
            allowedOrigins,
          )
        },
      )
    } catch (error) {
      console.error(
        "Unable to start CGF Gym API:",
        error,
      )

      process.exit(1)
    }
  }

startServer()