"""
Fallback Collector: Non-Branded Home Service Reviews from Google Play Store.
Collects a balanced set of 200 non-branded home service reviews from NoBroker & YesMadam:
- 100 high rating (4-5 stars)
- 100 critical rating (1-3 stars)
Columns: id,source,query_type,rating_or_upvotes,city_hint,date,text
"""

import os
import re
import time
from datetime import datetime
from typing import Dict, List, Set
from google_play_scraper import Sort, reviews
import pandas as pd

OUTPUT_FILE = "playstore_nonbranded_reviews.csv"
SOURCE = "Play Store"
QUERY_TYPE = "non_branded_home_service"

CITIES_REGEX = [
    (r"\b(bangalore|bengaluru)\b", "Bengaluru"),
    (r"\b(delhi|gurgaon|gurugram|noida|faridabad|ghaziabad)\b", "Delhi NCR"),
    (r"\b(mumbai|thane|navi mumbai)\b", "Mumbai"),
    (r"\b(pune)\b", "Pune"),
    (r"\b(hyderabad|secunderabad)\b", "Hyderabad"),
    (r"\b(chennai)\b", "Chennai"),
    (r"\b(kolkata)\b", "Kolkata"),
    (r"\b(ahmedabad)\b", "Ahmedabad")
]


def detect_city(text: str) -> str:
    text_lower = text.lower()
    for pattern, city_name in CITIES_REGEX:
        if re.search(pattern, text_lower):
            return city_name
    return ""


def clean_text(text: str) -> str:
    return " ".join((text or "").split())


def collect_balanced_nonbranded(target_pos: int = 100, target_neg: int = 100) -> List[Dict]:
    collected: List[Dict] = []
    seen_texts: Set[str] = set()

    apps = [
        ("yesmadamservices.app.com.yesmadamservices", "YesMadam"),
        ("com.nobroker.app", "NoBroker")
    ]

    pos_reviews: List[Dict] = []
    neg_reviews: List[Dict] = []

    print(f"[*] Collecting {target_pos} positive (4-5★) and {target_neg} critical (1-3★) non-branded reviews...")

    # 1. Fetch Positive (4-5 stars)
    for app_id, app_name in apps:
        if len(pos_reviews) >= target_pos:
            break
        for star in [5, 4]:
            if len(pos_reviews) >= target_pos:
                break
            try:
                items, _ = reviews(
                    app_id,
                    lang="en",
                    country="in",
                    sort=Sort.MOST_RELEVANT,
                    filter_score_with=star,
                    count=100
                )
                for item in items:
                    raw_text = clean_text(item.get("content") or "")
                    if len(raw_text.split()) < 15:
                        continue
                    norm = raw_text.lower()
                    if norm in seen_texts:
                        continue
                    seen_texts.add(norm)

                    date_val = item.get("at")
                    date_str = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else str(date_val)[:10]
                    city = detect_city(raw_text)

                    pos_reviews.append({
                        "id": "",
                        "source": SOURCE,
                        "query_type": QUERY_TYPE,
                        "rating_or_upvotes": int(item.get("score")),
                        "city_hint": city,
                        "date": date_str,
                        "text": raw_text
                    })
                    if len(pos_reviews) >= target_pos:
                        break
            except Exception as e:
                print(f"  [!] Error fetching positive from {app_name}: {e}")

    # 2. Fetch Critical (1-3 stars)
    for app_id, app_name in reversed(apps):
        if len(neg_reviews) >= target_neg:
            break
        for star in [1, 2, 3]:
            if len(neg_reviews) >= target_neg:
                break
            try:
                items, _ = reviews(
                    app_id,
                    lang="en",
                    country="in",
                    sort=Sort.MOST_RELEVANT,
                    filter_score_with=star,
                    count=100
                )
                for item in items:
                    raw_text = clean_text(item.get("content") or "")
                    if len(raw_text.split()) < 15:
                        continue
                    norm = raw_text.lower()
                    if norm in seen_texts:
                        continue
                    seen_texts.add(norm)

                    date_val = item.get("at")
                    date_str = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else str(date_val)[:10]
                    city = detect_city(raw_text)

                    neg_reviews.append({
                        "id": "",
                        "source": SOURCE,
                        "query_type": QUERY_TYPE,
                        "rating_or_upvotes": int(item.get("score")),
                        "city_hint": city,
                        "date": date_str,
                        "text": raw_text
                    })
                    if len(neg_reviews) >= target_neg:
                        break
            except Exception as e:
                print(f"  [!] Error fetching critical from {app_name}: {e}")

    all_reviews = pos_reviews[:target_pos] + neg_reviews[:target_neg]
    for i, r in enumerate(all_reviews, 1):
        r["id"] = f"NB_{i:03d}"

    print(f"[✔] Collected {len(pos_reviews[:target_pos])} positive & {len(neg_reviews[:target_neg])} critical non-branded reviews.")
    return all_reviews


def main():
    records = collect_balanced_nonbranded(target_pos=100, target_neg=100)
    df = pd.DataFrame(records, columns=[
        "id", "source", "query_type", "rating_or_upvotes", "city_hint", "date", "text"
    ])
    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")
    print(f"\n[✔] Saved {len(df)} balanced non-branded reviews to {OUTPUT_FILE}")
    print(df["rating_or_upvotes"].value_counts().sort_index())


if __name__ == "__main__":
    main()
