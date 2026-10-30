from enum import Enum

from pydantic import BaseModel, Field


class ModelType(str, Enum):
    TFIDF = "tfidf"
    WORD2VEC = "word2vec"
    FASTTEXT = "fasttext"


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000, description="Free-text product search query.")
    model: ModelType = Field(default=ModelType.TFIDF, description="Embedding model used for similarity search.")
    top_k: int = Field(default=5, ge=1, le=50, description="Number of similar products to return.")


class ProductResult(BaseModel):
    product_id: int
    product_name: str
    brand: str
    gender: str
    price_inr: float
    in_stock: bool
    image_url: str | None = None
    description: str | None = None
    score: float


class SearchResponse(BaseModel):
    query: str
    model: ModelType
    total_results: int
    results: list[ProductResult]
