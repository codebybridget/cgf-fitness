import {
  getClerkMongoUser,
  sanitizeUser,
} from "../utils/clerkUserSync.js"

/*
|--------------------------------------------------------------------------
| Get Current Clerk User
|--------------------------------------------------------------------------
|
| The Clerk session is verified by protect(). This controller resolves
| that authenticated Clerk identity to the CGF MongoDB User record.
|--------------------------------------------------------------------------
*/

const getClerkMe = async (
  req,
  res,
) => {
  try {
    if (
      req.authProvider !== "clerk" ||
      !req.clerkUserId
    ) {
      return res.status(401).json({
        success: false,
        message:
          "A Clerk authentication session is required.",
      })
    }

    return res.status(200).json({
      success: true,
      user:
        sanitizeUser(
          req.user,
        ),
      clerkUserId:
        req.clerkUserId,
    })
  } catch (error) {
    console.error(
      "Get Clerk user error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve Clerk user.",
    })
  }
}

export {
  getClerkMe,
}
