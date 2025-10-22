import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  isDarkMode: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

const ThemeToggle = React.forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ isDarkMode, onToggle, className, ...props }, ref) => {
    const handleClick = () => {
      onToggle(!isDarkMode)
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isDarkMode}
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        onClick={handleClick}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          isDarkMode ? "bg-slate-600" : "bg-slate-200",
          className
        )}
        {...props}
      >
        {/* Background icons */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          <Sun className={cn(
            "h-3 w-3 transition-opacity duration-200",
            isDarkMode ? "opacity-0" : "opacity-100 text-yellow-500"
          )} />
          <Moon className={cn(
            "h-3 w-3 transition-opacity duration-200",
            isDarkMode ? "opacity-100 text-blue-300" : "opacity-0"
          )} />
        </div>
        
        {/* Sliding knob */}
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 flex items-center justify-center",
            isDarkMode ? "translate-x-5" : "translate-x-0"
          )}
        >
          {isDarkMode ? (
            <Moon className="h-3 w-3 text-slate-600" />
          ) : (
            <Sun className="h-3 w-3 text-yellow-500" />
          )}
        </span>
      </button>
    )
  }
)

ThemeToggle.displayName = "ThemeToggle"

export { ThemeToggle }
