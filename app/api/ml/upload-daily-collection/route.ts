import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const ML_API_URL = process.env.ML_API_URL || 'http://34.224.33.158:8000';

interface ImageMetadata {
  filename: string;
  address: string;
  latitude: number;
  longitude: number;
  heading: number;
  location: string;
  state: string;
  date: string;
}

async function sendToML(imagePath: string, metadata: ImageMetadata) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('metadata', JSON.stringify({
      address: metadata.address,
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      location: metadata.location,
      state: metadata.state,
      heading: metadata.heading,
      date: metadata.date
    }));

    const response = await fetch(`${ML_API_URL}/add_to_index`, {
      method: 'POST',
      body: formData as any,
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to send ${path.basename(imagePath)}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();
    const metadataDate = date || '2025-12-22';
    
    const DAILY_COLLECTION_PATH = path.join(process.cwd(), 'data', 'daily-collection');
    const metadataPath = path.join(DAILY_COLLECTION_PATH, `metadata_${metadataDate}.json`);

    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json(
        { error: `Metadata file not found for date: ${metadataDate}` },
        { status: 404 }
      );
    }

    const metadata: ImageMetadata[] = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    const metadataMap = new Map<string, ImageMetadata>();
    metadata.forEach(item => {
      metadataMap.set(item.filename, item);
    });

    function findImages(dir: string, relativePath = ''): Array<{file: string, relativePath: string}> {
      const results: Array<{file: string, relativePath: string}> = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          results.push(...findImages(fullPath, path.join(relativePath, item)));
        } else if ((item.endsWith('.jpg') || item.endsWith('.png')) && metadataMap.has(item)) {
          results.push({ file: item, relativePath: path.join(relativePath, item) });
        }
      }
      return results;
    }
    
    const imageFiles = findImages(DAILY_COLLECTION_PATH);

    let successful = 0;
    let failed = 0;
    const results = [];

    const BATCH_SIZE = 10;
    for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
      const batch = imageFiles.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async ({ file: filename, relativePath }) => {
          const imagePath = path.join(DAILY_COLLECTION_PATH, relativePath);
          const meta = metadataMap.get(filename)!;
          
          const result = await sendToML(imagePath, meta);
          
          if (result) {
            successful++;
            return { filename, status: 'success', address: meta.address };
          } else {
            failed++;
            return { filename, status: 'failed', address: meta.address };
          }
        })
      );

      results.push(...batchResults);

      if (i + BATCH_SIZE < imageFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily collection uploaded to ML',
      stats: {
        total: imageFiles.length,
        successful,
        failed,
        successRate: Math.round((successful / imageFiles.length) * 100)
      },
      results
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload daily collection' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const DAILY_COLLECTION_PATH = path.join(process.cwd(), 'data', 'daily-collection');
    
    const metadataFiles = fs.readdirSync(DAILY_COLLECTION_PATH)
      .filter(file => file.startsWith('metadata_') && file.endsWith('.json'));

    const collections = metadataFiles.map(file => {
      const date = file.replace('metadata_', '').replace('.json', '');
      const metadataPath = path.join(DAILY_COLLECTION_PATH, file);
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      return {
        date,
        imageCount: metadata.length,
        file
      };
    });

    return NextResponse.json({
      success: true,
      collections
    });

  } catch (error) {
    console.error('Error listing collections:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list collections' 
      },
      { status: 500 }
    );
  }
}
