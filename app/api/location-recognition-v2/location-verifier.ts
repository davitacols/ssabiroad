// Multi-source location verification system
interface VerificationSource {
  name: string;
  location: { latitude: number; longitude: number };
  address: string;
  confidence: number;
  lastUpdated: Date;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  consensusLocation: { latitude: number; longitude: number };
  consensusAddress: string;
  sources: VerificationSource[];
  warnings: string[];
  alternatives: Array<{
    address: string;
    confidence: number;
    reason: string;
  }>;
}

export class LocationVerifier {
  private static readonly CONSENSUS_RADIUS = 100; // meters
  private static readonly MIN_SOURCES = 2;
  
  // Verify location using multiple sources
  static async verifyLocation(businessName: string, primaryResult: any): Promise<VerificationResult> {
    const sources: VerificationSource[] = [];
    
    // Collect from multiple sources
    const [googleResult, bingResult, foursquareResult] = await Promise.allSettled([
      this.searchGoogle(businessName),
      this.searchBing(businessName),
      this.searchFoursquare(businessName)
    ]);
    
    if (googleResult.status === 'fulfilled' && googleResult.value) {
      sources.push({
        name: 'Google Places',
        location: googleResult.value.location,
        address: googleResult.value.address,
        confidence: googleResult.value.confidence,
        lastUpdated: new Date()
      });
    }
    
    if (bingResult.status === 'fulfilled' && bingResult.value) {
      sources.push({
        name: 'Bing Maps',
        location: bingResult.value.location,
        address: bingResult.value.address,
        confidence: bingResult.value.confidence,
        lastUpdated: new Date()
      });
    }
    
    // Add primary result as a source
    sources.push({
      name: primaryResult.method,
      location: primaryResult.location,
      address: primaryResult.address,
      confidence: primaryResult.confidence,
      lastUpdated: new Date()
    });
    
    return this.findConsensus(sources);
  }
  
  // Find consensus among sources
  private static findConsensus(sources: VerificationSource[]): VerificationResult {
    if (sources.length < this.MIN_SOURCES) {
      return {
        verified: false,
        confidence: 0.3,
        consensusLocation: sources[0]?.location || { latitude: 0, longitude: 0 },
        consensusAddress: sources[0]?.address || '',
        sources,
        warnings: ['Insufficient sources for verification'],
        alternatives: []
      };
    }
    
    // Group sources by proximity
    const clusters = this.clusterByProximity(sources);
    const largestCluster = clusters.reduce((max, cluster) => 
      cluster.length > max.length ? cluster : max
    );
    
    if (largestCluster.length >= this.MIN_SOURCES) {
      const avgLocation = this.calculateCentroid(largestCluster);
      const bestSource = largestCluster.reduce((best, source) => 
        source.confidence > best.confidence ? source : best
      );
      
      return {
        verified: true,
        confidence: Math.min(0.95, largestCluster.length * 0.2 + bestSource.confidence),
        consensusLocation: avgLocation,
        consensusAddress: bestSource.address,
        sources: largestCluster,
        warnings: this.generateWarnings(largestCluster, clusters),
        alternatives: this.generateAlternatives(clusters, largestCluster)
      };
    }
    
    return {
      verified: false,
      confidence: 0.5,
      consensusLocation: sources[0].location,
      consensusAddress: sources[0].address,
      sources,
      warnings: ['Sources disagree on location'],
      alternatives: this.generateAlternatives(clusters, [])
    };
  }
  
  // Cluster sources by geographic proximity
  private static clusterByProximity(sources: VerificationSource[]): VerificationSource[][] {
    const clusters: VerificationSource[][] = [];
    
    for (const source of sources) {
      let addedToCluster = false;
      
      for (const cluster of clusters) {
        const distance = this.calculateDistance(
          source.location,
          cluster[0].location
        );
        
        if (distance <= this.CONSENSUS_RADIUS) {
          cluster.push(source);
          addedToCluster = true;
          break;
        }
      }
      
      if (!addedToCluster) {
        clusters.push([source]);
      }
    }
    
    return clusters;
  }
  
  // Calculate centroid of locations
  private static calculateCentroid(sources: VerificationSource[]): { latitude: number; longitude: number } {
    const sum = sources.reduce(
      (acc, source) => ({
        latitude: acc.latitude + source.location.latitude,
        longitude: acc.longitude + source.location.longitude
      }),
      { latitude: 0, longitude: 0 }
    );
    
    return {
      latitude: sum.latitude / sources.length,
      longitude: sum.longitude / sources.length
    };
  }
  
  // Calculate distance between two points
  private static calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  // Generate warnings based on verification results
  private static generateWarnings(consensus: VerificationSource[], allClusters: VerificationSource[][]): string[] {
    const warnings: string[] = [];
    
    if (consensus.length === 2) {
      warnings.push('Only 2 sources agree - location may need additional verification');
    }
    
    if (allClusters.length > 1) {
      warnings.push('Multiple possible locations found - please verify');
    }
    
    const oldSources = consensus.filter(s => 
      Date.now() - s.lastUpdated.getTime() > 30 * 24 * 60 * 60 * 1000
    );
    if (oldSources.length > 0) {
      warnings.push('Some location data may be outdated');
    }
    
    return warnings;
  }
  
  // Generate alternative location suggestions
  private static generateAlternatives(
    allClusters: VerificationSource[][],
    consensusCluster: VerificationSource[]
  ): Array<{ address: string; confidence: number; reason: string }> {
    return allClusters
      .filter(cluster => cluster !== consensusCluster)
      .map(cluster => {
        const bestSource = cluster.reduce((best, source) => 
          source.confidence > best.confidence ? source : best
        );
        return {
          address: bestSource.address,
          confidence: bestSource.confidence,
          reason: `Alternative location (${cluster.length} source${cluster.length > 1 ? 's' : ''})`
        };
      })
      .slice(0, 3);
  }
  
  // Search Google Places (simplified)
  private static async searchGoogle(businessName: string): Promise<any> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return null;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(businessName)}&inputtype=textquery&fields=geometry,formatted_address&key=${apiKey}`
      );
      
      const data = await response.json();
      const place = data.candidates?.[0];
      
      if (place?.geometry?.location) {
        return {
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          address: place.formatted_address,
          confidence: 0.8
        };
      }
    } catch (error) {
      console.log('Google search failed:', error.message);
    }
    
    return null;
  }
  
  // Search Bing Maps (placeholder)
  private static async searchBing(businessName: string): Promise<any> {
    // Placeholder for Bing Maps API integration
    return null;
  }
  
  // Search Foursquare (placeholder)
  private static async searchFoursquare(businessName: string): Promise<any> {
    // Placeholder for Foursquare API integration
    return null;
  }
}