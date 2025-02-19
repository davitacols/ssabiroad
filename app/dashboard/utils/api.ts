import { getSession } from "next-auth/react";

export async function fetchUserData() {
  const token = localStorage.getItem("token"); // ✅ Get token from localStorage
  if (!token) {
    throw new Error("No active session found"); // 🚨 Error if no token is present
  }

  const response = await fetch("/api/user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ Send token in Authorization header
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch user data");
  }

  return response.json();
}


export async function fetchStats() {
  // Replace with actual API call
  return {
    totalDetections: 100,
    savedBuildings: 50,
    detectionAccuracy: 90,
    detectionHistory: 75,
  };
}

export async function fetchRecentDetections() {
  // Replace with actual API call
  return [
    { id: 1, name: "Building 1", location: "Location 1" },
    { id: 2, name: "Building 2", location: "Location 2" },
    { id: 3, name: "Building 3", location: "Location 3" },
  ];
}