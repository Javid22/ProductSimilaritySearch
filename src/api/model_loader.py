from __future__ import annotations

import pickle
from dataclasses import dataclass
from functools import lru_cache

import numpy as np
import pandas as pd

from src.common.config import settings


@dataclass
class EmbeddingModel:
    """A trained gensim Word2Vec/FastText model plus one averaged vector per product."""

    model: object
    document_vectors: np.ndarray


def _load_pickle(path):
    with open(path, "rb") as f:
        return pickle.load(f)


@lru_cache(maxsize=1)
def get_products() -> pd.DataFrame:
    return _load_pickle(settings.products_path)


@lru_cache(maxsize=1)
def get_tfidf_vectorizer():
    return _load_pickle(settings.tfidf_vectorizer_path)


@lru_cache(maxsize=1)
def get_tfidf_matrix():
    return _load_pickle(settings.tfidf_matrix_path)


def average_vector(word_vectors, tokens: list[str]) -> np.ndarray:
    """Average the embeddings of the tokens found in the model's vocabulary."""
    vectors = []
    for token in tokens:
        try:
            vectors.append(word_vectors[token])
        except KeyError:
            continue
    if not vectors:
        return np.zeros(word_vectors.vector_size, dtype=np.float32)
    return np.mean(vectors, axis=0)


def _tokenized_documents() -> list[list[str]]:
    products = get_products()
    return products["preprocessed_text"].fillna("").astype(str).str.split().tolist()


def _build_document_vectors(word_vectors) -> np.ndarray:
    return np.vstack(
        [average_vector(word_vectors, tokens) for tokens in _tokenized_documents()]
    )


@lru_cache(maxsize=1)
def get_word2vec() -> EmbeddingModel:
    model = _load_pickle(settings.word2vec_model_path)
    return EmbeddingModel(model=model, document_vectors=_build_document_vectors(model.wv))


@lru_cache(maxsize=1)
def get_fasttext() -> EmbeddingModel:
    model = _load_pickle(settings.fasttext_model_path)
    return EmbeddingModel(model=model, document_vectors=_build_document_vectors(model.wv))


def warm_up() -> None:
    """Eagerly load every model so the first API request isn't the slow one."""
    get_products()
    get_tfidf_vectorizer()
    get_tfidf_matrix()
    get_word2vec()
    get_fasttext()
