import express from "express"

import {
  createTrainer,
  getMemberById,
  getMembers,
  getTrainers,
  updateMemberStatus,
  updateUserRole,
} from "../controllers/adminController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| Member Management
|--------------------------------------------------------------------------
*/

router.get(
  "/members",
  protect,
  authorize("admin"),
  getMembers,
)

router.get(
  "/members/:memberId",
  protect,
  authorize("admin"),
  getMemberById,
)

router.patch(
  "/members/:memberId/status",
  protect,
  authorize("admin"),
  updateMemberStatus,
)

/*
|--------------------------------------------------------------------------
| Trainer Management
|--------------------------------------------------------------------------
*/

router.get(
  "/trainers",
  protect,
  authorize("admin"),
  getTrainers,
)

router.post(
  "/trainers",
  protect,
  authorize("admin"),
  createTrainer,
)

/*
|--------------------------------------------------------------------------
| Role Management
|--------------------------------------------------------------------------
*/

router.patch(
  "/users/:userId/role",
  protect,
  authorize("admin"),
  updateUserRole,
)

export default router