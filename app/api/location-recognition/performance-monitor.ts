/**
 * Performance Monitor for Location Recognition API
 * 
 * This module provides tools to monitor and optimize the performance
 * of the location recognition API.
 */

// Store performance metrics
const metrics: Record<string, number[]> = {
  totalTime: [],
  visionApiTime: [],
  geocodingTime: [],
  businessSearchTime: [],
  databaseTime: []
};

// Maximum number of samples to keep
const MAX_SAMPLES = 100;

/**
 * Record a timing metric
 * @param category The category of the metric
 * @param time The time in milliseconds
 */
export function recordTiming(category: string, time: number): void {
  if (!metrics[category]) {
    metrics[category] = [];
  }
  
  metrics[category].push(time);
  
  // Keep only the most recent samples
  if (metrics[category].length > MAX_SAMPLES) {
    metrics[category].shift();
  }
}

/**
 * Get average timing for a category
 * @param category The category to get average for
 * @returns The average time in milliseconds
 */
export function getAverageTiming(category: string): number {
  if (!metrics[category] || metrics[category].length === 0) {
    return 0;
  }
  
  const sum = metrics[category].reduce((a, b) => a + b, 0);
  return sum / metrics[category].length;
}

/**
 * Get all performance metrics
 * @returns Object with average timings for all categories
 */
export function getAllMetrics(): Record<string, number> {
  const result: Record<string, number> = {};
  
  for (const category in metrics) {
    result[category] = getAverageTiming(category);
  }
  
  return result;
}

/**
 * Time a function execution
 * @param category The category to record the timing under
 * @param fn The function to time
 * @returns The result of the function
 */
export async function timeExecution<T>(category: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    recordTiming(category, duration);
  }
}

/**
 * Get performance recommendations based on metrics
 * @returns Array of recommendations to improve performance
 */
export function getRecommendations(): string[] {
  const recommendations: string[] = [];
  const metrics = getAllMetrics();
  
  if (metrics.visionApiTime > 5000) {
    recommendations.push("Vision API calls are slow. Consider enabling fast mode or reducing image resolution.");
  }
  
  if (metrics.geocodingTime > 3000) {
    recommendations.push("Geocoding is slow. Consider expanding the business database for faster lookups.");
  }
  
  if (metrics.totalTime > 10000) {
    recommendations.push("Overall processing is slow. Consider disabling non-essential features in config.ts.");
  }
  
  return recommendations;
}