import express from "express"

import {
  createFirstAdmin,
} from "../controllers/adminAuthController.js"

const router =
  express.Router()

router.post(
  "/setup",
  createFirstAdmin,
)

export default router