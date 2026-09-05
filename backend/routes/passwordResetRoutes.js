import express from "express"

import {
  requestMemberPasswordReset,
  resetPassword,
} from "../controllers/passwordResetController.js"

const router = express.Router()

router.post("/forgot-password", requestMemberPasswordReset)
router.post("/reset-password", resetPassword)

export default router
