"""
Initial training data loader - populates Pinecone with verified feedback
"""
import os
import psycopg2
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

def main():
    print("Navisense Training Data Loader\n")
    
    # Connect to database
    print("Connecting to PostgreSQL...")
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url, sslmode='require')
    cur = conn.cursor()
    
    # Get verified recognitions
    print("Fetching verified recognitions...")
    cur.execute("""
        SELECT 
            lr.id,
            lr.latitude,
            lr.longitude,
            lr.address,
            lr.business_name,
            lr.image_url,
            lr.method,
            lr.created_at,
            COUNT(lf.id) as feedback_count
        FROM location_recognitions lr
        LEFT JOIN location_feedback lf ON lr.id = lf."recognitionId"
        WHERE lf.is_correct = true
        GROUP BY lr.id
        ORDER BY lr.created_at DESC
    """)
    
    rows = cur.fetchall()
    print(f"Found {len(rows)} verified recognitions\n")
    
    if len(rows) == 0:
        print("No verified training data found yet.")
        print("Users need to provide feedback on location recognitions first.")
        return
    
    # Display training data
    print("Training Data Summary:")
    print("-" * 80)
    for row in rows:
        rec_id, lat, lng, address, business, image_url, method, created, feedback_count = row
        print(f"ID: {rec_id[:8]}...")
        print(f"  Location: {lat}, {lng}")
        print(f"  Business: {business or 'N/A'}")
        print(f"  Address: {address or 'N/A'}")
        print(f"  Method: {method}")
        print(f"  Feedback: {feedback_count} confirmations")
        print(f"  Image: {image_url or 'No image stored'}")
        print()
    
    print("-" * 80)
    print(f"\nTotal verified locations ready for training: {len(rows)}")
    
    # Check Pinecone status
    print("\nChecking Pinecone status...")
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index_name = os.getenv("PINECONE_INDEX_NAME", "navisense-locations")
    
    if index_name in pc.list_indexes().names():
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        print(f"Pinecone index exists: {index_name}")
        print(f"   Vectors stored: {stats.total_vector_count}")
    else:
        print(f"Pinecone index '{index_name}' not found")
        print("   It will be created when the ML service starts")
    
    print("\n" + "=" * 80)
    print("Next Steps:")
    print("1. Store images in S3 or local storage")
    print("2. Start the ML service: python app.py")
    print("3. Run sync: POST http://localhost:8000/sync-training")
    print("4. Test predictions: POST http://localhost:8000/predict")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
