import {
  Navigate,
  Route,
  Routes,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom"

import {
  useEffect,
  useState,
} from "react"

import Home from "./pages/Home"
import Login from "./pages/Login"
import AdminLogin from "./pages/AdminLogin"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import AdminForgotPassword from "./pages/AdminForgotPassword"
import ResetPassword from "./pages/ResetPassword"

import MemberMembershipPlans from "./pages/MembershipPlans.jsx"
import PaymentCallback from "./pages/PaymentCallback.jsx"

import Progress from "./pages/admin/Progress"
import Settings from "./pages/admin/Settings"

import Workout from "./pages/Workout"
import WorkoutHistory from "./pages/WorkoutHistory"
import MemberProgress from "./pages/Progress"
import Profile from "./pages/Profile"
import WeeklySchedule from "./pages/WeeklySchedule"
import Payment from "./pages/Payment"

import AdminMembershipPlans from "./pages/admin/MembershipPlans"

import AdminLayout from "./layouts/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminProfile from "./pages/admin/AdminProfile"
import Members from "./pages/admin/Members"
import Workouts from "./pages/admin/Workouts"
import ProgramBuilder from "./pages/admin/ProgramBuilder"
import Assignments from "./pages/admin/Assignments"
import MemberAssignments from "./pages/admin/MemberAssignments"
import WeeklyScheduleAdmin from "./pages/admin/WeeklySchedule"
import Exercises from "./pages/admin/Exercises"
import Attendance from "./pages/Attendance"
import AdminAttendance from "./pages/admin/Attendance"

import {
  useAuth,
} from "./context/AuthContext.jsx"

import {
  getMySubscription,
} from "./api/api.js"

/*
|--------------------------------------------------------------------------
| Loading Screen
|--------------------------------------------------------------------------
*/

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <p className="text-sm text-slate-400">
        Loading...
      </p>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Protected Member Route
|--------------------------------------------------------------------------
|
| This route only verifies authentication and member role.
|
| Membership/payment pages use this route because unpaid members must
| still be able to access the payment area.
|
*/

function ProtectedRoute() {
  const {
    isAuthenticated,
    isMember,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  /*
  |--------------------------------------------------------------------------
  | Not logged in
  |--------------------------------------------------------------------------
  */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Only members can enter member routes
  |--------------------------------------------------------------------------
  */

  if (!isMember) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return <Outlet />
}

/*
|--------------------------------------------------------------------------
| Paid Member Route
|--------------------------------------------------------------------------
|
| Authentication + member role + active paid subscription.
|
| Admins and trainers are handled by their own routes and are not subject
| to this member subscription gate.
|
*/

function PaidMemberRoute() {
  const {
    isAuthenticated,
    isMember,
    loading,
  } = useAuth()

  const location = useLocation()

  const [
    subscriptionLoading,
    setSubscriptionLoading,
  ] = useState(true)

  const [
    hasActiveSubscription,
    setHasActiveSubscription,
  ] = useState(false)

  useEffect(() => {
    let cancelled = false

    const checkSubscription = async () => {
      /*
      |--------------------------------------------------------------------------
      | Wait for authentication to finish
      |--------------------------------------------------------------------------
      */

      if (loading) {
        return
      }

      /*
      |--------------------------------------------------------------------------
      | Only check subscription for authenticated members
      |--------------------------------------------------------------------------
      */

      if (
        !isAuthenticated ||
        !isMember
      ) {
        if (!cancelled) {
          setSubscriptionLoading(false)
        }

        return
      }

      try {
        setSubscriptionLoading(true)

        const data =
          await getMySubscription()

        if (cancelled) {
          return
        }

        setHasActiveSubscription(
          Boolean(
            data?.hasActiveSubscription,
          ),
        )
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error(
          "Subscription check error:",
          error,
        )

        setHasActiveSubscription(false)
      } finally {
        if (!cancelled) {
          setSubscriptionLoading(false)
        }
      }
    }

    checkSubscription()

    return () => {
      cancelled = true
    }
  }, [
    loading,
    isAuthenticated,
    isMember,
  ])

  /*
  |--------------------------------------------------------------------------
  | Authentication loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return <LoadingScreen />
  }

  /*
  |--------------------------------------------------------------------------
  | Subscription loading
  |--------------------------------------------------------------------------
  */

  if (
    subscriptionLoading &&
    isAuthenticated &&
    isMember
  ) {
    return <LoadingScreen />
  }

  /*
  |--------------------------------------------------------------------------
  | Not logged in
  |--------------------------------------------------------------------------
  */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Only members can enter paid member routes
  |--------------------------------------------------------------------------
  */

  if (!isMember) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Subscription required
  |--------------------------------------------------------------------------
  */

  if (!hasActiveSubscription) {
    return (
      <Navigate
        to="/membership-plans"
        state={{
          from: location.pathname,
          subscriptionRequired: true,
        }}
      />
    )
  }

  return <Outlet />
}

/*
|--------------------------------------------------------------------------
| Protected Admin Route
|--------------------------------------------------------------------------
*/

function AdminRoute() {
  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  /*
  |--------------------------------------------------------------------------
  | Not logged in
  |--------------------------------------------------------------------------
  */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin-login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Only admins can enter admin routes
  |--------------------------------------------------------------------------
  */

  if (!isAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return <Outlet />
}

/*
|--------------------------------------------------------------------------
| Public Root
|--------------------------------------------------------------------------
|
| /
|
| Not logged in -> /login
| Member         -> /dashboard
| Admin          -> /admin
|
*/

function PublicEntry() {
  const {
    isAuthenticated,
    isAdmin,
    isMember,
    loading,
  } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  /*
  |--------------------------------------------------------------------------
  | Not logged in
  |--------------------------------------------------------------------------
  */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Admin
  |--------------------------------------------------------------------------
  */

  if (isAdmin) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Member
  |--------------------------------------------------------------------------
  */

  if (isMember) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Unknown role
  |--------------------------------------------------------------------------
  */

  return (
    <Navigate
      to="/login"
      replace
    />
  )
}

/*
|--------------------------------------------------------------------------
| Member Assignments Route
|--------------------------------------------------------------------------
*/

function MemberAssignmentsRoute() {
  const navigate = useNavigate()
  const { memberId } = useParams()

  return (
    <MemberAssignments
      memberId={memberId}
      onBack={() =>
        navigate(
          "/admin/assignments",
        )
      }
    />
  )
}

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
*/

function App() {
  return (
    <Routes>

      {/* ================================================================ */}
      {/* PUBLIC ENTRY                                                     */}
      {/* ================================================================ */}

      <Route
        path="/"
        element={
          <PublicEntry />
        }
      />

      {/* ================================================================ */}
      {/* MEMBER AUTHENTICATION                                            */}
      {/* ================================================================ */}

      <Route
        path="/login"
        element={
          <Login />
        }
      />

      <Route
        path="/register"
        element={
          <Register />
        }
      />

      <Route
        path="/forgot-password"
        element={
          <ForgotPassword />
        }
      />

      <Route
        path="/reset-password"
        element={
          <ResetPassword />
        }
      />

      <Route
        path="/admin-forgot-password"
        element={
          <AdminForgotPassword />
        }
      />

      {/* ================================================================ */}
      {/* ADMIN AUTHENTICATION                                             */}
      {/* ================================================================ */}

      <Route
        path="/admin-login"
        element={
          <AdminLogin />
        }
      />

      {/* ================================================================ */}
      {/* MEMBER ROUTES                                                    */}
      {/* ================================================================ */}
      {/*
        The outer ProtectedRoute allows authenticated members to access
        membership/payment pages even when they have not paid yet.
      */}

      <Route
        element={
          <ProtectedRoute />
        }
      >

        {/* -------------------------------------------------------------- */}
        {/* MEMBERSHIP / PAYMENT — AVAILABLE BEFORE PAYMENT               */}
        {/* -------------------------------------------------------------- */}

        <Route
          path="/membership-plans"
          element={
            <MemberMembershipPlans />
          }
        />

        <Route
          path="/payment"
          element={
            <Payment />
          }
        />

        <Route
          path="/payment/callback"
          element={
            <PaymentCallback />
          }
        />

        {/* -------------------------------------------------------------- */}
        {/* PAID MEMBER APP                                                */}
        {/* -------------------------------------------------------------- */}

        <Route
          element={
            <PaidMemberRoute />
          }
        >

          <Route
            path="/dashboard"
            element={
              <Home />
            }
          />

          <Route
            path="/workout"
            element={
              <Workout />
            }
          />

          <Route
            path="/workout-history"
            element={
              <WorkoutHistory />
            }
          />

          <Route
            path="/progress"
            element={
              <MemberProgress />
            }
          />

          <Route
            path="/weekly-schedule"
            element={
              <WeeklySchedule />
            }
          />

          <Route
            path="/attendance"
            element={
              <Attendance />
            }
          />

          <Route
            path="/profile"
            element={
              <Profile />
            }
          />

        </Route>

      </Route>

      {/* ================================================================ */}
      {/* ADMIN ROUTES                                                     */}
      {/* ================================================================ */}

      <Route
        element={
          <AdminRoute />
        }
      >

        <Route
          path="/admin"
          element={
            <AdminLayout />
          }
        >

          {/* ------------------------------------------------------------ */}
          {/* Admin Dashboard                                              */}
          {/* ------------------------------------------------------------ */}

          <Route
            index
            element={
              <AdminDashboard />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Members                                                       */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="members"
            element={
              <Members />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Membership Plans                                              */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="membership"
            element={
              <AdminMembershipPlans />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Weekly Schedule                                               */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="schedule"
            element={
              <WeeklyScheduleAdmin />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Exercises                                                     */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="exercises"
            element={
              <Exercises />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Programs                                                      */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="programs"
            element={
              <ProgramBuilder />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Workouts                                                      */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="workouts"
            element={
              <Workouts />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Assignments                                                   */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="assignments"
            element={
              <Assignments />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Progress                                                      */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="progress"
            element={
              <Progress />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Attendance                                                    */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="attendance"
            element={
              <AdminAttendance />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Member Assignments                                            */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="assignments/member/:memberId"
            element={
              <MemberAssignmentsRoute />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Admin Profile                                                 */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="profile"
            element={
              <AdminProfile />
            }
          />

          {/* ------------------------------------------------------------ */}
          {/* Settings                                                      */}
          {/* ------------------------------------------------------------ */}

          <Route
            path="settings"
            element={
              <Settings />
            }
          />

        </Route>

      </Route>

      {/* ================================================================ */}
      {/* FALLBACK                                                         */}
      {/* ================================================================ */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  )
}

/*
|--------------------------------------------------------------------------
| Coming Soon Page
|--------------------------------------------------------------------------
*/

function ComingSoonPage({
  title,
}) {
  return (
    <div className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        <p className="text-xs font-bold uppercase tracking-wider text-lime-400">
          CGF Admin
        </p>

        <h1 className="mt-2 text-3xl font-black">
          {title}
        </h1>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-500">
            This section will be built in
            the next stage.
          </p>
        </div>

      </div>
    </div>
  )
}

export default App