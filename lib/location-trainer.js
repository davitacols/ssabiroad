import fs from 'fs';

class LocationTrainer {
  constructor() {
    this.trainingData = this.loadTrainingData();
    this.patterns = new Map();
  }

  loadTrainingData() {
    try {
      return JSON.parse(fs.readFileSync('training-data.json', 'utf8'));
    } catch {
      return { queries: [], results: [], feedback: [] };
    }
  }

  saveTrainingData() {
    fs.writeFileSync('training-data.json', JSON.stringify(this.trainingData, null, 2));
  }

  // Learn from successful queries
  recordSuccess(query, result, provider) {
    this.trainingData.queries.push({
      query,
      result,
      provider,
      timestamp: Date.now(),
      success: true
    });
    this.updatePatterns(query, provider);
    this.saveTrainingData();
  }

  // Learn from user feedback
  recordFeedback(query, result, isCorrect) {
    this.trainingData.feedback.push({
      query,
      result,
      isCorrect,
      timestamp: Date.now()
    });
    this.saveTrainingData();
  }

  updatePatterns(query, bestProvider) {
    const pattern = this.extractPattern(query);
    if (!this.patterns.has(pattern)) {
      this.patterns.set(pattern, { providers: {}, count: 0 });
    }
    
    const patternData = this.patterns.get(pattern);
    patternData.providers[bestProvider] = (patternData.providers[bestProvider] || 0) + 1;
    patternData.count++;
  }

  extractPattern(query) {
    if (/^\d{5}(-\d{4})?$/.test(query)) return 'zipcode';
    if (/\d+\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|boulevard)/i.test(query)) return 'address';
    if (/\b(restaurant|store|hotel|business|shop|cafe)\b/i.test(query)) return 'business';
    if (/\b(park|school|hospital|church|library)\b/i.test(query)) return 'poi';
    return 'general';
  }

  // Get optimal provider based on learned patterns
  getOptimalProvider(query) {
    const pattern = this.extractPattern(query);
    const patternData = this.patterns.get(pattern);
    
    if (patternData && patternData.count > 5) {
      const bestProvider = Object.entries(patternData.providers)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      if (bestProvider) return bestProvider;
    }

    // Fallback to rule-based
    if (pattern === 'zipcode') return 'geocodio';
    if (pattern === 'business' || pattern === 'poi') return 'places';
    return 'maps';
  }

  // Get confidence score based on historical data
  getConfidenceScore(query, provider) {
    const pattern = this.extractPattern(query);
    const patternData = this.patterns.get(pattern);
    
    if (!patternData) return 0.5;
    
    const providerSuccess = patternData.providers[provider] || 0;
    return Math.min(0.95, providerSuccess / patternData.count);
  }
}

export const trainer = new LocationTrainer();