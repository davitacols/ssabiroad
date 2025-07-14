// Comprehensive ML Model for Location Recognition (Lightweight Implementation)
export class LocationMLModel {
  private weights: number[];
  private trainingData: TrainingExample[];
  private featureExtractor: FeatureExtractor;

  constructor() {
    this.weights = this.initializeWeights(50); // 50 features
    this.trainingData = [];
    this.featureExtractor = new FeatureExtractor();
    console.log('Initialized lightweight ML model');
  }

  // Initialize random weights
  private initializeWeights(size: number): number[] {
    return Array.from({ length: size }, () => (Math.random() - 0.5) * 0.1);
  }

  // Sigmoid activation function
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  // Predict location accuracy using linear model + sigmoid
  async predict(businessName: string, candidate: any, phoneNumber?: string, address?: string, area?: string): Promise<number> {
    try {
      const features = this.featureExtractor.extract(businessName, candidate, phoneNumber, address, area);
      
      // Compute weighted sum
      let sum = 0;
      for (let i = 0; i < features.length && i < this.weights.length; i++) {
        sum += features[i] * this.weights[i];
      }
      
      // Apply sigmoid activation
      const score = this.sigmoid(sum);
      
      // Ensure minimum threshold for known good patterns
      const boostedScore = this.applyBusinessLogic(businessName, candidate, phoneNumber, address, area, score);
      
      return Math.max(0, Math.min(1, boostedScore));
    } catch (error) {
      console.log('ML prediction failed, using fallback:', error.message);
      return this.fallbackScoring(businessName, candidate, phoneNumber, address, area);
    }
  }

  // Apply business logic boosts
  private applyBusinessLogic(businessName: string, candidate: any, phoneNumber?: string, address?: string, area?: string, baseScore: number): number {
    let score = baseScore;
    const candidateAddr = candidate.formatted_address?.toLowerCase() || '';
    
    // Phone-location consistency boost
    if (phoneNumber) {
      const phoneBoost = this.validatePhone(phoneNumber, candidateAddr);
      if (phoneBoost > 0.8) score += 0.2;
      else if (phoneBoost < 0.2) score -= 0.3;
    }
    
    // Address consistency boost
    if (address) {
      const addressBoost = this.validateAddress(address, candidateAddr);
      if (addressBoost > 0.7) score += 0.15;
    }
    
    // Area consistency boost
    if (area) {
      const areaBoost = this.validateArea(area, candidateAddr);
      if (areaBoost > 0.8) score += 0.1;
    }
    
    return score;
  }

