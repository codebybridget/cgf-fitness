import {
  Router,
} from "express"

import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js"

/*
 * IMPORTANT:
 *
 * Mount this router inside the same authenticated
 * route layer used by the existing CGF member
 * and admin routes.
 *
 * Example:
 *
 * app.use(
 *   "/api/notifications",
 *   authenticate,
 *   notificationRoutes,
 * )
 *
 * Use the exact authentication middleware already
 * used by /api/profile/me and /api/workout-logs.
 */

const router =
  Router()

router.get(
  "/",
  getMyNotifications,
)

router.patch(
  "/read-all",
  markAllNotificationsRead,
)

router.patch(
  "/:id/read",
  markNotificationRead,
)

export default router
