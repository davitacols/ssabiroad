import { 
  RekognitionClient, 
  DetectLabelsCommand, 
  DetectTextCommand,
  DetectFacesCommand,
  RecognizeCelebritiesCommand 
} from '@aws-sdk/client-rekognition';
import { rekognitionClient } from './aws-config';

export interface RekognitionAnalysis {
  labels: Array<{
    name: string;
    confidence: number;
    categories?: string[];
  }>;
  text: Array<{
    text: string;
    confidence: number;
    boundingBox?: any;
  }>;
  businessInfo: {
    businessNames: string[];
    signText: string[];
    buildingTypes: string[];
    confidence: number;
  };
  locationClues: {
    landmarks: string[];
    architecture: string[];
    streetSigns: string[];
    addresses: string[];
  };
}

export class RekognitionService {
  private client: RekognitionClient;

  constructor() {
    this.client = rekognitionClient;
  }

  async analyzeImage(imageBuffer: Buffer): Promise<RekognitionAnalysis> {
    try {
      const [labelsResult, textResult] = await Promise.all([
        this.detectLabels(imageBuffer),
        this.detectText(imageBuffer)
      ]);

      const labels = this.processLabels(labelsResult.Labels || []);
      const text = this.processText(textResult.TextDetections || []);
      
      return {
        labels,
        text,
        businessInfo: this.extractBusinessInfo(labels, text),
        locationClues: this.extractLocationClues(labels, text)
      };
    } catch (error) {
      console.error('Rekognition analysis failed:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  private async detectLabels(imageBuffer: Buffer) {
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBuffer },
      MaxLabels: 50,
      MinConfidence: 60,
      Features: ['GENERAL_LABELS', 'IMAGE_PROPERTIES']
    });
    return await this.client.send(command);
  }

  private async detectText(imageBuffer: Buffer) {
    const command = new DetectTextCommand({
      Image: { Bytes: imageBuffer },
      Filters: {
        WordFilter: {
          MinConfidence: 70
        }
      }
    });
    return await this.client.send(command);
  }

  private processLabels(labels: any[]) {
    return labels.map(label => ({
      name: label.Name,
      confidence: Math.round(label.Confidence),
      categories: label.Categories?.map((cat: any) => cat.Name) || []
    }));
  }

  private processText(textDetections: any[]) {
    return textDetections
      .filter(text => text.Type === 'LINE')
      .map(text => ({
        text: text.DetectedText,
        confidence: Math.round(text.Confidence),
        boundingBox: text.Geometry?.BoundingBox
      }));
  }

  private extractBusinessInfo(labels: any[], text: any[]) {
    const businessLabels = [
      'Restaurant', 'Store', 'Shop', 'Building', 'Office Building',
      'Hotel', 'Bank', 'Hospital', 'School', 'Church', 'Mall',
      'Gas Station', 'Pharmacy', 'Supermarket', 'Cafe', 'Bar'
    ];

    const buildingTypes = labels
      .filter(label => businessLabels.some(bl => label.name.includes(bl)))
      .map(label => label.name);

    const businessNames = text
      .filter(t => this.isLikelyBusinessName(t.text))
      .map(t => t.text);

    const signText = text
      .filter(t => t.confidence > 80 && t.text.length > 2)
      .map(t => t.text);

    return {
      businessNames,
      signText,
      buildingTypes,
      confidence: Math.max(...buildingTypes.map(bt => 
        labels.find(l => l.name === bt)?.confidence || 0
      ), 0)
    };
  }

  private extractLocationClues(labels: any[], text: any[]) {
    const landmarkLabels = ['Monument', 'Landmark', 'Tower', 'Bridge', 'Statue'];
    const architectureLabels = ['Architecture', 'Gothic', 'Modern', 'Classical'];
    
    const landmarks = labels
      .filter(label => landmarkLabels.some(ll => label.name.includes(ll)))
      .map(label => label.name);

    const architecture = labels
      .filter(label => architectureLabels.some(al => label.name.includes(al)))
      .map(label => label.name);

    const streetSigns = text
      .filter(t => this.isLikelyStreetSign(t.text))
      .map(t => t.text);

    const addresses = text
      .filter(t => this.isLikelyAddress(t.text))
      .map(t => t.text);

    return {
      landmarks,
      architecture,
      streetSigns,
      addresses
    };
  }

  private isLikelyBusinessName(text: string): boolean {
    const businessIndicators = [
      /\b(ltd|llc|inc|corp|co\.)\b/i,
      /\b(restaurant|cafe|shop|store|hotel|bank)\b/i,
      /^[A-Z][a-z]+ [A-Z][a-z]+$/,
      /\b(the|&)\b/i
    ];
    return businessIndicators.some(pattern => pattern.test(text));
  }

  private isLikelyStreetSign(text: string): boolean {
    const streetPatterns = [
      /\b(street|st|avenue|ave|road|rd|lane|ln|drive|dr|way|blvd|boulevard)\b/i,
      /\b(north|south|east|west|n|s|e|w)\b/i,
      /^\d+\s+[A-Za-z]/
    ];
    return streetPatterns.some(pattern => pattern.test(text));
  }

  private isLikelyAddress(text: string): boolean {
    const addressPatterns = [
      /^\d+\s+[A-Za-z\s]+(street|st|avenue|ave|road|rd)/i,
      /\b\d{5}(-\d{4})?\b/,
      /\b[A-Z]{2}\s+\d{5}\b/
    ];
    return addressPatterns.some(pattern => pattern.test(text));
  }
}

export const rekognitionService = new RekognitionService();