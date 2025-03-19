"use client"
import { useState } from "react"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export const AppNavbar = () => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleNavigation = (path: string) => {
    setLoading(true)
    setTimeout(() => {
      router.push(path)
    }, 1000) // Simulating a short delay before navigation
  }

  return (
    <div className="bg-background border-b border-slate-200 dark:border-slate-700">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <LucideIcons.Navigation className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Pic2Nav
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("/login")}
            disabled={loading}
            className="hover:text-teal-600 dark:hover:text-teal-400"
          >
            {loading ? "Loading..." : "Sign In"}
          </Button>
          <Button
            size="sm"
            onClick={() => handleNavigation("/signup")}
            disabled={loading}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0"
          >
            {loading ? "Loading..." : "Sign Up"}
          </Button>
        </div>
      </div>
    </div>
  )
}

