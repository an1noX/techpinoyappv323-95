
import React from 'react'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return <>{children}</>
}
