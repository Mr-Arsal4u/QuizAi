import React from 'react'
import { Brain } from 'lucide-react'
import { ThemeToggle } from './ui/theme-toggle'

interface HeaderProps {
  isDarkMode: boolean
  onToggleDarkMode: (enabled: boolean) => void
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, onToggleDarkMode }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">AI MCQ Solver</h1>
          <p className="text-xs text-muted-foreground">Solve questions instantly</p>
        </div>
      </div>
      
      <div className="flex items-center">
        <ThemeToggle
          isDarkMode={isDarkMode}
          onToggle={onToggleDarkMode}
        />
      </div>
    </div>
  )
}
