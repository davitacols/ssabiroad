# Deployment Checklist - Location Recognition V2 Enhancements

## ✅ Pre-Deployment

### Database
- [x] Schema updated in `prisma/schema.prisma`
- [x] Prisma client generated (`npx prisma generate`)
- [x] Database migrated (`npx prisma db push`)
- [x] New tables created:
  - [x] `location_recognitions`
  - [x] `location_feedback`
  - [x] `known_locations`
  - [x] `region_optimizations`

### Code
- [x] Feedback API endpoint created
- [x] Franchise detector module added
- [x] Geofence optimizer module added
- [x] Error recovery module added
- [x] Main route.ts integrated
- [x] All imports resolved
- [x] TypeScript compilation successful

### Documentation
- [x] HIGH_PRIORITY_ENHANCEMENTS.md
- [x] QUICK_START.md
- [x] ARCHITECTURE.md
- [x] ENHANCEMENTS_SUMMARY.md

## 🚀 Deployment Steps

### 1. Environment Variables
```bash
# Verify all required variables are set
✓ DATABASE_URL
✓ GOOGLE_PLACES_API_KEY
✓ ANTHROPIC_API_KEY
✓ GOOGLE_APPLICATION_CREDENTIALS_JSON
```

### 2. Build & Test
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build application
npm run build

# Run tests (if available)
npm test
```

### 3. Database Migration (Production)
```bash
# Push schema to production database
npx prisma db push --accept-data-loss

# Verify tables created
npx prisma studio
```

### 4. Deploy to Vercel
```bash
# Commit changes
git add .
git commit -m "feat: Add high-priority enhancements to location-recognition-v2"

# Push to repository
git push origin main

# Vercel will auto-deploy
```

## 📋 Post-Deployment

### Verification
- [ ] Test recognition endpoint with userId
- [ ] Submit test feedback
- [ ] Check accuracy stats endpoint
- [ ] Verify franchise detection
- [ ] Test regional optimization
- [ ] Confirm error recovery messages

### Monitoring
- [ ] Set up error tracking
- [ ] Monitor API response times
- [ ] Track feedback submission rate
- [ ] Watch accuracy trends
- [ ] Check database growth

### Frontend Integration
- [ ] Update API calls to include userId
- [ ] Add feedback prompt UI
- [ ] Display recognitionId in results
- [ ] Show franchise information
- [ ] Display error recovery suggestions
- [ ] Add accuracy stats dashboard

## 🧪 Testing Checklist

### API Endpoints

#### Recognition Endpoint
```bash
# Test with userId
curl -X POST http://localhost:3000/api/location-recognition-v2 \
  -F "image=@test.jpg" \
  -F "userId=test_user_123"

# Expected: recognitionId in response
```

#### Feedback Endpoint
```bash
# Submit positive feedback
curl -X POST http://localhost:3000/api/location-recognition-v2/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "recognitionId": "clx123",
    "wasCorrect": true,
    "userId": "test_user_123"
  }'

# Submit correction
curl -X POST http://localhost:3000/api/location-recognition-v2/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "recognitionId": "clx123",
    "wasCorrect": false,
    "correctAddress": "123 Test St",
    "correctLat": 51.5074,
    "correctLng": -0.1278,
    "userId": "test_user_123"
  }'
```

#### Stats Endpoint
```bash
# Get overall stats
curl http://localhost:3000/api/location-recognition-v2/feedback

# Get method-specific stats
curl http://localhost:3000/api/location-recognition-v2/feedback?method=claude-ai-analysis
```

### Database Queries

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('location_recognitions', 'location_feedback', 'known_locations', 'region_optimizations');

-- Check recognition records
SELECT COUNT(*) FROM location_recognitions;

-- Check feedback records
SELECT COUNT(*) FROM location_feedback;

-- Check known locations
SELECT COUNT(*) FROM known_locations;

-- Accuracy by method
SELECT 
  lr.method,
  COUNT(*) as total,
  SUM(CASE WHEN lf."wasCorrect" THEN 1 ELSE 0 END) as correct,
  ROUND(AVG(CASE WHEN lf."wasCorrect" THEN 100.0 ELSE 0.0 END), 2) as accuracy
FROM location_feedback lf
JOIN location_recognitions lr ON lr.id = lf."recognitionId"
GROUP BY lr.method;
```

## 🔍 Troubleshooting

### Common Issues

**Issue: Feedback endpoint returns 404**
- Solution: Ensure `feedback` directory exists in `app/api/location-recognition-v2/`
- Check: `app/api/location-recognition-v2/feedback/route.ts` exists

**Issue: Prisma client errors**
- Solution: Run `npx prisma generate`
- Check: `node_modules/@prisma/client` exists

**Issue: Database connection errors**
- Solution: Verify `DATABASE_URL` in environment
- Check: Connection string format is correct

**Issue: Recognition not saving**
- Solution: Check `saveRecognition` method is called
- Verify: userId is being passed correctly

**Issue: Franchise not detected**
- Solution: Add pattern to `franchisePatterns` in `franchise-detector.ts`
- Check: Business name matching logic

## 📊 Success Metrics

Track these metrics post-deployment:

### Week 1
- [ ] 100+ recognitions with userId
- [ ] 20+ feedback submissions
- [ ] 5+ known locations added
- [ ] 0 critical errors

### Month 1
- [ ] 1000+ recognitions
- [ ] 200+ feedback submissions
- [ ] 80%+ accuracy rate
- [ ] 50+ known locations
- [ ] 10+ franchises detected

### Quarter 1
- [ ] 10,000+ recognitions
- [ ] 2,000+ feedback submissions
- [ ] 85%+ accuracy rate
- [ ] 500+ known locations
- [ ] Regional optimization in 3+ countries

## 🎯 Rollback Plan

If issues arise:

1. **Revert Code**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Database Rollback**
   ```sql
   -- Drop new tables if needed
   DROP TABLE IF EXISTS location_feedback;
   DROP TABLE IF EXISTS location_recognitions;
   DROP TABLE IF EXISTS known_locations;
   DROP TABLE IF EXISTS region_optimizations;
   ```

3. **Restore Previous Version**
   - Redeploy previous commit
   - Verify old functionality works

## 📞 Support Contacts

- **Database Issues**: Check Neon dashboard
- **API Issues**: Review Vercel logs
- **Code Issues**: Check GitHub repository

## ✅ Final Sign-Off

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Database migrated
- [ ] Code deployed
- [ ] Monitoring active
- [ ] Team notified

**Deployment Date**: _____________
**Deployed By**: _____________
**Status**: ⬜ Success ⬜ Issues ⬜ Rollback

---

**Notes:**
_Add any deployment-specific notes here_
