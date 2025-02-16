// utils/api.ts
export const fetchUserData = async () => {
  try {
    const response = await fetch('/api/user');
    if (!response.ok) throw new Error('Failed to fetch user data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const fetchStats = async () => {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

export const fetchRecentDetections = async () => {
  try {
    const response = await fetch('/api/detections/recent');
    if (!response.ok) throw new Error('Failed to fetch recent detections');
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent detections:', error);
    throw error;
  }
};