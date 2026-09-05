import jwt from "jsonwebtoken"
import User from "../models/User.js"

const protect = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("Authentication error: JWT_SECRET is missing.")
      return res.status(500).json({
        success: false,
        message: "Authentication configuration is missing.",
      })
    }

    const authorization = req.headers.authorization

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      })
    }

    const token = authorization.slice(7).trim()

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      })
    }

    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated.",
      })
    }

    req.user = user
    return next()
  } catch (error) {
    console.error("Authentication error:", error.message)

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired.",
      })
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      })
    }

    return res.status(401).json({
      success: false,
      message: error.message || "Unable to authenticate request.",
    })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      })
    }

    const userRole = String(req.user.role || "").trim().toLowerCase()
    const allowedRoles = roles.map((role) => String(role).trim().toLowerCase())

    if (!allowedRoles.includes(userRole)) {
      console.warn(
        `Authorization denied: user=${req.user._id} role=${userRole} required=${allowedRoles.join(",")}`,
      )

      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
        role: userRole || null,
        requiredRoles: allowedRoles,
      })
    }

    next()
  }
}

const adminOnly = authorize("admin")

export {
  protect,
  authorize,
  adminOnly,
}
