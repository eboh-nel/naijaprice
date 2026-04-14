"""
Kara Nigeria scraper (kara.com.ng).

Kara is an electronics-focused retailer. Their pages are largely
server-rendered so BeautifulSoup works for most listings.
Respects robots.txt — avoids /cart, /checkout, /account paths.
"""
from app.scrapers.base import BaseScraper
from app.utils.text import clean_price
from app.utils.logger import get_logger
from bs4 import BeautifulSoup

logger = get_logger(__name__)

CATEGORY_URLS = [
    "https://www.kara.com.ng/phones-and-tablets.html",
    "https://www.kara.com.ng/laptops.html",
    "https://www.kara.com.ng/televisions.html",
]


class KaraScraper(BaseScraper):
    store_name = "Kara"
    base_url = "https://www.kara.com.ng"

    async def discover_product_urls(self) -> list[str]:
        urls = []
        for cat_url in CATEGORY_URLS:
            page = await self._get_page(cat_url)
            try:
                content = await page.content()
                soup = BeautifulSoup(content, "lxml")

                # Kara uses <a class="product-item-link"> for product links
                for a in soup.select("a.product-item-link"):
                    href = a.get("href", "")
                    if href.startswith("https://www.kara.com.ng"):
                        urls.append(href)

                # Try to follow pagination (page 2 only for MVP)
                next_link = soup.select_one("a.action.next")
                if next_link and next_link.get("href"):
                    page2 = await self._get_page(next_link["href"])
                    try:
                        content2 = await page2.content()
                        soup2 = BeautifulSoup(content2, "lxml")
                        for a in soup2.select("a.product-item-link"):
                            href = a.get("href", "")
                            if href.startswith("https://www.kara.com.ng"):
                                urls.append(href)
                    finally:
                        await page2.close()
            except Exception as e:
                logger.warning(f"Kara discover error on {cat_url}: {e}")
            finally:
                await page.close()

        return list(set(urls))[:100]

    async def scrape_product(self, url: str) -> dict | None:
        page = await self._get_page(url)
        try:
            content = await page.content()
            soup = BeautifulSoup(content, "lxml")

            # Title
            title_el = soup.select_one("h1.page-title span.base")
            if not title_el:
                return None
            title = title_el.get_text(strip=True)

            # Price
            price_el = soup.select_one("span.price-wrapper span.price")
            if not price_el:
                return None
            price = clean_price(price_el.get_text(strip=True))
            if price is None:
                return None

            # Old price
            old_price_el = soup.select_one("span.old-price span.price")
            old_price = clean_price(old_price_el.get_text(strip=True)) if old_price_el else None

            # Image
            image_el = soup.select_one("img.gallery-placeholder__image")
            image_url = image_el.get("src") if image_el else None

            # Stock status
            stock = "in_stock"
            oos_el = soup.select_one("div.stock.unavailable")
            if oos_el:
                stock = "out_of_stock"

            return {
                "store": self.store_name,
                "title": title,
                "price": price,
                "old_price": old_price,
                "currency": "NGN",
                "stock_status": stock,
                "product_url": url,
                "image_url": image_url,
                "seller_name": "Kara",
            }
        except Exception as e:
            logger.warning(f"Kara scrape_product error on {url}: {e}")
            return None
        finally:
            await page.close()
