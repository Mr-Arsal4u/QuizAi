import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', text = 'Thinking...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <span className="text-sm text-muted-foreground animate-pulse">{text}</span>
    </div>
  )
}
