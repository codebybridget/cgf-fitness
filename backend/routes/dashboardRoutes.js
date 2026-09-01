import express from "express"

import {
  getDashboardStats,
} from "../controllers/dashboardController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

router.get(
  "/stats",
  protect,
  authorize("admin"),
  getDashboardStats,
)

export default router