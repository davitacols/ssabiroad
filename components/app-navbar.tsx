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
    <div className="bg-background border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <LucideIcons.Navigation className="h-6 w-6" />
          SABIROAD
        </Link>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("/login")}
            disabled={loading}
          >
            {loading ? "Loading..." : "Sign In"}
          </Button>
          <Button
            size="sm"
            onClick={() => handleNavigation("/signup")}
            disabled={loading}
          >
            {loading ? "Loading..." : "Sign Up"}
          </Button>
        </div>
      </div>
    </div>
  )
}
