"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';  // Add the Link import
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
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");

      alert("Login successful! Redirecting...");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#002147] text-white">
      {/* Hero Animation */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 1 }}
        className="flex-1 flex items-center justify-center bg-[#002147]"
      >
        <h1 className="text-4xl font-bold">Welcome Back!</h1>
      </motion.div>

      {/* Login Form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 1 }}
        className="flex-1 flex items-center justify-center"
      >
        <Card className="w-full max-w-md p-6 bg-[#F4F4F4] rounded-2xl shadow-lg text-black">
          <CardContent>
            <h2 className="text-2xl font-semibold text-center mb-4 text-[#002147]">Login</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#002147]">Email</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full p-2 rounded-md bg-white text-black border border-[#002147]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#002147]">Password</label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full p-2 rounded-md bg-white text-black border border-[#002147]"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#0056b3] hover:bg-[#004494] p-2 rounded-md text-white font-bold"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm">Don't have an account? 
                <Link href="/signup" className="text-blue-400 hover:text-blue-500 font-medium ml-2">Sign Up</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
