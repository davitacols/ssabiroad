import io
import math
import os
import re
from typing import Any, Dict, List, Optional, Sequence

import boto3
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from botocore.exceptions import ClientError

CLIMATE_BANDS = ["tropical", "subtropical", "temperate", "polar"]
LATITUDE_HEMISPHERES = ["southern", "northern"]
LONGITUDE_HEMISPHERES = ["western", "eastern"]
COARSE_CELL_LAT_STEP = 10.0
COARSE_CELL_LNG_STEP = 10.0
COARSE_LAT_BUCKET_COUNT = int(180 / COARSE_CELL_LAT_STEP)
COARSE_LNG_BUCKET_COUNT = int(360 / COARSE_CELL_LNG_STEP)
COARSE_CELL_COUNT = COARSE_LAT_BUCKET_COUNT * COARSE_LNG_BUCKET_COUNT


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)

    dlat = lat2_rad - lat1_rad
    dlng = lng2_rad - lng1_rad
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(max(1 - a, 1e-8)))
    return 6371.0 * c


class ImageProjectionHead(nn.Module):
    def __init__(self, embedding_dim: int = 512):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(embedding_dim, embedding_dim),
            nn.LayerNorm(embedding_dim),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(embedding_dim, embedding_dim),
        )

    def forward(self, image_embeddings: torch.Tensor) -> torch.Tensor:
        projected = self.layers(image_embeddings)
        return F.normalize(projected + image_embeddings, dim=-1)


class FourierLocationEncoder(nn.Module):
    def __init__(self, output_dim: int = 512, frequency_count: int = 16):
        super().__init__()
        frequencies = torch.logspace(
            0,
            math.log2(64.0),
            steps=frequency_count,
            base=2.0,
        )
        self.register_buffer("frequencies", frequencies)
        input_dim = 6 + (frequency_count * 8)
        self.layers = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.LayerNorm(512),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(512, output_dim),
        )

    def forward(self, coordinates: torch.Tensor) -> torch.Tensor:
        lat = torch.deg2rad(coordinates[:, 0:1])
        lng = torch.deg2rad(coordinates[:, 1:2])

        base_features = [
            torch.sin(lat),
            torch.cos(lat),
            torch.sin(lng),
            torch.cos(lng),
            torch.sin(lat) * torch.cos(lng),
            torch.cos(lat) * torch.sin(lng),
        ]

        periodic_features = []
        for frequency in self.frequencies:
            periodic_features.extend(
                [
                    torch.sin(lat * frequency),
                    torch.cos(lat * frequency),
                    torch.sin(lng * frequency),
                    torch.cos(lng * frequency),
                    torch.sin((lat + lng) * frequency),
                    torch.cos((lat + lng) * frequency),
                    torch.sin((lat - lng) * frequency),
                    torch.cos((lat - lng) * frequency),
                ]
            )

        encoded = torch.cat(base_features + periodic_features, dim=1)
        return F.normalize(self.layers(encoded), dim=-1)


class GeoPriorHead(nn.Module):
    def __init__(self, embedding_dim: int = 512, hidden_dim: int = 512):
        super().__init__()
        self.trunk = nn.Sequential(
            nn.Linear(embedding_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.1),
        )
        self.coarse_cell_classifier = nn.Linear(hidden_dim, COARSE_CELL_COUNT)
        self.climate_classifier = nn.Linear(hidden_dim, len(CLIMATE_BANDS))
        self.latitude_hemisphere_classifier = nn.Linear(hidden_dim, len(LATITUDE_HEMISPHERES))
        self.longitude_hemisphere_classifier = nn.Linear(hidden_dim, len(LONGITUDE_HEMISPHERES))
        self.coordinate_head = nn.Linear(hidden_dim, 2)

    def forward(self, image_embeddings: torch.Tensor) -> Dict[str, torch.Tensor]:
        features = self.trunk(image_embeddings)
        return {
            "coarse_cell_logits": self.coarse_cell_classifier(features),
            "climate_logits": self.climate_classifier(features),
            "latitude_hemisphere_logits": self.latitude_hemisphere_classifier(features),
            "longitude_hemisphere_logits": self.longitude_hemisphere_classifier(features),
            "coordinate_prediction": torch.tanh(self.coordinate_head(features)),
        }


class GeoAlignmentModel(nn.Module):
    def __init__(self, embedding_dim: int = 512):
        super().__init__()
        self.image_head = ImageProjectionHead(embedding_dim=embedding_dim)
        self.location_head = FourierLocationEncoder(output_dim=embedding_dim)
        self.prior_head = GeoPriorHead(embedding_dim=embedding_dim)
        self.logit_scale = nn.Parameter(torch.tensor(math.log(1 / 0.07)))

    def encode_image(self, image_embeddings: torch.Tensor) -> torch.Tensor:
        return self.image_head(image_embeddings)

    def encode_location(self, coordinates: torch.Tensor) -> torch.Tensor:
        return self.location_head(coordinates)

    def predict_priors(self, image_embeddings: torch.Tensor) -> Dict[str, torch.Tensor]:
        return self.prior_head(image_embeddings)

    def contrastive_loss(
        self,
        image_embeddings: torch.Tensor,
        coordinates: torch.Tensor,
    ) -> torch.Tensor:
        projected_images = self.encode_image(image_embeddings)
        projected_locations = self.encode_location(coordinates)
        scale = self.logit_scale.exp().clamp(1.0, 100.0)
        logits = scale * projected_images @ projected_locations.T
        targets = torch.arange(logits.shape[0], device=logits.device)
        image_loss = F.cross_entropy(logits, targets)
        location_loss = F.cross_entropy(logits.T, targets)
        return 0.5 * (image_loss + location_loss)

    def joint_loss(
        self,
        image_embeddings: torch.Tensor,
        coordinates: torch.Tensor,
        prior_targets: Dict[str, torch.Tensor],
    ) -> Dict[str, torch.Tensor]:
        contrastive = self.contrastive_loss(image_embeddings, coordinates)
        prior_outputs = self.predict_priors(image_embeddings)

        coarse_cell_loss = F.cross_entropy(
            prior_outputs["coarse_cell_logits"],
            prior_targets["coarse_cell_indices"],
        )
        climate_loss = F.cross_entropy(
            prior_outputs["climate_logits"],
            prior_targets["climate_indices"],
        )
        latitude_hemisphere_loss = F.cross_entropy(
            prior_outputs["latitude_hemisphere_logits"],
            prior_targets["latitude_hemisphere_indices"],
        )
        longitude_hemisphere_loss = F.cross_entropy(
            prior_outputs["longitude_hemisphere_logits"],
            prior_targets["longitude_hemisphere_indices"],
        )
        coordinate_loss = F.smooth_l1_loss(
            prior_outputs["coordinate_prediction"],
            prior_targets["normalized_coordinates"],
        )

        total = (
            contrastive
            + (0.35 * coarse_cell_loss)
            + (0.1 * climate_loss)
            + (0.05 * latitude_hemisphere_loss)
            + (0.05 * longitude_hemisphere_loss)
            + (0.25 * coordinate_loss)
        )

        return {
            "total": total,
            "contrastive": contrastive,
            "coarse_cell": coarse_cell_loss,
            "climate": climate_loss,
            "latitude_hemisphere": latitude_hemisphere_loss,
            "longitude_hemisphere": longitude_hemisphere_loss,
            "coordinate": coordinate_loss,
        }


