import pytest
from fastapi.testclient import TestClient

from src.api.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.parametrize("model", ["tfidf", "word2vec", "fasttext"])
def test_search_returns_similar_products(client, model):
    response = client.post(
        "/api/v1/recommendations/search",
        json={"query": "black trolley bag", "model": model, "top_k": 3},
    )
    assert response.status_code == 200

    body = response.json()
    assert body["model"] == model
    assert body["total_results"] <= 3
    assert all(0.0 <= result["score"] <= 1.0 for result in body["results"])


def test_search_rejects_empty_query(client):
    response = client.post(
        "/api/v1/recommendations/search",
        json={"query": "   ", "model": "tfidf"},
    )
    assert response.status_code == 422


def test_search_rejects_out_of_vocabulary_query(client):
    response = client.post(
        "/api/v1/recommendations/search",
        json={"query": "zzqxplmkqq", "model": "word2vec"},
    )
    assert response.status_code == 422
