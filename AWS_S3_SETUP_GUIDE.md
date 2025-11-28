# AWS S3 Setup Guide for Blog Image Uploads

## Step 1: Create S3 Bucket

1. Go to **AWS Console**: https://console.aws.amazon.com/s3/
2. Click **"Create bucket"**
3. **Bucket name**: `pic2nav-blog-2025` (must be globally unique)
4. **Region**: `us-east-1` (US East N. Virginia)
5. **Object Ownership**: ACLs disabled (recommended)
6. **Block Public Access**: UNCHECK all boxes (we need public access)
7. Click **"Create bucket"**

## Step 2: Enable Public Access

1. Click on your bucket name
2. Go to **"Permissions"** tab
3. Scroll to **"Block public access"**
4. Click **"Edit"**
5. UNCHECK all 4 boxes
6. Click **"Save changes"**
7. Type `confirm` and click **"Confirm"**

## Step 3: Add Bucket Policy

1. Still in **"Permissions"** tab
2. Scroll to **"Bucket policy"**
3. Click **"Edit"**
4. Paste this policy (replace `pic2nav-blog-2025` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pic2nav-blog-2025/*"
    }
  ]
}
```

5. Click **"Save changes"**

## Step 4: Create IAM User (if needed)

1. Go to **IAM Console**: https://console.aws.amazon.com/iam/
2. Click **"Users"** → **"Create user"**
3. **User name**: `pic2nav-s3-uploader`
4. Click **"Next"**
5. **Permissions**: Click **"Attach policies directly"**
6. Search and select: `AmazonS3FullAccess`
7. Click **"Next"** → **"Create user"**

## Step 5: Create Access Keys

1. Click on the user you just created
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"**
4. Click **"Create access key"**
5. Select **"Application running outside AWS"**
6. Click **"Next"** → **"Create access key"**
7. **COPY BOTH**:
   - Access key ID
   - Secret access key

## Step 6: Update .env.local

Add these to your `.env.local` file:

```env
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID_HERE
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY_HERE
AWS_S3_REGION_NAME=us-east-1
AWS_S3_BUCKET_NAME=pic2nav-blog-2025
```

## Step 7: Update Upload Route

The code is already set up. Just make sure the bucket name matches in `.env.local`.

## Step 8: Test Upload

1. Restart your dev server
2. Go to `/blog/create`
3. Try uploading an image
4. Image should upload to S3 and return URL like:
   `https://pic2nav-blog-2025.s3.us-east-1.amazonaws.com/blog/1234567890-image.jpg`

## Troubleshooting

### Error: AccessDenied
- Check IAM user has S3 permissions
- Verify access keys are correct

### Error: NoSuchBucket
- Bucket name must match exactly
- Check region is correct

### Error: Access Blocked
- Ensure "Block public access" is OFF
- Verify bucket policy is applied

### Images not loading
- Check bucket policy allows public read
- Verify CORS if needed (usually not required for simple uploads)

## Optional: Add CORS (if uploading from browser)

1. Go to bucket → **"Permissions"** → **"CORS"**
2. Add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

---

**Done!** Your S3 bucket is ready for blog image uploads.
