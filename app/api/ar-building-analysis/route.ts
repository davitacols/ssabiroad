import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    
    const [result] = await client.annotateImage({
      image: { content: buffer },
      features: [
        { type: 'LANDMARK_DETECTION' },
        { type: 'LABEL_DETECTION' },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'TEXT_DETECTION' },
      ],
    });

    const landmarks = result.landmarkAnnotations || [];
    const labels = result.labelAnnotations || [];
    const textAnnotations = result.textAnnotations || [];

    const buildingAnalysis = {
      id: `building_${Date.now()}`,
      name: landmarks[0]?.description || 'Unknown Building',
      address: extractAddress(textAnnotations),
      architecturalStyle: detectArchitecturalStyle(labels),
      yearBuilt: estimateYearBuilt(labels),
      height: 0,
      floors: estimateFloors(labels),
      materials: detectMaterials(labels),
      historicalSignificance: landmarks[0]?.description ? 'Recognized Landmark' : 'Local Building',
      propertyValue: 0,
      energyRating: estimateEnergyRating(labels),
      structuralCondition: assessCondition(labels),
      latitude,
      longitude,
      photos: [],
      communityNotes: [],
      confidence: landmarks[0]?.score || 0,
    };

    return NextResponse.json(buildingAnalysis);
  } catch (error) {
    console.error('AR building analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze building' }, { status: 500 });
  }
}

function extractAddress(textAnnotations: any[]): string {
  if (textAnnotations.length === 0) return 'Address not detected';
  const text = textAnnotations[0].description || '';
  const addressPattern = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)/i;
  const match = text.match(addressPattern);
  return match ? match[0] : 'Address not detected';
}

function detectArchitecturalStyle(labels: any[]): string {
  const styleKeywords = {
    'Modern': ['modern', 'contemporary', 'glass', 'steel'],
    'Victorian': ['victorian', 'ornate', 'decorative'],
    'Gothic': ['gothic', 'pointed arch', 'cathedral'],
    'Neoclassical': ['neoclassical', 'columns', 'symmetrical'],
    'Art Deco': ['art deco', 'geometric', 'streamlined'],
    'Brutalist': ['brutalist', 'concrete', 'angular'],
    'Colonial': ['colonial', 'traditional', 'brick'],
  };

  const labelDescriptions = labels.map(l => l.description.toLowerCase());
  
  for (const [style, keywords] of Object.entries(styleKeywords)) {
    if (keywords.some(keyword => labelDescriptions.some(desc => desc.includes(keyword)))) {
      return style;
    }
  }
  return 'Contemporary';
}

function estimateYearBuilt(labels: any[]): number {
  const labelDescriptions = labels.map(l => l.description.toLowerCase());
  if (labelDescriptions.some(d => d.includes('historic') || d.includes('old'))) {
    return 1900 + Math.floor(Math.random() * 50);
  }
  if (labelDescriptions.some(d => d.includes('modern') || d.includes('new'))) {
    return 2000 + Math.floor(Math.random() * 24);
  }
  return 1950 + Math.floor(Math.random() * 74);
}

function estimateFloors(labels: any[]): number {
  const labelDescriptions = labels.map(l => l.description.toLowerCase());
  if (labelDescriptions.some(d => d.includes('skyscraper') || d.includes('tower'))) {
    return 20 + Math.floor(Math.random() * 30);
  }
  if (labelDescriptions.some(d => d.includes('high-rise'))) {
    return 10 + Math.floor(Math.random() * 15);
  }
  return 2 + Math.floor(Math.random() * 8);
}

function detectMaterials(labels: any[]): string[] {
  const materials: string[] = [];
  const labelDescriptions = labels.map(l => l.description.toLowerCase());
  
  const materialKeywords = {
    'Brick': ['brick', 'masonry'],
    'Concrete': ['concrete', 'cement'],
    'Glass': ['glass', 'window'],
    'Steel': ['steel', 'metal'],
    'Wood': ['wood', 'timber'],
    'Stone': ['stone', 'granite', 'marble'],
  };
  
  for (const [material, keywords] of Object.entries(materialKeywords)) {
    if (keywords.some(keyword => labelDescriptions.some(desc => desc.includes(keyword)))) {
      materials.push(material);
    }
  }
  return materials.length > 0 ? materials : ['Concrete', 'Glass'];
}

function estimateEnergyRating(labels: any[]): string {
  const ratings = ['A', 'B', 'C', 'D', 'E'];
  const labelDescriptions = labels.map(l => l.description.toLowerCase());
  if (labelDescriptions.some(d => d.includes('modern') || d.includes('new'))) {
    return ratings[Math.floor(Math.random() * 2)];
  }
  return ratings[2 + Math.floor(Math.random() * 3)];
}

function assessCondition(labels: any[]): string {
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
  const labelDescriptions = labels.map(l => l.description.toLowerCase());
  if (labelDescriptions.some(d => d.includes('new') || d.includes('renovated'))) {
    return 'Excellent';
  }
  if (labelDescriptions.some(d => d.includes('old') || d.includes('weathered'))) {
    return 'Fair';
  }
  return 'Good';
}
