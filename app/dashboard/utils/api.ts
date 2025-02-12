export async function fetchUserData() {
    const response = await fetch("/api/user")
    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }
    return response.json()
  }
  
  export async function fetchStats() {
    const response = await fetch("/api/stats")
    if (!response.ok) {
      throw new Error("Failed to fetch stats")
    }
    return response.json()
  }
  
  export async function fetchRecentDetections() {
    const response = await fetch("/api/recent-detections")
    if (!response.ok) {
      throw new Error("Failed to fetch recent detections")
    }
    return response.json()
  }
  
  