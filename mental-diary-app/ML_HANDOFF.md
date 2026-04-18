# ML Replacement Handoff

## Goal
Replace the current Python ML service with a stronger model without breaking the API, frontend, or prediction history.

## For You
1. Keep the external contract stable.
   The Node backend expects the Python service to support:
   - `GET /health`
   - `GET /models/current`
   - `POST /train`
   - `POST /predict`

2. Do not remove these response fields from `/predict`:
   - `primaryState`
   - `confidence`
   - `stressProbability`
   - `recoveryProbability`
   - `burnoutProbability`
   - `modelProvider`
   - `modelVersion`
   - `featureSnapshot`
   - `factors`
   - `explanation`

3. Keep model versioning.
   Every new model must expose a unique `modelVersion`. Backend persists it in `prediction_history`.

4. Change one layer at a time.
   Recommended order:
   - improve dataset
   - improve training pipeline
   - switch inference backend
   - tune thresholds
   - only then change UI presentation if needed

5. Preserve safety boundaries.
   The system should detect distress and risk markers, not produce medical diagnoses.

## For The New Model
You are replacing the current classifier inside `services/ml`.

Rules:
- Keep the HTTP schema unchanged.
- Prefer better text understanding over broader output.
- Use diary text as the primary signal, and numerical diary fields as support features.
- Return calibrated probabilities, not hard labels only.
- Include interpretable factors.
- If confidence is weak, prefer conservative output over overclaiming.
- Never output a diagnosis.

## Required Inputs
`POST /predict` receives a list of diary entries with:
- `moodScore`
- `energy`
- `sleepHours`
- `stress`
- `notes`
- `tags`
- `createdAt`

Use text first, then combine with behavioral trends.

## Recommended Next Implementation
1. Add a real train script with train/validation split.
2. Save metrics alongside the model artifact.
3. Start with `sentence-transformers` embeddings plus a classifier head.
4. Add threshold tuning for `burnout-risk`.
5. Store dataset version and model version in the registry.

## Suggested Work Plan
1. Create `services/ml/scripts/train.py`.
   Responsibilities:
   - load dataset
   - split into train/validation
   - train the selected model backend
   - save artifact into `services/ml/data/artifacts/`
   - write model metadata into `current_model.json`

2. Create `services/ml/scripts/evaluate.py`.
   Responsibilities:
   - load the saved artifact
   - run validation/test evaluation
   - output metrics JSON
   - optionally print confusion matrix and per-class scores

3. Add artifact files per model version:
   - `services/ml/data/artifacts/<backend>-<version>.joblib`
   - `services/ml/data/artifacts/<backend>-<version>.metrics.json`
   - `services/ml/data/artifacts/<backend>-<version>.config.json`

4. Keep `services/ml/app/model.py` focused on inference and registry loading.
   Training logic should move into scripts, not stay inside the API runtime.

## Suggested Script Contracts
Example `train.py` behavior:
- input: dataset path, backend name, model version
- output: artifact file, metrics file, updated registry

Example command:
```bash
cd services/ml
uv run python scripts/train.py --backend transformer-embeddings --version 2026.04.19
```

Example `evaluate.py` behavior:
- input: artifact path or version
- output: accuracy, macro F1, per-class precision/recall, confusion matrix

Example command:
```bash
cd services/ml
uv run python scripts/evaluate.py --version 2026.04.19
```

## Minimum Metrics To Track
- `accuracy`
- `macro_f1`
- `weighted_f1`
- per-class precision/recall/F1
- false positives for `burnout-risk`
- false negatives for `burnout-risk`

## Migration Template
When replacing the model:
1. Train new model under a new version.
2. Evaluate and save metrics.
3. Compare against the previous version.
4. Update `current_model.json` only if the new version is better or explicitly approved.
5. Run backend tests.
6. Verify `/models/current` and `/predict`.
7. Only then deploy.

## Files That Matter
- `services/ml/app/main.py`
- `services/ml/app/model.py`
- `services/ml/app/schemas.py`
- `services/ml/data/training_samples.jsonl`
- `apps/api/src/infrastructure/mlAdapter.ts`
- `apps/api/src/infrastructure/predictionStore.ts`

## Definition Of Done
- Node tests still pass.
- `/models/current` returns correct metadata.
- `/predict` returns the existing schema.
- Backend continues saving `modelProvider` and `modelVersion`.
- No frontend type changes are required.
