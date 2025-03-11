"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { FaGoogle } from "react-icons/fa"
import { Building2, LockIcon, MailIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadGoogleScript = () => {
      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/platform.js"
      script.async = true
      script.defer = true
      script.onload = () => {
        window.gapi.load("auth2", () => {
          window.gapi.auth2.init({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          })
        })
      }
      document.body.appendChild(script)
    }
    loadGoogleScript()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Login failed")
      }

      const { token } = await response.json()
      localStorage.setItem("token", token)
      router.push("/dashboard")
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const googleAuth = window.gapi.auth2.getAuthInstance()
      const googleUser = await googleAuth.signIn()
      const idToken = googleUser.getAuthResponse().id_token

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Google Sign-In failed")
      }

      const { token } = await response.json()
      localStorage.setItem("token", token)
      router.push("/dashboard")
    } catch (err) {
      setError(err.message || "An error occurred with Google Sign-In.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }} 
            animate={{ scale: 1 }} 
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to SabiRoad
          </h1>
          <p className="text-gray-500 mt-2">Sign in to continue to your dashboard</p>
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-xl">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <MailIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <LockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </motion.div>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <FaGoogle className="w-5 h-5 text-red-500" /> 
                <span>Sign in with Google</span>
              </Button>
            </motion.div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account? <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Create one</Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}