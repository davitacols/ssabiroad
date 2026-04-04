import io
import hashlib
import json
import mimetypes
import os
import random
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import boto3
import numpy as np
import psycopg2
import torch
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pinecone import Pinecone, ServerlessSpec

from architectural_matcher import ArchitecturalMatcher
from backbone import load_backbone
from enhanced_ocr import EnhancedOCR
from geolocation_model import GeolocationPredictor
from navisense_v3 import NaviSenseV3

load_dotenv()

s3_client = boto3.client('s3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_S3_REGION_NAME', 'us-east-1'))

app = FastAPI(title="Navisense ML API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def resolve_index_dimension(description: Any) -> Optional[int]:
    if description is None:
        return None

    if isinstance(description, dict):
        value = description.get("dimension")
        return value if isinstance(value, int) else None

    for attribute in ("dimension",):
        value = getattr(description, attribute, None)
        if isinstance(value, int):
            return value

    if hasattr(description, "to_dict"):
        try:
            as_dict = description.to_dict()
            value = as_dict.get("dimension")
            return value if isinstance(value, int) else None
        except Exception:
            return None

    return None


model, processor, device, backbone_info = load_backbone()
EMBEDDING_DIM = int(backbone_info["embedding_dim"])
BACKBONE_MODEL_NAME = str(backbone_info["model_name"])

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = backbone_info["index_name"]
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=EMBEDDING_DIM,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
else:
    index_description = None
    try:
        index_description = pc.describe_index(index_name)
    except Exception as error:
        print(f"Unable to inspect Pinecone index '{index_name}' dimension: {error}")

    existing_dimension = resolve_index_dimension(index_description)
    if existing_dimension is not None and existing_dimension != EMBEDDING_DIM:
        raise RuntimeError(
            f"Pinecone index '{index_name}' dimension ({existing_dimension}) does not match "
            f"the configured backbone '{BACKBONE_MODEL_NAME}' ({EMBEDDING_DIM}). "
            "Set PINECONE_INDEX_NAME to a compatible index or use a matching backbone."
        )
index = pc.Index(index_name)

# Initialize new ML components
geolocation_predictor = GeolocationPredictor(device, embedding_dim=EMBEDDING_DIM)
architectural_matcher = ArchitecturalMatcher()
enhanced_ocr = EnhancedOCR()
navisense_v3 = NaviSenseV3(model, processor, device, embedding_dim=EMBEDDING_DIM)
CODE_VERSION = "2026-04-01-configurable-backbone"
TRAINING_IMAGE_PREFIX = os.getenv("TRAINING_IMAGE_PREFIX", "navisense-training/direct")
TRAINING_SPLIT_SEED = 42

print("All ML models initialized successfully")

@app.on_event("startup")
def load_cached_artifacts():
    architectural_matcher.load_features()
    print("Architectural matcher features loaded")


def build_scene_analysis(
    embedding_np: np.ndarray,
    ocr_text: Optional[str] = None,
    context_clues: Optional[List[str]] = None,
) -> Dict[str, Any]:
    try:
        return navisense_v3.analyze_scene(
            embedding_np,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )
    except Exception as error:
        return {"error": str(error)}

def parse_context_hint_field(value: Optional[str]) -> List[str]:
    if not value:
        return []

    stripped = value.strip()
    if not stripped:
        return []

    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except json.JSONDecodeError:
        pass

    return [part.strip() for part in re.split(r"[\n,|]+", stripped) if part.strip()]

def score_context_clue(clue: str) -> int:
    normalized = clue.lower()
    score = 0

    if (
        re.search(r"\d", normalized)
        or "," in normalized
        or any(
            token in normalized
            for token in [
                "road",
                "street",
                "avenue",
                "boulevard",
                "junction",
                "retail park",
                "shopping centre",
                "shopping center",
                "industrial estate",
                "mall",
                "district",
                "estate",
                "park",
            ]
        )
    ):
        score += 4

    if any(
        token in normalized
        for token in [
            "commercial",
            "retail",
            "storefront",
            "industrial",
            "warehouse",
            "suburban",
            "urban",
            "coastal",
            "tropical",
            "residential",
            "office",
            "facade",
            "signage",
            "roadside",
        ]
    ):
        score += 2

    if len(normalized.split()) >= 3:
        score += 1

    return score

def collect_multimodal_context_clues(
    ocr_text: Optional[str] = None,
    context_labels: Optional[str] = None,
    best_guess_labels: Optional[str] = None,
) -> List[str]:
    context_candidates = []
    seen = set()

    for clue in parse_context_hint_field(context_labels) + parse_context_hint_field(best_guess_labels):
        lowered = clue.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        context_candidates.append(clue)

    context_candidates.sort(
        key=lambda clue: (score_context_clue(clue), len(clue)),
        reverse=True,
    )

    collected = []
    if ocr_text and ocr_text.strip():
        normalized_text = re.sub(r"\s+", " ", ocr_text).strip()
        if normalized_text:
            lowered = normalized_text.lower()
            if lowered not in seen:
                collected.append(normalized_text)
                seen.add(lowered)

    context_limit = 11 if collected else 12
    collected.extend(context_candidates[:context_limit])

    return collected[:12]

def generate_embedding(image: Image.Image):
    """Generate a backbone embedding for an input image."""
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        embeddings = model.get_image_features(**inputs)
    return embeddings[0].cpu().numpy().tolist()

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST'),
        database=os.getenv('POSTGRES_DATABASE'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        sslmode='require'
    )

def parse_metadata(metadata: Optional[str]) -> Dict[str, Any]:
    if not metadata:
        return {}

    try:
        parsed = json.loads(metadata)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}

def sanitize_storage_segment(value: Optional[str], default: str = "direct-train") -> str:
    cleaned = re.sub(r"[^a-z0-9_-]+", "-", (value or default).lower()).strip("-")
    return cleaned or default

def infer_file_extension(content_type: Optional[str], filename: Optional[str]) -> str:
    if filename:
        _, ext = os.path.splitext(filename)
        if ext:
            return ext.lower()

    if content_type:
        guessed = mimetypes.guess_extension(content_type.split(";")[0].strip()) or ""
        if guessed == ".jpe":
            return ".jpg"
        if guessed:
            return guessed.lower()

    return ".jpg"

def resolve_s3_key(image_url: str) -> str:
    if image_url.startswith('https://'):
        return image_url.split('.s3.amazonaws.com/')[-1]
    if image_url.startswith('blog/'):
        return image_url
    if image_url.startswith('navisense-training/'):
        return image_url
    return f"navisense-training/{image_url}"

def build_s3_url(key: str) -> str:
    bucket = os.getenv('AWS_S3_BUCKET_NAME')
    if not bucket:
        raise RuntimeError("AWS_S3_BUCKET_NAME is not configured")
    return f"https://{bucket}.s3.amazonaws.com/{key}"

