const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test_user_' + Date.now();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFeedbackStats() {
  console.log('\n📊 Testing Feedback Stats Endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/location-recognition-v2/feedback`);
    const data = await response.json();
    console.log('✅ Overall Stats:', data);
    
    // Test with method filter
    const methodResponse = await fetch(`${BASE_URL}/api/location-recognition-v2/feedback?method=claude-ai-analysis`);
    const methodData = await methodResponse.json();
    console.log('✅ Claude Method Stats:', methodData);
    
    return true;
  } catch (error) {
    console.log('❌ Stats test failed:', error.message);
    return false;
  }
}

async function testRecognitionWithTracking() {
  console.log('\n🎯 Testing Recognition with User Tracking...');
  
  // Create minimal test image
  const testImage = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
    0x7F, 0xFF, 0xD9
  ]);
  
  try {
    const FormData = (await import('formdata-node')).FormData;
    const { Blob } = await import('buffer');
    
    const formData = new FormData();
    const blob = new Blob([testImage], { type: 'image/jpeg' });
    formData.append('image', blob, 'test.jpg');
    formData.append('userId', TEST_USER_ID);
    formData.append('latitude', '51.5074');
    formData.append('longitude', '-0.1278');
    
    const response = await fetch(`${BASE_URL}/api/location-recognition-v2`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('✅ Recognition Result:', {
      success: data.success,
      method: data.method,
      confidence: data.confidence,
      hasRecognitionId: !!data.recognitionId,
      hasLocation: !!data.location
    });
    
    return data.recognitionId;
  } catch (error) {
    console.log('❌ Recognition test failed:', error.message);
    return null;
  }
}

async function testFeedbackSubmission(recognitionId) {
  console.log('\n💬 Testing Feedback Submission...');
  
  if (!recognitionId) {
    console.log('⚠️  Skipping - no recognitionId available');
    return false;
  }
  
  try {
    // Test correct feedback
    const correctResponse = await fetch(`${BASE_URL}/api/location-recognition-v2/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recognitionId,
        wasCorrect: true,
        userId: TEST_USER_ID
      })
    });
    
    const correctData = await correctResponse.json();
    console.log('✅ Correct Feedback:', correctData.success ? 'Submitted' : 'Failed');
    
    await sleep(1000);
    
    // Test correction feedback
    const correctionResponse = await fetch(`${BASE_URL}/api/location-recognition-v2/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recognitionId: 'test_rec_' + Date.now(),
        wasCorrect: false,
        correctAddress: '123 Test Street, London',
        correctLat: 51.5080,
        correctLng: -0.1280,
        userId: TEST_USER_ID
      })
    });
    
    const correctionData = await correctionResponse.json();
    console.log('✅ Correction Feedback:', correctionData.success ? 'Submitted' : 'Failed');
    
    return true;
  } catch (error) {
    console.log('❌ Feedback submission failed:', error.message);
    return false;
  }
}

async function testDatabaseRecords() {
  console.log('\n🗄️  Testing Database Records...');
  
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const recCount = await prisma.locationRecognition.count();
    console.log('✅ Recognitions stored:', recCount);
    
    const feedbackCount = await prisma.locationFeedback.count();
    console.log('✅ Feedback records:', feedbackCount);
    
    const knownCount = await prisma.knownLocation.count();
    console.log('✅ Known locations:', knownCount);
    
    // Show recent recognitions
    if (recCount > 0) {
      const recent = await prisma.locationRecognition.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          businessName: true,
          method: true,
          confidence: true,
          createdAt: true
        }
      });
      console.log('📋 Recent Recognitions:', recent);
    }
    
    // Show feedback stats
    if (feedbackCount > 0) {
      const stats = await prisma.locationFeedback.groupBy({
        by: ['wasCorrect'],
        _count: true
      });
      console.log('📊 Feedback Stats:', stats);
    }
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    await prisma.$disconnect();
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Location Recognition V2 Enhancements');
  console.log('================================================\n');
  console.log('Test User ID:', TEST_USER_ID);
  console.log('Base URL:', BASE_URL);
  
  const results = {
    stats: false,
    recognition: false,
    feedback: false,
    database: false
  };
  
  // Test 1: Stats endpoint
  results.stats = await testFeedbackStats();
  await sleep(1000);
  
  // Test 2: Recognition with tracking
  const recognitionId = await testRecognitionWithTracking();
  results.recognition = !!recognitionId;
  await sleep(2000);
  
  // Test 3: Feedback submission
  results.feedback = await testFeedbackSubmission(recognitionId);
  await sleep(1000);
  
  // Test 4: Database records
  results.database = await testDatabaseRecords();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log('Stats Endpoint:', results.stats ? '✅ PASS' : '❌ FAIL');
  console.log('Recognition Tracking:', results.recognition ? '✅ PASS' : '❌ FAIL');
  console.log('Feedback Submission:', results.feedback ? '✅ PASS' : '❌ FAIL');
  console.log('Database Storage:', results.database ? '✅ PASS' : '❌ FAIL');
  
  const passCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('✅ All enhancements working correctly!');
  } else {
    console.log('⚠️  Some tests failed - check logs above');
  }
}

runTests().catch(console.error);