class ZeroShotSceneAnalyzer:
    PROMPT_GROUPS: Dict[str, Dict[str, List[str]]] = {
        "landmark_types": {
            "cathedral": [
                "a photo of a cathedral",
                "a stone cathedral with towers and arches",
            ],
            "mosque": [
                "a photo of a mosque",
                "a mosque with domes and minarets",
            ],
            "bridge": [
                "a photo of a large bridge",
                "a landmark bridge over water",
            ],
            "stadium": [
                "a photo of a stadium",
                "a large sports stadium",
            ],
            "airport_terminal": [
                "a photo of an airport terminal",
                "a modern airport building",
            ],
            "train_station": [
                "a photo of a train station",
                "a railway station building",
            ],
            "office_tower": [
                "a photo of a glass office tower",
                "a modern commercial high rise",
            ],
            "residential_block": [
                "a photo of apartment buildings",
                "a dense residential block",
            ],
            "market_street": [
                "a photo of a busy market street",
                "a commercial street with storefronts",
            ],
            "monument": [
                "a photo of a monument",
                "a public monument or memorial",
            ],
        },
        "architectural_styles": {
            "gothic": [
                "gothic architecture with pointed arches",
                "a gothic stone facade",
            ],
            "modern_glass": [
                "modern glass architecture",
                "a sleek glass office facade",
            ],
            "brutalist": [
                "brutalist concrete architecture",
                "a heavy concrete facade",
            ],
            "colonial": [
                "colonial architecture",
                "a colonial era building facade",
            ],
            "vernacular": [
                "vernacular local architecture",
                "a traditional neighborhood streetscape",
            ],
            "industrial": [
                "industrial warehouse architecture",
                "a utilitarian industrial building",
            ],
            "big_box_retail": [
                "a big box retail storefront with large signage",
                "an out of town retail park facade",
            ],
            "mall_frontage": [
                "a shopping mall frontage with chain stores",
                "a retail complex facade with prominent signage",
            ],
            "office_park": [
                "a suburban office park building",
                "a low rise commercial office facade",
            ],
        },
        "building_typologies": {
            "strip_mall": [
                "a strip mall with multiple storefronts",
                "a roadside retail row with parking in front",
            ],
            "warehouse_unit": [
                "a warehouse unit in an industrial estate",
                "a light industrial shed with commercial signage",
            ],
            "shopping_centre": [
                "a shopping centre entrance with branded stores",
                "a mall or retail park commercial building",
            ],
            "office_block": [
                "a low rise office block",
                "a commercial office building near a roadway",
            ],
            "civic_building": [
                "a civic or institutional building",
                "a public services building facade",
            ],
            "hospitality_venue": [
                "a restaurant or bar frontage",
                "a hospitality venue with exterior signage",
            ],
        },
        "environment": {
            "coastal": [
                "a coastal street near the ocean",
                "a seaside town with marine air",
            ],
            "mountainous": [
                "a mountainous landscape with steep slopes",
                "a hillside settlement in the mountains",
            ],
            "tropical": [
                "a tropical urban scene with lush greenery",
                "a humid tropical street",
            ],
            "arid": [
                "an arid dry landscape",
                "a hot dry street with sparse greenery",
            ],
            "dense_urban": [
                "a dense downtown city street",
                "a crowded urban core with tall buildings",
            ],
            "suburban": [
                "a suburban street with spaced buildings",
                "a lower density neighborhood street",
            ],
            "rural": [
                "a rural road with open land",
                "a sparse settlement in the countryside",
            ],
            "commercial_corridor": [
                "a roadside commercial corridor with storefronts",
                "an auto oriented retail strip with parking",
            ],
            "industrial_estate": [
                "an industrial estate with warehouse buildings",
                "a light industrial roadside area",
            ],
            "retail_park": [
                "an out of town retail park environment",
                "a large format shopping area with chain stores",
            ],
            "peri_urban": [
                "a peri urban edge of city commercial zone",
                "a suburban fringe road with mixed commercial buildings",
            ],
        },
    }

    SCORE_DIMENSIONS: Dict[str, Dict[str, List[str]]] = {
        "walkability": {
            "positive": [
                "a walkable mixed use street with sidewalks",
                "a pedestrian friendly city block",
                "a safe urban street for walking",
            ],
            "negative": [
                "a car dependent road with no sidewalk",
                "a hostile road for pedestrians",
                "a highway like street with heavy traffic",
            ],
        },
        "urban_density": {
            "positive": [
                "a dense urban downtown scene",
                "a tightly packed city street",
                "a high density mixed use neighborhood",
            ],
            "negative": [
                "a sparse low density rural road",
                "a spread out suburban street",
                "an open low density landscape",
            ],
        },
        "greenery": {
            "positive": [
                "a tree lined street with abundant greenery",
                "a lush green urban environment",
                "a neighborhood with strong vegetation",
            ],
            "negative": [
                "a barren paved environment",
                "a concrete heavy street with little greenery",
                "a dry streetscape with sparse vegetation",
            ],
        },
        "terrain_complexity": {
            "positive": [
                "a steep hilly street",
                "a mountainous or highly sloped environment",
                "a rugged elevated landscape",
            ],
            "negative": [
                "a flat plain with little elevation change",
                "a level city street on flat ground",
                "a broad flat suburban road",
            ],
        },
    }

    def __init__(self, clip_model, processor, device: str):
        self.clip_model = clip_model
        self.processor = processor
        self.device = device
        self.prompt_cache: Dict[str, Dict[str, torch.Tensor]] = {}
        self.dimension_cache: Dict[str, Dict[str, torch.Tensor]] = {}
        self.max_text_clues = 12
        self.max_clue_length = 96
        self.max_text_fusion_weight = float(os.getenv("NAVISENSE_V3_TEXT_FUSION_WEIGHT", "0.28"))

    def _encode_text_prompts(self, prompts: Sequence[str]) -> torch.Tensor:
        inputs = self.processor(
            text=list(prompts),
            return_tensors="pt",
            padding=True,
            truncation=True,
        ).to(self.device)
        with torch.no_grad():
            text_features = self.clip_model.get_text_features(**inputs)
        return F.normalize(text_features, dim=-1)

    def _get_prompt_group(self, group_name: str) -> Dict[str, torch.Tensor]:
        if group_name in self.prompt_cache:
            return self.prompt_cache[group_name]

        encoded_group: Dict[str, torch.Tensor] = {}
        for label, prompts in self.PROMPT_GROUPS[group_name].items():
            prompt_embeddings = self._encode_text_prompts(prompts)
            encoded_group[label] = F.normalize(prompt_embeddings.mean(dim=0), dim=0)

        self.prompt_cache[group_name] = encoded_group
        return encoded_group

    def _get_dimension_prompts(self, dimension_name: str) -> Dict[str, torch.Tensor]:
        if dimension_name in self.dimension_cache:
            return self.dimension_cache[dimension_name]

        encoded = {}
        for polarity, prompts in self.SCORE_DIMENSIONS[dimension_name].items():
            prompt_embeddings = self._encode_text_prompts(prompts)
            encoded[polarity] = F.normalize(prompt_embeddings.mean(dim=0), dim=0)
        self.dimension_cache[dimension_name] = encoded
        return encoded

    @staticmethod
    def _normalize_image_embedding(image_embedding: np.ndarray) -> torch.Tensor:
        tensor = torch.FloatTensor(image_embedding).unsqueeze(0)
        return F.normalize(tensor, dim=-1)

    def _normalize_text_clues(
        self,
        ocr_text: Optional[str] = None,
        context_clues: Optional[Sequence[str]] = None,
    ) -> List[str]:
        clues: List[str] = []

        if ocr_text:
            normalized_text = re.sub(r"\s+", " ", ocr_text).strip()
            if normalized_text:
                for segment in re.split(r"[|;\n]+", normalized_text):
                    cleaned = segment.strip()
                    if len(cleaned) >= 3:
                        clues.append(cleaned[: self.max_clue_length])

        if context_clues:
            for clue in context_clues:
                cleaned = re.sub(r"\s+", " ", str(clue or "")).strip()
                if len(cleaned) >= 3:
                    clues.append(cleaned[: self.max_clue_length])

        deduped: List[str] = []
        seen = set()
        for clue in clues:
            lowered = clue.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            deduped.append(clue)
            if len(deduped) >= self.max_text_clues:
                break

        return deduped

    def encode_text_clues(
        self,
        ocr_text: Optional[str] = None,
        context_clues: Optional[Sequence[str]] = None,
    ) -> Optional[Dict[str, Any]]:
        clues = self._normalize_text_clues(ocr_text=ocr_text, context_clues=context_clues)
        if not clues:
            return None

        prompts = [f"a location clue that says {clue}" for clue in clues]
        text_embeddings = self._encode_text_prompts(prompts)
        fused_text_embedding = F.normalize(text_embeddings.mean(dim=0), dim=0)
        return {
            "clues": clues,
            "embedding": fused_text_embedding,
        }

    def fuse_image_and_text(
        self,
        image_embedding: np.ndarray,
        ocr_text: Optional[str] = None,
        context_clues: Optional[Sequence[str]] = None,
    ) -> Dict[str, Any]:
        image_vector = self._normalize_image_embedding(image_embedding).squeeze(0).to(self.device)
        encoded_text = self.encode_text_clues(ocr_text=ocr_text, context_clues=context_clues)
        if not encoded_text:
            return {
                "embedding": image_vector.cpu().numpy(),
                "multimodal_context": {
                    "enabled": False,
                    "fusion_weight": 0.0,
                    "clue_count": 0,
                    "clues": [],
                },
            }

        clue_count = len(encoded_text["clues"])
        fusion_weight = min(
            self.max_text_fusion_weight,
            0.12 + (0.04 * clue_count),
        )
        text_vector = encoded_text["embedding"].to(self.device)
        fused_vector = F.normalize(
            ((1.0 - fusion_weight) * image_vector) + (fusion_weight * text_vector),
            dim=0,
        )
        alignment = float(torch.dot(image_vector, text_vector).item())

        return {
            "embedding": fused_vector.cpu().numpy(),
            "multimodal_context": {
                "enabled": True,
                "fusion_weight": round(float(fusion_weight), 4),
                "clue_count": clue_count,
                "clues": encoded_text["clues"],
                "image_text_alignment": round(alignment, 4),
            },
        }

    def classify_group(
        self,
        group_name: str,
        image_embedding: np.ndarray,
        top_k: int = 3,
    ) -> List[Dict[str, Any]]:
        image_vector = self._normalize_image_embedding(image_embedding).to(self.device)
        prompt_group = self._get_prompt_group(group_name)
        labels = list(prompt_group.keys())
        text_matrix = torch.stack([prompt_group[label] for label in labels]).to(self.device)
        scores = (image_vector @ text_matrix.T).squeeze(0)
        probabilities = torch.softmax(scores * 10.0, dim=0)
        top_k = min(top_k, len(labels))
        values, indices = torch.topk(probabilities, k=top_k)

        results: List[Dict[str, Any]] = []
        for probability, index in zip(values.tolist(), indices.tolist()):
            results.append({"label": labels[index], "score": round(float(probability), 4)})
        return results

    def score_dimension(self, dimension_name: str, image_embedding: np.ndarray) -> Dict[str, Any]:
        prompts = self._get_dimension_prompts(dimension_name)
        image_vector = self._normalize_image_embedding(image_embedding).to(self.device)
        positive_score = float((image_vector @ prompts["positive"].unsqueeze(1).to(self.device)).item())
        negative_score = float((image_vector @ prompts["negative"].unsqueeze(1).to(self.device)).item())
        logit = (positive_score - negative_score) * 6.0
        normalized = 1.0 / (1.0 + math.exp(-logit))
        score = int(round(normalized * 100))

        if score >= 67:
            label = "high"
        elif score >= 34:
            label = "medium"
        else:
            label = "low"

        return {
            "score": score,
            "label": label,
            "positive_similarity": round(positive_score, 4),
            "negative_similarity": round(negative_score, 4),
        }

    def analyze_embedding(self, image_embedding: np.ndarray) -> Dict[str, Any]:
        return {
            "landmark_hypotheses": self.classify_group("landmark_types", image_embedding, top_k=3),
            "architectural_hypotheses": self.classify_group("architectural_styles", image_embedding, top_k=3),
            "building_typology_hypotheses": self.classify_group("building_typologies", image_embedding, top_k=3),
            "environment_hypotheses": self.classify_group("environment", image_embedding, top_k=3),
            "urban_signals": {
                "walkability": self.score_dimension("walkability", image_embedding),
                "urban_density": self.score_dimension("urban_density", image_embedding),
                "greenery": self.score_dimension("greenery", image_embedding),
                "terrain_complexity": self.score_dimension("terrain_complexity", image_embedding),
            },
        }


