import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FranchiseFeatures {
  colors: string[];
  architecturalStyle: string;
  signagePattern: string;
  logoElements: string[];
}

export class FranchiseDetector {
  private static franchisePatterns = {
    'mcdonalds': { colors: ['red', 'yellow'], keywords: ['golden arches', 'im lovin it'] },
    'starbucks': { colors: ['green', 'white'], keywords: ['siren', 'coffee'] },
    'subway': { colors: ['yellow', 'green'], keywords: ['eat fresh', 'sandwich'] },
    'fortune cookie': { colors: ['red', 'gold'], keywords: ['chinese', 'takeaway'] }
  };

  static async detectFranchise(
    businessName: string,
    visualFeatures: any,
    phoneNumber?: string,
    address?: string
  ): Promise<{ isFranchise: boolean; franchiseId?: string; confidence: number }> {
    const nameLower = businessName.toLowerCase();
    
    for (const [franchise, pattern] of Object.entries(this.franchisePatterns)) {
      if (nameLower.includes(franchise)) {
        const confidence = this.calculateFranchiseConfidence(
          businessName,
          visualFeatures,
          pattern
        );
        
        return {
          isFranchise: true,
          franchiseId: franchise,
          confidence
        };
      }
    }

    return { isFranchise: false, confidence: 0 };
  }

  private static calculateFranchiseConfidence(
    businessName: string,
    visualFeatures: any,
    pattern: any
  ): number {
    let score = 0.5;

    if (visualFeatures?.colors) {
      const matchingColors = pattern.colors.filter((c: string) =>
        visualFeatures.colors.some((vc: string) => vc.toLowerCase().includes(c))
      );
      score += (matchingColors.length / pattern.colors.length) * 0.3;
    }

    if (visualFeatures?.text) {
      const hasKeywords = pattern.keywords.some((k: string) =>
        visualFeatures.text.toLowerCase().includes(k)
      );
      if (hasKeywords) score += 0.2;
    }

    return Math.min(0.95, score);
  }

  static async findNearestFranchiseLocation(
    franchiseId: string,
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<any> {
    const locations = await prisma.knownLocation.findMany({
      where: { franchiseId },
      take: 10
    });

    let nearest = null;
    let minDistance = Infinity;

    for (const loc of locations) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        loc.latitude,
        loc.longitude
      );

      if (distance < minDistance && distance < radius) {
        minDistance = distance;
        nearest = loc;
      }
    }

    return nearest ? { ...nearest, distance: minDistance } : null;
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
