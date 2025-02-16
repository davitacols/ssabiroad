"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FaGoogle, FaFacebook } from "react-icons/fa";

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
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      alert("Login successful! Redirecting...");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="mb-6"
      >
        <img src="/logo.png" alt="App Logo" className="w-20 h-20 rounded-full shadow-lg" />
      </motion.div>
      
      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-full max-w-sm"
      >
        <Card className="p-6 bg-white rounded-2xl shadow-lg text-black">
          <CardContent>
            <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Login</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Social Login */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-700 mb-2">Or sign in with:</p>
              <div className="flex justify-center gap-4">
                <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                  <FaGoogle /> Google
                </Button>
                <Button className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg">
                  <FaFacebook /> Facebook
                </Button>
              </div>
            </div>

            {/* Sign up link */}
            <div className="mt-4 text-center">
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
