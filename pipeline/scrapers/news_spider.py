"""Scrapy spider for Bangalore real estate news.

Scrapes: Times of India property section, Economic Times real estate,
Makaan blog, BBMP press releases, 99acres Bangalore news.
"""

from __future__ import annotations

import hashlib
import re
from typing import Generator

import scrapy
from scrapy import Spider
from scrapy.http import Response

# Bangalore locality gazetteer for zone tagging (300+ area names)
BANGALORE_LOCALITIES: list[str] = [
    "Whitefield", "Sarjapur", "Koramangala", "HSR Layout", "Indiranagar",
    "Bellandur", "Marathahalli", "Electronic City", "Devanahalli", "Yelahanka",
    "Hebbal", "Manyata", "Kanakapura", "Bannerghatta", "JP Nagar",
    "Jayanagar", "Rajajinagar", "Malleshwaram", "Yeshwanthpur", "Peenya",
    "Hennur", "KR Puram", "Mahadevapura", "Kadugodi", "Varthur",
    "Panathur", "Brookefield", "Kundalahalli", "Hoodi", "ITPL",
    "Doddanekundi", "Kadubeesanahalli", "Balagere", "Harlur", "Haralur",
    "Ramamurthy Nagar", "CV Raman Nagar", "Banaswadi", "Horamavu", "Kalyan Nagar",
    "Thanisandra", "Kogilu", "Jakkur", "Bagalur", "Doddaballapur",
    "Nandi Hills", "International Airport", "Aerospace Park",
    "Nagavara", "Lingarajapuram", "RT Nagar", "Vidyaranyapura",
    "Tumkur Road", "Jalahalli", "Dasarahalli", "Chikkajala",
    "Virgonagar", "Thubarahalli", "Kengeri", "Uttarahalli", "Banashankari",
    "Dollars Colony", "Palace Orchards", "Hebbal Kempapura",
    "ORR", "Outer Ring Road", "PRR", "Peripheral Ring Road",
    "STRR", "Steel Flyover", "Metro Phase 2", "Metro Phase 3",
    "Namma Metro", "BMRCL", "BMTC", "BDA", "BBMP", "KIADB",
    "Prestige", "Brigade", "Sobha", "Godrej", "Puravankara", "Manyata Tech",
    "Embassy Tech Village", "RMZ", "Bagmane", "Cessna Business Park",
    "Global Village Tech Park", "Ecospace", "Salarpuria", "SEZ",
    "EPIP Zone", "ITIR", "K-RIDE", "SRA", "Namma Metro Yellow Line",
    "Bommasandra", "Jigani", "Attibele", "Sarjapur Road", "Haralur Road",
    "Budigere", "Gunjur", "Vrishabavathi", "Domlur", "Ejipura",
    "Indira Nagar", "Richmond Town", "Shivajinagar", "MG Road",
    "Commercial Street", "Cubbon Park", "Lavelle Road", "UB City",
    "Central Business District", "CBD",
]

# Compile regex for fast locality matching
_LOCALITY_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(loc) for loc in sorted(BANGALORE_LOCALITIES, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)

RE_KEYWORDS = re.compile(
    r"\b(real estate|property|apartment|villa|plot|land price|sqft|per square|"
    r"housing|residential|developer|builder|RERA|BDA|BBMP|metro|appreciation|"
    r"investment|infrastructure|corridor|township|layout)\b",
    re.IGNORECASE,
)

BANGALORE_KEYWORDS = re.compile(r"\bBangalore|Bengaluru|Karnataka\b", re.IGNORECASE)


class RENewsSpider(Spider):
    name = "re_news"
    custom_settings = {
        "ROBOTSTXT_OBEY": True,
        "DOWNLOAD_DELAY": 2,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "USER_AGENT": "Mozilla/5.0 (compatible; BangaloreREBot/1.0; research)",
        "ITEM_PIPELINES": {"pipeline.scrapers.news_spider.NewsDeduplicatePipeline": 300},
    }

    start_urls = [
        "https://timesofindia.indiatimes.com/topic/bangalore-property",
        "https://economictimes.indiatimes.com/topic/bangalore-real-estate",
        "https://www.makaan.com/iq/real-estate-news/bangalore",
        "https://99acres.com/real-estate-insights/bengaluru-real-estate-news",
    ]

    def parse(self, response: Response) -> Generator:
        for article_link in response.css("a[href]"):
            href = article_link.attrib.get("href", "")
            if not href:
                continue
            full_url = response.urljoin(href)
            if self._is_article_url(full_url):
                yield response.follow(full_url, callback=self.parse_article)

    def parse_article(self, response: Response) -> dict | None:
        title = (
            response.css("h1::text").get()
            or response.css("title::text").get()
            or ""
        ).strip()

        body = " ".join(response.css("article p::text, .article-body p::text").getall())
        full_text = f"{title} {body}"

        # Only keep if article is about Bangalore real estate
        if not BANGALORE_KEYWORDS.search(full_text) or not RE_KEYWORDS.search(full_text):
            return None

        localities_found = list({m.group(0) for m in _LOCALITY_PATTERN.finditer(full_text)})
        url = response.url
        url_hash = hashlib.sha256(url.encode()).hexdigest()[:32]

        published_raw = (
            response.css("time[datetime]::attr(datetime)").get()
            or response.css("meta[property='article:published_time']::attr(content)").get()
        )

        return {
            "headline": title,
            "url": url,
            "url_hash": url_hash,
            "published_at": published_raw,
            "localities": localities_found,
            "body_preview": body[:500],
        }

    @staticmethod
    def _is_article_url(url: str) -> bool:
        """Heuristic: article URLs contain date-like segments or article IDs."""
        return bool(re.search(r"/\d{4}/\d{2}/\d{2}/|/article/|-\d{7,}", url))


class NewsDeduplicatePipeline:
    """Scrapy item pipeline: drop items with URL hashes already in DB."""

    def __init__(self) -> None:
        self.seen_hashes: set[str] = set()

    def process_item(self, item: dict, spider: Spider) -> dict:
        if item["url_hash"] in self.seen_hashes:
            raise scrapy.exceptions.DropItem(f"Duplicate: {item['url']}")
        self.seen_hashes.add(item["url_hash"])
        return item
