"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { CookieConsent } from "@/components/CookieConsent"
import { ToastContextProvider } from "@/contexts/toast-context"
import { ErrorBoundary } from "@/components/error-boundary"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastContextProvider>
            {children}
            <CookieConsent />
          </ToastContextProvider>
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}