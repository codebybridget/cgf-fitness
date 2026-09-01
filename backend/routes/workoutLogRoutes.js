import express from "express"

import {
  completeSet,
  completeWorkout,
  getAdminMemberWorkoutProgress,
  getAdminWorkoutProgress,
  getMyWorkoutLog,
  uncompleteSet,
} from "../controllers/workoutLogController.js"

import {
  authorize,
  protect,
} from "../middleware/authMiddleware.js"

const router =
  express.Router()

/*
|--------------------------------------------------------------------------
| MEMBER ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Get logged-in member's workout log.
 *
 * Optional query:
 * ?date=2026-08-23
 */
router.get(
  "/me",
  protect,
  authorize("member"),
  getMyWorkoutLog,
)

/*
 * Complete one exercise set.
 */
router.post(
  "/set/complete",
  protect,
  authorize("member"),
  completeSet,
)

/*
 * Mark one exercise set incomplete.
 */
router.post(
  "/set/uncomplete",
  protect,
  authorize("member"),
  uncompleteSet,
)

/*
 * Complete the entire workout.
 */
router.post(
  "/complete",
  protect,
  authorize("member"),
  completeWorkout,
)

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Get all members' workout progress.
 *
 * Optional query parameters:
 *
 * ?date=2026-08-23
 * ?memberId=MEMBER_ID
 * ?status=completed
 *
 * Possible statuses:
 *
 * not_assigned
 * not_started
 * in_progress
 * completed
 */
router.get(
  "/admin/progress",
  protect,
  authorize("admin"),
  getAdminWorkoutProgress,
)

/*
 * Get one specific member's workout progress.
 *
 * Optional query:
 * ?date=2026-08-23
 */
router.get(
  "/admin/members/:memberId/progress",
  protect,
  authorize("admin"),
  getAdminMemberWorkoutProgress,
)

export default router