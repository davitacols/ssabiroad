const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const deviceId = `device_test_${Date.now()}`;

async function testContribute() {
  console.log('Testing crowdsourcing with deviceId:', deviceId);

  // Create a dummy image file
  const imageBuffer = Buffer.from('fake-image-data');
  const formData = new FormData();
  formData.append('file', imageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });
  formData.append('latitude', '6.5244');
  formData.append('longitude', '3.3792');
  formData.append('address', 'Lagos, Nigeria');
  formData.append('deviceId', deviceId);

  try {
    const res = await fetch(`${API_URL}/api/gamification/contribute`, {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    console.log('✅ Contribution result:', JSON.stringify(result, null, 2));

    // Get stats
    const statsRes = await fetch(`${API_URL}/api/gamification/contribute?deviceId=${deviceId}`);
    const stats = await statsRes.json();
    console.log('✅ Stats:', JSON.stringify(stats, null, 2));

    // Get leaderboard
    const leaderboardRes = await fetch(`${API_URL}/api/gamification/contribute`);
    const leaderboard = await leaderboardRes.json();
    console.log('✅ Leaderboard top 3:', JSON.stringify(leaderboard.leaderboard.slice(0, 3), null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testContribute();
