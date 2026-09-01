import Notification from "../models/Notification.js"

export async function getMyNotifications(
  req,
  res,
) {
  try {
    const limit = Math.min(
      Number(
        req.query.limit || 30,
      ),
      100,
    )

    const notifications =
      await Notification.find({
        user: req.user._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(limit)

    const unreadCount =
      await Notification.countDocuments({
        user: req.user._id,
        read: false,
      })

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error(
      "Get notifications error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve notifications.",
    })
  }
}

export async function markNotificationRead(
  req,
  res,
) {
  try {
    const notification =
      await Notification.findOneAndUpdate(
        {
          _id:
            req.params.id,
          user:
            req.user._id,
        },
        {
          read: true,
        },
        {
          new: true,
        },
      )

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      })
    }

    return res.status(200).json({
      success: true,
      notification,
    })
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to update notification.",
    })
  }
}

export async function markAllNotificationsRead(
  req,
  res,
) {
  try {
    await Notification.updateMany(
      {
        user:
          req.user._id,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      },
    )

    return res.status(200).json({
      success: true,
      message:
        "All notifications marked as read.",
    })
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to update notifications.",
    })
  }
}
