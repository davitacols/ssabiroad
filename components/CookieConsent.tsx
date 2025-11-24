"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"

export function CookieConsent() {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setTimeout(() => setShow(true), 1000)
    }
  }, [])

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShow(false)
  }

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined")
    setShow(false)
  }

  if (!mounted || !show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <Cookie className="h-6 w-6 text-stone-600 dark:text-stone-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-900 dark:text-white mb-2">Cookie Consent</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
              We use cookies to enhance your experience.{" "}
              <Link href="/cookies" className="underline hover:text-stone-900 dark:hover:text-stone-100">
                Learn more
              </Link>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={decline} className="flex-1">
                Decline
              </Button>
              <Button size="sm" onClick={accept} className="flex-1">
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
