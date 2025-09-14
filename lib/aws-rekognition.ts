import { RekognitionClient, DetectLabelsCommand, DetectTextCommand } from '@aws-sdk/client-rekognition';
import sharp from 'sharp';

export class AWSRekognitionService {
  private client: RekognitionClient;

  constructor() {
    this.client = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async analyzeImage(buffer: Buffer) {
    try {
      // Convert to JPEG if needed
      const processedBuffer = await this.convertToJpeg(buffer);
      
      const [labels, text] = await Promise.all([
        this.detectLabels(processedBuffer),
        this.detectText(processedBuffer),
      ]);

      return {
        success: true,
        labels: labels.Labels || [],
        text: text.TextDetections || [],
        businessClues: this.extractBusinessClues(labels.Labels || [], text.TextDetections || []),
      };
    } catch (error) {
      console.error('AWS Rekognition failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async convertToJpeg(buffer: Buffer): Promise<Buffer> {
    try {
      // Check if already JPEG
      if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
        return buffer;
      }
      
      // Convert to JPEG using Sharp
      console.log('Converting image to JPEG for Rekognition...');
      const jpegBuffer = await sharp(buffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      
      console.log(`Image converted: ${buffer.length} -> ${jpegBuffer.length} bytes`);
      return jpegBuffer;
    } catch (error) {
      console.error('Image conversion failed:', error);
      return buffer; // Return original if conversion fails
    }
  }

  private async detectLabels(buffer: Buffer) {
    try {
      const command = new DetectLabelsCommand({
        Image: { Bytes: buffer },
        MaxLabels: 20,
        MinConfidence: 70,
      });
      return await this.client.send(command);
    } catch (error) {
      console.error('Rekognition detectLabels failed:', error);
      return { Labels: [] };
    }
  }

  private async detectText(buffer: Buffer) {
    try {
      const command = new DetectTextCommand({
        Image: { Bytes: buffer },
      });
      return await this.client.send(command);
    } catch (error) {
      console.error('Rekognition detectText failed:', error);
      return { TextDetections: [] };
    }
  }

  private extractBusinessClues(labels: any[], textDetections: any[]) {
    const businessKeywords = ['Restaurant', 'Store', 'Shop', 'Building', 'Sign'];
    const relevantLabels = labels.filter(label => 
      businessKeywords.some(keyword => label.Name.includes(keyword))
    );

    const businessText = textDetections
      .filter(text => text.Type === 'LINE' && text.Confidence > 80)
      .map(text => text.DetectedText);

    return {
      businessLabels: relevantLabels,
      signText: businessText,
      confidence: Math.max(...relevantLabels.map(l => l.Confidence), 0),
    };
  }
}