class NaviSenseV3:
    def __init__(self, clip_model, processor, device: str = "cpu", embedding_dim: int = 512):
        self.device = device
        self.embedding_dim = int(embedding_dim)
        self.model = GeoAlignmentModel(embedding_dim=self.embedding_dim).to(device)
        self.model.eval()
        self.optimizer = torch.optim.AdamW(self.model.parameters(), lr=0.0005, weight_decay=0.01)
        self.scene_analyzer = ZeroShotSceneAnalyzer(clip_model, processor, device)
        self.training_examples: List[Dict[str, Any]] = []
        self.memory_records: List[Dict[str, Any]] = []
        self.memory_location_embeddings: Optional[torch.Tensor] = None
        self.score_gate = float(os.getenv("NAVISENSE_V3_SCORE_GATE", "0.78"))
        self.inference_temperature = float(os.getenv("NAVISENSE_V3_INFERENCE_TEMPERATURE", "0.08"))
        self.training_metrics: Dict[str, Any] = {}

        self.artifact_path = os.getenv("NAVISENSE_V3_ARTIFACT_PATH", "navisense_v3.pth")
        self.artifact_bucket = os.getenv("ML_ARTIFACTS_BUCKET") or os.getenv("AWS_S3_BUCKET_NAME")
        self.artifact_key = os.getenv(
            "NAVISENSE_V3_S3_KEY",
            "navisense-ml-artifacts/navisense_v3.pth",
        )
        self.s3_client = self._build_s3_client()
        self.load_artifacts()

    def _build_s3_client(self):
        if not self.artifact_bucket:
            return None

        try:
            return boto3.client(
                "s3",
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_S3_REGION_NAME", "us-east-1"),
            )
        except Exception as error:
            print(f"Failed to initialize NaviSense V3 artifact client: {error}")
            return None

    @staticmethod
    def _record_key(record: Dict[str, Any]) -> str:
        if record.get("image_hash"):
            return str(record["image_hash"])

        lat = round(float(record["latitude"]), 6)
        lng = round(float(record["longitude"]), 6)
        place_key = record.get("place_key")
        if place_key:
            return str(place_key)

        return f"{lat}:{lng}:{record.get('address') or record.get('businessName') or 'unknown'}"

    @staticmethod
    def _normalize_memory_text(value: Optional[str]) -> str:
        normalized = re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()
        return normalized

    @classmethod
    def _memory_key(cls, record: Dict[str, Any]) -> str:
        place_key = record.get("place_key")
        if place_key:
            return str(place_key)

        lat = round(float(record["latitude"]), 4)
        lng = round(float(record["longitude"]), 4)
        address = cls._normalize_memory_text(record.get("address"))
        business_name = cls._normalize_memory_text(record.get("businessName"))
        semantic_name = address or business_name
        if semantic_name:
            return f"{lat}:{lng}:{semantic_name}"
        return f"{lat}:{lng}"

    def _canonicalize_example(
        self,
        record: Dict[str, Any],
        image_embedding: Sequence[float],
    ) -> Dict[str, Any]:
        return {
            "image_hash": record.get("image_hash") or record.get("imageHash"),
            "latitude": float(record["latitude"]),
            "longitude": float(record["longitude"]),
            "address": record.get("address"),
            "businessName": record.get("businessName"),
            "source": record.get("source", "unknown"),
            "place_key": record.get("place_key"),
            "image_embedding": list(image_embedding),
        }

    def _filter_compatible_examples(self, examples: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
        compatible: List[Dict[str, Any]] = []
        skipped = 0

        for example in examples:
            embedding = example.get("image_embedding")
            if embedding is None or len(embedding) != self.embedding_dim:
                skipped += 1
                continue
            compatible.append(example)

        if skipped > 0:
            print(
                "Skipped incompatible NaviSense V3 training examples after backbone change: "
                f"{skipped} removed, {len(compatible)} retained"
            )

        return compatible

    def _refresh_location_memory(self, records: Optional[List[Dict[str, Any]]] = None) -> None:
        memory_source = records if records is not None else self.training_examples
        if not memory_source:
            self.memory_records = []
            self.memory_location_embeddings = None
            return

        self.memory_records = list(memory_source)
        coordinates = torch.FloatTensor(
            [[record["latitude"], record["longitude"]] for record in self.memory_records]
        ).to(self.device)

        with torch.no_grad():
            self.memory_location_embeddings = self.model.encode_location(coordinates)

    def _rank_matches(
        self,
        raw_scores: torch.Tensor,
        ranking_scores: torch.Tensor,
        top_k: int,
    ) -> List[Dict[str, Any]]:
        ranked_indices = torch.argsort(ranking_scores, descending=True).tolist()
        matches: List[Dict[str, Any]] = []
        seen = set()

        for index in ranked_indices:
            record = self.memory_records[index]
            key = self._memory_key(record)
            if key in seen:
                continue
            seen.add(key)
            matches.append(
                {
                    "index": index,
                    "record": record,
                    "raw_score": float(raw_scores[index].item()),
                    "fused_score": float(ranking_scores[index].item()),
                }
            )
            if len(matches) >= top_k:
                break

        return matches

    @staticmethod
    def _climate_band(latitude: float) -> str:
        return CLIMATE_BANDS[NaviSenseV3._climate_band_index(latitude)]

    @staticmethod
    def _climate_band_index(latitude: float) -> int:
        absolute_lat = abs(latitude)
        if absolute_lat < 23.5:
            return 0
        if absolute_lat < 40:
            return 1
        if absolute_lat < 66.5:
            return 2
        return 3

    @staticmethod
    def _coarse_cell_components(latitude: float, longitude: float) -> Dict[str, Any]:
        latitude_bucket = int(
            min(
                max(math.floor((latitude + 90.0) / COARSE_CELL_LAT_STEP), 0),
                COARSE_LAT_BUCKET_COUNT - 1,
            )
        )
        longitude_bucket = int(
            min(
                max(math.floor((longitude + 180.0) / COARSE_CELL_LNG_STEP), 0),
                COARSE_LNG_BUCKET_COUNT - 1,
            )
        )
        latitude_min = -90.0 + (latitude_bucket * COARSE_CELL_LAT_STEP)
        longitude_min = -180.0 + (longitude_bucket * COARSE_CELL_LNG_STEP)
        latitude_max = latitude_min + COARSE_CELL_LAT_STEP
        longitude_max = longitude_min + COARSE_CELL_LNG_STEP

        return {
            "cell_index": (latitude_bucket * COARSE_LNG_BUCKET_COUNT) + longitude_bucket,
            "cell_label": f"{latitude_bucket}:{longitude_bucket}",
            "latitude_bucket": latitude_bucket,
            "longitude_bucket": longitude_bucket,
            "latitude_range": [latitude_min, latitude_max],
            "longitude_range": [longitude_min, longitude_max],
            "center": {
                "latitude": latitude_min + (COARSE_CELL_LAT_STEP / 2.0),
                "longitude": longitude_min + (COARSE_CELL_LNG_STEP / 2.0),
            },
        }

    @classmethod
    def _decode_coarse_cell_index(cls, cell_index: int) -> Dict[str, Any]:
        latitude_bucket = max(0, min(cell_index // COARSE_LNG_BUCKET_COUNT, COARSE_LAT_BUCKET_COUNT - 1))
        longitude_bucket = max(0, min(cell_index % COARSE_LNG_BUCKET_COUNT, COARSE_LNG_BUCKET_COUNT - 1))
        latitude = -90.0 + (latitude_bucket * COARSE_CELL_LAT_STEP) + (COARSE_CELL_LAT_STEP / 2.0)
        longitude = -180.0 + (longitude_bucket * COARSE_CELL_LNG_STEP) + (COARSE_CELL_LNG_STEP / 2.0)
        components = cls._coarse_cell_components(latitude, longitude)
        return components

    @classmethod
    def _coarse_cell_index(cls, latitude: float, longitude: float) -> int:
        return cls._coarse_cell_components(latitude, longitude)["cell_index"]

    def describe_geospatial_prior(self, latitude: float, longitude: float) -> Dict[str, str]:
        coarse_cell = self._coarse_cell_components(latitude, longitude)
        return {
            "latitude_hemisphere": LATITUDE_HEMISPHERES[1 if latitude >= 0 else 0],
            "longitude_hemisphere": LONGITUDE_HEMISPHERES[1 if longitude >= 0 else 0],
            "climate_band": self._climate_band(latitude),
            "coarse_cell": coarse_cell["cell_label"],
            "coarse_cell_center": coarse_cell["center"],
        }

    def _build_prior_targets(self, coordinates: torch.Tensor) -> Dict[str, torch.Tensor]:
        latitudes = coordinates[:, 0]
        longitudes = coordinates[:, 1]
        absolute_latitudes = torch.abs(latitudes)

        climate_indices = torch.full_like(latitudes, 3, dtype=torch.long)
        climate_indices = torch.where(
            absolute_latitudes < 66.5,
            torch.full_like(climate_indices, 2),
            climate_indices,
        )
        climate_indices = torch.where(
            absolute_latitudes < 40.0,
            torch.full_like(climate_indices, 1),
            climate_indices,
        )
        climate_indices = torch.where(
            absolute_latitudes < 23.5,
            torch.zeros_like(climate_indices),
            climate_indices,
        )

        latitude_bucket = torch.clamp(
            torch.floor((latitudes + 90.0) / COARSE_CELL_LAT_STEP),
            0,
            COARSE_LAT_BUCKET_COUNT - 1,
        ).long()
        longitude_bucket = torch.clamp(
            torch.floor((longitudes + 180.0) / COARSE_CELL_LNG_STEP),
            0,
            COARSE_LNG_BUCKET_COUNT - 1,
        ).long()

        return {
            "coarse_cell_indices": (latitude_bucket * COARSE_LNG_BUCKET_COUNT) + longitude_bucket,
            "climate_indices": climate_indices,
            "latitude_hemisphere_indices": (latitudes >= 0).long(),
            "longitude_hemisphere_indices": (longitudes >= 0).long(),
            "normalized_coordinates": torch.stack(
                [latitudes / 90.0, longitudes / 180.0],
                dim=1,
            ),
        }

    def _prepare_query_embedding(
        self,
        image_embedding: np.ndarray,
        ocr_text: Optional[str] = None,
        context_clues: Optional[Sequence[str]] = None,
    ) -> Dict[str, Any]:
        prepared = self.scene_analyzer.fuse_image_and_text(
            image_embedding,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )
        return {
            "embedding": np.array(prepared["embedding"], dtype=np.float32),
            "multimodal_context": prepared["multimodal_context"],
        }

    def _predict_prior_state(self, image_embedding: np.ndarray, top_k: int = 5) -> Dict[str, Any]:
        image_tensor = torch.FloatTensor(image_embedding).unsqueeze(0).to(self.device)
        with torch.no_grad():
            prior_outputs = self.model.predict_priors(image_tensor)

        coarse_cell_probabilities = torch.softmax(
            prior_outputs["coarse_cell_logits"],
            dim=-1,
        ).squeeze(0).cpu()
        climate_probabilities = torch.softmax(prior_outputs["climate_logits"], dim=-1).squeeze(0).cpu()
        latitude_hemisphere_probabilities = torch.softmax(
            prior_outputs["latitude_hemisphere_logits"],
            dim=-1,
        ).squeeze(0).cpu()
        longitude_hemisphere_probabilities = torch.softmax(
            prior_outputs["longitude_hemisphere_logits"],
            dim=-1,
        ).squeeze(0).cpu()

        normalized_coordinates = prior_outputs["coordinate_prediction"].squeeze(0).cpu().numpy()
        predicted_coordinate = {
            "latitude": float(np.clip(normalized_coordinates[0] * 90.0, -90.0, 90.0)),
            "longitude": float(np.clip(normalized_coordinates[1] * 180.0, -180.0, 180.0)),
        }

        top_cell_count = min(top_k, COARSE_CELL_COUNT)
        coarse_values, coarse_indices = torch.topk(coarse_cell_probabilities, k=top_cell_count)
        top_coarse_cells = []
        for probability, cell_index in zip(coarse_values.tolist(), coarse_indices.tolist()):
            coarse_cell = self._decode_coarse_cell_index(cell_index)
            top_coarse_cells.append(
                {
                    "index": cell_index,
                    "cell": coarse_cell["cell_label"],
                    "probability": round(float(probability), 4),
                    "center": coarse_cell["center"],
                    "latitude_range": coarse_cell["latitude_range"],
                    "longitude_range": coarse_cell["longitude_range"],
                }
            )

        climate_values, climate_indices = torch.topk(
            climate_probabilities,
            k=min(3, len(CLIMATE_BANDS)),
        )
        top_climate_bands = [
            {
                "label": CLIMATE_BANDS[index],
                "score": round(float(value), 4),
            }
            for value, index in zip(climate_values.tolist(), climate_indices.tolist())
        ]

        latitude_hemisphere_index = int(torch.argmax(latitude_hemisphere_probabilities).item())
        longitude_hemisphere_index = int(torch.argmax(longitude_hemisphere_probabilities).item())
        climate_index = int(torch.argmax(climate_probabilities).item())
        coarse_entropy = -float(
            torch.sum(
                coarse_cell_probabilities
                * torch.log(torch.clamp(coarse_cell_probabilities, min=1e-8, max=1.0))
            ).item()
        )
        coarse_concentration = 1.0 - min(
            coarse_entropy / math.log(max(COARSE_CELL_COUNT, 2)),
            1.0,
        )

        return {
            "coarse_cell_probabilities": coarse_cell_probabilities.numpy(),
            "climate_probabilities": climate_probabilities.numpy(),
            "latitude_hemisphere_probabilities": latitude_hemisphere_probabilities.numpy(),
            "longitude_hemisphere_probabilities": longitude_hemisphere_probabilities.numpy(),
            "predicted_coordinate": predicted_coordinate,
            "diagnostics": {
                "predicted_coordinate": predicted_coordinate,
                "coarse_cell": top_coarse_cells[0] if top_coarse_cells else None,
                "top_coarse_cells": top_coarse_cells,
                "climate_band": top_climate_bands[0] if top_climate_bands else None,
                "top_climate_bands": top_climate_bands,
                "latitude_hemisphere": {
                    "label": LATITUDE_HEMISPHERES[latitude_hemisphere_index],
                    "score": round(float(latitude_hemisphere_probabilities[latitude_hemisphere_index]), 4),
                },
                "longitude_hemisphere": {
                    "label": LONGITUDE_HEMISPHERES[longitude_hemisphere_index],
                    "score": round(float(longitude_hemisphere_probabilities[longitude_hemisphere_index]), 4),
                },
                "coarse_cell_concentration": round(float(coarse_concentration), 4),
            },
        }

    def predict_geospatial_priors(
        self,
        image_embedding: np.ndarray,
        top_k: int = 5,
        ocr_text: Optional[str] = None,
        context_clues: Optional[Sequence[str]] = None,
    ) -> Dict[str, Any]:
        query = self._prepare_query_embedding(
            image_embedding,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )
        diagnostics = self._predict_prior_state(query["embedding"], top_k=top_k)["diagnostics"]
        diagnostics["multimodal_context"] = query["multimodal_context"]
        return diagnostics

    def _prior_alignment_for_record(
        self,
        record: Dict[str, Any],
        prior_state: Dict[str, Any],
    ) -> Dict[str, Any]:
        coarse_cell_index = self._coarse_cell_index(
            float(record["latitude"]),
            float(record["longitude"]),
        )
        climate_index = self._climate_band_index(float(record["latitude"]))
        latitude_hemisphere_index = 1 if float(record["latitude"]) >= 0 else 0
        longitude_hemisphere_index = 1 if float(record["longitude"]) >= 0 else 0

        predicted_coordinate = prior_state["predicted_coordinate"]
        coordinate_distance_km = haversine_km(
            predicted_coordinate["latitude"],
            predicted_coordinate["longitude"],
            float(record["latitude"]),
            float(record["longitude"]),
        )
        coordinate_bonus = math.exp(-coordinate_distance_km / 2500.0)
        coarse_cell_probability = float(prior_state["coarse_cell_probabilities"][coarse_cell_index])
        climate_probability = float(prior_state["climate_probabilities"][climate_index])
        latitude_hemisphere_probability = float(
            prior_state["latitude_hemisphere_probabilities"][latitude_hemisphere_index]
        )
        longitude_hemisphere_probability = float(
            prior_state["longitude_hemisphere_probabilities"][longitude_hemisphere_index]
        )
        total_bonus = (
            (0.18 * coarse_cell_probability)
            + (0.08 * climate_probability)
            + (0.05 * latitude_hemisphere_probability)
            + (0.05 * longitude_hemisphere_probability)
            + (0.1 * coordinate_bonus)
        )

        return {
            "coarse_cell": self._decode_coarse_cell_index(coarse_cell_index)["cell_label"],
            "coarse_cell_probability": round(coarse_cell_probability, 4),
            "climate_band_probability": round(climate_probability, 4),
            "latitude_hemisphere_probability": round(latitude_hemisphere_probability, 4),
            "longitude_hemisphere_probability": round(longitude_hemisphere_probability, 4),
            "coordinate_distance_km": round(float(coordinate_distance_km), 2),
            "coordinate_bonus": round(float(coordinate_bonus), 4),
            "total_bonus": round(float(total_bonus), 4),
        }

    def _confidence_from_scores(self, raw_scores: np.ndarray, weights: np.ndarray) -> float:
        if raw_scores.size == 0:
            return 0.0

        top_score = float(np.clip((raw_scores[0] + 1.0) / 2.0, 0.0, 1.0))
        margin = raw_scores[0] - raw_scores[1] if raw_scores.size > 1 else raw_scores[0]
        entropy = -float(np.sum(weights * np.log(np.clip(weights, 1e-8, 1.0))))
        max_entropy = math.log(max(len(weights), 2))
        concentration = 1.0 - min(entropy / max_entropy, 1.0)
        confidence = 0.35 + (0.35 * max(top_score, 0.0)) + (0.2 * max(margin, 0.0)) + (0.1 * concentration)
        return float(np.clip(confidence, 0.0, 0.96))

    def add_training_example(self, image_embedding: Sequence[float], record: Dict[str, Any]) -> None:
        if len(image_embedding) != self.embedding_dim:
            raise ValueError(
                f"Expected embedding length {self.embedding_dim}, got {len(image_embedding)}"
            )
        example = self._canonicalize_example(record, image_embedding)
        key = self._record_key(example)
        existing_index = None
        for index, existing in enumerate(self.training_examples):
            if self._record_key(existing) == key:
                existing_index = index
                break

        if existing_index is None:
            self.training_examples.append(example)
        else:
            self.training_examples[existing_index] = example

        self._refresh_location_memory()
        self.save_artifacts()

    def batch_train(
        self,
        examples: List[Dict[str, Any]],
        epochs: int = 12,
        batch_size: int = 32,
    ) -> float:
        canonical_examples: List[Dict[str, Any]] = []
        skipped_incompatible = 0
        for example in examples:
            embedding = example.get("embedding")
            if embedding is None:
                continue
            if len(embedding) != self.embedding_dim:
                skipped_incompatible += 1
                continue
            canonical_examples.append(self._canonicalize_example(example, embedding))

        if skipped_incompatible > 0:
            print(
                "Skipped incompatible NaviSense V3 batch-train examples: "
                f"{skipped_incompatible} removed before training"
            )

        if not canonical_examples:
            self.training_examples = []
            self._refresh_location_memory([])
            self.training_metrics = {"samples": 0, "final_loss": 0.0}
            self.save_artifacts()
            return 0.0

        self.training_examples = canonical_examples
        if len(canonical_examples) < 2:
            self._refresh_location_memory()
            self.training_metrics = {
                "samples": len(canonical_examples),
                "final_loss": 0.0,
                "coarse_cell_classes": COARSE_CELL_COUNT,
            }
            self.save_artifacts()
            return 0.0

        image_embeddings = torch.FloatTensor(
            [example["image_embedding"] for example in canonical_examples]
        ).to(self.device)
        coordinates = torch.FloatTensor(
            [[example["latitude"], example["longitude"]] for example in canonical_examples]
        ).to(self.device)
        prior_targets = self._build_prior_targets(coordinates)

        effective_batch_size = max(2, min(batch_size, len(canonical_examples)))
        final_loss = 0.0
        loss_totals = {
            "total": 0.0,
            "contrastive": 0.0,
            "coarse_cell": 0.0,
            "climate": 0.0,
            "latitude_hemisphere": 0.0,
            "longitude_hemisphere": 0.0,
            "coordinate": 0.0,
        }
        step_count = 0
        self.model.train()

        for _ in range(epochs):
            permutation = torch.randperm(len(canonical_examples), device=self.device)
            for start in range(0, len(canonical_examples), effective_batch_size):
                indices = permutation[start : start + effective_batch_size]
                if indices.numel() < 2:
                    continue

                batch_embeddings = image_embeddings[indices]
                batch_coordinates = coordinates[indices]
                batch_prior_targets = {
                    name: values[indices]
                    for name, values in prior_targets.items()
                }
                losses = self.model.joint_loss(
                    batch_embeddings,
                    batch_coordinates,
                    batch_prior_targets,
                )
                loss = losses["total"]

                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                final_loss = float(loss.item())
                for name, value in losses.items():
                    loss_totals[name] += float(value.item())
                step_count += 1

        self.model.eval()
        self._refresh_location_memory()
        averaged_losses = {
            f"{name}_loss": round(total / max(step_count, 1), 6)
            for name, total in loss_totals.items()
        }
        self.training_metrics = {
            "samples": len(canonical_examples),
            "epochs": epochs,
            "final_loss": final_loss,
            "coarse_cell_classes": COARSE_CELL_COUNT,
            **averaged_losses,
        }
        self.save_artifacts()
        return final_loss

    def predict(
        self,
        image_embedding: np.ndarray,
        top_k: int = 5,
        ocr_text: Optional[str] = None,
        context_clues: Optional[Sequence[str]] = None,
    ) -> Optional[Dict[str, Any]]:
        if self.memory_location_embeddings is None or not self.memory_records:
            return None

        query = self._prepare_query_embedding(
            image_embedding,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )
        prepared_embedding = query["embedding"]
        prior_state = self._predict_prior_state(prepared_embedding, top_k=max(top_k, 3))
        with torch.no_grad():
            image_tensor = torch.FloatTensor(prepared_embedding).unsqueeze(0).to(self.device)
            projected_image = self.model.encode_image(image_tensor)
            raw_scores = (projected_image @ self.memory_location_embeddings.T).squeeze(0)

        fused_scores = raw_scores.clone()
        prior_alignment_by_index: Dict[int, Dict[str, Any]] = {}
        for index, record in enumerate(self.memory_records):
            prior_alignment = self._prior_alignment_for_record(record, prior_state)
            prior_alignment_by_index[index] = prior_alignment
            fused_scores[index] = raw_scores[index] + prior_alignment["total_bonus"]

        ranked_matches = self._rank_matches(
            raw_scores,
            fused_scores,
            top_k=max(top_k, 1),
        )
        if not ranked_matches:
            return None

        ranking_scores = np.array([match["fused_score"] for match in ranked_matches], dtype=np.float32)
        weights = torch.softmax(
            torch.FloatTensor(ranking_scores) / max(self.inference_temperature, 1e-4),
            dim=0,
        ).numpy()

        latitude = float(sum(match["record"]["latitude"] * weight for match, weight in zip(ranked_matches, weights)))
        longitude = float(sum(match["record"]["longitude"] * weight for match, weight in zip(ranked_matches, weights)))

        top_matches = []
        for match, weight in zip(ranked_matches, weights):
            record = match["record"]
            top_matches.append(
                {
                    "latitude": record["latitude"],
                    "longitude": record["longitude"],
                    "address": record.get("address"),
                    "businessName": record.get("businessName"),
                    "source": record.get("source"),
                    "raw_score": round(float(match["raw_score"]), 4),
                    "fused_score": round(float(match["fused_score"]), 4),
                    "weight": round(float(weight), 4),
                    "prior_alignment": prior_alignment_by_index.get(match["index"]),
                    "geospatial_prior": self.describe_geospatial_prior(
                        float(record["latitude"]),
                        float(record["longitude"]),
                    ),
                }
            )

        return {
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "address": ranked_matches[0]["record"].get("address"),
                "businessName": ranked_matches[0]["record"].get("businessName"),
            },
            "confidence": self._confidence_from_scores(ranking_scores, weights),
            "raw_score": round(float(ranked_matches[0]["raw_score"]), 4),
            "fused_score": round(float(ranked_matches[0]["fused_score"]), 4),
            "score_gate": self.score_gate,
            "top_matches": top_matches,
            "geospatial_prior": self.describe_geospatial_prior(latitude, longitude),
            "prior_diagnostics": prior_state["diagnostics"],
            "multimodal_context": query["multimodal_context"],
        }

    def analyze_scene(
        self,
        image_embedding: np.ndarray,
        ocr_text: Optional[str] = None,
        context_clues: Optional[Sequence[str]] = None,
    ) -> Dict[str, Any]:
        query = self._prepare_query_embedding(
            image_embedding,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )
        scene_analysis = self.scene_analyzer.analyze_embedding(query["embedding"])
        scene_analysis["multimodal_context"] = query["multimodal_context"]
        scene_analysis["geospatial_priors"] = self.predict_geospatial_priors(
            image_embedding,
            top_k=3,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )
        alignment = self.predict(
            image_embedding,
            top_k=3,
            ocr_text=ocr_text,
            context_clues=context_clues,
        )
        if alignment:
            scene_analysis["geospatial_alignment"] = {
                "confidence": round(float(alignment["confidence"]), 4),
                "score_gate": alignment["score_gate"],
                "geospatial_prior": alignment["geospatial_prior"],
                "prior_diagnostics": alignment["prior_diagnostics"],
                "multimodal_context": alignment["multimodal_context"],
                "top_matches": alignment["top_matches"],
            }
        else:
            scene_analysis["geospatial_alignment"] = None
        return scene_analysis

    def evaluate(self, examples: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not examples:
            return None

        errors = []
        confidences = []
        prior_coordinate_errors = []
        coarse_cell_top_1_hits = 0
        coarse_cell_top_5_hits = 0
        climate_hits = 0
        latitude_hemisphere_hits = 0
        longitude_hemisphere_hits = 0
        prior_samples = 0
        for example in examples:
            if len(example.get("embedding", [])) != self.embedding_dim:
                continue
            embedding = np.array(example["embedding"])
            prediction = self.predict(embedding, top_k=3)
            if not prediction:
                prior_prediction = self.predict_geospatial_priors(embedding, top_k=5)
            else:
                error_km = haversine_km(
                    prediction["location"]["latitude"],
                    prediction["location"]["longitude"],
                    float(example["latitude"]),
                    float(example["longitude"]),
                )
                errors.append(error_km)
                confidences.append(float(prediction["confidence"]))
                prior_prediction = prediction.get("prior_diagnostics") or self.predict_geospatial_priors(
                    embedding,
                    top_k=5,
                )

            if prior_prediction:
                prior_samples += 1
                actual_coarse_cell_index = self._coarse_cell_index(
                    float(example["latitude"]),
                    float(example["longitude"]),
                )
                top_coarse_cells = prior_prediction.get("top_coarse_cells", [])
                if top_coarse_cells and top_coarse_cells[0]["index"] == actual_coarse_cell_index:
                    coarse_cell_top_1_hits += 1
                if actual_coarse_cell_index in {cell["index"] for cell in top_coarse_cells[:5]}:
                    coarse_cell_top_5_hits += 1

                predicted_coordinate = prior_prediction.get("predicted_coordinate")
                if predicted_coordinate:
                    prior_coordinate_errors.append(
                        haversine_km(
                            predicted_coordinate["latitude"],
                            predicted_coordinate["longitude"],
                            float(example["latitude"]),
                            float(example["longitude"]),
                        )
                    )

                if prior_prediction.get("climate_band", {}).get("label") == self._climate_band(
                    float(example["latitude"])
                ):
                    climate_hits += 1
                if prior_prediction.get("latitude_hemisphere", {}).get("label") == LATITUDE_HEMISPHERES[
                    1 if float(example["latitude"]) >= 0 else 0
                ]:
                    latitude_hemisphere_hits += 1
                if prior_prediction.get("longitude_hemisphere", {}).get("label") == LONGITUDE_HEMISPHERES[
                    1 if float(example["longitude"]) >= 0 else 0
                ]:
                    longitude_hemisphere_hits += 1

        if not errors and not prior_samples:
            return None

        metrics: Dict[str, Any] = {
            "average_error_km": float(np.mean(errors)) if errors else None,
            "median_error_km": float(np.median(errors)) if errors else None,
            "within_1km": float(np.mean([error <= 1.0 for error in errors])) if errors else None,
            "within_10km": float(np.mean([error <= 10.0 for error in errors])) if errors else None,
            "within_50km": float(np.mean([error <= 50.0 for error in errors])) if errors else None,
            "average_confidence": float(np.mean(confidences)) if confidences else 0.0,
            "samples": len(errors),
            "prior_samples": prior_samples,
        }
        if prior_samples:
            metrics.update(
                {
                    "prior_coordinate_error_km": (
                        float(np.mean(prior_coordinate_errors)) if prior_coordinate_errors else None
                    ),
                    "coarse_cell_top1_accuracy": coarse_cell_top_1_hits / prior_samples,
                    "coarse_cell_top5_accuracy": coarse_cell_top_5_hits / prior_samples,
                    "climate_band_accuracy": climate_hits / prior_samples,
                    "latitude_hemisphere_accuracy": latitude_hemisphere_hits / prior_samples,
                    "longitude_hemisphere_accuracy": longitude_hemisphere_hits / prior_samples,
                }
            )
        return metrics

    def save_artifacts(self) -> None:
        try:
            checkpoint = {
                "checkpoint_version": 2,
                "embedding_dim": self.embedding_dim,
                "model_state_dict": self.model.state_dict(),
                "optimizer_state_dict": self.optimizer.state_dict(),
                "training_examples": self.training_examples,
                "training_metrics": self.training_metrics,
                "score_gate": self.score_gate,
                "inference_temperature": self.inference_temperature,
            }

            with open(self.artifact_path, "wb") as artifact_file:
                torch.save(checkpoint, artifact_file)

            if self.s3_client and self.artifact_bucket:
                buffer = io.BytesIO()
                torch.save(checkpoint, buffer)
                self.s3_client.put_object(
                    Bucket=self.artifact_bucket,
                    Key=self.artifact_key,
                    Body=buffer.getvalue(),
                    ContentType="application/octet-stream",
                )
        except Exception as error:
            print(f"Failed to save NaviSense V3 artifacts: {error}")

    def load_artifacts(self) -> None:
        try:
            checkpoint_bytes = None

            if self.s3_client and self.artifact_bucket:
                try:
                    checkpoint_bytes = self.s3_client.get_object(
                        Bucket=self.artifact_bucket,
                        Key=self.artifact_key,
                    )["Body"].read()
                    print("NaviSense V3 artifacts loaded from S3")
                except ClientError as error:
                    error_code = error.response.get("Error", {}).get("Code")
                    if error_code not in {"NoSuchKey", "404"}:
                        print(f"Failed to load NaviSense V3 artifacts from S3: {error}")
                except Exception as error:
                    print(f"Failed to load NaviSense V3 artifacts from S3: {error}")

            if checkpoint_bytes is None and os.path.exists(self.artifact_path):
                with open(self.artifact_path, "rb") as artifact_file:
                    checkpoint_bytes = artifact_file.read()
                print("NaviSense V3 artifacts loaded from local checkpoint")

            if checkpoint_bytes is None:
                return

            checkpoint = torch.load(io.BytesIO(checkpoint_bytes), map_location=self.device)
            checkpoint_embedding_dim = int(checkpoint.get("embedding_dim", self.embedding_dim))
            if checkpoint_embedding_dim != self.embedding_dim:
                print(
                    "Skipping NaviSense V3 model weights because the embedding dimension changed: "
                    f"{checkpoint_embedding_dim} -> {self.embedding_dim}"
                )
                self.training_examples = self._filter_compatible_examples(
                    checkpoint.get("training_examples", [])
                )
                self.training_metrics = checkpoint.get("training_metrics", {})
                self.score_gate = float(checkpoint.get("score_gate", self.score_gate))
                self.inference_temperature = float(
                    checkpoint.get("inference_temperature", self.inference_temperature)
                )
                self.model.eval()
                self._refresh_location_memory()
                return
            load_result = self.model.load_state_dict(
                checkpoint["model_state_dict"],
                strict=False,
            )
            if load_result.missing_keys or load_result.unexpected_keys:
                print(
                    "NaviSense V3 checkpoint loaded with compatibility adjustments: "
                    f"missing={load_result.missing_keys}, unexpected={load_result.unexpected_keys}"
                )
            optimizer_state = checkpoint.get("optimizer_state_dict")
            if optimizer_state:
                try:
                    self.optimizer.load_state_dict(optimizer_state)
                except Exception as error:
                    print(f"Failed to restore NaviSense V3 optimizer state: {error}")
            self.training_examples = self._filter_compatible_examples(
                checkpoint.get("training_examples", [])
            )
            self.training_metrics = checkpoint.get("training_metrics", {})
            self.score_gate = float(checkpoint.get("score_gate", self.score_gate))
            self.inference_temperature = float(
                checkpoint.get("inference_temperature", self.inference_temperature)
            )
            self.model.eval()
            self._refresh_location_memory()
        except Exception as error:
            print(f"Failed to load NaviSense V3 artifacts: {error}")
