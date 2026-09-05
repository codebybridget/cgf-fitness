import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

const ThemeContext = createContext(null)

const STORAGE_KEY = "cgf-theme"

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)

  return stored === "light" || stored === "dark"
    ? stored
    : "dark"
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-cgf-theme", theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark" ? "light" : "dark",
    )
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider.",
    )
  }

  return context
}
