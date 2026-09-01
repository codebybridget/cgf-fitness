import {
  Navigate,
  Route,
  Routes,
  Outlet,
  useLocation,
} from "react-router-dom"

import Home from "./pages/Home"
import Login from "./pages/Login"
import AdminLogin from "./pages/AdminLogin"
import Register from "./pages/Register"

import Progress from "./pages/admin/Progress"
import Settings from "./pages/admin/Settings"

import Workout from "./pages/Workout"
import WorkoutHistory from "./pages/WorkoutHistory"
import MemberProgress from "./pages/Progress"
import Profile from "./pages/Profile"
import WeeklySchedule from "./pages/WeeklySchedule"
import MembershipPlans from "./pages/admin/MembershipPlans"
import Payment from "./pages/Payment"
import AdminLayout from "./layouts/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminProfile from "./pages/admin/AdminProfile"
import Members from "./pages/admin/Members"
import Workouts from "./pages/admin/Workouts"
import ProgramBuilder from "./pages/admin/ProgramBuilder"
import Assignments from "./pages/admin/Assignments"
import WeeklyScheduleAdmin from "./pages/admin/WeeklySchedule"
import Exercises from "./pages/admin/Exercises"
import Membership from "./pages/Membership"
import { useAuth } from "./context/AuthContext.jsx"
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
| IMPORTANT:
| Only users with role === "member" can enter member pages.
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

      <Route
        element={
          <ProtectedRoute />
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
          path="/profile"
          element={
            <Profile />
          }
        />
      </Route>
      <Route
  path="/membership"
  element={
    <Membership />
  }
/>
      <Route
  path="/payment"
  element={
    <Payment />
  }
/>

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
          {/* Admin Dashboard */}

          <Route
            index
            element={
              <AdminDashboard />
            }
          />

          {/* Members */}

          <Route
            path="members"
            element={
              <Members />
            }
          />

          {/* Membership Plans */}

            <Route
              path="membership"
              element={
                <MembershipPlans />
              }
            />


          {/* Weekly Schedule */}

          <Route
            path="schedule"
            element={
              <WeeklyScheduleAdmin />
            }
          />

          {/* Exercises */}

          <Route
            path="exercises"
            element={
              <Exercises />
            }
          />

          {/* Programs */}

          <Route
            path="programs"
            element={
              <ProgramBuilder />
            }
          />

          {/* Workouts */}

          <Route
            path="workouts"
            element={
              <Workouts />
            }
          />

          {/* Assignments */}

          <Route
            path="assignments"
            element={
              <Assignments />
            }
          />

          {/* Progress */}

          <Route
            path="progress"
            element={
              <Progress />
            }
          />
           {/* Admin Profile */}

<Route
  path="profile"
  element={
    <AdminProfile />
  }
/>
          {/* Settings */}

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