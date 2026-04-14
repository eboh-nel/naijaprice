"""
Jumia Nigeria scraper.

Respects robots.txt:
- Does not scrape /checkout/, /cart/, /account/ or admin paths
- Rate limits between requests
- Discovers products via category pages only
"""
from app.scrapers.base import BaseScraper
from app.utils.text import clean_price
import logging

logger = logging.getLogger(__name__)

CATEGORY_URLS = [
    "https://www.jumia.com.ng/phones-tablets/",
    "https://www.jumia.com.ng/laptops/",
]


class JumiaScraper(BaseScraper):
    store_name = "Jumia"
    base_url = "https://www.jumia.com.ng"

    async def discover_product_urls(self) -> list[str]:
        urls = []
        for cat_url in CATEGORY_URLS:
            page = await self._get_page(cat_url)
            try:
                # Jumia product links: article[data-item] a
                links = await page.eval_on_selector_all(
                    "article.prd a.core",
                    "els => els.map(el => el.href)",
                )
                urls.extend([l for l in links if l.startswith("http")])
            except Exception as e:
                logger.warning(f"Jumia discover error on {cat_url}: {e}")
            finally:
                await page.close()
        return list(set(urls))[:100]  # cap for MVP

    async def scrape_product(self, url: str) -> dict | None:
        page = await self._get_page(url)
        try:
            title = await page.text_content("h1.-fs20.-pts.-pbxs") or ""
            title = title.strip()

            price_raw = await page.text_content("span.-b.-ltr.-tal.-fs24") or ""
            price = clean_price(price_raw)

            old_price_el = await page.query_selector("span.-tal.-gy5.-lthr.-fs16.-pvxs")
            old_price = None
            if old_price_el:
                old_raw = await old_price_el.text_content()
                old_price = clean_price(old_raw)

            image_el = await page.query_selector("img.-fw.-fh")
            image_url = None
            if image_el:
                image_url = await image_el.get_attribute("data-src") or await image_el.get_attribute("src")

            seller_el = await page.query_selector("a[href*='/sellers/']")
            seller_name = (await seller_el.text_content()).strip() if seller_el else None

            stock = "in_stock"
            oos = await page.query_selector("div.-error")
            if oos:
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
                "seller_name": seller_name,
            }
        except Exception as e:
            logger.warning(f"Jumia scrape_product error on {url}: {e}")
            return None
        finally:
            await page.close()
