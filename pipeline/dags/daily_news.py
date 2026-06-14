"""Airflow DAG: Daily news scraping and zone tagging (6AM IST)."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator

logger = logging.getLogger(__name__)

default_args = {
    "owner": "bangalore-re",
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

DATABASE_URL = os.environ["DATABASE_URL"]


def task_scrape_news(**_: object) -> None:
    """Run Scrapy spider and write results to /tmp/news_items.json."""
    import json
    import subprocess
    result = subprocess.run(
        ["scrapy", "crawl", "re_news", "-o", "/tmp/news_items.json", "--logfile", "/tmp/scrapy.log"],
        cwd="/app/pipeline",
        capture_output=True,
        text=True,
        timeout=600,
    )
    logger.info("Scrapy exit code: %d", result.returncode)
    if result.returncode != 0:
        logger.warning("Scrapy stderr: %s", result.stderr[:500])


def task_tag_and_store(**_: object) -> None:
    """NLP zone tagging and DB write for scraped news items."""
    import json
    import hashlib
    from pathlib import Path
    from sqlalchemy import create_engine, text

    news_file = Path("/tmp/news_items.json")
    if not news_file.exists():
        logger.warning("No news items file found")
        return

    items = json.loads(news_file.read_text())
    engine = create_engine(DATABASE_URL)

    # Load zone name → h3_id mapping
    with engine.connect() as conn:
        zones_df = __import__("pandas").read_sql(
            text("SELECT h3_id, name FROM zones WHERE name IS NOT NULL"), conn
        )
    name_to_h3 = dict(zip(zones_df["name"].str.lower(), zones_df["h3_id"]))

    from pipeline.scrapers.news_spider import _LOCALITY_PATTERN, RE_KEYWORDS
    import re

    rows_inserted = 0
    with engine.connect() as conn:
        for item in items:
            headline = item.get("headline", "")
            url = item.get("url", "")
            url_hash = item.get("url_hash") or hashlib.sha256(url.encode()).hexdigest()[:32]

            # Find zone H3 from locality mentions
            localities = item.get("localities", [])
            zone_h3 = None
            for loc in localities:
                h3 = name_to_h3.get(loc.lower())
                if h3:
                    zone_h3 = h3
                    break

            # Simple sentiment: count positive/negative RE keywords
            full_text = f"{headline} {item.get('body_preview', '')}"
            pos = len(re.findall(r"\b(surge|appreciate|rise|boom|launch|new|record)\b", full_text, re.I))
            neg = len(re.findall(r"\b(fall|decline|slow|stall|delay|oversupply)\b", full_text, re.I))
            total = pos + neg
            sentiment = round((pos - neg) / total, 3) if total > 0 else 0.0

            # Classify signal type
            signal_type = "market"
            if re.search(r"\b(metro|airport|highway|road|PRR|STRR|K-RIDE)\b", full_text, re.I):
                signal_type = "infrastructure"
            elif re.search(r"\b(RERA|BDA|BBMP|government|policy|tax|stamp duty)\b", full_text, re.I):
                signal_type = "policy"
            elif re.search(r"\b(IT park|office|company|jobs|employment|GCC)\b", full_text, re.I):
                signal_type = "employment"

            try:
                conn.execute(text("""
                    INSERT INTO news (zone_h3, headline, url, url_hash, published_at, signal_type, sentiment)
                    VALUES (:zone_h3, :headline, :url, :url_hash, :published_at, :signal_type, :sentiment)
                    ON CONFLICT (url_hash) DO NOTHING
                """), {
                    "zone_h3": zone_h3,
                    "headline": headline[:500],
                    "url": url[:1000],
                    "url_hash": url_hash,
                    "published_at": item.get("published_at"),
                    "signal_type": signal_type,
                    "sentiment": sentiment,
                })
                rows_inserted += 1
            except Exception as e:
                logger.warning("Failed to insert news item: %s", e)

        conn.commit()
    logger.info("Inserted %d news items", rows_inserted)


with DAG(
    dag_id="daily_news",
    default_args=default_args,
    schedule="30 0 * * *",  # 00:30 UTC = 6AM IST
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["news", "scraping"],
) as dag:

    scrape = PythonOperator(task_id="scrape_news", python_callable=task_scrape_news)
    tag_store = PythonOperator(task_id="tag_and_store", python_callable=task_tag_and_store)

    scrape >> tag_store
