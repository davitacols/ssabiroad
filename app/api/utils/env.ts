/**
 * Environment variable utilities
 */

// Helper function to get environment variables that works in both local and production
export function getEnv(key: string): string | undefined {
  // For server-side code (API routes)
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[key]
    if (value) return value
  }

  // For client-side code with NEXT_PUBLIC_ prefix
  if (typeof window !== "undefined" && key.startsWith("NEXT_PUBLIC_")) {
    // Try window.__ENV first (for Vercel)
    if ((window as any).__ENV && (window as any).__ENV[key]) {
      return (window as any).__ENV[key]
    }
    // Fallback to direct process.env for Next.js client-side
    if ((window as any).process?.env && (window as any).process.env[key]) {
      return (window as any).process.env[key]
    }
  }

  console.warn(`Environment variable ${key} not found`)
  return undefined
}