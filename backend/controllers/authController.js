import jwt from "jsonwebtoken"
import User from "../models/User.js"

/*
|--------------------------------------------------------------------------
| Generate Authentication Token
|--------------------------------------------------------------------------
*/

const generateToken = (
  userId,
) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is missing from the .env file.",
    )
  }

  return jwt.sign(
    {
      userId:
        String(userId),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  )
}

/*
|--------------------------------------------------------------------------
| Sanitize User
|--------------------------------------------------------------------------
|
| Never send the password hash to the frontend.
|
|--------------------------------------------------------------------------
*/

const sanitizeUser = (
  user,
) => {
  const userObject =
    user?.toObject
      ? user.toObject()
      : { ...user }

  delete userObject.password

  return userObject
}

/*
|--------------------------------------------------------------------------
| Register Member
|--------------------------------------------------------------------------
|
| Public registration creates MEMBER accounts only.
|
|--------------------------------------------------------------------------
*/

const register = async (
  req,
  res,
) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
    } = req.body

    /*
    |--------------------------------------------------------------------------
    | Validate Required Fields
    |--------------------------------------------------------------------------
    */

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email and password are required.",
      })
    }

    if (
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Email
    |--------------------------------------------------------------------------
    */

    const normalizedEmail =
      email
        .trim()
        .toLowerCase()

    /*
    |--------------------------------------------------------------------------
    | Check Existing Account
    |--------------------------------------------------------------------------
    */

    const existingUser =
      await User.findOne({
        email:
          normalizedEmail,
      })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Create Member
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Never accept role from public registration.
    |
    */

    const user =
      await User.create({
        firstName:
          firstName.trim(),

        lastName:
          lastName.trim(),

        email:
          normalizedEmail,

        password,

        phone:
          phone?.trim() || "",

        role: "member",
      })

    /*
    |--------------------------------------------------------------------------
    | Generate Token
    |--------------------------------------------------------------------------
    */

    const token =
      generateToken(
        user._id,
      )

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        "Member account created successfully.",

      token,

      user:
        sanitizeUser(
          user,
        ),
    })
  } catch (error) {
    console.error(
      "Register error:",
      error,
    )

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      })
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create account.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

const login = async (
  req,
  res,
) => {
  try {
    const {
      email,
      password,
    } = req.body

    /*
    |--------------------------------------------------------------------------
    | Validate Input
    |--------------------------------------------------------------------------
    */

    if (
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Email
    |--------------------------------------------------------------------------
    */

    const normalizedEmail =
      email
        .trim()
        .toLowerCase()

    /*
    |--------------------------------------------------------------------------
    | Find User
    |--------------------------------------------------------------------------
    |
    | password is normally excluded by the User model.
    | Explicitly include it for password verification.
    |
    */

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      }).select(
        "+password",
      )

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
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
    | Password Check
    |--------------------------------------------------------------------------
    */

    const passwordMatches =
      await user.comparePassword(
        password,
      )

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | Update Last Login
    |--------------------------------------------------------------------------
    */

    user.lastLogin =
      new Date()

    await user.save()

    /*
    |--------------------------------------------------------------------------
    | Generate Token
    |--------------------------------------------------------------------------
    */

    const token =
      generateToken(
        user._id,
      )

    /*
    |--------------------------------------------------------------------------
    | Get Clean User
    |--------------------------------------------------------------------------
    */

    const authenticatedUser =
      sanitizeUser(
        user,
      )

    /*
    |--------------------------------------------------------------------------
    | Diagnostic Server Log
    |--------------------------------------------------------------------------
    |
    | This lets us verify exactly which role the backend authenticated.
    |
    */

    console.log(
      `Login successful: ${authenticatedUser.email} | role=${authenticatedUser.role}`,
    )

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      token,

      user:
        authenticatedUser,
    })
  } catch (error) {
    console.error(
      "Login error:",
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to log in.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| Get Current User
|--------------------------------------------------------------------------
*/

const getMe = async (
  req,
  res,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    })
  }

  return res.status(200).json({
    success: true,

    user:
      sanitizeUser(
        req.user,
      ),
  })
}

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export {
  register,
  login,
  getMe,
}