"""
Collects stratified Google Play Store reviews for Urban Company.
Target: 50 five-star, 50 four-star, 35 three-star, 35 two-star, 30 one-star (~200 total).
Filters out reviews with fewer than 15 words and deduplicates by text.
Saves to playstore_reviews.csv with exact 7 columns:
id,source,query_type,rating_or_upvotes,city_hint,date,text
"""

import os
import re
import time
from datetime import datetime
from typing import Dict, List, Set
from google_play_scraper import Sort, reviews
import pandas as pd

APP_ID = "com.urbanclap.urbanclap"
SOURCE = "Play Store"
QUERY_TYPE = "branded_uc"
OUTPUT_FILE = "playstore_reviews.csv"

# Target distribution
STRATIFIED_TARGETS = {
    5: 50,
    4: 50,
    3: 35,
    2: 35,
    1: 30
}

CITIES = [
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
    for pattern, city_name in CITIES:
        if re.search(pattern, text_lower):
            return city_name
    return ""


def clean_text(text: str) -> str:
    # Normalize whitespaces and line breaks
    return " ".join((text or "").split())


def collect_reviews() -> List[Dict]:
    collected_records: List[Dict] = []
    seen_texts: Set[str] = set()
    global_counter = 1

    print(f"[*] Starting Play Store collection for app: {APP_ID} (Sort.MOST_RELEVANT)")

    for star_rating, target_count in STRATIFIED_TARGETS.items():
        print(f"\n[+] Fetching {target_count} reviews with rating {star_rating}★ (min 15 words)...")
        star_collected = 0
        continuation_token = None
        batch_idx = 0
        max_batches = 25  # Safeguard

        while star_collected < target_count and batch_idx < max_batches:
            batch_idx += 1
            try:
                batch_items, continuation_token = reviews(
                    APP_ID,
                    lang="en",
                    country="in",
                    sort=Sort.MOST_RELEVANT,
                    count=100,
                    filter_score_with=star_rating,
                    continuation_token=continuation_token
                )
            except Exception as e:
                print(f"[!] Error fetching batch {batch_idx} for {star_rating}★: {e}")
                break

            if not batch_items:
                print(f"[!] No more reviews available for {star_rating}★ at batch {batch_idx}.")
                break

            for item in batch_items:
                raw_text = clean_text(item.get("content") or "")
                words = raw_text.split()
                if len(words) < 15:
                    continue

                norm_text = raw_text.lower()
                if norm_text in seen_texts:
                    continue
                seen_texts.add(norm_text)

                date_val = item.get("at")
                if isinstance(date_val, datetime):
                    date_str = date_val.strftime("%Y-%m-%d")
                elif date_val:
                    date_str = str(date_val)[:10]
                else:
                    date_str = ""

                city = detect_city(raw_text)

                collected_records.append({
                    "id": f"PS_{global_counter:03d}",
                    "source": SOURCE,
                    "query_type": QUERY_TYPE,
                    "rating_or_upvotes": star_rating,
                    "city_hint": city,
                    "date": date_str,
                    "text": raw_text
                })

                global_counter += 1
                star_collected += 1

                if star_collected >= target_count:
                    break

            time.sleep(0.5)
            if not continuation_token:
                break

        print(f"  -> Collected {star_collected} / {target_count} for {star_rating}★")

    return collected_records


def main():
    records = collect_reviews()
    df = pd.DataFrame(records, columns=[
        "id", "source", "query_type", "rating_or_upvotes", "city_hint", "date", "text"
    ])
    
    # Final safety deduplication & word count filter
    df["word_count"] = df["text"].apply(lambda t: len(str(t).split()))
    df = df[df["word_count"] >= 15].drop(columns=["word_count"])
    df = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
    
    # Re-index IDs consecutively
    df["id"] = [f"PS_{i:03d}" for i in range(1, len(df) + 1)]

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")
    print(f"\n[✔] Successfully saved {len(df)} reviews to {OUTPUT_FILE}")
    print(df["rating_or_upvotes"].value_counts().sort_index())


if __name__ == "__main__":
    main()
