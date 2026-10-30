import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from sklearn.metrics.pairwise import cosine_similarity

from src.api.model_loader import (
    average_vector,
    get_fasttext,
    get_products,
    get_tfidf_matrix,
    get_tfidf_vectorizer,
    get_word2vec,
)
from src.api.schemas.recommendation import ModelType, ProductResult, SearchRequest, SearchResponse
from src.common.preprocess import preprocess_text

router = APIRouter(prefix="/api/v1/recommendations", tags=["recommendations"])


def _similarity_scores(model_type: ModelType, preprocessed_query: str) -> np.ndarray:
    if model_type == ModelType.TFIDF:
        query_vector = get_tfidf_vectorizer().transform([preprocessed_query])
        return cosine_similarity(query_vector, get_tfidf_matrix()).flatten()

    embedding = get_word2vec() if model_type == ModelType.WORD2VEC else get_fasttext()
    query_vector = average_vector(embedding.model.wv, preprocessed_query.split())

    if not np.any(query_vector):
        raise ValueError("None of the query terms were found in the model's vocabulary.")

    return cosine_similarity(query_vector.reshape(1, -1), embedding.document_vectors).flatten()


def _to_result(row: pd.Series, score: float) -> ProductResult:
    images = row.get("images")
    description = row.get("description")
    return ProductResult(
        product_id=int(row["sku"]),
        product_name=row["name"],
        brand=row["brand"],
        gender=row["gender"],
        price_inr=float(row["price"]),
        in_stock=bool(row["in_stock"]),
        image_url=None if pd.isna(images) else str(images).split("~")[0].strip() or None,
        description=None if pd.isna(description) else str(description).strip(),
        score=round(float(score), 4),
    )


@router.post("/search", response_model=SearchResponse)
def search(request: SearchRequest) -> SearchResponse:
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=422, detail="Please provide a non-empty search query.")

    preprocessed_query = preprocess_text(query)
    if not preprocessed_query:
        raise HTTPException(
            status_code=422,
            detail="Query contains no searchable terms after preprocessing.",
        )

    try:
        scores = _similarity_scores(request.model, preprocessed_query)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail=f"Model artifacts for '{request.model.value}' are not available.",
        )
    except Exception:
        raise HTTPException(status_code=500, detail="An internal similarity search error occurred.")

    products = get_products()
    top_indices = np.argsort(scores)[::-1][: request.top_k]
    results = [
        _to_result(products.iloc[idx], scores[idx]) for idx in top_indices if scores[idx] > 0
    ]

    return SearchResponse(
        query=request.query,
        model=request.model,
        total_results=len(results),
        results=results,
    )
