import { Moon, Sun } from "lucide-react"
import { useTheme } from '../providers/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`
        h-8 w-8 flex items-center justify-center rounded-md
        border bg-background transition-colors hover:bg-accent
        ${theme === "dark" ? "border-accent" : "border-input"}
      `}
    >
      <Sun className={`
        h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0
        ${theme === "dark" ? "text-accent-foreground" : "text-foreground"}
      `} />
      
      <Moon className={`
        absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100
        ${theme === "dark" ? "text-accent-foreground" : "text-foreground"}
      `} />
      
      <span className="sr-only">
        {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      </span>
    </button>
  )
} 