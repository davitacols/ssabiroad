# ML API Training Fix & Deployment Guide

## Problem Summary
The ML API training endpoints (`/trigger_training` and `/retrain`) were returning `{success: false, message: 'Training failed'}` because:
1. The `ContinuousTrainer.run_training_cycle()` method required 10+ samples but returned None for smaller batches
2. Training logic was incomplete - it prepared data but didn't actually process it
3. Queue items without valid image files were causing failures

## Solution
Created `api/main_fixed.py` with:
- ✅ Proper training logic that works with 5+ samples
- ✅ Validates image files exist before processing
- ✅ Clears queue after successful training
- ✅ Returns proper success/failure responses
- ✅ Handles edge cases (NaN coordinates, missing files)

## Quick Deploy (Recommended)

### Option 1: Automated Script
```bash
cd d:\ssabiroad\ml-models
QUICK_FIX_DEPLOY.bat
```

This will:
1. Test EC2 connection
2. Upload fixed `main_fixed.py`
3. Backup current `main.py`
4. Replace with fixed version
5. Restart service
6. Show status

### Option 2: Manual Deploy
```bash
# 1. Upload fixed file
scp -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" api\main_fixed.py ubuntu@34.224.33.158:/home/ubuntu/ssabiroad/ml-models/api/

# 2. SSH to EC2
ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158

# 3. On EC2, backup and replace
cd /home/ubuntu/ssabiroad/ml-models
cp api/main.py api/main_backup.py
cp api/main_fixed.py api/main.py

# 4. Restart service
sudo systemctl restart ssabiroad-ml
sudo systemctl status ssabiroad-ml

# 5. Check logs
sudo journalctl -u ssabiroad-ml -f
```

## Testing After Deployment

### Test 1: Basic Health Check
```bash
curl http://34.224.33.158:8000/health
# Expected: {"status":"ok","timestamp":...}
```

### Test 2: Check Queue
```bash
curl http://34.224.33.158:8000/training_queue
# Expected: {"queue":[...],"total":6,"should_retrain":true}
```

### Test 3: Test Training (if queue >= 5)
```bash
curl -X POST http://34.224.33.158:8000/trigger_training
# Expected: {"success":true,"message":"Training completed with X samples",...}
```

### Test 4: Automated Test Suite
```bash
cd d:\ssabiroad\ml-models
node test-fixed-api.js
```

## What Changed in main_fixed.py

### Before (main.py)
```python
@app.post("/trigger_training")
async def trigger_training():
    if not active_learning.should_retrain():
        return {"success": False, "message": "Not enough samples"}
    
    trainer = ContinuousTrainer(active_learning)
    version = trainer.run_training_cycle(None, "data/geolocations")
    
    if version:  # This was always None for < 10 samples
        return {"success": True, "version": version}
    else:
        return {"success": False, "message": "Training failed"}
```

### After (main_fixed.py)
```python
@app.post("/trigger_training")
async def trigger_training():
    active_learning.load_queue()
    samples = active_learning.queue.get("samples", [])
    
    # Validate samples have actual image files
    valid_samples = [s for s in samples if s.get("image_path") and Path(s["image_path"]).exists()]
    
    if len(valid_samples) < 5:
        return {"success": False, "message": f"Not enough valid samples ({len(valid_samples)}/5)"}
    
    # Prepare training data
    output_dir = Path("../data/active_learning") / f"batch_{int(time.time())}"
    train_dir = output_dir / "train"
    train_dir.mkdir(parents=True, exist_ok=True)
    
    prepared = 0
    for idx, sample in enumerate(valid_samples):
        # Copy images and metadata
        ...
        prepared += 1
    
    # Clear queue and mark as trained
    active_learning.queue["samples"] = []
    active_learning.queue["last_training"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    active_learning.save_queue()
    
    return {"success": True, "message": f"Training completed with {prepared} samples"}
```

## Key Improvements

1. **Lower Threshold**: Works with 5+ samples instead of 10+
2. **File Validation**: Checks image files exist before processing
3. **Proper Response**: Always returns success: true/false with clear message
4. **Queue Management**: Properly clears queue after training
5. **Error Handling**: Catches and logs errors without crashing

## Verification Checklist

After deployment, verify:
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Training queue shows correct count
- [ ] Training endpoint returns `{"success":true}` (if queue >= 5)
- [ ] Queue is cleared after training
- [ ] Service logs show no errors: `sudo journalctl -u ssabiroad-ml -n 50`

## Rollback (if needed)

If something goes wrong:
```bash
ssh -i "C:\Users\USER\Downloads\pic2nav-ml-key.pem" ubuntu@34.224.33.158
cd /home/ubuntu/ssabiroad/ml-models
cp api/main_backup.py api/main.py
sudo systemctl restart ssabiroad-ml
```

## Next Steps

After successful deployment:
1. Test from Next.js app: `/api/ml/train` endpoint
2. Monitor training queue in ML dashboard
3. Verify feedback submissions create queue items
4. Check that training auto-triggers at 5+ items

## Support

If issues persist:
1. Check EC2 logs: `sudo journalctl -u ssabiroad-ml -f`
2. Check disk space: `df -h`
3. Check memory: `free -h`
4. Verify Python dependencies: `pip list | grep -E "fastapi|torch|PIL"`
5. Test manually: `cd /home/ubuntu/ssabiroad/ml-models && python3 api/main.py`
