from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/naijaprice"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "change-me-in-production"
    DEBUG: bool = False
    SCRAPE_DELAY_MIN: float = 1.5
    SCRAPE_DELAY_MAX: float = 4.0
    STALE_THRESHOLD_HOURS: int = 24

    class Config:
        env_file = ".env"


settings = Settings()
