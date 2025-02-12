export function updateStats(prevStats, result) {
    return {
      ...prevStats,
      totalDetections: prevStats.totalDetections + 1,
      detectionAccuracy: Math.round(
        (prevStats.detectionAccuracy * prevStats.totalDetections + result.confidence * 100) /
          (prevStats.totalDetections + 1),
      ),
    }
  }
  
  export function addRecentDetection(prevDetections, result) {
    const newDetection = {
      id: Date.now(),
      building: result.description || "Unknown Building",
      time: "Just now",
      confidence: result.confidence,
      imageUrl: result.imageUrl,
    }
    return [newDetection, ...prevDetections.slice(0, 4)]
  }
  
  export function updateUsageData(prevData) {
    const today = new Date().getDay()
    return prevData.map((item, index) => (index === today ? { ...item, detections: item.detections + 1 } : item))
  }
  
  