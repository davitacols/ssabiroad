const { S3Client, CreateBucketCommand, PutBucketPolicyCommand, PutPublicAccessBlockCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'pic2nav-blog-2025';

async function setupBucket() {
  try {
    // Create bucket
    console.log('Creating bucket...');
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
    console.log('✓ Bucket created');

    // Disable block public access
    console.log('Configuring public access...');
    await s3Client.send(new PutPublicAccessBlockCommand({
      Bucket: BUCKET_NAME,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    }));
    console.log('✓ Public access configured');

    // Set bucket policy for public read
    console.log('Setting bucket policy...');
    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
      }],
    };

    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(policy),
    }));
    console.log('✓ Bucket policy set');

    console.log(`\n✅ S3 bucket "${BUCKET_NAME}" is ready!`);
    console.log(`\nAdd to .env.local:\nAWS_S3_BUCKET_NAME=${BUCKET_NAME}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupBucket();
