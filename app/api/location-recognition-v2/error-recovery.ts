export interface RecoveryStrategy {
  suggestion: string;
  action: string;
  priority: number;
}

export class ErrorRecovery {
  static analyzeFailure(
    result: any,
    imageMetadata?: any
  ): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = [];

    if (!result.success) {
      if (result.method === 'no-location-data') {
        strategies.push({
          suggestion: 'Take a clearer photo of business signage or street address',
          action: 'retake_photo',
          priority: 1
        });
        
        strategies.push({
          suggestion: 'Enable GPS on your device for better accuracy',
          action: 'enable_gps',
          priority: 2
        });
      }

      if (result.method === 'no-text-detected') {
        strategies.push({
          suggestion: 'Move closer to visible text or signs',
          action: 'adjust_distance',
          priority: 1
        });
        
        strategies.push({
          suggestion: 'Ensure good lighting conditions',
          action: 'improve_lighting',
          priority: 2
        });
      }

      if (result.confidence < 0.5) {
        strategies.push({
          suggestion: 'Take multiple photos from different angles',
          action: 'multiple_angles',
          priority: 1
        });
      }
    }

    if (imageMetadata?.blurry) {
      strategies.push({
        suggestion: 'Hold camera steady and tap to focus',
        action: 'reduce_blur',
        priority: 1
      });
    }

    if (imageMetadata?.lowLight) {
      strategies.push({
        suggestion: 'Use flash or find better lighting',
        action: 'improve_lighting',
        priority: 2
      });
    }

    return strategies.sort((a, b) => a.priority - b.priority);
  }

  static generateUserMessage(strategies: RecoveryStrategy[]): string {
    if (strategies.length === 0) {
      return 'Unable to identify location. Please try again.';
    }

    const topSuggestions = strategies.slice(0, 3);
    const messages = topSuggestions.map((s, i) => `${i + 1}. ${s.suggestion}`);
    
    return `To improve results:\n${messages.join('\n')}`;
  }

  static shouldRetryWithAdjustments(
    result: any,
    attemptCount: number
  ): { retry: boolean; adjustments?: any } {
    if (attemptCount >= 3) return { retry: false };

    if (result.confidence < 0.6 && result.method !== 'exif-gps-standard') {
      return {
        retry: true,
        adjustments: {
          increaseTimeout: true,
          useAlternativeAPIs: true,
          expandSearchRadius: true
        }
      };
    }

    return { retry: false };
  }
}
