# Quick Start Guide - High Priority Enhancements

## 🚀 What's New

Four major enhancements have been added to location-recognition-v2:

1. **User Feedback Loop** - Learn from corrections
2. **Franchise Detection** - Better chain location accuracy  
3. **Geofencing** - Regional search optimization
4. **Error Recovery** - Helpful failure suggestions

## 📝 Usage Examples

### 1. Submit Location Recognition with User ID

```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('userId', 'user_123'); // NEW: Track user
formData.append('latitude', '51.5074');
formData.append('longitude', '-0.1278');

const response = await fetch('/api/location-recognition-v2', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// result now includes: recognitionId, franchiseId, regionHint
```

### 2. Submit Feedback

```javascript
// User confirms location is correct
await fetch('/api/location-recognition-v2/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recognitionId: result.recognitionId,
    wasCorrect: true,
    userId: 'user_123'
  })
});

// User corrects location
await fetch('/api/location-recognition-v2/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recognitionId: result.recognitionId,
    wasCorrect: false,
    correctAddress: '456 Real Street, London',
    correctLat: 51.5080,
    correctLng: -0.1280,
    userId: 'user_123'
  })
});
```

### 3. Check Accuracy Stats

```javascript
// Overall accuracy
const stats = await fetch('/api/location-recognition-v2/feedback');
const data = await stats.json();
// { total: 150, correct: 127, incorrect: 23, accuracy: "84.67%" }

// Accuracy by method
const claudeStats = await fetch('/api/location-recognition-v2/feedback?method=claude-ai-analysis');
// { total: 50, correct: 45, incorrect: 5, accuracy: "90.00%", method: "claude-ai-analysis" }
```

### 4. Enhanced Response Format

```json
{
  "success": true,
  "name": "Starbucks",
  "address": "123 High Street, London",
  "location": { "latitude": 51.5074, "longitude": -0.1278 },
  "confidence": 0.92,
  "method": "claude-ai-analysis",
  
  "recognitionId": "clx123abc",
  "franchiseId": "starbucks",
  "franchiseConfidence": 0.88,
  "regionHint": "UK",
  
  "nearbyPlaces": [...],
  "photos": [...],
  "weather": {...}
}
```

### 5. Error Recovery

When recognition fails:

```json
{
  "success": false,
  "confidence": 0,
  "method": "no-location-data",
  "error": "To improve results:\n1. Take a clearer photo of business signage\n2. Enable GPS on your device\n3. Ensure good lighting conditions"
}
```

## 🎯 Integration Checklist

### Frontend Integration

- [ ] Add `userId` to recognition requests
- [ ] Store `recognitionId` from responses
- [ ] Show feedback prompt after recognition
- [ ] Display accuracy stats in settings
- [ ] Show recovery suggestions on failure

### Example React Component

```jsx
function LocationRecognition() {
  const [result, setResult] = useState(null);
  
  const handleRecognition = async (image) => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('userId', currentUser.id);
    
    const res = await fetch('/api/location-recognition-v2', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    setResult(data);
  };
  
  const handleFeedback = async (wasCorrect) => {
    await fetch('/api/location-recognition-v2/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recognitionId: result.recognitionId,
        wasCorrect,
        userId: currentUser.id
      })
    });
  };
  
  return (
    <div>
      {result && (
        <>
          <LocationDisplay location={result} />
          <FeedbackButtons 
            onCorrect={() => handleFeedback(true)}
            onIncorrect={() => handleFeedback(false)}
          />
        </>
      )}
    </div>
  );
}
```

## 📊 Monitoring

### Check System Health

```bash
# Get overall accuracy
curl http://localhost:3000/api/location-recognition-v2/feedback

# Check specific method
curl http://localhost:3000/api/location-recognition-v2/feedback?method=claude-ai-analysis
```

### Database Queries

```sql
-- Top performing methods
SELECT method, 
       COUNT(*) as total,
       AVG(confidence) as avg_confidence
FROM location_recognitions
GROUP BY method
ORDER BY avg_confidence DESC;

-- Feedback accuracy by method
SELECT lr.method,
       COUNT(*) as total,
       SUM(CASE WHEN lf."wasCorrect" THEN 1 ELSE 0 END) as correct
FROM location_feedback lf
JOIN location_recognitions lr ON lr.id = lf."recognitionId"
GROUP BY lr.method;

-- Most verified locations
SELECT "businessName", address, "verificationCount"
FROM known_locations
ORDER BY "verificationCount" DESC
LIMIT 10;
```

## 🔧 Configuration

### Add New Franchise

Edit `franchise-detector.ts`:

```typescript
private static franchisePatterns = {
  'costa': { 
    colors: ['red', 'brown'], 
    keywords: ['coffee', 'costa coffee'] 
  },
  // Add more...
};
```

### Add New Region

Edit `geofence-optimizer.ts`:

```typescript
private static regionMappings = {
  FR: {
    bounds: { minLat: 42, maxLat: 51, minLng: -5, maxLng: 8 },
    searchSuffixes: ['France', 'FR'],
    commonChains: ['Carrefour', 'Auchan']
  },
  // Add more...
};
```

## 🎓 Best Practices

1. **Always pass userId** - Enables personalized improvements
2. **Prompt for feedback** - Show after every recognition
3. **Display confidence** - Let users know accuracy level
4. **Show recovery tips** - Help users get better results
5. **Monitor stats** - Track accuracy trends over time

## 🐛 Troubleshooting

**Feedback not saving?**
- Check `recognitionId` is valid
- Ensure database connection is active
- Verify Prisma client is generated

**Franchise not detected?**
- Add pattern to `franchisePatterns`
- Check visual features are being extracted
- Verify business name matching logic

**Region optimization not working?**
- Confirm coordinates are valid
- Check region bounds in `regionMappings`
- Verify IP geolocation service is accessible

## 📚 API Reference

See [HIGH_PRIORITY_ENHANCEMENTS.md](./HIGH_PRIORITY_ENHANCEMENTS.md) for complete documentation.
