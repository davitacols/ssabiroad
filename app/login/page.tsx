"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        // More specific error handling
        if (data.error) {
           throw new Error(data.error);
        } else if (response.status === 401) {
          throw new Error("Invalid credentials"); // Example: Handle 401 Unauthorized
        } else {
          throw new Error("Login failed");
        }
      }

      localStorage.setItem("token", data.token);
      alert("Login successful! Redirecting...");
      router.push("/dashboard");
    } catch (err: any) { // Type the error as any or your custom error type
      setError(err.message); // Display the error message
      console.error("Login Error:", err); // Log the full error for debugging
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      {/* Hero Animation */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="flex-1 flex items-center justify-center p-4 md:p-0"
      >
        <h1 className="text-3xl md:text-5xl font-bold text-center">Welcome Back!</h1>
      </motion.div>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="flex-1 flex items-center justify-center p-4 md:p-0"
      >
        <Card className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg text-black">
          <CardContent>
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 text-gray-800">Login</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>} {/* Display error message */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg bg-gray-100 text-gray-900 border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg bg-gray-100 text-gray-900 border border-gray-300"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg text-white font-bold transition duration-300"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700">
                Don't have an account?
                <Link href="/signup" className="text-blue-500 hover:text-blue-600 font-medium ml-2">
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}