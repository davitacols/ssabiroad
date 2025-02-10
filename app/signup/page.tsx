"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [formData, setFormData] = useState({ email: "", username: "", password: "", name: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Signup failed")

      alert("Signup successful! Redirecting to dashboard...")
      router.push("/dashboard")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-4">Sign Up</h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="Full Name" className="border p-2 w-full rounded-md" value={formData.name} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" className="border p-2 w-full rounded-md" value={formData.email} onChange={handleChange} required />
          <input type="text" name="username" placeholder="Username" className="border p-2 w-full rounded-md" value={formData.username} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" className="border p-2 w-full rounded-md" value={formData.password} onChange={handleChange} required />

          <button type="submit" className="bg-blue-600 text-white w-full p-2 rounded-md hover:bg-blue-700 transition" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          Already have an account? <a href="/login" className="text-blue-600">Login</a>
        </p>
      </div>
    </div>
  )
}
