import * as vision from '@google-cloud/vision';

interface SceneFeatures {
  dominantColors: string[];
  buildingMaterial: string | null;
  architecturalStyle: string | null;
  signagePresent: boolean;
  windowStyle: string | null;
  roofType: string | null;
  adjacentBusinesses: string[];
  streetFurniture: string[];
  estimatedAge: 'modern' | 'historic' | 'mixed' | null;
}

interface ValidationResult {
  isMatch: boolean;
  confidence: number;
  matchedFeatures: string[];
  mismatchedFeatures: string[];
  reasoning: string;
}

export class SceneValidator {
  /**
   * Extract visual scene features from image for location validation
   */
  static async extractSceneFeatures(buffer: Buffer, client: vision.ImageAnnotatorClient): Promise<SceneFeatures> {
    try {
      const [labelResult, objectResult] = await Promise.all([
        client.labelDetection({ image: { content: buffer }, maxResults: 25 }),
        client.localizedObjectAnnotations({ image: { content: buffer } })
      ]);

      const labels = labelResult.labelAnnotations || [];
      const objects = objectResult.localizedObjectAnnotations || [];

      const features: SceneFeatures = {
        dominantColors: [],
        buildingMaterial: null,
        architecturalStyle: null,
        signagePresent: false,
        windowStyle: null,
        roofType: null,
        adjacentBusinesses: [],
        streetFurniture: [],
        estimatedAge: null
      };

      // Extract colors
      const colorLabels = ['Red', 'Blue', 'Green', 'Yellow', 'White', 'Black', 'Brown', 'Gray', 'Pink', 'Orange', 'Purple', 'Beige', 'Cream'];
      for (const label of labels) {
        if (colorLabels.includes(label.description) && label.score > 0.6) {
          features.dominantColors.push(label.description);
        }
      }

      // Extract building material
      const materialLabels = ['Brick', 'Stone', 'Glass', 'Metal', 'Wood', 'Concrete', 'Tile', 'Marble', 'Granite', 'Sandstone'];
      for (const label of labels) {
        if (materialLabels.includes(label.description) && label.score > 0.7) {
          features.buildingMaterial = label.description;
          break;
        }
      }

      // Extract architectural style
      const styleLabels = ['Victorian', 'Georgian', 'Edwardian', 'Modern', 'Contemporary', 'Art Deco', 'Gothic', 'Baroque', 'Neoclassical', 'Brutalist'];
      for (const label of labels) {
        if (styleLabels.includes(label.description) && label.score > 0.7) {
          features.architecturalStyle = label.description;
          break;
        }
      }

      // Check for signage
      const signageLabels = ['Sign', 'Signage', 'Text', 'Logo', 'Brand', 'Storefront'];
      features.signagePresent = labels.some(l => signageLabels.includes(l.description) && l.score > 0.6);

      // Extract window style
      const windowLabels = ['Window', 'Glass', 'Transparent', 'Reflective'];
      for (const label of labels) {
        if (windowLabels.includes(label.description) && label.score > 0.6) {
          features.windowStyle = label.description;
          break;
        }
      }

      // Extract roof type
      const roofLabels = ['Roof', 'Pitched', 'Flat', 'Mansard', 'Gable', 'Dome'];
      for (const label of labels) {
        if (roofLabels.includes(label.description) && label.score > 0.6) {
          features.roofType = label.description;
          break;
        }
      }

      // Extract adjacent businesses
      const businessLabels = ['Shop', 'Store', 'Restaurant', 'Cafe', 'Bank', 'Office', 'Pharmacy', 'Salon', 'Supermarket', 'Market'];
      for (const label of labels) {
        if (businessLabels.includes(label.description) && label.score > 0.6) {
          features.adjacentBusinesses.push(label.description);
        }
      }

      // Extract street furniture (UK-specific indicators)
      const furnitureLabels = ['Street light', 'Traffic light', 'Bench', 'Post box', 'Phone booth', 'Bollard', 'Lamppost'];
      for (const label of labels) {
        if (furnitureLabels.includes(label.description) && label.score > 0.6) {
          features.streetFurniture.push(label.description);
        }
      }

      // Estimate building age
      if (features.architecturalStyle && ['Victorian', 'Georgian', 'Edwardian', 'Gothic'].includes(features.architecturalStyle)) {
        features.estimatedAge = 'historic';
      } else if (features.architecturalStyle && ['Modern', 'Contemporary', 'Brutalist'].includes(features.architecturalStyle)) {
        features.estimatedAge = 'modern';
      } else if (features.buildingMaterial === 'Brick' && features.architecturalStyle === null) {
        features.estimatedAge = 'mixed';
      }

      console.log('Extracted scene features:', features);
      return features;
    } catch (error) {
      console.error('Scene feature extraction failed:', error);
      return {
        dominantColors: [],
        buildingMaterial: null,
        architecturalStyle: null,
        signagePresent: false,
        windowStyle: null,
        roofType: null,
        adjacentBusinesses: [],
        streetFurniture: [],
        estimatedAge: null
      };
    }
  }

