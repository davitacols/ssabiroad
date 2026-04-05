"use client"

import dynamic from "next/dynamic"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { ToastContextProvider } from "@/contexts/toast-context"
import { ErrorBoundary } from "@/components/error-boundary"

const CookieConsent = dynamic(
  () => import("@/components/CookieConsent").then((mod) => mod.CookieConsent),
  { ssr: false }
)

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
