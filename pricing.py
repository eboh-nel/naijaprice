"""
Konga Nigeria scraper.

Respects robots.txt:
- Avoids admin, checkout, cart, account paths
- Uses category pages for URL discovery
"""
from app.scrapers.base import BaseScraper
from app.utils.text import clean_price
import logging

logger = logging.getLogger(__name__)

CATEGORY_URLS = [
    "https://www.konga.com/category/phones-tablets-5294",
    "https://www.konga.com/category/laptops-computers-5270",
]


class KongaScraper(BaseScraper):
    store_name = "Konga"
    base_url = "https://www.konga.com"

    async def discover_product_urls(self) -> list[str]:
        urls = []
        for cat_url in CATEGORY_URLS:
            page = await self._get_page(cat_url)
            try:
                links = await page.eval_on_selector_all(
                    "a[data-cy='productCard']",
                    "els => els.map(el => el.href)",
                )
                urls.extend([l for l in links if "konga.com/product" in l])
            except Exception as e:
                logger.warning(f"Konga discover error on {cat_url}: {e}")
            finally:
                await page.close()
        return list(set(urls))[:100]

    async def scrape_product(self, url: str) -> dict | None:
        page = await self._get_page(url)
        try:
            title_el = await page.query_selector("h1[data-cy='productTitle']")
            title = (await title_el.text_content()).strip() if title_el else ""

            price_el = await page.query_selector("span[data-cy='product-price']")
            price_raw = (await price_el.text_content()) if price_el else ""
            price = clean_price(price_raw)

            old_price_el = await page.query_selector("span[data-cy='product-old-price']")
            old_price = None
            if old_price_el:
                old_price = clean_price(await old_price_el.text_content())

            image_el = await page.query_selector("img[data-cy='productImage']")
            image_url = await image_el.get_attribute("src") if image_el else None

            stock = "in_stock"
            oos_el = await page.query_selector("[data-cy='out-of-stock']")
            if oos_el:
                stock = "out_of_stock"

            if not title or price is None:
                return None

            return {
                "store": self.store_name,
                "title": title,
                "price": price,
                "old_price": old_price,
                "currency": "NGN",
                "stock_status": stock,
                "product_url": url,
                "image_url": image_url,
                "seller_name": None,
            }
        except Exception as e:
            logger.warning(f"Konga scrape_product error on {url}: {e}")
            return None
        finally:
            await page.close()
