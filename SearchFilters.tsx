from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/naijaprice"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "change-me-in-production"
    DEBUG: bool = False
    SCRAPE_DELAY_MIN: float = 1.5
    SCRAPE_DELAY_MAX: float = 4.0
    STALE_THRESHOLD_HOURS: int = 24

    # Email alerts (leave blank to use mock/log mode)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = "alerts@naijaprice.ng"

    class Config:
        env_file = ".env"


settings = Settings()
