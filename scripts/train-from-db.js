const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const FormData = require('form-data');

const prisma = new PrismaClient();
const ML_URL = 'http://localhost:8000';

async function trainFromDatabase() {
  try {
    console.log('\n🚀 Starting ML Training from Database...\n');
    
    // Get READY training samples
    const samples = await prisma.trainingQueue.findMany({
      where: { status: 'READY' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${samples.length} training samples\n`);
    
    if (samples.length === 0) {
      console.log('❌ No training data available');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const sample of samples) {
      try {
        console.log(`Training: ${sample.address}`);
        
        // Decode base64 image from error field (where we stored it)
        const imageBuffer = Buffer.from(sample.error, 'base64');
        
        // Create form data
        const formData = new FormData();
        formData.append('file', imageBuffer, {
          filename: 'image.jpg',
          contentType: 'image/jpeg'
        });
        formData.append('latitude', sample.latitude.toString());
        formData.append('longitude', sample.longitude.toString());
        formData.append('address', sample.address);
        
        // Send to ML service
        const response = await fetch(`${ML_URL}/train`, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders()
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`  ✅ Success: ${result.message || 'Trained'}`);
          
          // Update status to SENT
          await prisma.trainingQueue.update({
            where: { id: sample.id },
            data: { status: 'SENT' }
          });
          
          successCount++;
        } else {
          const error = await response.text();
          console.log(`  ❌ Failed: ${error}`);
          errorCount++;
        }
        
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Training Complete:`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${samples.length}\n`);
    
  } catch (error) {
    console.error('❌ Training failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

trainFromDatabase();
