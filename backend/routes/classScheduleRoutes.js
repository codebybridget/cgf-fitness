import express from "express"

import {
  createSchedule,
  getSchedule,
  seedDefaultSchedule,
  updateSchedule,
} from "../controllers/classScheduleController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| View Schedule
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  getSchedule,
)

/*
|--------------------------------------------------------------------------
| Admin / Trainer Management
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  createSchedule,
)

router.put(
  "/:id",
  protect,
  authorize(
    "admin",
    "trainer",
  ),
  updateSchedule,
)

/*
|--------------------------------------------------------------------------
| Create Default Weekly Schedule
|--------------------------------------------------------------------------
*/

router.post(
  "/seed-default",
  protect,
  authorize("admin"),
  seedDefaultSchedule,
)

export default router