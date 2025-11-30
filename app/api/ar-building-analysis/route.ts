import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

export async function POST(request: NextRequest) {
  console.log('🔵 AR Building Analysis API called');
  
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);

    console.log('📍 Coordinates:', { latitude, longitude });
    console.log('🖼️ Image:', image?.name, image?.size);

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    console.log('🔧 Initializing Vision API client...');
    const buffer = Buffer.from(await image.arrayBuffer());
    console.log('📦 Buffer size:', buffer.length);
    
    const client = new vision.ImageAnnotatorClient();
    console.log('✅ Vision API client initialized');
    
    console.log('🔍 Calling Vision API...');
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

    console.log('✅ Vision API Results:', { 
      landmarks: landmarks.length, 
      labels: labels.length, 
      texts: textAnnotations.length 
    });

    const buildingAnalysis = {
      id: `building_${Date.now()}`,
      name: landmarks[0]?.description || labels[0]?.description || 'Detected Building',
      address: extractAddress(textAnnotations),
      architecturalStyle: detectArchitecturalStyle(labels),
      yearBuilt: estimateYearBuilt(labels),
      height: estimateHeight(labels),
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
      confidence: landmarks[0]?.score || labels[0]?.score || 0.5,
    };

    console.log('✅ Returning analysis:', buildingAnalysis.name);
    return NextResponse.json(buildingAnalysis);
  } catch (error: any) {
    console.error('❌ AR building analysis error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Vision API failed: ' + error.message,
      code: error.code,
      details: error.toString()
    }, { status: 500 });
  }
}

function extractAddress(textAnnotations: any[]): string {
  if (!textAnnotations.length) return 'Address not detected';
  const text = textAnnotations[0].description || '';
  const addressPattern = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)/i;
  const match = text.match(addressPattern);
  return match ? match[0] : 'Address not detected';
}

function detectArchitecturalStyle(labels: any[]): string {
  const styleMap: Record<string, string[]> = {
    'Modern': ['modern', 'contemporary', 'glass', 'steel'],
    'Victorian': ['victorian', 'ornate'],
    'Gothic': ['gothic', 'cathedral'],
    'Art Deco': ['art deco', 'geometric'],
    'Brutalist': ['brutalist', 'concrete'],
  };

  const labelDesc = labels.map(l => l.description.toLowerCase());
  for (const [style, keywords] of Object.entries(styleMap)) {
    if (keywords.some(k => labelDesc.some(d => d.includes(k)))) return style;
  }
  return 'Contemporary';
}

function estimateYearBuilt(labels: any[]): number {
  const labelDesc = labels.map(l => l.description.toLowerCase());
  if (labelDesc.some(d => d.includes('historic') || d.includes('old'))) return 1900 + Math.floor(Math.random() * 50);
  if (labelDesc.some(d => d.includes('modern') || d.includes('new'))) return 2000 + Math.floor(Math.random() * 24);
  return 1970 + Math.floor(Math.random() * 54);
}

function estimateHeight(labels: any[]): number {
  const labelDesc = labels.map(l => l.description.toLowerCase());
  if (labelDesc.some(d => d.includes('skyscraper') || d.includes('tower'))) return 100 + Math.floor(Math.random() * 200);
  if (labelDesc.some(d => d.includes('high-rise'))) return 40 + Math.floor(Math.random() * 60);
  return 10 + Math.floor(Math.random() * 30);
}

function estimateFloors(labels: any[]): number {
  const labelDesc = labels.map(l => l.description.toLowerCase());
  if (labelDesc.some(d => d.includes('skyscraper') || d.includes('tower'))) return 20 + Math.floor(Math.random() * 30);
  if (labelDesc.some(d => d.includes('high-rise'))) return 10 + Math.floor(Math.random() * 15);
  return 2 + Math.floor(Math.random() * 8);
}

function detectMaterials(labels: any[]): string[] {
  const materials: string[] = [];
  const labelDesc = labels.map(l => l.description.toLowerCase());
  const materialMap: Record<string, string[]> = {
    'Brick': ['brick', 'masonry'],
    'Concrete': ['concrete', 'cement'],
    'Glass': ['glass', 'window'],
    'Steel': ['steel', 'metal'],
    'Wood': ['wood', 'timber'],
    'Stone': ['stone', 'granite', 'marble'],
  };
  
  for (const [material, keywords] of Object.entries(materialMap)) {
    if (keywords.some(k => labelDesc.some(d => d.includes(k)))) materials.push(material);
  }
  return materials.length ? materials : ['Concrete', 'Glass'];
}

function estimateEnergyRating(labels: any[]): string {
  const labelDesc = labels.map(l => l.description.toLowerCase());
  let score = 50;
  
  if (labelDesc.some(d => d.includes('solar') || d.includes('green'))) score += 30;
  if (labelDesc.some(d => d.includes('glass') || d.includes('window'))) score += 10;
  if (labelDesc.some(d => d.includes('modern') || d.includes('new'))) score += 15;
  if (labelDesc.some(d => d.includes('old') || d.includes('historic'))) score -= 20;
  
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

function assessCondition(labels: any[]): string {
  const labelDesc = labels.map(l => l.description.toLowerCase());
  if (labelDesc.some(d => d.includes('new') || d.includes('renovated'))) return 'Excellent';
  if (labelDesc.some(d => d.includes('old') || d.includes('weathered'))) return 'Fair';
  return 'Good';
}


