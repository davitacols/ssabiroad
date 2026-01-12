@echo off
echo Committing ML service changes...
echo.

cd /d d:\ssabiroad

echo Adding files...
git add navisense-ml/
git add app/admin/ml-training/page.tsx
git add app/api/location-recognition-v2/route.ts
git add scripts/check-ready-for-training.js
git add scripts/check-training-data.js
git add scripts/sync-training.js
git add scripts/test-ml-pipeline.js
git add scripts/train-from-db.js
git add scripts/verify-training.js
git add .gitignore

echo.
echo Committing...
git commit -m "Add Navisense ML service with CLIP embeddings and Pinecone integration"

echo.
echo Pushing to GitHub...
git push origin master

echo.
echo Done! Now deploy on Render:
echo 1. Go to https://render.com
echo 2. New Web Service
echo 3. Connect GitHub repo
echo 4. Root Directory: navisense-ml
echo 5. Add environment variables from navisense-ml/DEPLOY.md
echo.
pause
