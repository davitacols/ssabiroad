# Location Recognition V2 - Enhanced Architecture

## 🏗️ System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER UPLOADS IMAGE                        │
│                     (with optional userId)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REGION OPTIMIZATION                           │
│  • Detect region from coordinates/IP                            │
│  • Build regional search queries                                │
│  • Apply geographic filters                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOCATION RECOGNITION                          │
│  1. EXIF GPS Extraction (0.95 confidence)                       │
│  2. Claude AI Analysis (0.8-0.9 confidence)                     │
│  3. Google Vision API (0.7-0.85 confidence)                     │
│  4. Device Location Fallback (0.4 confidence)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRANCHISE DETECTION                           │
│  • Visual pattern matching                                      │
│  • Color/logo analysis                                          │
│  • Nearest location lookup                                      │
│  • Confidence scoring                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SAVE RECOGNITION                              │
│  • Store in location_recognitions table                         │
│  • Generate recognitionId                                       │
│  • Hash image for deduplication                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RETURN ENHANCED RESULT                        │
│  • Location + confidence                                        │
│  • recognitionId (for feedback)                                 │
│  • franchiseId (if detected)                                    │
│  • regionHint                                                   │
│  • recoveryStrategies (if failed)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER PROVIDES FEEDBACK                        │
│  POST /feedback { recognitionId, wasCorrect, ... }              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FEEDBACK PROCESSING                           │
│  1. Store in location_feedback table                            │
│  2. Train ML model with correction                              │
│  3. Update known_locations (if correct)                         │
│  4. Increment verification count                                │
└─────────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

```
┌─────────────────────────┐
│  location_recognitions  │
├─────────────────────────┤
│ id (PK)                 │
│ businessName            │
│ detectedAddress         │
│ latitude                │
│ longitude               │
│ confidence              │
│ method                  │
│ imageHash               │
│ userId                  │
│ createdAt               │
└───────────┬─────────────┘
            │ 1:1
            ▼
┌─────────────────────────┐
│   location_feedback     │
├─────────────────────────┤
│ id (PK)                 │
│ recognitionId (FK)      │
│ wasCorrect              │
│ correctAddress          │
│ correctLat              │
│ correctLng              │
│ userId                  │
│ createdAt               │
└─────────────────────────┘

┌─────────────────────────┐
│    known_locations      │
├─────────────────────────┤
│ id (PK)                 │
│ businessName            │
│ address                 │
│ latitude                │
│ longitude               │
│ phoneNumber             │
│ visualFeatures (JSON)   │
│ franchiseId             │
│ verificationCount       │
│ lastVerified            │
└─────────────────────────┘

┌─────────────────────────┐
│  region_optimizations   │
├─────────────────────────┤
│ id (PK)                 │
│ region                  │
│ countryCode             │
│ priority                │
│ searchHints (JSON)      │
└─────────────────────────┘
```

## 🔄 Feedback Loop

```
Recognition → User Feedback → ML Training → Improved Accuracy
     ↑                                              ↓
     └──────────────────────────────────────────────┘
```

### Feedback Impact:
1. **Correct Feedback** → Add to known_locations → Faster future recognition
2. **Incorrect Feedback** → Train ML model → Better candidate selection
3. **Multiple Feedbacks** → Increase verification count → Higher confidence

## 🎯 Franchise Detection Flow

```
Business Name Detected
        ↓
Check Franchise Patterns
        ↓
    Match Found?
    ├─ Yes → Extract Visual Features
    │         ↓
    │    Calculate Confidence
    │         ↓
    │    Search Known Locations
    │         ↓
    │    Find Nearest Match
    │         ↓
    │    Return Enhanced Result
    │
    └─ No → Continue Normal Flow
```

## 🌍 Regional Optimization Flow

```
User Location/IP
        ↓
Detect Region (UK/US/etc)
        ↓
Get Region Bounds
        ↓
Build Regional Queries
  • "Business UK"
  • "Business London"
  • "Business"
        ↓
Filter Candidates by Bounds
        ↓
Prioritize Regional Results
```

## 🔧 Error Recovery Flow

```
Recognition Failed
        ↓
Analyze Failure Reason
  • No GPS data
  • No text detected
  • Low confidence
  • Blurry image
        ↓
Generate Recovery Strategies
  • Retake photo
  • Enable GPS
  • Better lighting
  • Multiple angles
        ↓
Return User-Friendly Message
```

## 📊 ML Training Pipeline

```
User Feedback
        ↓
Extract Features
  • Business name
  • Phone number
  • Address
  • Visual features
        ↓
Calculate Error
        ↓
Update Model Weights
        ↓
Store Training Example
        ↓
Improved Predictions
```

## 🚀 Performance Optimizations

### Caching Strategy
```
Request → Check Cache → Cache Hit? 
                            ├─ Yes → Return Cached
                            └─ No → Process → Cache Result
```

### Parallel Processing
```
Image Upload
     ├─ EXIF Extraction (parallel)
     ├─ Claude AI Analysis (parallel)
     ├─ Google Vision API (parallel)
     └─ Region Detection (parallel)
          ↓
     First Success Wins
```

### Database Indexing
```
Indexes:
• location_recognitions.imageHash (deduplication)
• location_recognitions.method (stats)
• location_feedback.wasCorrect (accuracy)
• known_locations.businessName (search)
• known_locations.franchiseId (franchise lookup)
```

## 🔐 Security Considerations

1. **Image Hashing** - Prevent duplicate processing
2. **User Tracking** - Optional userId for privacy
3. **Rate Limiting** - Prevent abuse (TODO)
4. **Input Validation** - Sanitize all inputs
5. **Database Constraints** - Enforce data integrity

## 📈 Monitoring Points

```
Key Metrics:
├─ Recognition Success Rate
├─ Average Confidence Score
├─ Feedback Accuracy by Method
├─ Franchise Detection Rate
├─ Regional Optimization Impact
└─ Error Recovery Effectiveness
```

## 🔮 Future Architecture

```
Current: Single Image → Recognition
Future:  Multiple Images → Triangulation → Higher Confidence
         Batch Processing → Queue System → Async Results
         Offline Mode → Local ML → Sync Later
```