def upload_training_image(
    image_bytes: bytes,
    image_hash: str,
    content_type: Optional[str],
    filename: Optional[str],
    source: Optional[str]
) -> str:
    bucket = os.getenv('AWS_S3_BUCKET_NAME')
    if not bucket:
        raise RuntimeError("AWS_S3_BUCKET_NAME is not configured")

    extension = infer_file_extension(content_type, filename)
    source_segment = sanitize_storage_segment(source)
    s3_key = f"{TRAINING_IMAGE_PREFIX}/{source_segment}/{image_hash[:2]}/{image_hash}{extension}"
    s3_client.put_object(
        Bucket=bucket,
        Key=s3_key,
        Body=image_bytes,
        ContentType=content_type or "application/octet-stream"
    )
    return build_s3_url(s3_key)

def load_image_from_s3(image_url: str) -> Tuple[bytes, Image.Image]:
    bucket = os.getenv('AWS_S3_BUCKET_NAME')
    if not bucket:
        raise RuntimeError("AWS_S3_BUCKET_NAME is not configured")

    response = s3_client.get_object(Bucket=bucket, Key=resolve_s3_key(image_url))
    image_bytes = response['Body'].read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return image_bytes, image

def build_vector_metadata(record: Dict[str, Any]) -> Dict[str, Any]:
    metadata = {
        "latitude": float(record["latitude"]),
        "longitude": float(record["longitude"]),
        "source": record.get("source", "unknown")
    }
    if record.get("address"):
        metadata["address"] = record["address"]
    if record.get("businessName"):
        metadata["businessName"] = record["businessName"]
    if record.get("originalMethod"):
        metadata["originalMethod"] = record["originalMethod"]
    return metadata

def normalize_candidate_text(value: Optional[str]) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()

def build_candidate_location_key(metadata: Optional[Dict[str, Any]]) -> str:
    metadata = metadata or {}
    latitude = metadata.get("latitude")
    longitude = metadata.get("longitude")
    address = normalize_candidate_text(metadata.get("address"))
    business_name = normalize_candidate_text(metadata.get("businessName"))
    semantic_name = address or business_name

    if latitude is not None and longitude is not None:
        try:
            lat_key = round(float(latitude), 4)
            lng_key = round(float(longitude), 4)
            if semantic_name:
                return f"{lat_key}:{lng_key}:{semantic_name}"
            return f"{lat_key}:{lng_key}"
        except (TypeError, ValueError):
            pass

    return semantic_name or "unknown"

def dedupe_architectural_candidates(
    arch_matches: List[Tuple[str, float]],
    pinecone_matches: Any,
) -> Tuple[List[Tuple[Any, float]], int]:
    match_lookup = {match.id: match for match in pinecone_matches}
    deduped: List[Tuple[Any, float]] = []
    seen_keys = set()
    collapsed_duplicates = 0

    for match_id, score in arch_matches:
        pinecone_match = match_lookup.get(match_id)
        if pinecone_match is None:
            continue

        candidate_key = build_candidate_location_key(getattr(pinecone_match, "metadata", {}))
        if candidate_key in seen_keys:
            collapsed_duplicates += 1
            continue

        seen_keys.add(candidate_key)
        deduped.append((pinecone_match, float(score)))

    return deduped, collapsed_duplicates

def upsert_training_vector(image_hash: str, embedding: List[float], metadata: Dict[str, Any]) -> str:
    vector_id = f"loc_{image_hash[:16]}"
    legacy_feedback_id = f"fb_{image_hash[:16]}"
    index.upsert(vectors=[(vector_id, embedding, metadata)])
    if legacy_feedback_id != vector_id:
        try:
            index.delete(ids=[legacy_feedback_id])
        except Exception:
            pass
    return vector_id

