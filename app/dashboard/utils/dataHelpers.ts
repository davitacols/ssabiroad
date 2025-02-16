// utils/dataHelpers.ts
export const updateStats = (prevStats, newDetection) => {
  return {
    ...prevStats,
    totalDetections: prevStats.totalDetections + 1,
    detectionAccuracy: (prevStats.detectionAccuracy * prevStats.totalDetections + newDetection.confidence) / (prevStats.totalDetections + 1),
    detectionHistory: prevStats.detectionHistory + 1
  };
};

export const addRecentDetection = (prevDetections, newDetection) => {
  const updatedDetections = [newDetection, ...prevDetections].slice(0, 10);
  return updatedDetections;
};

export const updateUsageData = (prevData) => {
  const today = new Date().getDay();
  const updatedData = [...prevData];
  updatedData[today].detections += 1;
  return updatedData;
};