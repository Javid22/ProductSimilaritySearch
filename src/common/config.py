from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # --- runtime ---
    environment: str = "development"
    log_level: str = "INFO"

    # --- server ---
    api_host: str = "0.0.0.0"
    api_port: int = 8005

    # --- CORS: comma-separated list of allowed origins ---
    cors_allow_origins: str = "http://localhost:5173"

    # --- paths ---
    data_raw_dir: Path = ROOT_DIR / "data" / "raw"
    data_processed_dir: Path = ROOT_DIR / "data" / "processed"
    models_dir: Path = ROOT_DIR / "models"

    tfidf_dir: Path = models_dir / "tfidf"
    word2vec_dir: Path = models_dir / "word2vec"
    fasttext_dir: Path = models_dir / "fasttext"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allow_origins.split(",") if origin.strip()]

    @property
    def tfidf_vectorizer_path(self) -> Path:
        return self.tfidf_dir / "tfidf_vectorizer.pkl"

    @property
    def tfidf_matrix_path(self) -> Path:
        return self.tfidf_dir / "tfidf_matrix.pkl"

    @property
    def products_path(self) -> Path:
        return self.tfidf_dir / "products.pkl"

    @property
    def word2vec_model_path(self) -> Path:
        return self.word2vec_dir / "word2vec_model.pkl"

    @property
    def fasttext_model_path(self) -> Path:
        return self.fasttext_dir / "fasttext_model.pkl"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
