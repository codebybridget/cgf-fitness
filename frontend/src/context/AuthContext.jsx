import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

import {
  loginUser,
  getMe,
} from "../api/api.js"

const AuthContext =
  createContext(null)

/*
|--------------------------------------------------------------------------
| Stored authentication
|--------------------------------------------------------------------------
*/

const getStoredToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  )
}

const getStoredUser = () => {
  try {
    const storedUser =
      localStorage.getItem("user")

    return storedUser
      ? JSON.parse(storedUser)
      : null
  } catch (error) {
    console.error(
      "Unable to read stored user:",
      error,
    )

    localStorage.removeItem("user")

    return null
  }
}

/*
|--------------------------------------------------------------------------
| Auth Provider
|--------------------------------------------------------------------------
*/

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(getStoredUser)

  const [token, setToken] =
    useState(getStoredToken)

  const [loading, setLoading] =
    useState(true)

  /*
  |--------------------------------------------------------------------------
  | Restore authentication
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | We do NOT blindly trust the user saved in localStorage.
  |
  | We ask the backend who the authenticated user really is.
  |
  */

  useEffect(() => {
    const restoreAuthentication =
      async () => {
        const storedToken =
          getStoredToken()

        if (!storedToken) {
          setToken(null)
          setUser(null)
          setLoading(false)
          return
        }

        try {
          /*
          |----------------------------------------------------------------
          | Ask backend for current user
          |----------------------------------------------------------------
          */

          const data =
            await getMe()

          if (
            !data?.success ||
            !data?.user
          ) {
            throw new Error(
              "Unable to restore user session.",
            )
          }

          const currentUser =
            data.user

          /*
          |----------------------------------------------------------------
          | Backend is source of truth
          |----------------------------------------------------------------
          */

          setToken(
            storedToken,
          )

          setUser(
            currentUser,
          )

          localStorage.setItem(
            "token",
            storedToken,
          )

          localStorage.setItem(
            "accessToken",
            storedToken,
          )

          localStorage.setItem(
            "user",
            JSON.stringify(
              currentUser,
            ),
          )
        } catch (error) {
          console.error(
            "Session restore error:",
            error,
          )

          /*
          |--------------------------------------------------------------
          | Token is invalid/expired
          |--------------------------------------------------------------
          */

          localStorage.removeItem(
            "token",
          )

          localStorage.removeItem(
            "accessToken",
          )

          localStorage.removeItem(
            "user",
          )

          setToken(null)
          setUser(null)
        } finally {
          setLoading(false)
        }
      }

    restoreAuthentication()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  const login = async (
    email,
    password,
  ) => {
    try {
      const data =
        await loginUser(
          email,
          password,
        )

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Login failed.",
        )
      }

      const receivedToken =
        data?.token ||
        data?.accessToken

      if (!receivedToken) {
        throw new Error(
          "Login succeeded but no authentication token was returned.",
        )
      }

      /*
      |----------------------------------------------------------------
      | Store token temporarily
      |----------------------------------------------------------------
      */

      localStorage.setItem(
        "token",
        receivedToken,
      )

      localStorage.setItem(
        "accessToken",
        receivedToken,
      )

      setToken(
        receivedToken,
      )

      /*
      |----------------------------------------------------------------
      | Get the authoritative user from backend
      |----------------------------------------------------------------
      */

      const me =
        await getMe()

      if (
        !me?.success ||
        !me?.user
      ) {
        throw new Error(
          "Unable to retrieve authenticated user.",
        )
      }

      const authenticatedUser =
        me.user

      localStorage.setItem(
        "user",
        JSON.stringify(
          authenticatedUser,
        ),
      )

      setUser(
        authenticatedUser,
      )

      return {
        success: true,
        user:
          authenticatedUser,
        token:
          receivedToken,
      }
    } catch (error) {
      console.error(
        "Login error:",
        error,
      )

      localStorage.removeItem(
        "token",
      )

      localStorage.removeItem(
        "accessToken",
      )

      localStorage.removeItem(
        "user",
      )

      setToken(null)
      setUser(null)

      const message =
        error.response
          ?.data?.message ||
        error.message ||
        "Unable to login."

      throw new Error(
        message,
      )
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const logout = () => {
    localStorage.removeItem(
      "token",
    )

    localStorage.removeItem(
      "accessToken",
    )

    localStorage.removeItem(
      "user",
    )

    setToken(null)
    setUser(null)
  }

  /*
  |--------------------------------------------------------------------------
  | Clear authentication
  |--------------------------------------------------------------------------
  */

  const clearAuthentication =
    () => {
      logout()
    }

  /*
  |--------------------------------------------------------------------------
  | Authentication state
  |--------------------------------------------------------------------------
  */

  const isAuthenticated =
    Boolean(
      token && user,
    )

  /*
  |--------------------------------------------------------------------------
  | Role
  |--------------------------------------------------------------------------
  */

  const role =
    user?.role || null

  const isAdmin =
    role === "admin"

  const isMember =
    role === "member"

  const isTrainer =
    role === "trainer"

  /*
  |--------------------------------------------------------------------------
  | Context value
  |--------------------------------------------------------------------------
  */

  const value = {
    user,
    token,
    role,

    loading,

    isAuthenticated,

    isAdmin,
    isMember,
    isTrainer,

    login,
    logout,
    clearAuthentication,
  }

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}

/*
|--------------------------------------------------------------------------
| useAuth
|--------------------------------------------------------------------------
*/

export const useAuth = () => {
  const context =
    useContext(
      AuthContext,
    )

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    )
  }

  return context
}

export default AuthContext