import asyncio
import random
from abc import ABC, abstractmethod
from playwright.async_api import async_playwright
from app.config import settings
import logging

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]


class BaseScraper(ABC):
    store_name: str = ""
    base_url: str = ""

    def __init__(self):
        self.browser = None
        self.context = None

    @abstractmethod
    async def discover_product_urls(self) -> list[str]:
        """Return list of product URLs to scrape."""
        raise NotImplementedError

    @abstractmethod
    async def scrape_product(self, url: str) -> dict | None:
        """Scrape a single product page and return raw dict."""
        raise NotImplementedError

    async def _random_delay(self):
        delay = random.uniform(settings.SCRAPE_DELAY_MIN, settings.SCRAPE_DELAY_MAX)
        await asyncio.sleep(delay)

    async def _get_page(self, url: str):
        if not self.context:
            raise RuntimeError("Browser context not initialized")
        page = await self.context.new_page()
        await page.set_extra_http_headers({"Accept-Language": "en-US,en;q=0.9"})
        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
        await self._random_delay()
        return page

    async def run(self) -> list[dict]:
        results = []
        errors = 0
        async with async_playwright() as pw:
            self.browser = await pw.chromium.launch(headless=True)
            self.context = await self.browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": 1280, "height": 800},
            )
            try:
                urls = await self.discover_product_urls()
                logger.info(f"[{self.store_name}] Found {len(urls)} product URLs")

                for url in urls:
                    try:
                        item = await self.scrape_product(url)
                        if item:
                            results.append(item)
                    except Exception as e:
                        errors += 1
                        logger.warning(f"[{self.store_name}] Error scraping {url}: {e}")
            finally:
                await self.browser.close()

        logger.info(f"[{self.store_name}] Done: {len(results)} products, {errors} errors")
        return results
