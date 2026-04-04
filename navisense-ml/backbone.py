import os
import re
from typing import Any, Dict, Optional, Tuple

import torch
from transformers import AutoModel, AutoProcessor


DEFAULT_BACKBONE_MODEL = "openai/clip-vit-base-patch32"
DEFAULT_INDEX_NAME = "navisense-locations"


def get_backbone_model_name() -> str:
    configured = (
        os.getenv("NAVISENSE_BACKBONE_MODEL")
        or os.getenv("NAVISENSE_CLIP_MODEL_NAME")
        or os.getenv("NAVISENSE_MODEL_NAME")
    )
    return (configured or DEFAULT_BACKBONE_MODEL).strip()


def get_backbone_slug(model_name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", model_name.lower()).strip("-")
    return slug or "default"


def resolve_index_name(model_name: str) -> str:
    configured_index_name = os.getenv("PINECONE_INDEX_NAME")
    if configured_index_name:
        return configured_index_name

    if model_name == DEFAULT_BACKBONE_MODEL:
        return DEFAULT_INDEX_NAME

    return f"{DEFAULT_INDEX_NAME}-{get_backbone_slug(model_name)}"


def resolve_device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


def infer_embedding_dim(model: Any) -> int:
    configured_dimension = os.getenv("NAVISENSE_EMBEDDING_DIM")
    if configured_dimension:
        return int(configured_dimension)

    config = getattr(model, "config", None)
    candidate_containers = [
        config,
        getattr(config, "vision_config", None),
        getattr(config, "text_config", None),
    ]

    for container in candidate_containers:
        if container is None:
            continue
        for attribute in ("projection_dim", "embed_dim", "hidden_size"):
            value = getattr(container, attribute, None)
            if isinstance(value, int) and value > 0:
                return value

    raise RuntimeError(
        "Unable to infer the backbone embedding dimension. "
        "Set NAVISENSE_EMBEDDING_DIM explicitly."
    )


def load_backbone(device: Optional[str] = None) -> Tuple[Any, Any, str, Dict[str, Any]]:
    resolved_device = device or resolve_device()
    model_name = get_backbone_model_name()

    print(f"Loading vision backbone: {model_name}")
    model = AutoModel.from_pretrained(model_name)
    processor = AutoProcessor.from_pretrained(model_name)

    for required_method in ("get_image_features", "get_text_features"):
        if not hasattr(model, required_method):
            raise RuntimeError(
                f"Configured backbone '{model_name}' does not expose `{required_method}`. "
                "Use a CLIP-compatible or dual-encoder vision-language model."
            )

    model.to(resolved_device)
    model.eval()

    embedding_dim = infer_embedding_dim(model)
    backbone_info = {
        "model_name": model_name,
        "embedding_dim": embedding_dim,
        "device": resolved_device,
        "index_name": resolve_index_name(model_name),
        "default_index_name": DEFAULT_INDEX_NAME,
    }

    print(
        "Vision backbone loaded:",
        f"{backbone_info['model_name']} on {resolved_device}",
        f"(embedding_dim={embedding_dim})",
    )
    return model, processor, resolved_device, backbone_info
