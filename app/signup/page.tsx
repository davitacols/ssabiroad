"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import { MailIcon, UserIcon, LockIcon } from "lucide-react";

export default function SignUp() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");

      alert("Signup successful! Redirecting...");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      console.error("Signup Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand Section */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <img
                src="logos/logo.png"
                alt="Logo"
                className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg"
              />
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create Your Account
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Join us and start your journey today!
            </p>
          </div>

          <Card className="p-6 bg-white/70 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-xl">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600 text-center" role="alert">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 h-12 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 h-12 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Choose a username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
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
                    className="pl-10 h-12 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-12 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Create a password"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
