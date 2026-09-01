import express from "express"

import {
  getTrainerMemberById,
  getTrainerMembers,
} from "../controllers/trainerController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

router.get(
  "/members",
  protect,
  authorize("trainer"),
  getTrainerMembers,
)

router.get(
  "/members/:memberId",
  protect,
  authorize("trainer"),
  getTrainerMemberById,
)

export default router