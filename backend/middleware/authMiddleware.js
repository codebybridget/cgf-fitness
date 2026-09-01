import jwt from "jsonwebtoken"
import User from "../models/User.js"

/*
|--------------------------------------------------------------------------
| Protect Route
|--------------------------------------------------------------------------
|
| Verifies the JWT and loads the current user from MongoDB.
|
*/

const protect = async (
  req,
  res,
  next,
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | JWT Secret
    |--------------------------------------------------------------------------
    */

    if (!process.env.JWT_SECRET) {
      console.error(
        "Authentication error: JWT_SECRET is missing.",
      )

      return res.status(500).json({
        success: false,
        message:
          "Authentication configuration is missing.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Authorization Header
    |--------------------------------------------------------------------------
    */

    const authorization =
      req.headers.authorization

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer ",
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Extract Token
    |--------------------------------------------------------------------------
    */

    const token =
      authorization
        .slice(7)
        .trim()

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token is missing.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Verify JWT
    |--------------------------------------------------------------------------
    */

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET,
      )

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Load Current User
    |--------------------------------------------------------------------------
    */

    const user =
      await User.findById(
        decoded.userId,
      ).select("-password")

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User account not found.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Active Account Check
    |--------------------------------------------------------------------------
    */

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This account has been deactivated.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Attach User To Request
    |--------------------------------------------------------------------------
    */

    req.user = user

    next()
  } catch (error) {
    console.error(
      "Authentication error:",
      error.message,
    )

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token has expired.",
      })
    }

    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      })
    }

    return res.status(401).json({
      success: false,
      message:
        "Unable to authenticate request.",
    })
  }
}


/*
|--------------------------------------------------------------------------
| Authorize Roles
|--------------------------------------------------------------------------
|
| Usage:
|
| authorize("admin")
| authorize("member")
| authorize("admin", "trainer")
|
|--------------------------------------------------------------------------
*/

const authorize = (
  ...roles
) => {
  return (
    req,
    res,
    next,
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      })
    }

    const userRole =
      String(
        req.user.role || "",
      )
        .trim()
        .toLowerCase()

    const allowedRoles =
      roles.map(
        (role) =>
          String(
            role,
          )
            .trim()
            .toLowerCase(),
      )

    if (
      !allowedRoles.includes(
        userRole,
      )
    ) {
      console.warn(
        `Authorization denied: user=${req.user._id} role=${userRole} required=${allowedRoles.join(",")}`,
      )

      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action.",
        role:
          userRole || null,
        requiredRoles:
          allowedRoles,
      })
    }

    next()
  }
}


/*
|--------------------------------------------------------------------------
| Admin Only
|--------------------------------------------------------------------------
|
| Shortcut for:
|
| authorize("admin")
|
| This is used by membershipRoutes.js.
|--------------------------------------------------------------------------
*/

const adminOnly =
  authorize("admin")


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export {
  protect,
  authorize,
  adminOnly,
}