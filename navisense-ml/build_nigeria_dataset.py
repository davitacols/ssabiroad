"""
Build a Nigeria-first dataset manifest for NaviSense from structured map sources.

This script consolidates the old one-off collection scripts into a single dataset builder that:

- samples building footprints from HOT OSM GeoJSON exports
- optionally supplements them with Overpass/OSM building queries around seeded Nigerian cities
- optionally reverse-geocodes coordinates using Google Geocoding
- optionally downloads Street View images using Google Street View
- writes a clean manifest and summary for review before training

The output is a reviewable dataset artifact, not an automatic training side effect.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import random
import re
import time
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import requests

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

load_dotenv(dotenv_path=str(SCRIPT_DIR / ".env"))

NIGERIA_CITY_SEEDS: Tuple[Dict[str, Any], ...] = (
    {"name": "Lagos", "latitude": 6.5244, "longitude": 3.3792, "radius_m": 2500},
    {"name": "Abuja", "latitude": 9.0765, "longitude": 7.3986, "radius_m": 2500},
    {"name": "Port Harcourt", "latitude": 4.8156, "longitude": 7.0498, "radius_m": 2200},
    {"name": "Ibadan", "latitude": 7.3775, "longitude": 3.9470, "radius_m": 2200},
    {"name": "Kano", "latitude": 12.0022, "longitude": 8.5920, "radius_m": 2200},
    {"name": "Enugu", "latitude": 6.5244, "longitude": 7.5086, "radius_m": 2200},
    {"name": "Benin City", "latitude": 6.3350, "longitude": 5.6037, "radius_m": 2200},
    {"name": "Kaduna", "latitude": 10.5105, "longitude": 7.4165, "radius_m": 2200},
)

OVERPASS_QUERY_TEMPLATE = """
[out:json][timeout:{timeout_seconds}];
(
  way["building"](around:{radius_m},{latitude},{longitude});
  relation["building"](around:{radius_m},{latitude},{longitude});
);
out tags center;
"""


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "dataset"


def normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip().lower()


def is_low_specificity_address(
    address: Optional[str],
    *,
    country: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
) -> bool:
    normalized = normalize_text(address)
    if not normalized:
        return True

    generic_values = {
        normalize_text(country),
        normalize_text(city),
        normalize_text(state),
        "nigeria",
    }
    generic_values.discard("")
    if normalized in generic_values:
        return True

    comma_parts = [normalize_text(part) for part in normalized.split(",") if normalize_text(part)]
    if len(comma_parts) == 1 and comma_parts[0] in generic_values:
        return True

    return False


def centroid_from_geometry(geometry: Dict[str, Any]) -> Optional[Tuple[float, float]]:
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if not geometry_type or not coordinates:
        return None

    if geometry_type == "Point":
        return float(coordinates[1]), float(coordinates[0])

    if geometry_type == "Polygon":
        ring = coordinates[0]
    elif geometry_type == "MultiPolygon":
        ring = coordinates[0][0]
    else:
        return None

    if not ring:
        return None

    lngs = [point[0] for point in ring if len(point) >= 2]
    lats = [point[1] for point in ring if len(point) >= 2]
    if not lngs or not lats:
        return None

    return float(sum(lats) / len(lats)), float(sum(lngs) / len(lngs))


def stable_bucket_key(latitude: float, longitude: float, precision: int = 2) -> str:
    return f"{round(latitude, precision):.{precision}f}|{round(longitude, precision):.{precision}f}"


def deterministic_split_hint(record_id: str) -> str:
    hashed = int(hashlib.sha1(record_id.encode("utf-8")).hexdigest()[:8], 16)
    return "val" if hashed % 10 == 0 else "train"


@dataclass
class BuildingRecord:
    record_id: str
    source: str
    source_id: str
    latitude: float
    longitude: float
    country: str = "Nigeria"
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    building_type: Optional[str] = None
    name: Optional[str] = None
    image_status: str = "not_requested"
    image_path: Optional[str] = None
    streetview_heading: Optional[int] = None
    streetview_pitch: Optional[int] = None
    geocode_status: str = "not_requested"
    split_hint: str = "train"
    tags: Dict[str, Any] = field(default_factory=dict)

    def dedupe_key(self) -> str:
        return "|".join(
            [
                stable_bucket_key(self.latitude, self.longitude, precision=5),
                normalize_text(self.name),
                normalize_text(self.address),
            ]
        )

    def to_json(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["latitude"] = round(self.latitude, 7)
        payload["longitude"] = round(self.longitude, 7)
        return payload


class DatasetBuilder:
    def __init__(self, args: argparse.Namespace) -> None:
        self.args = args
        self.session = requests.Session()
        self.google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
        self.overpass_url = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        root = Path(args.output_root or os.getenv("DATASET_BUILD_ROOT", "navisense-ml/data/datasets"))
        self.output_dir = root / f"nigeria-{timestamp}"
        self.images_dir = self.output_dir / "images"
        self.manifests_dir = self.output_dir / "manifests"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.manifests_dir.mkdir(parents=True, exist_ok=True)

    def build(self) -> Dict[str, Any]:
        hotosm_records = self._load_hotosm_records()
        overpass_records = self._collect_overpass_records()
        combined = self._dedupe_records([*hotosm_records, *overpass_records])

        if self.args.reverse_geocode:
            self._reverse_geocode_records(combined)

        if self.args.download_streetview:
            self._download_streetview(combined)

        summary = self._write_outputs(combined, hotosm_records, overpass_records)
        return summary

    def _load_hotosm_records(self) -> List[BuildingRecord]:
        hotosm_path = self.args.hotosm_geojson or os.getenv("HOTOSM_NIGERIA_GEOJSON", "").strip()
        if not hotosm_path:
            print("HOT OSM path not provided, skipping HOT OSM ingestion.")
            return []

        path = Path(hotosm_path)
        if not path.exists():
            print(f"HOT OSM file not found: {path}")
            return []

        print(f"Loading HOT OSM GeoJSON from {path}")
        payload = json.loads(path.read_text(encoding="utf-8"))
        features = payload.get("features", [])
        raw_records: List[BuildingRecord] = []

        for feature in features:
            geometry = feature.get("geometry") or {}
            centroid = centroid_from_geometry(geometry)
            if centroid is None:
                continue

            latitude, longitude = centroid
            properties = feature.get("properties") or {}
            source_id = str(
                properties.get("@id")
                or properties.get("id")
                or properties.get("osm_id")
                or hashlib.sha1(f"{latitude}|{longitude}".encode("utf-8")).hexdigest()[:12]
            )
            record = BuildingRecord(
                record_id=f"hotosm-{source_id}",
                source="hotosm_nigeria",
                source_id=source_id,
                latitude=latitude,
                longitude=longitude,
                city=properties.get("addr:city") or properties.get("city"),
                state=properties.get("addr:state") or properties.get("state"),
                address=self._format_address_from_tags(properties),
                building_type=properties.get("building"),
                name=properties.get("name"),
                split_hint=deterministic_split_hint(f"hotosm-{source_id}"),
                tags={key: value for key, value in properties.items() if value not in (None, "")},
            )
            raw_records.append(record)

        sampled = self._sample_spatially_diverse(raw_records, self.args.hotosm_sample_size)
        print(f"HOT OSM records loaded: {len(raw_records)} raw, {len(sampled)} sampled")
        return sampled

    def _collect_overpass_records(self) -> List[BuildingRecord]:
        if not self.args.include_overpass:
            print("Overpass enrichment disabled, skipping seeded city collection.")
            return []

        records: List[BuildingRecord] = []
        for city in NIGERIA_CITY_SEEDS:
            query = OVERPASS_QUERY_TEMPLATE.format(
                timeout_seconds=self.args.overpass_timeout_seconds,
                radius_m=city["radius_m"],
                latitude=city["latitude"],
                longitude=city["longitude"],
            )
            print(f"Querying Overpass for {city['name']}")
            try:
                response = self.session.post(
                    self.overpass_url,
                    data=query,
                    headers={"Content-Type": "text/plain"},
                    timeout=self.args.overpass_timeout_seconds,
                )
                response.raise_for_status()
            except requests.RequestException as error:
                print(f"Overpass query failed for {city['name']}: {error}")
                continue

            elements = response.json().get("elements", [])
            city_records: List[BuildingRecord] = []
            for element in elements:
                center = element.get("center") or {}
                latitude = center.get("lat") or element.get("lat")
                longitude = center.get("lon") or element.get("lon")
                if latitude is None or longitude is None:
                    continue

                tags = element.get("tags") or {}
                source_id = str(element.get("id") or hashlib.sha1(f"{latitude}|{longitude}".encode("utf-8")).hexdigest()[:12])
                city_records.append(
                    BuildingRecord(
                        record_id=f"overpass-{city['name'].lower()}-{source_id}",
                        source="overpass_seed",
                        source_id=source_id,
                        latitude=float(latitude),
                        longitude=float(longitude),
                        city=city["name"],
                        state=tags.get("addr:state"),
                        address=self._format_address_from_tags(tags),
                        building_type=tags.get("building"),
                        name=tags.get("name") or tags.get("addr:housename"),
                        split_hint=deterministic_split_hint(f"overpass-{city['name'].lower()}-{source_id}"),
                        tags={key: value for key, value in tags.items() if value not in (None, "")},
                    )
                )

            sampled = self._sample_spatially_diverse(city_records, self.args.overpass_per_city)
            print(f"Overpass records for {city['name']}: {len(city_records)} raw, {len(sampled)} sampled")
            records.extend(sampled)
            time.sleep(self.args.request_delay_seconds)

        return records

    def _sample_spatially_diverse(self, records: Sequence[BuildingRecord], limit: int) -> List[BuildingRecord]:
        if limit <= 0 or len(records) <= limit:
            return list(records)

        buckets: Dict[str, List[BuildingRecord]] = defaultdict(list)
        for record in records:
            buckets[stable_bucket_key(record.latitude, record.longitude, precision=2)].append(record)

        for bucket_records in buckets.values():
            bucket_records.sort(key=lambda item: item.record_id)

        bucket_keys = sorted(buckets.keys())
        sampled: List[BuildingRecord] = []
        bucket_index = 0
        while len(sampled) < limit and bucket_keys:
            bucket_key = bucket_keys[bucket_index % len(bucket_keys)]
            bucket = buckets[bucket_key]
            if bucket:
                sampled.append(bucket.pop(0))
            if not bucket:
                bucket_keys.remove(bucket_key)
                bucket_index -= 1
            bucket_index += 1

        return sampled

    def _dedupe_records(self, records: Sequence[BuildingRecord]) -> List[BuildingRecord]:
        deduped: Dict[str, BuildingRecord] = {}
        for record in records:
            key = record.dedupe_key()
            existing = deduped.get(key)
            if existing is None:
                deduped[key] = record
                continue

            # Prefer records with richer address/name data and then keep HOT OSM as canonical.
            existing_score = int(bool(existing.address)) + int(bool(existing.name))
            record_score = int(bool(record.address)) + int(bool(record.name))
            existing_is_hotosm = existing.source == "hotosm_nigeria"
            record_is_hotosm = record.source == "hotosm_nigeria"

            if record_score > existing_score or (record_score == existing_score and record_is_hotosm and not existing_is_hotosm):
                deduped[key] = record

        result = list(deduped.values())
        result.sort(key=lambda item: (item.source, item.record_id))
        print(f"Combined dataset after dedupe: {len(result)} records")
        return result

    def _reverse_geocode_records(self, records: Sequence[BuildingRecord]) -> None:
        if not self.google_maps_api_key:
            print("GOOGLE_MAPS_API_KEY is not configured, skipping reverse geocoding.")
            return

        print("Reverse geocoding manifest records...")
        for index, record in enumerate(records, start=1):
            if record.address and not is_low_specificity_address(
                record.address,
                country=record.country,
                city=record.city,
                state=record.state,
            ):
                record.geocode_status = "existing"
                continue

            try:
                response = self.session.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params={
                        "latlng": f"{record.latitude},{record.longitude}",
                        "key": self.google_maps_api_key,
                    },
                    timeout=30,
                )
                response.raise_for_status()
                payload = response.json()
                result = (payload.get("results") or [None])[0]
                if result:
                    record.address = result.get("formatted_address")
                    locality, admin_area = self._extract_location_components(result)
                    record.city = record.city or locality
                    record.state = record.state or admin_area
                    record.geocode_status = "resolved"
                else:
                    record.geocode_status = "no_result"
            except requests.RequestException as error:
                record.geocode_status = f"error:{type(error).__name__}"

            if index % 25 == 0:
                print(f"  Geocoded {index}/{len(records)} records")
            time.sleep(self.args.request_delay_seconds)

    def _download_streetview(self, records: Sequence[BuildingRecord]) -> None:
        if not self.google_maps_api_key:
            print("GOOGLE_MAPS_API_KEY is not configured, skipping Street View downloads.")
            return

        headings = [heading.strip() for heading in self.args.streetview_headings.split(",") if heading.strip()]
        heading_values = [int(value) for value in headings] if headings else [0]
        print(f"Downloading Street View images for {len(records)} records")

        for index, record in enumerate(records, start=1):
            downloaded = False
            for heading in heading_values:
                metadata = self._fetch_streetview_metadata(record.latitude, record.longitude, heading)
                status = metadata.get("status")
                if status != "OK":
                    record.image_status = f"metadata:{status or 'unknown'}"
                    continue

                params = {
                    "size": self.args.streetview_size,
                    "location": f"{record.latitude},{record.longitude}",
                    "heading": heading,
                    "pitch": self.args.streetview_pitch,
                    "key": self.google_maps_api_key,
                }
                try:
                    response = self.session.get(
                        "https://maps.googleapis.com/maps/api/streetview",
                        params=params,
                        timeout=60,
                    )
                    response.raise_for_status()
                except requests.RequestException as error:
                    record.image_status = f"download_error:{type(error).__name__}"
                    continue

                if "image" not in (response.headers.get("content-type") or ""):
                    record.image_status = "invalid_content"
                    continue

                filename = f"{record.record_id}-h{heading}.jpg"
                image_path = self.images_dir / filename
                image_path.write_bytes(response.content)
                record.image_status = "downloaded"
                record.image_path = str(image_path.relative_to(self.output_dir))
                record.streetview_heading = heading
                record.streetview_pitch = self.args.streetview_pitch
                downloaded = True
                break

            if not downloaded and record.image_status == "not_requested":
                record.image_status = "unavailable"

            if index % 25 == 0:
                print(f"  Downloaded Street View for {index}/{len(records)} records")
            time.sleep(self.args.request_delay_seconds)

    def _fetch_streetview_metadata(self, latitude: float, longitude: float, heading: int) -> Dict[str, Any]:
        response = self.session.get(
            "https://maps.googleapis.com/maps/api/streetview/metadata",
            params={
                "size": self.args.streetview_size,
                "location": f"{latitude},{longitude}",
                "heading": heading,
                "pitch": self.args.streetview_pitch,
                "key": self.google_maps_api_key,
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def _write_outputs(
        self,
        records: Sequence[BuildingRecord],
        hotosm_records: Sequence[BuildingRecord],
        overpass_records: Sequence[BuildingRecord],
    ) -> Dict[str, Any]:
        manifest_path = self.manifests_dir / "dataset.jsonl"
        with manifest_path.open("w", encoding="utf-8") as handle:
            for record in records:
                handle.write(json.dumps(record.to_json(), ensure_ascii=True) + "\n")

        summary = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "country": "Nigeria",
            "output_dir": str(self.output_dir),
            "manifest_path": str(manifest_path),
            "image_dir": str(self.images_dir),
            "total_records": len(records),
            "source_breakdown": dict(Counter(record.source for record in records)),
            "city_breakdown": dict(Counter(record.city or "unknown" for record in records)),
            "building_type_breakdown": dict(Counter(record.building_type or "unknown" for record in records)),
            "image_status_breakdown": dict(Counter(record.image_status for record in records)),
            "geocode_status_breakdown": dict(Counter(record.geocode_status for record in records)),
            "records_with_addresses": sum(1 for record in records if record.address),
            "records_with_names": sum(1 for record in records if record.name),
            "records_with_images": sum(1 for record in records if record.image_path),
            "records_with_validation_split": dict(Counter(record.split_hint for record in records)),
            "input_counts": {
                "hotosm_sampled": len(hotosm_records),
                "overpass_sampled": len(overpass_records),
            },
            "config": {
                "include_overpass": self.args.include_overpass,
                "hotosm_geojson": self.args.hotosm_geojson,
                "hotosm_sample_size": self.args.hotosm_sample_size,
                "overpass_per_city": self.args.overpass_per_city,
                "reverse_geocode": self.args.reverse_geocode,
                "download_streetview": self.args.download_streetview,
                "streetview_headings": self.args.streetview_headings,
                "streetview_pitch": self.args.streetview_pitch,
                "streetview_size": self.args.streetview_size,
            },
        }

        summary_path = self.manifests_dir / "summary.json"
        summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(f"Wrote manifest: {manifest_path}")
        print(f"Wrote summary: {summary_path}")
        return summary

    @staticmethod
    def _format_address_from_tags(tags: Dict[str, Any]) -> Optional[str]:
        parts = [
            tags.get("addr:housenumber"),
            tags.get("addr:street"),
            tags.get("addr:suburb"),
            tags.get("addr:city") or tags.get("city"),
            tags.get("addr:state") or tags.get("state"),
            tags.get("addr:postcode"),
            tags.get("addr:country"),
        ]
        cleaned = [str(part).strip() for part in parts if part not in (None, "")]
        return ", ".join(cleaned) if cleaned else None

    @staticmethod
    def _extract_location_components(result: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
        locality = None
        admin_area = None
        for component in result.get("address_components", []):
            types = component.get("types", [])
            if locality is None and ("locality" in types or "administrative_area_level_2" in types):
                locality = component.get("long_name")
            if admin_area is None and "administrative_area_level_1" in types:
                admin_area = component.get("long_name")
        return locality, admin_area


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a Nigeria-first NaviSense dataset manifest.")
    parser.add_argument(
        "--output-root",
        default="",
        help="Base output directory for generated dataset runs. Defaults to DATASET_BUILD_ROOT or navisense-ml/data/datasets.",
    )
    parser.add_argument(
        "--hotosm-geojson",
        default="",
        help="Path to HOT OSM Nigeria GeoJSON/JSON export. Can also be supplied via HOTOSM_NIGERIA_GEOJSON.",
    )
    parser.add_argument(
        "--hotosm-sample-size",
        type=int,
        default=2000,
        help="Maximum number of HOT OSM building records to keep after spatial sampling.",
    )
    parser.add_argument(
        "--include-overpass",
        action="store_true",
        help="Supplement the dataset with OSM/Overpass building queries around seeded Nigerian cities.",
    )
    parser.add_argument(
        "--overpass-per-city",
        type=int,
        default=120,
        help="Maximum number of Overpass building records to keep per seed city after spatial sampling.",
    )
    parser.add_argument(
        "--overpass-timeout-seconds",
        type=int,
        default=40,
        help="Timeout for Overpass API requests.",
    )
    parser.add_argument(
        "--reverse-geocode",
        action="store_true",
        help="Use Google Geocoding to fill in addresses/city/state for records that do not already have them.",
    )
    parser.add_argument(
        "--download-streetview",
        action="store_true",
        help="Download Street View images for manifest records when imagery is available.",
    )
    parser.add_argument(
        "--streetview-headings",
        default="0,90,180,270",
        help="Comma-separated Street View headings to try for each coordinate.",
    )
    parser.add_argument(
        "--streetview-pitch",
        type=int,
        default=0,
        help="Street View pitch to request.",
    )
    parser.add_argument(
        "--streetview-size",
        default=os.getenv("STREETVIEW_IMAGE_SIZE", "640x640"),
        help="Street View image size, e.g. 640x640.",
    )
    parser.add_argument(
        "--request-delay-seconds",
        type=float,
        default=0.2,
        help="Delay between external API requests to reduce rate-limit pressure.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    builder = DatasetBuilder(args)
    summary = builder.build()
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