def upsert_training_record(
    image_url: str,
    image_hash: str,
    latitude: float,
    longitude: float,
    address: Optional[str] = None,
    business_name: Optional[str] = None,
    verified: bool = True,
    user_corrected: bool = False,
    confidence: Optional[float] = None,
    user_id: Optional[str] = None,
    trained: bool = False
) -> None:
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        trained_at = datetime.now(timezone.utc) if trained else None
        cur.execute(
            '''
            INSERT INTO "NavisenseTraining" (
                "imageUrl", "imageHash", latitude, longitude, address, "businessName",
                verified, "userCorrected", confidence, "userId", "trainedAt"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT ("imageHash") DO UPDATE SET
                "imageUrl" = EXCLUDED."imageUrl",
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                address = COALESCE(EXCLUDED.address, "NavisenseTraining".address),
                "businessName" = COALESCE(EXCLUDED."businessName", "NavisenseTraining"."businessName"),
                verified = EXCLUDED.verified OR "NavisenseTraining".verified,
                "userCorrected" = EXCLUDED."userCorrected" OR "NavisenseTraining"."userCorrected",
                confidence = COALESCE(EXCLUDED.confidence, "NavisenseTraining".confidence),
                "userId" = COALESCE(EXCLUDED."userId", "NavisenseTraining"."userId"),
                "trainedAt" = COALESCE(EXCLUDED."trainedAt", "NavisenseTraining"."trainedAt")
            ''',
            (
                image_url,
                image_hash,
                float(latitude),
                float(longitude),
                address,
                business_name,
                verified,
                user_corrected,
                confidence,
                user_id,
                trained_at
            )
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()

def mark_training_records_trained(image_hashes: List[str]) -> None:
    if not image_hashes:
        return

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            'UPDATE "NavisenseTraining" SET "trainedAt" = %s WHERE "imageHash" = ANY(%s)',
            (datetime.now(timezone.utc), image_hashes)
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()

def fetch_combined_training_records(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            '''
            SELECT "imageUrl", "imageHash", latitude, longitude, address, "businessName",
                   verified, "userCorrected", confidence, "userId", "createdAt"
            FROM "NavisenseTraining"
            WHERE verified = true AND "imageUrl" IS NOT NULL
            ORDER BY "createdAt" DESC
            '''
        )
        training_rows = cur.fetchall()

        cur.execute(
            '''
            SELECT lr."imageUrl", lr."imageHash", lf."correctLat", lf."correctLng",
                   COALESCE(lf."correctAddress", lr."detectedAddress"), lr."businessName",
                   lf."createdAt", lr."userId"
            FROM location_feedback lf
            JOIN location_recognitions lr ON lf."recognitionId" = lr.id
            WHERE lf."wasCorrect" = true
              AND lf."correctLat" IS NOT NULL
              AND lf."correctLng" IS NOT NULL
              AND lr."imageUrl" IS NOT NULL
            ORDER BY lf."createdAt" DESC
            '''
        )
        feedback_rows = cur.fetchall()
    finally:
        cur.close()
        conn.close()

    combined: List[Dict[str, Any]] = []

    for row in training_rows:
        image_url, image_hash, lat, lng, addr, business_name, verified, user_corrected, confidence, user_id, created_at = row
        combined.append({
            "source": "navisense_training",
            "priority": 1,
            "image_url": image_url,
            "image_hash": image_hash,
            "latitude": float(lat),
            "longitude": float(lng),
            "address": addr,
            "businessName": business_name,
            "verified": bool(verified),
            "userCorrected": bool(user_corrected),
            "confidence": float(confidence) if confidence is not None else None,
            "userId": user_id,
            "created_at": created_at,
            "place_key": build_place_key({
                "latitude": float(lat),
                "longitude": float(lng),
                "address": addr,
                "businessName": business_name
            })
        })

    for row in feedback_rows:
        image_url, image_hash, lat, lng, addr, business_name, created_at, user_id = row
        canonical_hash = image_hash or hashlib.sha256(image_url.encode()).hexdigest()
        combined.append({
            "source": "verified_feedback",
            "priority": 2,
            "image_url": image_url,
            "image_hash": canonical_hash,
            "latitude": float(lat),
            "longitude": float(lng),
            "address": addr,
            "businessName": business_name,
            "verified": True,
            "userCorrected": True,
            "confidence": None,
            "userId": user_id,
            "created_at": created_at,
            "place_key": build_place_key({
                "latitude": float(lat),
                "longitude": float(lng),
                "address": addr,
                "businessName": business_name
            })
        })

    combined.sort(key=lambda record: (record["priority"], sort_timestamp(record["created_at"])), reverse=True)

    deduped: Dict[str, Dict[str, Any]] = {}
    for record in combined:
        image_hash = record["image_hash"]
        if image_hash not in deduped:
            deduped[image_hash] = record
            continue

        existing = deduped[image_hash]
        if not existing.get("address") and record.get("address"):
            existing["address"] = record["address"]
        if not existing.get("businessName") and record.get("businessName"):
            existing["businessName"] = record["businessName"]

    deduped_records = list(deduped.values())
    deduped_records.sort(key=lambda record: sort_timestamp(record["created_at"]), reverse=True)

    if limit is not None:
        return deduped_records[:limit]
    return deduped_records

def fetch_recognition_backfill_records(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        query = '''
            SELECT "imageUrl", "imageHash", latitude, longitude, "detectedAddress",
                   "businessName", method, "createdAt"
            FROM location_recognitions
            WHERE latitude IS NOT NULL
              AND longitude IS NOT NULL
              AND "imageUrl" IS NOT NULL
              AND method != 'navisense-ml'
            ORDER BY "createdAt" DESC
        '''
        params: Tuple[Any, ...] = ()
        if limit is not None:
            query += ' LIMIT %s'
            params = (limit,)

        cur.execute(query, params)
        rows = cur.fetchall()
    finally:
        cur.close()
        conn.close()

    records: List[Dict[str, Any]] = []
    for row in rows:
        image_url, image_hash, lat, lng, addr, business_name, method, created_at = row
        canonical_hash = image_hash or hashlib.sha256(image_url.encode()).hexdigest()
        records.append({
            "source": "historical_recognition",
            "originalMethod": method,
            "image_url": image_url,
            "image_hash": canonical_hash,
            "latitude": float(lat),
            "longitude": float(lng),
            "address": addr,
            "businessName": business_name,
            "created_at": created_at,
        })

    deduped: Dict[str, Dict[str, Any]] = {}
    for record in records:
        image_hash = record["image_hash"]
        if image_hash not in deduped:
            deduped[image_hash] = record
            continue

        existing = deduped[image_hash]
        if not existing.get("address") and record.get("address"):
            existing["address"] = record["address"]
        if not existing.get("businessName") and record.get("businessName"):
            existing["businessName"] = record["businessName"]

    deduped_records = list(deduped.values())
    deduped_records.sort(key=lambda record: sort_timestamp(record["created_at"]), reverse=True)
    return deduped_records

def prepare_training_examples(
    records: List[Dict[str, Any]],
    sync_vectors: bool = False
) -> Tuple[List[Dict[str, Any]], List[Dict[str, str]]]:
    prepared = []
    failures = []

    for record in records:
        try:
            _, image = load_image_from_s3(record["image_url"])
            embedding = generate_embedding(image)
            record_copy = dict(record)
            record_copy["embedding"] = embedding
            prepared.append(record_copy)

            if sync_vectors:
                upsert_training_vector(
                    record_copy["image_hash"],
                    embedding,
                    build_vector_metadata(record_copy)
                )
        except Exception as e:
            failures.append({
                "image_hash": record["image_hash"],
                "image_url": record["image_url"],
                "error": str(e)
            })

    return prepared, failures

def count_unique_places(examples: List[Dict[str, Any]]) -> int:
    return len({
        example.get("place_key") or build_place_key(example)
        for example in examples
    })

def split_examples_by_place(
    examples: List[Dict[str, Any]],
    validation_ratio: float = 0.2,
    minimum_validation_examples: int = 0,
    random_seed: int = TRAINING_SPLIT_SEED
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    if len(examples) < 2:
        return examples, [], {
            "seed": random_seed,
            "requested_validation_ratio": validation_ratio,
            "minimum_validation_examples": minimum_validation_examples,
            "target_validation_examples": 0,
            "train_samples": len(examples),
            "validation_samples": 0,
            "train_unique_places": count_unique_places(examples),
            "validation_unique_places": 0,
            "total_unique_places": count_unique_places(examples),
            "actual_validation_ratio": 0.0,
        }

    grouped_examples: Dict[str, List[Dict[str, Any]]] = {}
    for example in examples:
        place_key = example.get("place_key") or build_place_key(example)
        grouped_examples.setdefault(place_key, []).append(example)

    place_keys = list(grouped_examples.keys())
    if len(place_keys) < 2:
        shuffled = list(examples)
        random.Random(random_seed).shuffle(shuffled)
        return shuffled, [], {
            "seed": random_seed,
            "requested_validation_ratio": validation_ratio,
            "minimum_validation_examples": minimum_validation_examples,
            "target_validation_examples": 0,
            "train_samples": len(shuffled),
            "validation_samples": 0,
            "train_unique_places": count_unique_places(shuffled),
            "validation_unique_places": 0,
            "total_unique_places": count_unique_places(shuffled),
            "actual_validation_ratio": 0.0,
        }

    random.Random(random_seed).shuffle(place_keys)

    target_validation_size = (
        max(1, int(round(len(examples) * validation_ratio)))
        if len(examples) >= 5
        else 0
    )
    max_validation_examples = max(0, len(examples) - 1)
    if minimum_validation_examples > 0:
        target_validation_size = max(
            target_validation_size,
            min(minimum_validation_examples, max_validation_examples)
        )
    if target_validation_size <= 0:
        training_examples = []
        for place_key in place_keys:
            training_examples.extend(grouped_examples[place_key])
        return training_examples, [], {
            "seed": random_seed,
            "requested_validation_ratio": validation_ratio,
            "minimum_validation_examples": minimum_validation_examples,
            "target_validation_examples": 0,
            "train_samples": len(training_examples),
            "validation_samples": 0,
            "train_unique_places": count_unique_places(training_examples),
            "validation_unique_places": 0,
            "total_unique_places": count_unique_places(training_examples),
            "actual_validation_ratio": 0.0,
        }

    validation_place_keys = []
    validation_count = 0

    for index, place_key in enumerate(place_keys):
        remaining_place_groups = len(place_keys) - (index + 1)
        if validation_count >= target_validation_size:
            break
        if remaining_place_groups <= 0:
            break
        candidate_group_size = len(grouped_examples[place_key])
        remaining_training_examples = len(examples) - (validation_count + candidate_group_size)
        if remaining_training_examples <= 0:
            break

        validation_place_keys.append(place_key)
        validation_count += candidate_group_size

    if not validation_place_keys:
        training_examples = []
        for place_key in place_keys:
            training_examples.extend(grouped_examples[place_key])
        return training_examples, [], {
            "seed": random_seed,
            "requested_validation_ratio": validation_ratio,
            "minimum_validation_examples": minimum_validation_examples,
            "target_validation_examples": target_validation_size,
            "train_samples": len(training_examples),
            "validation_samples": 0,
            "train_unique_places": count_unique_places(training_examples),
            "validation_unique_places": 0,
            "total_unique_places": count_unique_places(training_examples),
            "actual_validation_ratio": 0.0,
        }

    validation_place_key_set = set(validation_place_keys)
    training_examples = []
    validation_examples = []

    for place_key in place_keys:
        target = validation_examples if place_key in validation_place_key_set else training_examples
        target.extend(grouped_examples[place_key])

    return training_examples, validation_examples, {
        "seed": random_seed,
        "requested_validation_ratio": validation_ratio,
        "minimum_validation_examples": minimum_validation_examples,
        "target_validation_examples": target_validation_size,
        "train_samples": len(training_examples),
        "validation_samples": len(validation_examples),
        "train_unique_places": count_unique_places(training_examples),
        "validation_unique_places": count_unique_places(validation_examples),
        "total_unique_places": count_unique_places(examples),
        "actual_validation_ratio": (
            len(validation_examples) / len(examples) if examples else 0.0
        ),
    }

def split_training_examples(
    examples: List[Dict[str, Any]],
    validation_ratio: float = 0.2
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    training_examples, validation_examples, _ = split_examples_by_place(
        examples,
        validation_ratio=validation_ratio,
        minimum_validation_examples=0,
        random_seed=TRAINING_SPLIT_SEED,
    )
    return training_examples, validation_examples

def choose_training_epochs(sample_count: int) -> int:
    if sample_count < 20:
        return 60
    if sample_count < 75:
        return 40
    return 25

def sort_timestamp(value: Optional[datetime]) -> float:
    if value is None:
        return 0.0
    return value.timestamp()

def normalize_place_text(value: Optional[str]) -> str:
    if not value:
        return ""
    normalized = re.sub(r"\s+", " ", value.strip().lower())
    normalized = re.sub(r"[^a-z0-9\s,.-]", "", normalized)
    return normalized.strip()

def build_place_key(record: Dict[str, Any]) -> str:
    address = normalize_place_text(record.get("address"))
    business_name = normalize_place_text(record.get("businessName"))
    lat_bucket = round(float(record["latitude"]), 4)
    lng_bucket = round(float(record["longitude"]), 4)

    if address and business_name:
        return f"{business_name}|{address}"
    if address:
        return f"addr|{address}"
    if business_name:
        return f"biz|{business_name}|{lat_bucket}|{lng_bucket}"
    return f"coords|{lat_bucket}|{lng_bucket}"

def build_evaluation_results(
    eval_examples: List[Dict[str, Any]],
    include_scene_analysis: bool = False
) -> Dict[str, Any]:
    geo_evaluation = geolocation_predictor.evaluate_accuracy(
        [example["embedding"] for example in eval_examples],
        [example["latitude"] for example in eval_examples],
        [example["longitude"] for example in eval_examples]
    )

    arch_test_results = []
    eval_embeddings = [example["embedding"] for example in eval_examples]
    if len(eval_embeddings) >= 2:
        query_emb = np.array(eval_embeddings[0])
        candidates = [{
            'id': f'test_{i}',
            'embedding': emb,
            'metadata': {'test': True}
        } for i, emb in enumerate(eval_embeddings[1:6])]

        arch_matches = architectural_matcher.match_building(query_emb, candidates)
        arch_test_results = arch_matches[:3]

    sample_ocr_text = "McDonald's Restaurant\n123 Main Street\n(555) 123-4567\nOpen 24 Hours"
    ocr_results = enhanced_ocr.extract_all(sample_ocr_text)
    ocr_confidence = enhanced_ocr.confidence_score(ocr_results)
    navisense_v3_evaluation = navisense_v3.evaluate(eval_examples)

    sample_scene_analysis = None
    if include_scene_analysis and eval_embeddings:
        sample_scene_analysis = build_scene_analysis(np.array(eval_embeddings[0]))

    return {
        "geolocation_model": {
            "average_error_km": geo_evaluation['average_error_km'],
            "median_error_km": geo_evaluation['median_error_km'],
            "within_1km": geo_evaluation['within_1km'],
            "within_10km": geo_evaluation['within_10km'],
            "within_50km": geo_evaluation['within_50km'],
            "confidence_gate": geolocation_predictor.confidence_gate,
            "confidence_calibration": geolocation_predictor.confidence_calibration,
            "samples_tested": geo_evaluation['total_samples'],
            "status": "good" if geo_evaluation['average_error_km'] < 50 else "needs_improvement"
        },
        "architectural_matcher": {
            "test_matches": arch_test_results,
            "buildings_in_database": len(architectural_matcher.building_features),
            "status": "operational"
        },
        "enhanced_ocr": {
            "sample_extraction": ocr_results,
            "confidence": ocr_confidence,
            "status": "operational"
        },
        "navisense_v3": {
            "training_examples": len(navisense_v3.training_examples),
            "score_gate": navisense_v3.score_gate,
            "metrics": navisense_v3_evaluation,
            "sample_scene_analysis": sample_scene_analysis,
            "status": "operational" if navisense_v3.training_examples else "warming_up"
        },
        "vector_database": {
            "index_name": index_name,
            "dimension": EMBEDDING_DIM,
            "total_vectors": index.describe_index_stats().total_vector_count,
            "status": "operational"
        }
    }

@app.get("/")
def read_root():
    return {
        "status": "Navisense ML API", 
        "version": "4.1",
        "features": [
            "Configurable Vision-Language Image Embeddings",
            "Geo Alignment Retrieval",
            "Geolocation Prediction", 
            "Multi-View Architectural Matching",
            "Enhanced OCR Analysis",
            "Landmark Detection",
            "Zero-Shot Scene Understanding"
        ]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "model": BACKBONE_MODEL_NAME, 
        "index_name": index_name,
        "embedding_dim": EMBEDDING_DIM,
        "device": device, 
        "code_version": CODE_VERSION,
        "confidence_gate": geolocation_predictor.confidence_gate,
        "vectors_in_db": index.describe_index_stats().total_vector_count,
        "geolocation_model": "loaded",
        "architectural_matcher": "loaded",
        "enhanced_ocr": "loaded",
        "navisense_v3": {
            "status": "loaded",
            "examples_cached": len(navisense_v3.training_examples),
            "score_gate": navisense_v3.score_gate
        }
    }

@app.get("/debug/parser-check")
def parser_check():
    sample_address = "123 Main Street"
    sample_phone = "(555) 123-4567"
    return {
        "code_version": CODE_VERSION,
        "address_input": sample_address,
        "address_output": enhanced_ocr.extract_addresses(sample_address),
        "phone_input": sample_phone,
        "phone_output": enhanced_ocr.extract_phone_numbers(sample_phone)
    }

@app.get("/stats")
def get_stats():
    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DATABASE'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            sslmode='require'
        )
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM location_recognitions")
        total_recognitions = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM location_feedback WHERE \"wasCorrect\" = true")
        verified_feedback = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM \"NavisenseTraining\" WHERE verified = true")
        navisense_training = cur.fetchone()[0]
        
        # Count verified feedback with correct locations (ready for training)
        cur.execute('''
            SELECT COUNT(*) FROM location_feedback lf
            JOIN location_recognitions lr ON lf."recognitionId" = lr.id
            WHERE lf."wasCorrect" = true AND lf."correctLat" IS NOT NULL 
            AND lf."correctLng" IS NOT NULL AND lr."imageUrl" IS NOT NULL
        ''')
        feedback_ready = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        vectors_in_pinecone = index.describe_index_stats().total_vector_count
        ready_for_training = navisense_training + feedback_ready
        
        return {
            "total_recognitions": total_recognitions,
            "verified_feedback": verified_feedback,
            "vectors_in_pinecone": vectors_in_pinecone,
            "ready_for_training": ready_for_training,
            "navisense_training": navisense_training,
            "feedback_ready": feedback_ready
        }
    except Exception as e:
        return {
            "total_recognitions": 0, 
            "verified_feedback": 0, 
            "vectors_in_pinecone": index.describe_index_stats().total_vector_count, 
            "ready_for_training": 0,
            "navisense_training": 0,
            "feedback_ready": 0
        }

@app.post("/sync-training")
async def sync_training(limit: Optional[int] = None):
    try:
        records = fetch_combined_training_records(limit=limit)
        synced = 0
        failed = 0
        failures = []

        for record in records:
            try:
                _, image = load_image_from_s3(record["image_url"])
                embedding = generate_embedding(image)
                upsert_training_vector(
                    record["image_hash"],
                    embedding,
                    build_vector_metadata(record)
                )
                synced += 1
            except Exception as e:
                failed += 1
                failures.append({
                    "image_hash": record["image_hash"],
                    "image_url": record["image_url"],
                    "error": str(e)
                })

        return {
            "success": True,
            "records_considered": len(records),
            "synced": synced,
            "skipped": 0,
            "failed": failed,
            "failures": failures[:5],
            "message": f"Synced {synced} training vectors from {len(records)} canonical records"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync-recognition-vectors")
async def sync_recognition_vectors(limit: int = Query(default=200, ge=1, le=5000)):
    try:
        records = fetch_recognition_backfill_records(limit=limit)
        before_count = index.describe_index_stats().total_vector_count
        synced = 0
        failed = 0
        failures = []

        for record in records:
            try:
                _, image = load_image_from_s3(record["image_url"])
                embedding = generate_embedding(image)
                upsert_training_vector(
                    record["image_hash"],
                    embedding,
                    build_vector_metadata(record)
                )
                synced += 1
            except Exception as e:
                failed += 1
                failures.append({
                    "image_hash": record["image_hash"],
                    "image_url": record["image_url"],
                    "error": str(e)
                })

        after_count = index.describe_index_stats().total_vector_count
        methods_seen = sorted({
            str(record.get("originalMethod"))
            for record in records
            if record.get("originalMethod")
        })

        return {
            "success": True,
            "records_considered": len(records),
            "synced": synced,
            "failed": failed,
            "failures": failures[:10],
            "vector_count_before": before_count,
            "vector_count_after": after_count,
            "methods_seen": methods_seen,
            "message": (
                f"Synced {synced} historical recognition vectors into index "
                f"'{index_name}' from {len(records)} recognition records"
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict_location(
    file: UploadFile = File(...),
    ocr_text: Optional[str] = Form(None),
    context_labels: Optional[str] = Form(None),
    best_guess_labels: Optional[str] = Form(None),
):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        context_clues = collect_multimodal_context_clues(
            ocr_text=ocr_text,
            context_labels=context_labels,
            best_guess_labels=best_guess_labels,
        )
        
        # Try exact hash match first
        img_hash = hashlib.sha256(image_bytes).hexdigest()
        exact_ids = [f"loc_{img_hash[:16]}", f"fb_{img_hash[:16]}"]
        exact_match = index.fetch(ids=exact_ids)
        
        if exact_match.vectors:
            for vector_id in exact_ids:
                if vector_id in exact_match.vectors:
                    match = exact_match.vectors[vector_id]
                    return {
                        "success": True,
                        "hasLocation": True,
                        "location": {
                            "latitude": float(match.metadata["latitude"]),
                            "longitude": float(match.metadata["longitude"]),
                            "address": match.metadata.get("address"),
                            "businessName": match.metadata.get("businessName")
                        },
                        "confidence": 1.0,
                        "method": "exact_match"
                    }
        
        # Generate embedding for similarity search, geospatial alignment, and scene analysis
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        scene_analysis = build_scene_analysis(
            embedding_np,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )
        geospatial_alignment = navisense_v3.predict(
            embedding_np,
            top_k=5,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )

        # Try similarity search with architectural matching
        results = index.query(
            vector=embedding,
            top_k=10,
            include_metadata=True,
            include_values=True
        )
        
        if results.matches:
            # Use architectural matcher for better building matching
            candidates = [{
                'id': match.id,
                'embedding': getattr(match, 'values', None),
                'metadata': match.metadata,
                'score': match.score
            } for match in results.matches]
            
            # Enhanced matching with architectural features
            arch_matches = architectural_matcher.match_building(embedding_np, candidates)
            multimodal_context = scene_analysis.get("multimodal_context", {}) if isinstance(scene_analysis, dict) else {}
            multimodal_enabled = bool(
                multimodal_context.get("enabled") and (multimodal_context.get("clue_count", 0) or 0) > 0
            )
            geospatial_alignment_confidence = (
                float(geospatial_alignment["confidence"])
                if geospatial_alignment and geospatial_alignment.get("confidence") is not None
                else 0.0
            )
             
            if arch_matches:
                unique_arch_matches, collapsed_duplicates = dedupe_architectural_candidates(
                    arch_matches,
                    results.matches,
                )
                unique_candidate_count = len(unique_arch_matches[:5])
                top_arch_score = unique_arch_matches[0][1] if unique_arch_matches else 0.0
                architectural_support = (
                    unique_candidate_count >= 2
                    or multimodal_enabled
                    or geospatial_alignment_confidence >= max(navisense_v3.score_gate - 0.06, 0.72)
                )
                architectural_gate = 0.88 if architectural_support else 0.93

                if unique_arch_matches and top_arch_score >= architectural_gate and architectural_support:
                    best_match = unique_arch_matches[0][0]

                    # Weight-averaged location from the strongest unique architectural matches
                    top_unique_arch = unique_arch_matches[: min(3, len(unique_arch_matches))]
                    total_weight = sum(score for _, score in top_unique_arch)

                    if total_weight > 0:
                        avg_lat = sum(float(match.metadata["latitude"]) * score for match, score in top_unique_arch) / total_weight
                        avg_lng = sum(float(match.metadata["longitude"]) * score for match, score in top_unique_arch) / total_weight

                        return {
                            "success": True,
                            "hasLocation": True,
                            "location": {
                                "latitude": avg_lat,
                                "longitude": avg_lng,
                                "address": best_match.metadata.get("address"),
                                "businessName": best_match.metadata.get("businessName")
                            },
                            "confidence": min(float(top_arch_score), 0.94),  # Cap to keep approximate retrieval clearly below exact matches
                            "method": "architectural_matching",
                            "analysis": scene_analysis,
                            "top_geospatial_matches": geospatial_alignment["top_matches"] if geospatial_alignment else [],
                            "geospatial_prior": geospatial_alignment["geospatial_prior"] if geospatial_alignment else None,
                            "prior_diagnostics": geospatial_alignment["prior_diagnostics"] if geospatial_alignment else None,
                            "candidate_diversity": {
                                "unique_locations": unique_candidate_count,
                                "duplicate_candidates_collapsed": collapsed_duplicates,
                                "geospatial_alignment_confidence": round(geospatial_alignment_confidence, 4),
                                "multimodal_enabled": multimodal_enabled,
                            }
                        }

        if geospatial_alignment and geospatial_alignment["confidence"] >= navisense_v3.score_gate:
            return {
                "success": True,
                "hasLocation": True,
                "location": geospatial_alignment["location"],
                "confidence": geospatial_alignment["confidence"],
                "score_gate": geospatial_alignment["score_gate"],
                "method": "geospatial_alignment",
                "analysis": scene_analysis,
                "top_geospatial_matches": geospatial_alignment["top_matches"],
                "geospatial_prior": geospatial_alignment["geospatial_prior"],
                "prior_diagnostics": geospatial_alignment["prior_diagnostics"],
            }

        # If no strong retrieval or alignment match, try geolocation prediction for unknown buildings
        if not results.matches or results.matches[0].score < 0.5:
            pred_lat, pred_lng, geo_confidence = geolocation_predictor.predict(embedding_np)
            
            # Validate predicted coordinates are reasonable
            if (
                -90 <= pred_lat <= 90
                and -180 <= pred_lng <= 180
                and geo_confidence >= geolocation_predictor.confidence_gate
            ):
                return {
                    "success": True,
                    "hasLocation": True,
                    "location": {
                        "latitude": pred_lat,
                        "longitude": pred_lng,
                        "address": "Predicted location",
                        "businessName": "Unknown building"
                    },
                    "confidence": geo_confidence,
                    "confidence_gate": geolocation_predictor.confidence_gate,
                    "method": "geolocation_prediction",
                    "analysis": scene_analysis,
                    "top_geospatial_matches": geospatial_alignment["top_matches"] if geospatial_alignment else [],
                    "geospatial_prior": geospatial_alignment["geospatial_prior"] if geospatial_alignment else None,
                    "prior_diagnostics": geospatial_alignment["prior_diagnostics"] if geospatial_alignment else None,
                }
        
        # Fallback to basic similarity if available
        if results.matches and results.matches[0].score >= 0.5:
            top_match = results.matches[0]
            total_weight = sum(m.score for m in results.matches[:3])
            avg_lat = sum(float(m.metadata["latitude"]) * m.score for m in results.matches[:3]) / total_weight
            avg_lng = sum(float(m.metadata["longitude"]) * m.score for m in results.matches[:3]) / total_weight
            
            return {
                "success": True,
                "hasLocation": True,
                "location": {
                    "latitude": avg_lat,
                    "longitude": avg_lng,
                    "address": top_match.metadata.get("address"),
                    "businessName": top_match.metadata.get("businessName")
                },
                "confidence": float(top_match.score),
                "method": "similarity",
                "analysis": scene_analysis,
                "top_geospatial_matches": geospatial_alignment["top_matches"] if geospatial_alignment else [],
                "geospatial_prior": geospatial_alignment["geospatial_prior"] if geospatial_alignment else None,
                "prior_diagnostics": geospatial_alignment["prior_diagnostics"] if geospatial_alignment else None,
            }
        
        return {
            "success": False,
            "hasLocation": False,
            "message": "No similar locations found",
            "confidence": 0.0,
            "analysis": scene_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scene-analysis")
async def scene_analysis_route(
    file: UploadFile = File(...),
    ocr_text: Optional[str] = Form(None),
    context_labels: Optional[str] = Form(None),
    best_guess_labels: Optional[str] = Form(None),
):
    """Zero-shot scene understanding plus geospatial alignment hints"""
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        context_clues = collect_multimodal_context_clues(
            ocr_text=ocr_text,
            context_labels=context_labels,
            best_guess_labels=best_guess_labels,
        )

        return {
            "success": True,
            "analysis": build_scene_analysis(
                embedding_np,
                ocr_text=ocr_text,
                context_clues=context_clues,
            ),
            "method": "navisense_v3_scene_analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/geospatial-alignment")
async def geospatial_alignment_route(
    file: UploadFile = File(...),
    ocr_text: Optional[str] = Form(None),
    context_labels: Optional[str] = Form(None),
    best_guess_labels: Optional[str] = Form(None),
):
    """Predict location via continuous image-to-GPS alignment"""
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        context_clues = collect_multimodal_context_clues(
            ocr_text=ocr_text,
            context_labels=context_labels,
            best_guess_labels=best_guess_labels,
        )
        prediction = navisense_v3.predict(
            embedding_np,
            top_k=5,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )

        if not prediction:
            return {
                "success": False,
                "message": "No trained geospatial alignment memory available"
            }

        return {
            "success": True,
            "prediction": prediction,
            "analysis": build_scene_analysis(
                embedding_np,
                ocr_text=ocr_text,
                context_clues=context_clues,
            ),
            "method": "navisense_v3_geospatial_alignment"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/enhanced-ocr")
async def enhanced_ocr_analysis(file: UploadFile = File(...), ocr_text: str = Form(...)):
    """Enhanced OCR analysis for landmarks and business info"""
    try:
        # Extract comprehensive information from OCR text
        extracted = enhanced_ocr.extract_all(ocr_text)
        confidence = enhanced_ocr.confidence_score(extracted)
        
        return {
            "success": True,
            "extracted_data": extracted,
            "confidence": confidence,
            "method": "enhanced_ocr"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/architectural-analysis")
async def architectural_analysis(file: UploadFile = File(...)):
    """Analyze architectural features of a building"""
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        
        # Extract architectural features
        features = architectural_matcher.extract_features(embedding_np, {})
        
        return {
            "success": True,
            "architectural_features": {
                "roof_pattern": features['roof_pattern'],
                "window_pattern": features['window_pattern'],
                "facade_style": features['facade_style'],
                "height_estimate": features['height_estimate'],
                "color_profile": features['color_profile']
            },
            "method": "architectural_analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/geolocation-predict")
async def geolocation_predict(file: UploadFile = File(...)):
    """Predict lat/lng for unknown buildings using ML regression"""
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        
        # Predict coordinates
        pred_lat, pred_lng, confidence = geolocation_predictor.predict(embedding_np)
        
        return {
            "success": True,
            "predicted_location": {
                "latitude": pred_lat,
                "longitude": pred_lng
            },
            "confidence": confidence,
            "confidence_gate": geolocation_predictor.confidence_gate,
            "method": "geolocation_regression"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/multi-view-match")
async def multi_view_match(file: UploadFile = File(...)):
    """Match building across multiple views/angles"""
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Generate embedding
        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)
        
        # Get candidates from vector database
        results = index.query(
            vector=embedding,
            top_k=20,
            include_metadata=True,
            include_values=True
        )
        
        if not results.matches:
            return {"success": False, "message": "No candidates found"}
        
        # Prepare candidates for architectural matching
        candidates = [{
            'id': match.id,
            'embedding': getattr(match, 'values', None),
            'metadata': match.metadata,
            'score': match.score
        } for match in results.matches]
        
        # Perform multi-view architectural matching
        arch_matches = architectural_matcher.match_building(embedding_np, candidates)
        
        # Format results
        formatted_matches = []
        for match_id, score in arch_matches[:5]:
            original_match = next(m for m in results.matches if m.id == match_id)
            formatted_matches.append({
                "id": match_id,
                "architectural_score": score,
                "similarity_score": float(original_match.score),
                "location": {
                    "latitude": float(original_match.metadata["latitude"]),
                    "longitude": float(original_match.metadata["longitude"]),
                    "address": original_match.metadata.get("address"),
                    "businessName": original_match.metadata.get("businessName")
                }
            })
        
        return {
            "success": True,
            "matches": formatted_matches,
            "method": "multi_view_architectural_matching"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/db-sample")
def get_sample_data():
    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DATABASE'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            sslmode='require'
        )
        cur = conn.cursor()
        
        # Get sample from NavisenseTraining
        cur.execute('SELECT "imageUrl", "imageHash", latitude, longitude FROM "NavisenseTraining" WHERE verified = true LIMIT 3')
        training_sample = cur.fetchall()
        
        # Get sample from feedback
        cur.execute('''
            SELECT lr."imageUrl", lr."imageHash", lf."correctLat", lf."correctLng"
            FROM location_feedback lf
            JOIN location_recognitions lr ON lf."recognitionId" = lr.id
            WHERE lf."wasCorrect" = true AND lf."correctLat" IS NOT NULL 
            AND lr."imageUrl" IS NOT NULL LIMIT 3
        ''')
        feedback_sample = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "training_sample": training_sample,
            "feedback_sample": feedback_sample
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/train")
async def train_location(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(None),
    businessName: str = Form(None),
    userId: str = Form(None),
    metadata: str = Form(None)
):
    try:
        metadata_payload = parse_metadata(metadata)
        effective_address = address or metadata_payload.get("address")
        effective_business_name = (
            businessName
            or metadata_payload.get("businessName")
            or metadata_payload.get("name")
        )
        effective_user_id = userId or metadata_payload.get("userId") or metadata_payload.get("deviceId")
        source = metadata_payload.get("source") or metadata_payload.get("method") or "direct-train"
        confidence = metadata_payload.get("confidence")
        try:
            confidence = float(confidence) if confidence is not None else None
        except (TypeError, ValueError):
            confidence = None

        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        embedding = generate_embedding(image)
        embedding_np = np.array(embedding)

        img_hash = hashlib.sha256(image_bytes).hexdigest()
        stored_image_url = upload_training_image(
            image_bytes,
            img_hash,
            file.content_type,
            file.filename,
            source
        )

        training_record = {
            "image_hash": img_hash,
            "image_url": stored_image_url,
            "latitude": latitude,
            "longitude": longitude,
            "address": effective_address,
            "businessName": effective_business_name,
            "source": source
        }
        vector_metadata = build_vector_metadata(training_record)
        vector_id = upsert_training_vector(img_hash, embedding, vector_metadata)

        upsert_training_record(
            stored_image_url,
            img_hash,
            latitude,
            longitude,
            address=effective_address,
            business_name=effective_business_name,
            verified=True,
            user_corrected=bool(metadata_payload.get("userCorrected"))
            or metadata_payload.get("method") == "user-correction"
            or source == "user-correction",
            confidence=confidence,
            user_id=effective_user_id,
            trained=True
        )

        geolocation_predictor.train_step(embedding_np, latitude, longitude)
        geolocation_predictor.save_model()

        architectural_matcher.add_building(vector_id, embedding_np, vector_metadata)
        architectural_matcher.save_features()
        navisense_v3.add_training_example(embedding, training_record)

        return {
            "success": True,
            "message": "Training data persisted and models updated",
            "vector_id": vector_id,
            "image_hash": img_hash,
            "training_image_url": stored_image_url,
            "total_vectors": index.describe_index_stats().total_vector_count,
            "navisense_v3_examples": len(navisense_v3.training_examples)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
async def retrain_models():
    """Retrain the geolocation model from the full canonical training corpus."""
    try:
        records = fetch_combined_training_records()
        if not records:
            return {
                "success": False,
                "message": "No verified training data available for retraining"
            }

        examples, failures = prepare_training_examples(records, sync_vectors=True)
        if len(examples) < 2:
            return {
                "success": False,
                "message": "Not enough valid training samples after loading images",
                "records_considered": len(records),
                "samples_loaded": len(examples),
                "samples_failed": len(failures),
                "failures": failures[:5]
            }

        train_examples, validation_examples = split_training_examples(examples)
        train_embeddings = [example["embedding"] for example in train_examples]
        train_lats = [example["latitude"] for example in train_examples]
        train_lngs = [example["longitude"] for example in train_examples]

        geolocation_predictor.reset_model()
        epochs = choose_training_epochs(len(train_examples))
        final_loss = geolocation_predictor.batch_train(
            train_embeddings,
            train_lats,
            train_lngs,
            epochs=epochs
        )
        geolocation_predictor.save_model()
        navisense_v3_loss = navisense_v3.batch_train(
            train_examples,
            epochs=max(8, min(epochs, 20)),
            batch_size=min(32, max(len(train_examples), 2))
        )

        architectural_matcher.save_features()
        mark_training_records_trained([example["image_hash"] for example in examples])

        validation_metrics = None
        confidence_calibration = None
        navisense_v3_validation = None
        if validation_examples:
            validation_metrics = geolocation_predictor.evaluate_accuracy(
                [example["embedding"] for example in validation_examples],
                [example["latitude"] for example in validation_examples],
                [example["longitude"] for example in validation_examples]
            )
            confidence_calibration = geolocation_predictor.calibrate_confidence(
                [example["embedding"] for example in validation_examples],
                [example["latitude"] for example in validation_examples],
                [example["longitude"] for example in validation_examples]
            )
            navisense_v3_validation = navisense_v3.evaluate(validation_examples)

        return {
            "success": True,
            "message": f"Retrained geolocation model with {len(train_examples)} samples",
            "records_considered": len(records),
            "samples_loaded": len(examples),
            "samples_failed": len(failures),
            "train_samples": len(train_examples),
            "validation_samples": len(validation_examples),
            "epochs": epochs,
            "final_training_loss": final_loss,
            "navisense_v3_training_loss": navisense_v3_loss,
            "validation_metrics": validation_metrics,
            "confidence_calibration": confidence_calibration,
            "navisense_v3_validation": navisense_v3_validation,
            "failures": failures[:5]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/s3-test")
def test_s3_access():
    try:
        bucket = os.getenv('AWS_S3_BUCKET_NAME')
        # List first 5 objects in bucket
        response = s3_client.list_objects_v2(Bucket=bucket, MaxKeys=5)
        objects = [obj['Key'] for obj in response.get('Contents', [])]
        return {"success": True, "bucket": bucket, "sample_objects": objects}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/evaluate-models")
async def evaluate_models(
    limit: int = Query(default=20, ge=2, le=100),
    include_scene_analysis: bool = Query(default=False)
):
    """Comprehensive evaluation of all ML models"""
    try:
        records = fetch_combined_training_records(limit=limit)
        if not records:
            return {"success": False, "message": "No test data available"}

        examples, failures = prepare_training_examples(records, sync_vectors=False)
        if not examples:
            return {
                "success": False,
                "message": "Unable to load evaluation images",
                "records_considered": len(records),
                "failures": failures[:5]
            }

        _, validation_examples = split_training_examples(examples)
        eval_examples = validation_examples or examples
        
        return {
            "success": True,
            "evaluation_results": build_evaluation_results(
                eval_examples,
                include_scene_analysis=include_scene_analysis
            ),
            "evaluation_config": {
                "records_limit": limit,
                "include_scene_analysis": include_scene_analysis
            },
            "records_considered": len(records),
            "samples_loaded": len(examples),
            "samples_failed": len(failures),
            "failures": failures[:5],
            "overall_status": "All models operational"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/evaluate-heldout")
async def evaluate_heldout(
    limit: Optional[int] = Query(default=None, ge=2, le=1000),
    validation_ratio: float = Query(default=0.3, ge=0.1, le=0.5),
    minimum_validation_examples: int = Query(default=10, ge=1, le=200),
    include_scene_analysis: bool = Query(default=False)
):
    """Evaluate on a larger deterministic held-out split built from canonical records."""
    try:
        records = fetch_combined_training_records(limit=limit)
        if not records:
            return {"success": False, "message": "No test data available"}

        examples, failures = prepare_training_examples(records, sync_vectors=False)
        if not examples:
            return {
                "success": False,
                "message": "Unable to load evaluation images",
                "records_considered": len(records),
                "failures": failures[:5]
            }

        train_examples, validation_examples, holdout_summary = split_examples_by_place(
            examples,
            validation_ratio=validation_ratio,
            minimum_validation_examples=minimum_validation_examples,
            random_seed=TRAINING_SPLIT_SEED,
        )

        if not validation_examples:
            return {
                "success": False,
                "message": "Unable to create a non-empty held-out split",
                "records_considered": len(records),
                "samples_loaded": len(examples),
                "samples_failed": len(failures),
                "holdout_summary": holdout_summary,
                "failures": failures[:5]
            }

        return {
            "success": True,
            "evaluation_results": build_evaluation_results(
                validation_examples,
                include_scene_analysis=include_scene_analysis
            ),
            "evaluation_config": {
                "records_limit": limit,
                "validation_ratio": validation_ratio,
                "minimum_validation_examples": minimum_validation_examples,
                "include_scene_analysis": include_scene_analysis,
                "seed": TRAINING_SPLIT_SEED,
            },
            "holdout_split": holdout_summary,
            "records_considered": len(records),
            "samples_loaded": len(examples),
            "samples_failed": len(failures),
            "train_samples": len(train_examples),
            "validation_samples": len(validation_examples),
            "failures": failures[:5],
            "overall_status": "All models operational"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/model-info")
def get_model_info():
    """Get detailed information about all loaded models"""
    return {
        "navisense_ml_version": "4.3",
        "models": {
            "clip_embeddings": {
                "model": BACKBONE_MODEL_NAME,
                "embedding_dim": EMBEDDING_DIM,
                "index_name": index_name,
                "device": device,
                "status": "loaded"
            },
            "geolocation_predictor": {
                "architecture": "3-layer MLP with confidence estimation",
                "input_dim": EMBEDDING_DIM,
                "output": "latitude, longitude, confidence",
                "confidence_gate": geolocation_predictor.confidence_gate,
                "confidence_calibration": geolocation_predictor.confidence_calibration,
                "status": "loaded"
            },
            "architectural_matcher": {
                "features": [
                    "roof_pattern", "window_pattern", "facade_style", 
                    "color_profile", "height_estimate", "texture_pattern",
                    "architectural_style", "building_age", "symmetry_score"
                ],
                "matching_algorithm": "weighted_feature_similarity",
                "buildings_tracked": len(architectural_matcher.building_features),
                "status": "loaded"
            },
            "enhanced_ocr": {
                "capabilities": [
                    "business_name_extraction", "phone_number_detection",
                    "address_parsing", "landmark_detection", "street_sign_recognition"
                ],
                "landmark_categories": list(enhanced_ocr.LANDMARK_PATTERNS.keys()),
                "status": "loaded"
            },
            "navisense_v3": {
                "architecture": "configurable vision-language encoder + Fourier location encoder + contrastive geo alignment + learned geospatial prior heads",
                "geospatial_prior_heads": [
                    "coarse_cell_classifier",
                    "climate_band_classifier",
                    "latitude_hemisphere_classifier",
                    "longitude_hemisphere_classifier",
                    "coordinate_prior_head"
                ],
                "zero_shot_heads": [
                    "landmark_hypotheses",
                    "architectural_hypotheses",
                    "environment_hypotheses",
                    "urban_signals",
                    "multimodal_text_fusion"
                ],
                "examples_cached": len(navisense_v3.training_examples),
                "score_gate": navisense_v3.score_gate,
                "inference_temperature": navisense_v3.inference_temperature,
                "text_fusion_weight_cap": navisense_v3.scene_analyzer.max_text_fusion_weight,
                "training_metrics": navisense_v3.training_metrics,
                "status": "loaded"
            }
        },
        "vector_database": {
            "provider": "Pinecone",
            "index_name": index_name,
            "dimension": EMBEDDING_DIM,
            "metric": "cosine",
            "total_vectors": index.describe_index_stats().total_vector_count
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Load architectural features on startup
    architectural_matcher.load_features()
    print(
        "NaviSense ML API v4.3 starting with configurable backbone support:",
        f"{BACKBONE_MODEL_NAME} ({EMBEDDING_DIM} dims)"
    )
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