  // Train model with new data (simplified gradient descent)
  async trainWithFeedback(businessName: string, candidate: any, isCorrect: boolean, phoneNumber?: string, address?: string, area?: string) {
    const features = this.featureExtractor.extract(businessName, candidate, phoneNumber, address, area);
    const label = isCorrect ? 1 : 0;
    
    this.trainingData.push({ features, label, timestamp: Date.now() });
    
    // Keep only recent training data (last 100 examples)
    if (this.trainingData.length > 100) {
      this.trainingData = this.trainingData.slice(-100);
    }
    
    // Update weights using simple gradient descent
    this.updateWeights(features, label);
    
    console.log(`ML model updated with feedback: ${businessName} -> ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
  }

  // Simple gradient descent weight update
  private updateWeights(features: number[], label: number) {
    const learningRate = 0.01;
    
    // Compute current prediction
    let prediction = 0;
    for (let i = 0; i < features.length && i < this.weights.length; i++) {
      prediction += features[i] * this.weights[i];
    }
    prediction = this.sigmoid(prediction);
    
    // Compute error
    const error = label - prediction;
    
    // Update weights
    for (let i = 0; i < features.length && i < this.weights.length; i++) {
      this.weights[i] += learningRate * error * features[i] * prediction * (1 - prediction);
    }
  }

  // Fallback scoring when ML fails
  private fallbackScoring(businessName: string, candidate: any, phoneNumber?: string, address?: string, area?: string): number {
    let score = 0.5;
    
    // Phone validation
    if (phoneNumber) {
      score += this.validatePhone(phoneNumber, candidate.formatted_address) * 0.4;
    }
    
    // Address validation
    if (address) {
      score += this.validateAddress(address, candidate.formatted_address) * 0.3;
    }
    
    // Area validation
    if (area) {
      score += this.validateArea(area, candidate.formatted_address) * 0.2;
    }
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  private validatePhone(phone: string, address: string): number {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const addr = address.toUpperCase();
    
    // US phone validation
    if (cleanPhone.length === 10 || (cleanPhone.length === 11 && cleanPhone.startsWith('1'))) {
      const areaCode = cleanPhone.length === 10 ? cleanPhone.substring(0, 3) : cleanPhone.substring(1, 4);
      
      // Florida codes
      if (['305', '321', '352', '386', '407', '561', '727', '754', '772', '786', '813', '850', '863', '904', '941', '954'].includes(areaCode)) {
        return addr.includes('FLORIDA') || addr.includes('FL') ? 1.0 : 0.0;
      }
      
      // Other US codes
      if (parseInt(areaCode) >= 200) {
        return addr.includes('UNITED STATES') || addr.includes('USA') ? 0.9 : 0.0;
      }
    }
    
    // UK phone validation
    if (phone.match(/^((\+44|0)?20|(\+44|0)?7|(\+44|0)?1)/)) {
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

// Feature extraction for ML model
class FeatureExtractor {
  extract(businessName: string, candidate: any, phoneNumber?: string, address?: string, area?: string): number[] {
    const features: number[] = [];
    const candidateAddr = candidate.formatted_address?.toLowerCase() || '';
    const businessLower = businessName.toLowerCase();
    
    // Business name features (10 features)
    features.push(businessLower.length / 50); // Normalized length
    features.push(businessLower.split(' ').length / 10); // Word count
    features.push(businessLower.includes('restaurant') ? 1 : 0);
    features.push(businessLower.includes('coffee') ? 1 : 0);
    features.push(businessLower.includes('bank') ? 1 : 0);
    features.push(businessLower.includes('shop') ? 1 : 0);
    features.push(businessLower.includes('market') ? 1 : 0);
    features.push(businessLower.includes('hotel') ? 1 : 0);
    features.push(/\d/.test(businessLower) ? 1 : 0); // Contains numbers
    features.push(/[&']/.test(businessLower) ? 1 : 0); // Contains special chars
    
    // Phone features (15 features)
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      features.push(1); // Has phone
      features.push(cleanPhone.length / 15); // Normalized length
      features.push(cleanPhone.startsWith('1') ? 1 : 0); // US format
      features.push(cleanPhone.startsWith('44') ? 1 : 0); // UK format
      features.push(cleanPhone.length === 10 ? 1 : 0); // US local format
      
      // Area code analysis
      if (cleanPhone.length >= 3) {
        const areaCode = cleanPhone.length === 10 ? cleanPhone.substring(0, 3) : cleanPhone.substring(1, 4);
        features.push(['305', '561', '954', '786', '813', '407', '321', '727', '850', '904'].includes(areaCode) ? 1 : 0); // Florida
        features.push(['212', '718', '646', '917', '347', '929'].includes(areaCode) ? 1 : 0); // NYC
        features.push(['213', '323', '310', '424', '661', '818', '626', '747'].includes(areaCode) ? 1 : 0); // LA
        features.push(parseInt(areaCode) >= 200 && parseInt(areaCode) <= 999 ? 1 : 0); // Valid US
      } else {
        features.push(0, 0, 0, 0);
      }
      
      // Phone-address consistency
      features.push(candidateAddr.includes('florida') && ['305', '561', '954', '786', '813', '407', '321', '727', '850', '904'].includes(cleanPhone.substring(0, 3)) ? 1 : 0);
      features.push(candidateAddr.includes('new york') && ['212', '718', '646', '917', '347', '929'].includes(cleanPhone.substring(0, 3)) ? 1 : 0);
      features.push(candidateAddr.includes('california') && ['213', '323', '310', '424', '661', '818', '626', '747'].includes(cleanPhone.substring(0, 3)) ? 1 : 0);
      features.push(candidateAddr.includes('uk') && phoneNumber.match(/^((\+44|0)?20|(\+44|0)?7|(\+44|0)?1)/) ? 1 : 0);
      features.push(candidateAddr.includes('london') && phoneNumber.includes('020') ? 1 : 0);
    } else {
      // No phone - fill with zeros
      for (let i = 0; i < 15; i++) features.push(0);
    }
    
    // Address features (10 features)
    if (address) {
      const addrLower = address.toLowerCase();
      features.push(1); // Has address
      features.push(addrLower.length / 100); // Normalized length
      features.push(addrLower.includes('street') || addrLower.includes('st') ? 1 : 0);
      features.push(addrLower.includes('road') || addrLower.includes('rd') ? 1 : 0);
      features.push(addrLower.includes('avenue') || addrLower.includes('ave') ? 1 : 0);
      features.push(addrLower.includes('boulevard') || addrLower.includes('blvd') ? 1 : 0);
      features.push(/\d+/.test(addrLower) ? 1 : 0); // Contains numbers
      
      // Address-candidate consistency
      const streetWords = addrLower.match(/\b\w+\s+(street|st|road|rd|avenue|ave|boulevard|blvd)\b/gi) || [];
      let matches = 0;
      for (const street of streetWords) {
        if (candidateAddr.includes(street.toLowerCase())) matches++;
      }
      features.push(streetWords.length > 0 ? matches / streetWords.length : 0);
      features.push(streetWords.length / 5); // Normalized street count
      features.push(0); // Reserved
    } else {
      for (let i = 0; i < 10; i++) features.push(0);
    }
    
    // Area features (10 features)
    if (area) {
      const areaLower = area.toLowerCase();
      features.push(1); // Has area
      features.push(areaLower.includes('london') ? 1 : 0);
      features.push(areaLower.includes('florida') ? 1 : 0);
      features.push(areaLower.includes('california') ? 1 : 0);
      features.push(areaLower.includes('new york') ? 1 : 0);
      features.push(areaLower.includes('uk') ? 1 : 0);
      features.push(areaLower.includes('usa') ? 1 : 0);
      
      // Area-candidate consistency
      const keywords = areaLower.match(/\b(london|manchester|birmingham|florida|california|texas|new york|chicago|miami)\b/gi) || [];
      let areaMatches = 0;
      for (const keyword of keywords) {
        if (candidateAddr.includes(keyword.toLowerCase())) areaMatches++;
      }
      features.push(keywords.length > 0 ? areaMatches / keywords.length : 0);
      features.push(keywords.length / 5); // Normalized keyword count
      features.push(0); // Reserved
    } else {
      for (let i = 0; i < 10; i++) features.push(0);
    }
    
    // Candidate quality features (5 features)
    features.push(candidateAddr.length / 100); // Address length
    features.push(candidateAddr.split(',').length / 10); // Address components
    features.push(candidateAddr.includes('united states') ? 1 : 0);
    features.push(candidateAddr.includes('united kingdom') ? 1 : 0);
    features.push(candidate.name ? (candidate.name.toLowerCase().includes(businessLower.split(' ')[0]) ? 1 : 0) : 0);
    
    // Ensure exactly 50 features
    while (features.length < 50) features.push(0);
    return features.slice(0, 50);
  }
}

// Training example interface
interface TrainingExample {
  features: number[];
  label: number;
  timestamp: number;
}