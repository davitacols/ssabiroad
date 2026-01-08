// Enhanced ML Model with Ensemble Scoring, Geographic Validation, and Continuous Learning

export class LocationMLModel {
  private weights: number[];
  private trainingData: TrainingExample[];
  private featureExtractor: FeatureExtractor;
  private geoValidator: GeographicValidator;
  private predictionCache: Map<string, CachedPrediction>;
  private ensembleWeights: number[] = [0.4, 0.3, 0.2, 0.1];
  private feedbackQueue: FeedbackItem[] = [];

  constructor() {
    this.weights = this.initializeWeights(50);
    this.trainingData = [];
    this.featureExtractor = new FeatureExtractor();
    this.geoValidator = new GeographicValidator();
    this.predictionCache = new Map();
    console.log('Initialized enhanced ML model with ensemble scoring');
  }

  private initializeWeights(size: number): number[] {
    return Array.from({ length: size }, () => (Math.random() - 0.5) * 0.1);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  // Ensemble prediction combining 4 scoring methods
  async predict(businessName: string, candidate: any, phoneNumber?: string, address?: string, area?: string): Promise<number> {
    const cacheKey = `${businessName}|${candidate.place_id}`;
    const cached = this.predictionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached.score;
    }

    try {
      const scores = [
        await this.predictWithML(businessName, candidate, phoneNumber, address, area),
        await this.predictWithPhoneValidation(phoneNumber, candidate),
        await this.predictWithAddressValidation(address, candidate),
        await this.predictWithGeoValidation(candidate, area)
      ];
      
      const ensembleScore = scores.reduce((sum, score, i) => sum + score * this.ensembleWeights[i], 0);
      const finalScore = Math.max(0, Math.min(1, ensembleScore));
      
      this.predictionCache.set(cacheKey, { score: finalScore, timestamp: Date.now() });
      return finalScore;
    } catch (error) {
      console.log('Ensemble prediction failed, using fallback:', error.message);
      return this.fallbackScoring(businessName, candidate, phoneNumber, address, area);
    }
  }

  private async predictWithML(businessName: string, candidate: any, phoneNumber?: string, address?: string, area?: string): Promise<number> {
    const features = this.featureExtractor.extract(businessName, candidate, phoneNumber, address, area);
    let sum = 0;
    for (let i = 0; i < features.length && i < this.weights.length; i++) {
      sum += features[i] * this.weights[i];
    }
    return this.sigmoid(sum);
  }

  private async predictWithPhoneValidation(phoneNumber: string | undefined, candidate: any): Promise<number> {
    if (!phoneNumber) return 0.5;
    const candidateAddr = candidate.formatted_address?.toLowerCase() || '';
    return this.validatePhone(phoneNumber, candidateAddr);
  }

  private async predictWithAddressValidation(address: string | undefined, candidate: any): Promise<number> {
    if (!address) return 0.5;
    const candidateAddr = candidate.formatted_address?.toLowerCase() || '';
    return this.validateAddress(address, candidateAddr);
  }

  private async predictWithGeoValidation(candidate: any, area?: string): Promise<number> {
    const lat = candidate.geometry?.location?.lat;
    const lng = candidate.geometry?.location?.lng;
    if (!lat || !lng) return 0.5;
    return await this.geoValidator.validateLocation(lat, lng, area);
  }

  async searchSimilar(text: string, limit: number = 5): Promise<Array<{name: string, latitude: number, longitude: number, confidence: number}>> {
    const results: Array<{name: string, latitude: number, longitude: number, confidence: number, similarity: number}> = [];
    
    for (const example of this.trainingData) {
      if (example.label === 1 && example.metadata) {
        const similarity = this.calculateTextSimilarity(text, example.metadata.name);
        if (similarity > 0.3) {
          results.push({
            name: example.metadata.name,
            latitude: example.metadata.latitude,
            longitude: example.metadata.longitude,
            confidence: similarity,
            similarity
          });
        }
      }
    }
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(r => ({ name: r.name, latitude: r.latitude, longitude: r.longitude, confidence: r.confidence }));
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const s1 = text1.toLowerCase();
    const s2 = text2.toLowerCase();
    
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen > 0 ? 1 - (distance / maxLen) : 0;
  }

