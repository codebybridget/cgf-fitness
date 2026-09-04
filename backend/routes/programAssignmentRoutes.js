import express from "express"

import {
  createProgramAssignment,
  getProgramAssignments,
  getProgramAssignmentById,
  updateProgramAssignment,
  cancelProgramAssignment,
  getMyTodayWorkout,
  getMyProgramAssignments,
} from "../controllers/programAssignmentController.js"

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
 * Get today's assigned workout.
 *
 * IMPORTANT:
 * This route must appear BEFORE /:id.
 */
router.get(
  "/my-today",
  protect,
  authorize("member"),
  getMyTodayWorkout,
)

/*
 * Get all programs assigned
 * to the logged-in member.
 */
router.get(
  "/my-programs",
  protect,
  authorize("member"),
  getMyProgramAssignments,
)

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Create a program assignment.
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  createProgramAssignment,
)

/*
 * Get all assignments.
 */
router.get(
  "/",
  protect,
  authorize("admin"),
  getProgramAssignments,
)

/*
 * Get one assignment.
 */
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getProgramAssignmentById,
)

/*
 * Update assignment.
 */
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateProgramAssignment,
)

/*
 * Cancel assignment.
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  cancelProgramAssignment,
)

export default router
