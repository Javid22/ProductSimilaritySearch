# Product Recommendation Search

Myntra product search powered by three interchangeable similarity models — TF-IDF, Word2Vec, and FastText — served behind a FastAPI endpoint.

## Structure

```
data/
  raw/            # original Myntra catalog CSV (tracked in git — source of truth)
  processed/      # cleaned/tokenized catalog used for training (gitignored, regenerated)
src/
  common/
    config.py     # paths to model artifacts
    preprocess.py # shared text-cleaning function (used by training AND the API)
  training/
    process.py          # raw CSV -> combined_text
    preprocess.py        # combined_text -> preprocessed_text
    tokenize_products.py # preprocessed_text -> tokens
    tf_idf_model.py       # trains + pickles the TF-IDF vectorizer/matrix
    word2vec_model.py     # trains + pickles the Word2Vec model
    fasttext_model.py     # trains + pickles the FastText model
  api/
    main.py          # FastAPI app entrypoint
    model_loader.py  # loads/caches models, builds Word2Vec/FastText doc vectors
    routers/recommendation.py  # /api/v1/recommendations/search
    schemas/recommendation.py  # request/response models
models/           # trained .pkl artifacts (gitignored — regenerated, see "Deploying" below)
tests/
```

## Deploying

`data/processed/` and `models/**/*.pkl` are **not** committed to git — they're derived from
`data/raw/Myntra_fashion_products.csv` (which *is* committed) by the training pipeline below.
Before the API can serve requests on a fresh checkout (including a new server), you must run
the full "Workflow" section once to produce those artifacts. This repo doesn't yet bake that
into an automated deploy step (e.g. a Docker build stage, a CI job, or downloading pre-trained
artifacts from object storage) — pick one when you're ready to deploy, since training on every
server is wasteful/slow for large catalogs.

## Workflow

1. Put the raw Myntra catalog CSV in `data/raw/`.
2. Build the processed/tokenized dataset:
   ```
   python -m src.training.process
   python -m src.training.preprocess
   python -m src.training.tokenize_products
   ```
3. Train the models (each writes its own `.pkl` artifacts under `models/`):
   ```
   python -m src.training.tf_idf_model
   python -m src.training.word2vec_model
   python -m src.training.fasttext_model
   ```
4. Run the API:
   ```
   uvicorn src.api.main:app --reload --port 8005
   ```

## API

`POST /api/v1/recommendations/search`

```json
{
  "query": "black trolley bag",
  "model": "tfidf",   // "tfidf" | "word2vec" | "fasttext"
  "top_k": 5
}
```

Returns the `top_k` catalog products most similar to the query under the chosen model, ranked by cosine similarity.

`GET /health` — liveness check.

## Setup

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Word2Vec and FastText depend on `gensim`, which requires Python 3.12 or earlier at the time of writing.

### Configuration

All runtime config is loaded from environment variables (via `.env`, see `.env.example`) by `src/common/config.py`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENVIRONMENT` | `development` | `production` disables `/docs` and `/redoc` |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `API_HOST` / `API_PORT` | `0.0.0.0` / `8005` | Used by `python main.py` |
| `CORS_ALLOW_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed frontend origins |
| `DATA_RAW_DIR` / `DATA_PROCESSED_DIR` / `MODELS_DIR` | repo-relative paths | Override artifact locations |

The frontend reads `VITE_API_TARGET` from `frontend/.env.local` (see `frontend/.env.example`) to know which backend to proxy to in dev.

## Tests

```
pytest
```
