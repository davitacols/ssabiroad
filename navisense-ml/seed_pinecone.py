import os
import io
import hashlib
import torch
from PIL import Image
from pinecone import Pinecone, ServerlessSpec
import psycopg2
from dotenv import load_dotenv
import boto3

from backbone import load_backbone

load_dotenv()

s3_client = boto3.client('s3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_S3_REGION_NAME', 'us-east-1'))

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
model, processor, device, backbone_info = load_backbone()
index_name = backbone_info["index_name"]
embedding_dim = int(backbone_info["embedding_dim"])
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=embedding_dim,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
index = pc.Index(index_name)

def generate_embedding(image: Image.Image):
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        embeddings = model.get_image_features(**inputs)
    return embeddings[0].cpu().numpy().tolist()

print("🔄 Seeding Pinecone with verified locations...")

conn = psycopg2.connect(
    host=os.getenv('POSTGRES_HOST'),
    database=os.getenv('POSTGRES_DATABASE'),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD'),
    sslmode='require'
)
cur = conn.cursor()

# Get verified locations with images
cur.execute('''
    SELECT DISTINCT lr.latitude, lr.longitude, lr."detectedAddress", lr."businessName", lr."imageUrl"
    FROM location_recognitions lr
    WHERE lr.latitude IS NOT NULL 
    AND lr.longitude IS NOT NULL
    AND lr."imageUrl" IS NOT NULL
    AND lr.method != 'navisense-ml'
    LIMIT 50
''')

rows = cur.fetchall()
print(f"Found {len(rows)} locations to seed")

synced = 0
failed = 0

for lat, lng, address, business, image_url in rows:
    try:
        # Download image from S3
        bucket = os.getenv('AWS_S3_BUCKET_NAME')
        key = image_url.replace(f'https://{bucket}.s3.amazonaws.com/', '')
        
        response = s3_client.get_object(Bucket=bucket, Key=key)
        image_bytes = response['Body'].read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        
        # Create vector ID
        img_hash = hashlib.sha256(image_bytes).hexdigest()
        vector_id = f"loc_{img_hash[:16]}"
        
        # Store in Pinecone
        metadata = {"latitude": float(lat), "longitude": float(lng)}
        if address:
            metadata["address"] = address
        if business:
            metadata["businessName"] = business
        
        index.upsert(vectors=[(vector_id, embedding, metadata)])
        synced += 1
        print(f"✅ Synced: {business or address or 'Location'}")
        
    except Exception as e:
        failed += 1
        print(f"❌ Failed: {e}")

cur.close()
conn.close()

print(f"\n✅ Seeding complete: {synced} synced, {failed} failed")
print(f"📊 Total vectors in Pinecone: {index.describe_index_stats().total_vector_count}")
