"""
Import a reviewed dataset manifest into the canonical NaviSense training corpus.

This script is the handoff between dataset collection/review and the live training store.
It reads a dataset.jsonl manifest, validates local image availability, uploads reviewed images
to the configured training image bucket, and upserts canonical rows into NavisenseTraining.

The importer is intentionally conservative:

- dry-run mode is supported for review-safe validation
- approved-only mode skips records without explicit review approval
- local images are required unless an existing image URL is already present
- upload and database failures are tracked per record so one bad row does not stop the whole run
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import re
import uuid
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import boto3
import psycopg2

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(dotenv_path: Optional[str] = None, override: bool = False, *args: Any, **kwargs: Any) -> None:
        path = Path(dotenv_path or ".env")
        if not path.exists():
            return None

        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if override or key not in os.environ:
                os.environ[key] = value
        return None


SCRIPT_DIR = Path(__file__).resolve().parent

load_dotenv(dotenv_path=str(SCRIPT_DIR / ".env"), override=True)

TRAINING_IMAGE_PREFIX = os.getenv("TRAINING_IMAGE_PREFIX", "navisense-training/direct")
DEFAULT_PUBLIC_SOURCE_ALLOWLIST = ("hotosm_nigeria", "overpass_seed")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_S3_REGION_NAME", "us-east-1"),
)


def normalize_text(value: Optional[str]) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


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


def build_s3_url(key: str) -> str:
    bucket = os.getenv("AWS_S3_BUCKET_NAME")
    if not bucket:
        raise RuntimeError("AWS_S3_BUCKET_NAME is not configured")
    return f"https://{bucket}.s3.amazonaws.com/{key}"


def upload_training_image(
    image_bytes: bytes,
    image_hash: str,
    content_type: Optional[str],
    filename: Optional[str],
    source: Optional[str],
) -> str:
    bucket = os.getenv("AWS_S3_BUCKET_NAME")
    if not bucket:
        raise RuntimeError("AWS_S3_BUCKET_NAME is not configured")

    extension = infer_file_extension(content_type, filename)
    source_segment = sanitize_storage_segment(source)
    s3_key = f"{TRAINING_IMAGE_PREFIX}/{source_segment}/{image_hash[:2]}/{image_hash}{extension}"
    s3_client.put_object(
        Bucket=bucket,
        Key=s3_key,
        Body=image_bytes,
        ContentType=content_type or "application/octet-stream",
    )
    return build_s3_url(s3_key)


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        database=os.getenv("POSTGRES_DATABASE", "ssabiroad"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        sslmode="require",
    )


def upsert_training_record(
    cursor: Any,
    image_url: str,
    image_hash: str,
    latitude: float,
    longitude: float,
    address: Optional[str],
    business_name: Optional[str],
    verified: bool,
    user_corrected: bool,
    confidence: Optional[float],
    user_id: Optional[str],
) -> None:
    cursor.execute(
        """
        INSERT INTO "NavisenseTraining" (
            id, "imageUrl", "imageHash", latitude, longitude, address, "businessName",
            verified, "userCorrected", confidence, "userId", "trainedAt"
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
        """,
        (
            uuid.uuid4().hex,
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
            None,
        ),
    )


def parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "y", "approved", "verified", "accept", "accepted"}


def normalize_review_status(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower()).strip("_")


def is_low_specificity_address(
    address: Optional[str],
    *,
    country: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
) -> bool:
    normalized = normalize_text(address).lower()
    if not normalized:
        return True

    generic_values = {
        normalize_text(country).lower(),
        normalize_text(city).lower(),
        normalize_text(state).lower(),
        "nigeria",
    }
    generic_values.discard("")
    if normalized in generic_values:
        return True

    comma_parts = [normalize_text(part).lower() for part in normalized.split(",") if normalize_text(part)]
    if len(comma_parts) == 1 and comma_parts[0] in generic_values:
        return True

    return False


def is_record_approved(record: Dict[str, Any]) -> bool:
    if parse_bool(record.get("approved")) or parse_bool(record.get("verified")):
        return True

    for key in ("review_status", "import_status", "qa_status"):
        status = normalize_review_status(record.get(key))
        if status in {"approved", "accepted", "verified", "ready", "ready_for_import"}:
            return True

    return False


def to_float(value: Any) -> Optional[float]:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def derive_address(record: Dict[str, Any]) -> Optional[str]:
    explicit = normalize_text(record.get("address") or record.get("formatted_address"))
    if explicit and not is_low_specificity_address(
        explicit,
        country=record.get("country"),
        city=record.get("city"),
        state=record.get("state"),
    ):
        return explicit

    parts = [
        normalize_text(record.get("name")),
        normalize_text(record.get("city")),
        normalize_text(record.get("state")),
        normalize_text(record.get("country") or "Nigeria"),
    ]
    parts = [part for part in parts if part]
    if not parts:
        return None
    return ", ".join(parts)


def derive_business_name(record: Dict[str, Any]) -> Optional[str]:
    for key in ("business_name", "businessName", "name", "building_name"):
        value = normalize_text(record.get(key))
        if value:
            return value
    return None


def derive_source(record: Dict[str, Any], fallback: str) -> str:
    source = normalize_text(record.get("source"))
    return source or fallback


def parse_csv_set(value: Optional[str]) -> set[str]:
    return {
        normalize_text(part)
        for part in str(value or "").split(",")
        if normalize_text(part)
    }


def build_record_hash(image_url: str, latitude: float, longitude: float) -> str:
    payload = f"{image_url}|{round(latitude, 7)}|{round(longitude, 7)}"
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()


def read_jsonl(path: Path) -> Iterable[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            raw = line.strip()
            if not raw:
                continue
            payload = json.loads(raw)
            if not isinstance(payload, dict):
                raise ValueError(f"Manifest line {line_number} is not a JSON object")
            payload["_line_number"] = line_number
            yield payload


def resolve_image_path(record: Dict[str, Any], dataset_root: Path, manifest_dir: Path) -> Optional[Path]:
    raw_path = record.get("image_path") or record.get("imagePath")
    if not raw_path:
        return None

    path = Path(str(raw_path))
    candidates: List[Path] = []
    if path.is_absolute():
        candidates.append(path)
    else:
        candidates.append(manifest_dir / path)
        candidates.append(dataset_root / path)

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


@dataclass
class ImportStats:
    manifest_path: str
    dataset_root: str
    total_records: int = 0
    imported_records: int = 0
    dry_run_records: int = 0
    skipped_unapproved: int = 0
    skipped_limit: int = 0
    skipped_invalid_coordinates: int = 0
    skipped_missing_image: int = 0
    skipped_disallowed_source: int = 0
    skipped_low_specificity_address: int = 0
    skipped_missing_city: int = 0
    skipped_city_batch: int = 0
    skipped_total_batch: int = 0
    upload_failures: int = 0
    db_failures: int = 0
    promotion_candidate_records: int = 0
    city_batch_breakdown: Dict[str, int] = field(default_factory=dict)
    promoted_city_breakdown: Dict[str, int] = field(default_factory=dict)
    promoted_source_breakdown: Dict[str, int] = field(default_factory=dict)
    error_samples: List[str] = field(default_factory=list)

    def as_dict(self) -> Dict[str, Any]:
        payload = {
            "manifest_path": self.manifest_path,
            "dataset_root": self.dataset_root,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_records": self.total_records,
            "imported_records": self.imported_records,
            "dry_run_records": self.dry_run_records,
            "skipped_unapproved": self.skipped_unapproved,
            "skipped_limit": self.skipped_limit,
            "skipped_invalid_coordinates": self.skipped_invalid_coordinates,
            "skipped_missing_image": self.skipped_missing_image,
            "skipped_disallowed_source": self.skipped_disallowed_source,
            "skipped_low_specificity_address": self.skipped_low_specificity_address,
            "skipped_missing_city": self.skipped_missing_city,
            "skipped_city_batch": self.skipped_city_batch,
            "skipped_total_batch": self.skipped_total_batch,
            "upload_failures": self.upload_failures,
            "db_failures": self.db_failures,
            "promotion_candidate_records": self.promotion_candidate_records,
        }
        if self.city_batch_breakdown:
            payload["city_batch_breakdown"] = self.city_batch_breakdown
        if self.promoted_city_breakdown:
            payload["promoted_city_breakdown"] = self.promoted_city_breakdown
        if self.promoted_source_breakdown:
            payload["promoted_source_breakdown"] = self.promoted_source_breakdown
        if self.error_samples:
            payload["error_samples"] = self.error_samples[:10]
        return payload


@dataclass
class PreparedRecord:
    record: Dict[str, Any]
    latitude: float
    longitude: float
    source: str
    city: str
    address: Optional[str]
    business_name: Optional[str]
    image_url: str
    image_path: Optional[Path]
    image_hash: Optional[str]


class ManifestImporter:
    def __init__(self, args: argparse.Namespace) -> None:
        self.args = args
        self.manifest_path = Path(args.manifest).resolve()
        self.manifest_dir = self.manifest_path.parent
        default_root = self.manifest_dir.parent if self.manifest_dir.name == "manifests" else self.manifest_dir
        self.dataset_root = Path(args.dataset_root).resolve() if args.dataset_root else default_root.resolve()
        self.stats = ImportStats(
            manifest_path=str(self.manifest_path),
            dataset_root=str(self.dataset_root),
        )

    def run(self) -> Dict[str, Any]:
        prepared_records = self._prepare_records()
        if self.args.limit is not None and len(prepared_records) > self.args.limit:
            self.stats.skipped_limit += len(prepared_records) - self.args.limit
            prepared_records = prepared_records[: self.args.limit]

        conn = None
        cursor = None

        if not self.args.dry_run:
            conn = get_db_connection()
            cursor = conn.cursor()

        try:
            for prepared in prepared_records:
                image_url = prepared.image_url
                image_hash = prepared.image_hash
                if prepared.image_path is not None:
                    image_bytes = prepared.image_path.read_bytes()
                    image_hash = hashlib.sha1(image_bytes).hexdigest()
                    if not image_url:
                        if self.args.dry_run or self.args.skip_upload:
                            image_url = str(prepared.image_path.resolve())
                        else:
                            content_type = mimetypes.guess_type(str(prepared.image_path))[0]
                            try:
                                image_url = upload_training_image(
                                    image_bytes=image_bytes,
                                    image_hash=image_hash,
                                    content_type=content_type,
                                    filename=prepared.image_path.name,
                                    source=prepared.source,
                                )
                            except Exception as error:
                                self.stats.upload_failures += 1
                                self._remember_error(
                                    f"line {prepared.record.get('_line_number')}: upload failed for {prepared.image_path.name}: {error}"
                                )
                                continue

                assert image_hash
                if not image_hash:
                    image_hash = build_record_hash(image_url, prepared.latitude, prepared.longitude)

                if self.args.dry_run:
                    self.stats.dry_run_records += 1
                    continue

                assert cursor is not None
                assert conn is not None
                try:
                    upsert_training_record(
                        cursor=cursor,
                        image_url=image_url,
                        image_hash=image_hash,
                        latitude=prepared.latitude,
                        longitude=prepared.longitude,
                        address=prepared.address,
                        business_name=prepared.business_name,
                        verified=not self.args.mark_unverified,
                        user_corrected=self.args.mark_user_corrected,
                        confidence=to_float(prepared.record.get("confidence")) or self.args.default_confidence,
                        user_id=self.args.user_id,
                    )
                    conn.commit()
                    self.stats.imported_records += 1
                except Exception as error:
                    conn.rollback()
                    self.stats.db_failures += 1
                    self._remember_error(
                        f"line {prepared.record.get('_line_number')}: db import failed for {prepared.record.get('record_id', 'record')}: {error}"
                    )
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()

        return self.stats.as_dict()

    def _prepare_records(self) -> List[PreparedRecord]:
        prepared_records: List[PreparedRecord] = []
        allowed_sources = parse_csv_set(self.args.public_source_allowlist) or set(DEFAULT_PUBLIC_SOURCE_ALLOWLIST)

        for record in read_jsonl(self.manifest_path):
            self.stats.total_records += 1

            if self.args.approved_only and not is_record_approved(record):
                self.stats.skipped_unapproved += 1
                continue

            latitude = to_float(record.get("latitude"))
            longitude = to_float(record.get("longitude"))
            if latitude is None or longitude is None:
                self.stats.skipped_invalid_coordinates += 1
                continue

            image_url = normalize_text(record.get("image_url") or record.get("imageUrl"))
            image_path = resolve_image_path(record, self.dataset_root, self.manifest_dir)
            if not image_url and image_path is None:
                self.stats.skipped_missing_image += 1
                self._remember_error(
                    f"line {record.get('_line_number')}: missing image_path/image_url for {record.get('record_id', 'record')}"
                )
                continue

            source = self.args.source_tag or derive_source(record, "nigeria_dataset_import")
            address = derive_address(record)
            city = normalize_text(record.get("city"))
            business_name = derive_business_name(record)
            image_hash = normalize_text(record.get("image_hash") or record.get("imageHash")) or None

            if self.args.public_training_ready:
                if source not in allowed_sources:
                    self.stats.skipped_disallowed_source += 1
                    continue
                if is_low_specificity_address(
                    address,
                    country=record.get("country"),
                    city=record.get("city"),
                    state=record.get("state"),
                ):
                    self.stats.skipped_low_specificity_address += 1
                    continue
                if not city:
                    self.stats.skipped_missing_city += 1
                    continue

            prepared_records.append(
                PreparedRecord(
                    record=record,
                    latitude=latitude,
                    longitude=longitude,
                    source=source,
                    city=city or "unknown",
                    address=address,
                    business_name=business_name,
                    image_url=image_url,
                    image_path=image_path,
                    image_hash=image_hash,
                )
            )

        if not self.args.public_training_ready:
            return prepared_records

        city_counts = Counter(item.city for item in prepared_records)
        self.stats.promotion_candidate_records = len(prepared_records)
        self.stats.city_batch_breakdown = dict(sorted(city_counts.items()))
        minimum_city_batch = max(self.args.minimum_city_batch, 1)

        city_balanced_records = [
            item for item in prepared_records if city_counts.get(item.city, 0) >= minimum_city_batch
        ]
        self.stats.skipped_city_batch = len(prepared_records) - len(city_balanced_records)

        minimum_total_batch = max(self.args.minimum_total_batch, 1)
        if len(city_balanced_records) < minimum_total_batch:
            self.stats.skipped_total_batch = len(city_balanced_records)
            if city_balanced_records:
                self._remember_error(
                    "public-training-ready gate blocked import: "
                    f"only {len(city_balanced_records)} qualifying records remained "
                    f"(minimum_total_batch={minimum_total_batch})"
                )
            return []

        promoted_city_counts = Counter(item.city for item in city_balanced_records)
        promoted_source_counts = Counter(item.source for item in city_balanced_records)
        self.stats.promoted_city_breakdown = dict(sorted(promoted_city_counts.items()))
        self.stats.promoted_source_breakdown = dict(sorted(promoted_source_counts.items()))
        return city_balanced_records

    def _remember_error(self, message: str) -> None:
        if len(self.stats.error_samples) < 10:
            self.stats.error_samples.append(message)


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Import a reviewed Nigeria dataset manifest into NavisenseTraining."
    )
    parser.add_argument(
        "--manifest",
        required=True,
        help="Path to manifests/dataset.jsonl from a dataset builder run.",
    )
    parser.add_argument(
        "--dataset-root",
        help="Optional dataset run root. Defaults to the parent of the manifest's manifests directory.",
    )
    parser.add_argument(
        "--approved-only",
        action="store_true",
        help="Only import records explicitly marked approved or verified in the manifest.",
    )
    parser.add_argument(
        "--public-training-ready",
        action="store_true",
        help="Apply conservative public-data promotion rules: allowed sources only, specific addresses, city labels, and minimum balanced batch size.",
    )
    parser.add_argument(
        "--public-source-allowlist",
        default=",".join(DEFAULT_PUBLIC_SOURCE_ALLOWLIST),
        help="Comma-separated public sources allowed when --public-training-ready is enabled.",
    )
    parser.add_argument(
        "--minimum-city-batch",
        type=int,
        default=3,
        help="Minimum number of qualifying approved records required per city when --public-training-ready is enabled.",
    )
    parser.add_argument(
        "--minimum-total-batch",
        type=int,
        default=12,
        help="Minimum total qualifying records required before a public-data batch is imported.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and summarize import candidates without uploading or writing to the database.",
    )
    parser.add_argument(
        "--skip-upload",
        action="store_true",
        help="Do not upload local images to S3. Use the local image path as imageUrl when no image_url is present.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Import at most N qualifying records after approval and validation filters.",
    )
    parser.add_argument(
        "--source-tag",
        help="Optional storage/source tag used for uploaded training images.",
    )
    parser.add_argument(
        "--default-confidence",
        type=float,
        help="Optional fallback confidence when the manifest does not include one.",
    )
    parser.add_argument(
        "--mark-unverified",
        action="store_true",
        help="Import rows with verified=false instead of the default verified=true.",
    )
    parser.add_argument(
        "--mark-user-corrected",
        action="store_true",
        help="Mark imported rows as user-corrected in the canonical corpus.",
    )
    parser.add_argument(
        "--user-id",
        help="Optional userId value to attach to imported records.",
    )
    return parser


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()
    importer = ManifestImporter(args)
    summary = importer.run()
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
