import { clerkClient, getAuth } from "@clerk/express"
import User from "../models/User.js"

/*
 * Resolve a verified Clerk session to the corresponding CGF MongoDB user.
 *
 * Rules:
 * 1. A known clerkId always wins.
 * 2. Otherwise, a verified Clerk email may link an existing CGF account.
 * 3. If no CGF account exists, create a member account.
 * 4. Never allow Clerk sign-in to change an existing MongoDB role.
 */

const getPrimaryEmail = (clerkUser) => {
  const primaryId = clerkUser?.primaryEmailAddressId

  const primary =
    clerkUser?.emailAddresses?.find(
      (item) => item.id === primaryId,
    ) || clerkUser?.emailAddresses?.[0]

  return primary?.emailAddress?.trim()?.toLowerCase() || ""
}

const isEmailVerified = (clerkUser) => {
  const primaryId = clerkUser?.primaryEmailAddressId

  const primary =
    clerkUser?.emailAddresses?.find(
      (item) => item.id === primaryId,
    ) || clerkUser?.emailAddresses?.[0]

  return Boolean(primary?.verification?.status === "verified")
}

const buildNames = (clerkUser) => {
  const firstName =
    clerkUser?.firstName?.trim() ||
    clerkUser?.username?.trim() ||
    "CGF"

  const lastName =
    clerkUser?.lastName?.trim() ||
    "Member"

  return { firstName, lastName }
}

const sanitizeUser = (user) => {
  const value = user?.toObject
    ? user.toObject()
    : { ...user }

  delete value.password
  return value
}

export const getClerkMongoUser = async (req) => {
  const { userId } = getAuth(req)

  if (!userId) {
    const error = new Error("Clerk authentication required.")
    error.statusCode = 401
    throw error
  }

  const clerkUser =
    await clerkClient.users.getUser(userId)

  const email = getPrimaryEmail(clerkUser)

  if (!email) {
    const error = new Error(
      "Your Clerk account does not have a usable email address.",
    )
    error.statusCode = 400
    throw error
  }

  const verified = isEmailVerified(clerkUser)

  let user =
    await User.findOne({
      clerkId: userId,
    })

  if (!user) {
    user =
      await User.findOne({
        email,
      })

    if (user) {
      // Only link an existing CGF account when the Clerk email is verified.
      if (!verified) {
        const error = new Error(
          "Please verify your email address before linking this CGF account.",
        )
        error.statusCode = 403
        throw error
      }

      user.clerkId = userId
    }
  }

  if (!user) {
    const { firstName, lastName } =
      buildNames(clerkUser)

    user =
      new User({
        firstName,
        lastName,
        email,
        clerkId: userId,
        role: "member",
        emailVerified: verified,
      })
  }

  if (!user.isActive) {
    const error = new Error(
      "This account has been deactivated.",
    )
    error.statusCode = 403
    throw error
  }

  // Clerk is the authentication authority; MongoDB remains the CGF
  // authorization/profile authority.
  user.emailVerified =
    verified || user.emailVerified

  user.lastLogin = new Date()

  await user.save()

  return {
    user,
    clerkUser,
    userId,
    email,
    verified,
  }
}

export { sanitizeUser }
