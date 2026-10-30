from src.api.main import app
from src.common.config import settings

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=not settings.is_production,
    )

