"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";  // Import the SABIROAD Header
import { motion } from "framer-motion";

export default function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Include the token in the headers
          },
        });

        if (response.status === 401) {
          setAuthenticated(false);
          return;
        }

        const data = await response.json();
        setName(data.user.username);
        setEmail(data.user.email);
      } catch (error) {
        setAuthenticated(false);
      }
    };

    fetchUser();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate profile update logic
    setTimeout(() => {
      setLoading(false);
      alert("Profile updated successfully!");
    }, 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Simulate password change logic
    setTimeout(() => {
      setLoading(false);
      alert("Password changed successfully!");
    }, 2000);
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
        <Header /> {/* Add the SABIROAD Header */}
        <div className="flex-1 container mx-auto p-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-center">Unauthorized</h1>
            <p className="text-center mt-4">You need to log in to access this page.</p>
            <div className="text-center mt-6">
              <Button onClick={() => router.push("/login")} className="bg-blue-500 hover:bg-blue-600 p-3 rounded-md text-white font-bold">
                Go to Login
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header /> {/* Add the SABIROAD Header */}
      <div className="flex-1 container mx-auto p-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-center">Settings</h1>
        </motion.div>

        <Card className="mb-8 shadow-md rounded-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="w-full p-3 rounded-md bg-white text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full p-3 rounded-md bg-white text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-md text-white font-bold transition duration-300"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Change Password</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <Input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required 
                  className="w-full p-3 rounded-md bg-white text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  className="w-full p-3 rounded-md bg-white text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  className="w-full p-3 rounded-md bg-white text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-md text-white font-bold transition duration-300"
                disabled={loading}
              >
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
