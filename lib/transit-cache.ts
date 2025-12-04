export class TransitCache {
  private static CACHE_KEY = 'transit_routes_cache'
  private static CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  static saveRoute(key: string, data: any) {
    if (typeof window === 'undefined') return
    
    const cache = this.getCache()
    cache[key] = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache))
  }

  static getRoute(key: string) {
    if (typeof window === 'undefined') return null
    
    const cache = this.getCache()
    const cached = cache[key]
    
    if (!cached) return null
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      delete cache[key]
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache))
      return null
    }
    
    return cached.data
  }

  private static getCache() {
    if (typeof window === 'undefined') return {}
    
    const cached = localStorage.getItem(this.CACHE_KEY)
    return cached ? JSON.parse(cached) : {}
  }

  static clearCache() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.CACHE_KEY)
  }
}
