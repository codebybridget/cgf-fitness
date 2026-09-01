import { useEffect, useState } from "react"

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom"

import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Dumbbell,
  UserRound,
  FileCog,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react"

import {
  useAuth,
} from "../context/AuthContext.jsx"

import {
  getMyProfile,
} from "../api/api.js"

const navigationItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Members",
    path: "/admin/members",
    icon: Users,
  },
  {
    label: "Membership Plans",
    path: "/admin/membership",
    icon: CreditCard,
  },
  {
    label: "Weekly Schedule",
    path: "/admin/schedule",
    icon: CalendarDays,
  },
  {
    label: "Exercise Library",
    path: "/admin/workouts",
    icon: Dumbbell,
  },
  {
    label: "Workout Programs",
    path: "/admin/programs",
    icon: FileCog,
  },
  {
    label: "Assignments",
    path: "/admin/assignments",
    icon: UserRoundCheck,
  },
  {
    label: "Progress",
    path: "/admin/progress",
    icon: BarChart3,
  },
  {
    label: "Profile",
    path: "/admin/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
]

function AdminLayout() {
  const navigate = useNavigate()

  const {
    logout,
  } = useAuth()

  const [
    adminProfile,
    setAdminProfile,
  ] = useState(null)

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false)

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false)


  /*
  |--------------------------------------------------------------------------
  | Load Admin Profile
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadAdminProfile =
      async () => {
        try {
          const response =
            await getMyProfile()

          const user =
            response?.user ||
            response?.profile ||
            response

          if (user) {
            setAdminProfile(user)
          }
        } catch (error) {
          console.error(
            "Unable to load admin profile:",
            error,
          )
        }
      }

    loadAdminProfile()
  }, [])


  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    logout()

    navigate(
      "/admin-login",
      {
        replace: true,
      },
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Admin Display Name
  |--------------------------------------------------------------------------
  */

  const adminName =
    adminProfile
      ? `${adminProfile.firstName || ""} ${adminProfile.lastName || ""}`.trim()
      : ""


  /*
  |--------------------------------------------------------------------------
  | Admin Initial
  |--------------------------------------------------------------------------
  */

  const adminInitial =
    adminProfile?.firstName
      ?.charAt(0)
      ?.toUpperCase() ||
    adminProfile?.lastName
      ?.charAt(0)
      ?.toUpperCase() ||
    "A"


  return (
    <div className="min-h-screen bg-black text-white">

      {/* ================================================================ */}
      {/* MOBILE SIDEBAR OVERLAY                                           */}
      {/* ================================================================ */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}


      {/* ================================================================ */}
      {/* SIDEBAR                                                          */}
      {/* ================================================================ */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/10 bg-black transition-all duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } ${
          sidebarCollapsed
            ? "w-20"
            : "w-72"
        }`}
      >

        {/* Sidebar Header */}

        <div
          className={`flex h-20 items-center border-b border-white/10 ${
            sidebarCollapsed
              ? "justify-center px-3"
              : "justify-between px-5"
          }`}
        >

          {!sidebarCollapsed && (
            <div>

              <p className="text-2xl font-black tracking-tight">
                CGF
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-400">
                Admin Panel
              </p>

            </div>
          )}

          {sidebarCollapsed && (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-lg font-black text-black">
              C
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 lg:hidden"
          >
            <X size={18} />
          </button>

        </div>


        {/* Navigation */}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">

          {!sidebarCollapsed && (
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600">
              Management
            </p>
          )}

          {navigationItems.map(
            (item) => {
              const Icon =
                item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={
                    item.path ===
                    "/admin"
                  }
                  onClick={() =>
                    setSidebarOpen(
                      false,
                    )
                  }
                  className={({
                    isActive,
                  }) =>
                    `group flex items-center rounded-2xl transition ${
                      sidebarCollapsed
                        ? "justify-center px-3 py-3"
                        : "gap-3 px-3 py-3"
                    } ${
                      isActive
                        ? "bg-yellow-400 text-black"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`
                  }
                  title={
                    sidebarCollapsed
                      ? item.label
                      : undefined
                  }
                >

                  <Icon size={19} />

                  {!sidebarCollapsed && (
                    <span className="text-sm font-bold">
                      {item.label}
                    </span>
                  )}

                </NavLink>
              )
            },
          )}

        </nav>


        {/* Logout */}

        <div className="border-t border-white/10 p-3">

          <button
            type="button"
            onClick={
              handleLogout
            }
            className={`flex w-full items-center rounded-2xl text-gray-500 transition hover:bg-white/5 hover:text-white ${
              sidebarCollapsed
                ? "justify-center px-3 py-3"
                : "gap-3 px-3 py-3"
            }`}
            title={
              sidebarCollapsed
                ? "Logout"
                : undefined
            }
          >

            <LogOut size={19} />

            {!sidebarCollapsed && (
              <span className="text-sm font-bold">
                Logout
              </span>
            )}

          </button>

        </div>

      </aside>


      {/* ================================================================ */}
      {/* MAIN AREA                                                        */}
      {/* ================================================================ */}

      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed
            ? "lg:pl-20"
            : "lg:pl-72"
        }`}
      >

        {/* ============================================================ */}
        {/* HEADER                                                        */}
        {/* ============================================================ */}

        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur-xl">

          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

            {/* Left */}

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(
                    true,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setSidebarCollapsed(
                    (current) =>
                      !current,
                  )
                }
                className="hidden h-10 w-10 items-center justify-center rounded-xl bg-white/5 lg:flex"
              >

                {sidebarCollapsed ? (
                  <ChevronRight
                    size={19}
                  />
                ) : (
                  <ChevronLeft
                    size={19}
                  />
                )}

              </button>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Control Center
                </p>

                <p className="text-sm font-black">
                  CGF Fitness Management
                </p>

              </div>

            </div>


            {/* ======================================================== */}
            {/* DYNAMIC ADMIN PROFILE                                    */}
            {/* ======================================================== */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/profile",
                )
              }
              className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-white/5"
              title="Open profile"
            >

              <div className="hidden text-right sm:block">

                <p className="text-sm font-bold">
                  {adminName ||
                    "Admin"}
                </p>

                <p className="text-xs capitalize text-gray-600">
                  {adminProfile?.role ||
                    "Administrator"}
                </p>

              </div>


              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-yellow-400/30 bg-yellow-400 text-sm font-black text-black">

                {adminProfile?.profilePhoto ? (
                  <img
                    src={
                      adminProfile.profilePhoto
                    }
                    alt="Admin profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  adminInitial
                )}

              </div>

            </button>

          </div>

        </header>


        {/* Page Content */}

        <main>
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default AdminLayout