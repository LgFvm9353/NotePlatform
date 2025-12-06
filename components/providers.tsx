"use client"

import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useOfflineSync } from "@/hooks/useOfflineSync"

function GlobalHooks() {
  useKeyboardShortcuts([])
  useOfflineSync()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <GlobalHooks />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