  // Continuous learning with feedback queue
  async trainWithFeedback(businessName: string, candidate: any, isCorrect: boolean, phoneNumber?: string, address?: string, area?: string) {
    const features = this.featureExtractor.extract(businessName, candidate, phoneNumber, address, area);
    const label = isCorrect ? 1 : 0;
    
    this.trainingData.push({ 
      features, 
      label, 
      timestamp: Date.now(),
      metadata: { name: businessName, latitude: candidate.geometry?.location?.lat, longitude: candidate.geometry?.location?.lng }
    });
    
    // Queue feedback for batch processing
    this.feedbackQueue.push({
      businessName,
      candidate,
      isCorrect,
      timestamp: Date.now()
    });

    if (this.trainingData.length > 100) {
      this.trainingData = this.trainingData.slice(-100);
    }
    
    this.updateWeights(features, label);
    
    // Process feedback queue if it reaches threshold
    if (this.feedbackQueue.length >= 10) {
      await this.processFeedbackQueue();
    }
    
    console.log(`ML model updated: ${businessName} -> ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
  }

  private async processFeedbackQueue() {
    console.log(`Processing feedback queue with ${this.feedbackQueue.length} items`);
    
    // Adjust ensemble weights based on feedback accuracy
    const correctCount = this.feedbackQueue.filter(f => f.isCorrect).length;
    const accuracy = correctCount / this.feedbackQueue.length;
    
    if (accuracy > 0.85) {
      this.ensembleWeights[0] += 0.05; // Boost ML model weight
    } else if (accuracy < 0.7) {
      this.ensembleWeights[0] -= 0.05; // Reduce ML model weight
    }
    
    // Normalize weights
    const sum = this.ensembleWeights.reduce((a, b) => a + b, 0);
    this.ensembleWeights = this.ensembleWeights.map(w => w / sum);
    
    this.feedbackQueue = [];
  }

  private updateWeights(features: number[], label: number) {
    const learningRate = 0.01;
    
    let prediction = 0;
    for (let i = 0; i < features.length && i < this.weights.length; i++) {
      prediction += features[i] * this.weights[i];
    }
    prediction = this.sigmoid(prediction);
    
    const error = label - prediction;
    
    for (let i = 0; i < features.length && i < this.weights.length; i++) {
      this.weights[i] += learningRate * error * features[i] * prediction * (1 - prediction);
    }
  }

  private fallbackScoring(businessName: string, candidate: any, phoneNumber?: string, address?: string, area?: string): number {
    let score = 0.5;
    
    if (phoneNumber) {
      score += this.validatePhone(phoneNumber, candidate.formatted_address) * 0.4;
    }
    
    if (address) {
      score += this.validateAddress(address, candidate.formatted_address) * 0.3;
    }
    
    if (area) {
      score += this.validateArea(area, candidate.formatted_address) * 0.2;
    }
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  private validatePhone(phone: string, address: string): number {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const addr = address.toUpperCase();
    
    if (cleanPhone.length === 10 || (cleanPhone.length === 11 && cleanPhone.startsWith('1'))) {
      const areaCode = cleanPhone.length === 10 ? cleanPhone.substring(0, 3) : cleanPhone.substring(1, 4);
      
      if (['305', '321', '352', '386', '407', '561', '727', '754', '772', '786', '813', '850', '863', '904', '941', '954'].includes(areaCode)) {
        return addr.includes('FLORIDA') || addr.includes('FL') ? 1.0 : 0.0;
      }
      
      if (parseInt(areaCode) >= 200) {
        return addr.includes('UNITED STATES') || addr.includes('USA') ? 0.9 : 0.0;
      }
    }
    
    if (phone.match(/^((\\+44|0)?20|(\\+44|0)?7|(\\+44|0)?1)/)) {
      return addr.includes('UK') || addr.includes('UNITED KINGDOM') || addr.includes('LONDON') ? 1.0 : 0.0;
    }
    
    return 0.5;
  }

  private validateAddress(provided: string, found: string): number {
    const streetWords = provided.toLowerCase().match(/\b\w+\s+(street|st|road|rd|avenue|ave|boulevard|blvd)\b/gi) || [];
    let matches = 0;
    
    for (const street of streetWords) {
      if (found.toLowerCase().includes(street.toLowerCase())) {
        matches++;
      }
    }
    
    return streetWords.length > 0 ? matches / streetWords.length : 0.5;
  }

  private validateArea(provided: string, found: string): number {
    const keywords = provided.toLowerCase().match(/\b(london|manchester|birmingham|florida|california|texas|new york|chicago|miami)\b/gi) || [];
    let matches = 0;
    
    for (const keyword of keywords) {
      if (found.toLowerCase().includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    
    return keywords.length > 0 ? matches / keywords.length : 0.5;
  }
}

// Geographic Validation Layer
export class GeographicValidator {
  private regionBoundaries: Map<string, RegionBoundary> = new Map();

  constructor() {
    this.initializeRegions();
  }

  private initializeRegions() {
    this.regionBoundaries.set('UK', {
      name: 'United Kingdom',
      bounds: { north: 55.8, south: 50.0, east: 2.0, west: -8.0 },
      cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool']
    });
    
    this.regionBoundaries.set('Florida', {
      name: 'Florida, USA',
      bounds: { north: 30.8, south: 24.5, east: -80.0, west: -87.6 },
      cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale']
    });
    
    this.regionBoundaries.set('California', {
      name: 'California, USA',
      bounds: { north: 42.0, south: 32.5, east: -114.1, west: -124.4 },
      cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento']
    });
  }

  async validateLocation(lat: number, lng: number, area?: string): Promise<number> {
    if (!area) return 0.5;

    for (const [key, region] of this.regionBoundaries) {
      if (area.toLowerCase().includes(key.toLowerCase()) || area.toLowerCase().includes(region.name.toLowerCase())) {
        const inBounds = this.isWithinBounds(lat, lng, region.bounds);
        return inBounds ? 0.95 : 0.2;
      }
    }

    return 0.5;
  }

  private isWithinBounds(lat: number, lng: number, bounds: Bounds): boolean {
    return lat >= bounds.south && lat <= bounds.north && 
           lng >= bounds.west && lng <= bounds.east;
  }
}

// Enhanced Feature Extraction
export class FeatureExtractor {
  extract(businessName: string, candidate: any, phoneNumber?: string, address?: string, area?: string): number[] {
    const features: number[] = [];
    const candidateAddr = candidate.formatted_address?.toLowerCase() || '';
    const businessLower = businessName.toLowerCase();
    
    // Business name features (10)
    features.push(businessLower.length / 50);
    features.push(businessLower.split(' ').length / 10);
    features.push(businessLower.includes('restaurant') ? 1 : 0);
    features.push(businessLower.includes('coffee') ? 1 : 0);
    features.push(businessLower.includes('bank') ? 1 : 0);
    features.push(businessLower.includes('shop') ? 1 : 0);
    features.push(businessLower.includes('market') ? 1 : 0);
    features.push(businessLower.includes('hotel') ? 1 : 0);
    features.push(/\d/.test(businessLower) ? 1 : 0);
    features.push(/[&']/.test(businessLower) ? 1 : 0);
    
    // Phone features (15)
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      features.push(1);
      features.push(cleanPhone.length / 15);
      features.push(cleanPhone.startsWith('1') ? 1 : 0);
      features.push(cleanPhone.startsWith('44') ? 1 : 0);
      features.push(cleanPhone.length === 10 ? 1 : 0);
      
      if (cleanPhone.length >= 3) {
        const areaCode = cleanPhone.length === 10 ? cleanPhone.substring(0, 3) : cleanPhone.substring(1, 4);
        features.push(['305', '561', '954', '786', '813', '407', '321', '727', '850', '904'].includes(areaCode) ? 1 : 0);
        features.push(['212', '718', '646', '917', '347', '929'].includes(areaCode) ? 1 : 0);
        features.push(['213', '323', '310', '424', '661', '818', '626', '747'].includes(areaCode) ? 1 : 0);
        features.push(parseInt(areaCode) >= 200 && parseInt(areaCode) <= 999 ? 1 : 0);
      } else {
        features.push(0, 0, 0, 0);
      }
      
      features.push(candidateAddr.includes('florida') && ['305', '561', '954', '786', '813', '407', '321', '727', '850', '904'].includes(cleanPhone.substring(0, 3)) ? 1 : 0);
      features.push(candidateAddr.includes('new york') && ['212', '718', '646', '917', '347', '929'].includes(cleanPhone.substring(0, 3)) ? 1 : 0);
      features.push(candidateAddr.includes('california') && ['213', '323', '310', '424', '661', '818', '626', '747'].includes(cleanPhone.substring(0, 3)) ? 1 : 0);
      features.push(candidateAddr.includes('uk') && phoneNumber.match(/^((\\+44|0)?20|(\\+44|0)?7|(\\+44|0)?1)/) ? 1 : 0);
      features.push(candidateAddr.includes('london') && phoneNumber.includes('020') ? 1 : 0);
    } else {
      for (let i = 0; i < 15; i++) features.push(0);
    }
    
    // Address features (10)
    if (address) {
      const addrLower = address.toLowerCase();
      features.push(1);
      features.push(addrLower.length / 100);
      features.push(addrLower.includes('street') || addrLower.includes('st') ? 1 : 0);
      features.push(addrLower.includes('road') || addrLower.includes('rd') ? 1 : 0);
      features.push(addrLower.includes('avenue') || addrLower.includes('ave') ? 1 : 0);
      features.push(addrLower.includes('boulevard') || addrLower.includes('blvd') ? 1 : 0);
      features.push(/\d+/.test(addrLower) ? 1 : 0);
      
      const streetWords = addrLower.match(/\b\w+\s+(street|st|road|rd|avenue|ave|boulevard|blvd)\b/gi) || [];
      let matches = 0;
      for (const street of streetWords) {
        if (candidateAddr.includes(street.toLowerCase())) matches++;
      }
      features.push(streetWords.length > 0 ? matches / streetWords.length : 0);
      features.push(streetWords.length / 5);
      features.push(0);
    } else {
      for (let i = 0; i < 10; i++) features.push(0);
    }
    
    // Area features (10)
    if (area) {
      const areaLower = area.toLowerCase();
      features.push(1);
      features.push(areaLower.includes('london') ? 1 : 0);
      features.push(areaLower.includes('florida') ? 1 : 0);
      features.push(areaLower.includes('california') ? 1 : 0);
      features.push(areaLower.includes('new york') ? 1 : 0);
      features.push(areaLower.includes('uk') ? 1 : 0);
      features.push(areaLower.includes('usa') ? 1 : 0);
      
      const keywords = areaLower.match(/\b(london|manchester|birmingham|florida|california|texas|new york|chicago|miami)\b/gi) || [];
      let areaMatches = 0;
      for (const keyword of keywords) {
        if (candidateAddr.includes(keyword.toLowerCase())) areaMatches++;
      }
      features.push(keywords.length > 0 ? areaMatches / keywords.length : 0);
      features.push(keywords.length / 5);
      features.push(0);
    } else {
      for (let i = 0; i < 10; i++) features.push(0);
    }
    
    // Candidate quality features (5)
    features.push(candidateAddr.length / 100);
    features.push(candidateAddr.split(',').length / 10);
    features.push(candidateAddr.includes('united states') ? 1 : 0);
    features.push(candidateAddr.includes('united kingdom') ? 1 : 0);
    features.push(candidate.name ? (candidate.name.toLowerCase().includes(businessLower.split(' ')[0]) ? 1 : 0) : 0);
    
    while (features.length < 50) features.push(0);
    return features.slice(0, 50);
  }
}

// Type definitions
export interface TrainingExample {
  features: number[];
  label: number;
  timestamp: number;
  metadata?: { name: string; latitude: number; longitude: number };
}

export interface CachedPrediction {
  score: number;
  timestamp: number;
}

export interface FeedbackItem {
  businessName: string;
  candidate: any;
  isCorrect: boolean;
  timestamp: number;
}

export interface RegionBoundary {
  name: string;
  bounds: Bounds;
  cities: string[];
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
