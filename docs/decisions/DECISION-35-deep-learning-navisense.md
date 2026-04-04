# DECISION-35: Start Deep Learning Integration for NaviSense

- Status: accepted for implementation
- Branch: `decision/35-deep-learning-navisense`
- Date: 2026-04-03

## Summary

This decision starts the first structured deep-learning upgrade path for NaviSense.

The branch introduces a configurable vision-language backbone for the ML service, isolates
retrieval indexes and model artifacts by backbone family, adds a deterministic held-out
evaluation route for backbone comparisons, and strengthens the app-side training queue so
feedback and verified recognitions carry richer metadata into the ML pipeline.

The immediate goal is not to replace the current production baseline blindly. The goal is to
create a safe experimentation path that lets the team compare the current CLIP ViT-B/32
baseline against stronger geolocation-oriented backbones such as StreetCLIP without corrupting
indexes, checkpoints, or route behavior.

## Why We Are Doing This

The current hybrid product is useful in production, but the ML-only geolocation core still
needs improvement. The existing baseline is good enough for exact-match and rough retrieval,
but it is not necessarily the best long-term representation for photo geolocation.

Before this branch:

- the ML service was effectively tied to a single backbone
- Pinecone index usage assumed one embedding family
- model checkpoints could be reused across incompatible embedding dimensions
- evaluations were too small or too ad hoc to compare backbone changes responsibly

This branch fixes those structural constraints first.

## What This Branch Adds

### 1. Configurable backbone loading

The NaviSense ML service now resolves its active backbone through environment configuration
instead of assuming a single fixed model.

Primary additions:

- `navisense-ml/backbone.py`
- `NAVISENSE_BACKBONE_MODEL` in `navisense-ml/.env.example`
- StreetCLIP experiment profile in `navisense-ml/.env.streetclip.example`

Current intended modes:

- baseline: `openai/clip-vit-base-patch32`
- experiment: `geolocal/StreetCLIP`

### 2. Embedding-dimension safety

The service now carries embedding dimension as a first-class runtime property.

This means:

- the app refuses to boot against a Pinecone index with the wrong vector size
- the geolocation predictor skips incompatible checkpoints
- NaviSense V3 skips incompatible artifacts and incompatible cached examples
- retrieval and architectural matching no longer assume a hard-coded 512-dimension stack

This is the minimum safety layer needed before any serious backbone experimentation.

### 3. Separate experiment deployment path

The branch adds deployment support for a StreetCLIP experiment service with its own:

- Pinecone index
- artifact keys
- environment profile
- Cloud Run deployment path

This is important because experiment services must not reload baseline checkpoints or mix
baseline vectors with StreetCLIP vectors.

### 4. Better evaluation path

The ML service now exposes a deterministic place-grouped held-out evaluation route.

Key idea:

- validation samples are grouped by place to reduce exact-place leakage
- comparisons can be rerun with the same seed and split configuration
- backbone changes can be judged on the same held-out slice instead of anecdotal examples

This makes the comparison process much more honest than ad hoc spot checks.

### 5. Training-queue metadata groundwork

The app-side training queue is being upgraded so ML ingestion has richer provenance:

- source
- method
- label quality
- confidence
- recognition id
- business and address context
- image hash and image url when available

The Prisma schema and migration in this branch add the missing `TrainingQueue` columns needed
for that richer training metadata, and the helper utilities centralize metadata building and
legacy-safe queue insertion.

## Experimental Result Snapshot

The strongest evidence from this branch so far is the held-out backbone comparison run on
2026-04-01.

Dataset summary:

- 38 canonical records considered
- 14 unique places
- 26 training samples
- 12 validation samples
- deterministic split seed: `42`

Held-out comparison highlights:

- baseline geolocation model average error: `1374.29 km`
- StreetCLIP geolocation model average error: `1190.10 km`
- baseline NaviSense V3 average error: `36.14 km`
- StreetCLIP NaviSense V3 average error: `5.96 km`
- baseline NaviSense V3 within 10 km: `25%`
- StreetCLIP NaviSense V3 within 10 km: `100%`

Interpretation:

- StreetCLIP looks materially better on the retrieval-plus-prior `NaviSense V3` path
- both direct geolocation heads still need work
- the split is still small, so this is promising evidence, not final proof

## Decision

We are moving forward with deep-learning integration under the following rules:

1. Keep the current production baseline intact until larger held-out evaluation confirms the win.
2. Treat StreetCLIP as the first structured experiment, not as an automatic replacement.
3. Isolate every backbone family by index and artifact keys.
4. Use held-out evaluation and route-level feedback before promoting any new backbone.
5. Continue growing the canonical training corpus so evaluation becomes statistically meaningful.

## Scope of This Commit

This decision commit is intentionally scoped to NaviSense ML and training-pipeline groundwork.

Included areas:

- backbone abstraction and experiment configuration
- dimension-safe checkpoint and vector handling
- deployment plumbing for the StreetCLIP experiment service
- training-queue metadata helpers and schema support
- ML-related API wiring and route documentation updates

Explicitly not the focus of this decision commit:

- homepage redesign work
- camera UI redesign work
- paper and PDF publishing work

## Key Files

- `navisense-ml/backbone.py`
- `navisense-ml/app.py`
- `navisense-ml/geolocation_model.py`
- `navisense-ml/navisense_v3.py`
- `navisense-ml/architectural_matcher.py`
- `navisense-ml/.env.example`
- `navisense-ml/.env.streetclip.example`
- `navisense-ml/deploy-cloudrun.ps1`
- `lib/navisense-training-metadata.ts`
- `lib/training-queue.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260330143000_enrich_training_queue_metadata/migration.sql`
- `app/api/location-feedback/training.ts`
- `app/api/ml/sync-feedback/route.ts`
- `app/api/location-recognition-v2/README.md`

## Next Steps

1. Increase the canonical held-out corpus beyond the current 38 records.
2. Backfill StreetCLIP retrieval memory toward parity with the baseline service.
3. Compare route-level outcomes, not just ML-side diagnostics.
4. Decide whether StreetCLIP becomes the new production default after a larger evaluation pass.
