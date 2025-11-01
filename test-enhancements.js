const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test_user_' + Date.now();

async function testFeedbackEndpoint() {
  console.log('\n🧪 Testing Feedback Endpoint...');
  
  // Test GET - accuracy stats
  try {
    const response = await fetch(`${BASE_URL}/api/location-recognition-v2/feedback`);
    const data = await response.json();
    console.log('✅ GET /feedback:', data);
  } catch (error) {
    console.log('❌ GET /feedback failed:', error.message);
  }
  
  // Test POST - submit feedback
  try {
    const response = await fetch(`${BASE_URL}/api/location-recognition-v2/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recognitionId: 'test_rec_' + Date.now(),
        wasCorrect: true,
        userId: TEST_USER_ID
      })
    });
    const data = await response.json();
    console.log('✅ POST /feedback:', data.success ? 'Success' : 'Failed');
  } catch (error) {
    console.log('❌ POST /feedback failed:', error.message);
  }
}

async function testRecognitionWithUserId() {
  console.log('\n🧪 Testing Recognition with userId...');
  
  // Create a test image (1x1 pixel JPEG)
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
    console.log('✅ Recognition response:', {
      success: data.success,
      hasRecognitionId: !!data.recognitionId,
      method: data.method,
      confidence: data.confidence
    });
    
    return data.recognitionId;
  } catch (error) {
    console.log('❌ Recognition failed:', error.message);
    return null;
  }
}

async function testFranchiseDetection() {
  console.log('\n🧪 Testing Franchise Detection...');
  
  const { FranchiseDetector } = require('./app/api/location-recognition-v2/franchise-detector.ts');
  
  const testCases = [
    { name: "McDonald's", expected: 'mcdonalds' },
    { name: "Starbucks Coffee", expected: 'starbucks' },
    { name: "Subway Sandwiches", expected: 'subway' },
    { name: "Fortune Cookie Chinese", expected: 'fortune cookie' }
  ];
  
  for (const test of testCases) {
    try {
      const result = await FranchiseDetector.detectFranchise(
        test.name,
        { colors: ['red', 'yellow'], text: test.name.toLowerCase() }
      );
      console.log(`✅ ${test.name}:`, {
        detected: result.isFranchise,
        franchiseId: result.franchiseId,
        confidence: result.confidence
      });
    } catch (error) {
      console.log(`❌ ${test.name} failed:`, error.message);
    }
  }
}

async function testGeofenceOptimizer() {
  console.log('\n🧪 Testing Geofence Optimizer...');
  
  const { GeofenceOptimizer } = require('./app/api/location-recognition-v2/geofence-optimizer.ts');
  
  // Test UK coordinates
  try {
    const ukHint = await GeofenceOptimizer.getRegionHint(51.5074, -0.1278);
    console.log('✅ UK Region Detection:', ukHint);
  } catch (error) {
    console.log('❌ UK region detection failed:', error.message);
  }
  
  // Test US coordinates
  try {
    const usHint = await GeofenceOptimizer.getRegionHint(40.7128, -74.0060);
    console.log('✅ US Region Detection:', usHint);
  } catch (error) {
    console.log('❌ US region detection failed:', error.message);
  }
  
  // Test search query building
  try {
    const queries = GeofenceOptimizer.buildRegionalSearchQuery(
      'Starbucks',
      { countryCode: 'UK', region: 'UK', searchPriority: ['UK', 'London'] }
    );
    console.log('✅ Regional Queries:', queries);
  } catch (error) {
    console.log('❌ Query building failed:', error.message);
  }
}

async function testErrorRecovery() {
  console.log('\n🧪 Testing Error Recovery...');
  
  const { ErrorRecovery } = require('./app/api/location-recognition-v2/error-recovery.ts');
  
  const failureResult = {
    success: false,
    method: 'no-location-data',
    confidence: 0
  };
  
  try {
    const strategies = ErrorRecovery.analyzeFailure(failureResult);
    console.log('✅ Recovery Strategies:', strategies);
    
    const message = ErrorRecovery.generateUserMessage(strategies);
    console.log('✅ User Message:', message);
    
    const retry = ErrorRecovery.shouldRetryWithAdjustments(failureResult, 1);
    console.log('✅ Retry Decision:', retry);
  } catch (error) {
    console.log('❌ Error recovery failed:', error.message);
  }
}

async function testDatabaseTables() {
  console.log('\n🧪 Testing Database Tables...');
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Test location_recognitions table
    const recCount = await prisma.locationRecognition.count();
    console.log('✅ location_recognitions table:', recCount, 'records');
    
    // Test location_feedback table
    const feedbackCount = await prisma.locationFeedback.count();
    console.log('✅ location_feedback table:', feedbackCount, 'records');
    
    // Test known_locations table
    const knownCount = await prisma.knownLocation.count();
    console.log('✅ known_locations table:', knownCount, 'records');
    
    // Test region_optimizations table
    const regionCount = await prisma.regionOptimization.count();
    console.log('✅ region_optimizations table:', regionCount, 'records');
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function runAllTests() {
  console.log('🚀 Starting Enhancement Tests...\n');
  console.log('Test User ID:', TEST_USER_ID);
  
  await testDatabaseTables();
  await testFeedbackEndpoint();
  
  const recognitionId = await testRecognitionWithUserId();
  
  if (recognitionId) {
    console.log('\n🧪 Testing Feedback with Real Recognition ID...');
    try {
      const response = await fetch(`${BASE_URL}/api/location-recognition-v2/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recognitionId,
          wasCorrect: true,
          userId: TEST_USER_ID
        })
      });
      const data = await response.json();
      console.log('✅ Feedback with real ID:', data.success ? 'Success' : 'Failed');
    } catch (error) {
      console.log('❌ Feedback with real ID failed:', error.message);
    }
  }
  
  await testFranchiseDetection();
  await testGeofenceOptimizer();
  await testErrorRecovery();
  
  console.log('\n✅ All tests completed!');
}

runAllTests().catch(console.error);