  /**
   * Quick validation of candidate against scene features
   */
  static validateCandidateWithScene(candidate: any, sceneFeatures: SceneFeatures): boolean {
    if (!sceneFeatures) return true;
    
    const address = candidate.formatted_address?.toLowerCase() || '';
    
    // UK street furniture indicates UK location
    if (sceneFeatures.streetFurniture?.length > 0) {
      const hasUKFurniture = sceneFeatures.streetFurniture.some(f => 
        ['Post box', 'Phone booth', 'Bollard'].includes(f)
      );
      
      if (hasUKFurniture && !address.includes('uk') && !address.includes('london')) {
        return false;
      }
    }
    
    // Architectural style consistency
    if (sceneFeatures.architecturalStyle === 'Victorian' || sceneFeatures.architecturalStyle === 'Georgian') {
      if (!address.includes('london') && !address.includes('uk')) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate that a search result matches the scene in the image
   */
  static async validateLocationMatch(
    imageFeatures: SceneFeatures,
    searchResult: any,
    businessName: string,
    client: vision.ImageAnnotatorClient
  ): Promise<ValidationResult> {
    const matchedFeatures: string[] = [];
    const mismatchedFeatures: string[] = [];

    // Check 1: UK-specific street furniture indicates UK location
    if (imageFeatures.streetFurniture.length > 0) {
      const hasUKFurniture = imageFeatures.streetFurniture.some(f => 
        ['Post box', 'Phone booth', 'Bollard'].includes(f)
      );
      
      if (hasUKFurniture) {
        const addressUpper = searchResult.formatted_address?.toUpperCase() || '';
        if (addressUpper.includes('UK') || addressUpper.includes('UNITED KINGDOM') || addressUpper.includes('LONDON')) {
          matchedFeatures.push('UK street furniture matches UK location');
        } else {
          mismatchedFeatures.push('UK street furniture but non-UK location');
          return {
            isMatch: false,
            confidence: 0.1,
            matchedFeatures,
            mismatchedFeatures,
            reasoning: 'Image shows UK street furniture but search result is not in UK'
          };
        }
      }
    }

    // Check 2: Architectural style consistency
    if (imageFeatures.architecturalStyle) {
      const addressUpper = searchResult.formatted_address?.toUpperCase() || '';
      
      if (imageFeatures.architecturalStyle === 'Victorian' || imageFeatures.architecturalStyle === 'Georgian') {
        if (addressUpper.includes('LONDON') || addressUpper.includes('UK')) {
          matchedFeatures.push(`${imageFeatures.architecturalStyle} architecture matches UK location`);
        } else {
          mismatchedFeatures.push(`${imageFeatures.architecturalStyle} architecture but non-UK location`);
        }
      }
    }

    // Check 3: Building material consistency
    if (imageFeatures.buildingMaterial === 'Brick') {
      // Brick buildings are common in UK
      const addressUpper = searchResult.formatted_address?.toUpperCase() || '';
      if (addressUpper.includes('LONDON') || addressUpper.includes('UK')) {
        matchedFeatures.push('Brick building matches UK location');
      }
    }

    // Check 4: Adjacent businesses consistency
    if (imageFeatures.adjacentBusinesses.length > 0) {
      // This would require checking Google Places nearby for the search result
      // For now, just note that we detected adjacent businesses
      matchedFeatures.push(`Detected ${imageFeatures.adjacentBusinesses.length} adjacent business types`);
    }

    // Check 5: Signage presence
    if (imageFeatures.signagePresent) {
      matchedFeatures.push('Storefront signage visible');
    }

    // Calculate confidence based on matched features
    const totalChecks = 5;
    const matchScore = matchedFeatures.length / totalChecks;
    const mismatchPenalty = mismatchedFeatures.length * 0.3;
    const confidence = Math.max(0, Math.min(1, matchScore - mismatchPenalty));

    const isMatch = confidence > 0.6 && mismatchedFeatures.length === 0;

    return {
      isMatch,
      confidence,
      matchedFeatures,
      mismatchedFeatures,
      reasoning: isMatch 
        ? `Scene analysis confirms location match (${(confidence * 100).toFixed(0)}% confidence)`
        : `Scene analysis suggests location mismatch: ${mismatchedFeatures.join(', ')}`
    };
  }

  /**
   * Compare two images to determine if they show the same location
   */
  static async compareLocations(
    buffer1: Buffer,
    buffer2: Buffer,
    client: vision.ImageAnnotatorClient
  ): Promise<{ isSameLocation: boolean; confidence: number; differences: string[] }> {
    try {
      const features1 = await this.extractSceneFeatures(buffer1, client);
      const features2 = await this.extractSceneFeatures(buffer2, client);

      const differences: string[] = [];
      let matchingFeatures = 0;
      let totalFeatures = 0;

      // Compare colors
      totalFeatures++;
      if (features1.dominantColors.length > 0 && features2.dominantColors.length > 0) {
        const commonColors = features1.dominantColors.filter(c => features2.dominantColors.includes(c));
        if (commonColors.length > 0) {
          matchingFeatures++;
        } else {
          differences.push(`Color mismatch: ${features1.dominantColors[0]} vs ${features2.dominantColors[0]}`);
        }
      }

      // Compare building material
      totalFeatures++;
      if (features1.buildingMaterial === features2.buildingMaterial && features1.buildingMaterial) {
        matchingFeatures++;
      } else if (features1.buildingMaterial && features2.buildingMaterial) {
        differences.push(`Material mismatch: ${features1.buildingMaterial} vs ${features2.buildingMaterial}`);
      }

      // Compare architectural style
      totalFeatures++;
      if (features1.architecturalStyle === features2.architecturalStyle && features1.architecturalStyle) {
        matchingFeatures++;
      } else if (features1.architecturalStyle && features2.architecturalStyle) {
        differences.push(`Style mismatch: ${features1.architecturalStyle} vs ${features2.architecturalStyle}`);
      }

      // Compare signage
      totalFeatures++;
      if (features1.signagePresent === features2.signagePresent) {
        matchingFeatures++;
      } else {
        differences.push(`Signage mismatch: ${features1.signagePresent} vs ${features2.signagePresent}`);
      }

      // Compare window style
      totalFeatures++;
      if (features1.windowStyle === features2.windowStyle && features1.windowStyle) {
        matchingFeatures++;
      }

      const confidence = totalFeatures > 0 ? matchingFeatures / totalFeatures : 0;
      const isSameLocation = confidence > 0.7 && differences.length < 2;

      return { isSameLocation, confidence, differences };
    } catch (error) {
      console.error('Location comparison failed:', error);
      return { isSameLocation: false, confidence: 0, differences: ['Comparison failed'] };
    }
  }

  /**
   * Extract distinctive features that can identify a specific branch
   */
  static async extractBranchIdentifiers(buffer: Buffer, client: vision.ImageAnnotatorClient): Promise<{
    uniqueFeatures: string[];
    buildingNumber?: string;
    streetName?: string;
    colorScheme: string;
    distinctiveElements: string[];
  }> {
    try {
      const [textResult, labelResult] = await Promise.all([
        client.textDetection({ image: { content: buffer } }),
        client.labelDetection({ image: { content: buffer }, maxResults: 30 })
      ]);

      const texts = textResult.textAnnotations || [];
      const labels = labelResult.labelAnnotations || [];

      const uniqueFeatures: string[] = [];
      const distinctiveElements: string[] = [];
      let colorScheme = 'neutral';

      // Extract building number from text
      let buildingNumber: string | undefined;
      if (texts.length > 0) {
        const fullText = texts[0].description || '';
        const numberMatch = fullText.match(/^(\d{1,4})\s+/m);
        if (numberMatch) {
          buildingNumber = numberMatch[1];
          uniqueFeatures.push(`Building number: ${buildingNumber}`);
        }

        // Extract street name
        const streetMatch = fullText.match(/(\d+)\s+([A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Way|Place|Pl))/i);
        if (streetMatch) {
          uniqueFeatures.push(`Street: ${streetMatch[2].trim()}`);
        }
      }

      // Determine color scheme
      const colorLabels = labels.filter(l => 
        ['Red', 'Blue', 'Green', 'Yellow', 'White', 'Black', 'Brown', 'Gray'].includes(l.description)
      );
      if (colorLabels.length > 0) {
        colorScheme = colorLabels[0].description;
        uniqueFeatures.push(`Color: ${colorScheme}`);
      }

      // Extract distinctive architectural elements
      const distinctiveLabels = ['Arch', 'Column', 'Balcony', 'Turret', 'Spire', 'Dome', 'Awning', 'Canopy', 'Portico'];
      for (const label of labels) {
        if (distinctiveLabels.includes(label.description) && label.score > 0.7) {
          distinctiveElements.push(label.description);
          uniqueFeatures.push(`Distinctive: ${label.description}`);
        }
      }

      return {
        uniqueFeatures,
        buildingNumber,
        colorScheme,
        distinctiveElements,
        streetName: uniqueFeatures.find(f => f.startsWith('Street:'))?.replace('Street: ', '')
      };
    } catch (error) {
      console.error('Branch identifier extraction failed:', error);
      return {
        uniqueFeatures: [],
        colorScheme: 'unknown',
        distinctiveElements: []
      };
    }
  }
}
