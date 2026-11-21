"""
Collects public Trustpilot reviews for Urban Company.
Fetches pages 1-3 of https://www.trustpilot.com/review/urbancompany.com?page={page}
Parses reviews from __NEXT_DATA__ script tag (with fallback to JSON-LD / HTML).
Saves up to 50 reviews to trustpilot_reviews.csv with exact 7 columns:
id,source,query_type,rating_or_upvotes,city_hint,date,text
Filters out reviews with fewer than 15 words and deduplicates by text.
If blocked or unavailable, prints a clear message and continues gracefully without crashing.
"""

import json
import os
import re
import time
from datetime import datetime
from typing import Dict, List, Set
from bs4 import BeautifulSoup
import pandas as pd
import requests

OUTPUT_FILE = "trustpilot_reviews.csv"
SOURCE = "Trustpilot"
QUERY_TYPE = "branded_uc"
MAX_REVIEWS = 50

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

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


def parse_next_data(soup: BeautifulSoup) -> List[Dict]:
    parsed: List[Dict] = []
    script = soup.find("script", id="__NEXT_DATA__")
    if not script or not script.string:
        return parsed

    try:
        data = json.loads(script.string)
        page_props = data.get("props", {}).get("pageProps", {})
        review_list = page_props.get("reviews", [])

        for r in review_list:
            text = clean_text(r.get("text") or r.get("reviewText") or "")
            title = clean_text(r.get("title") or "")
            full_text = f"{title}. {text}".strip() if title and title not in text else text

            rating = r.get("rating")
            date_val = r.get("dates", {}).get("publishedDate") or r.get("createdAt")
            date_str = str(date_val)[:10] if date_val else ""

            if full_text:
                parsed.append({
                    "text": full_text,
                    "rating": rating,
                    "date": date_str
                })
    except Exception as e:
        print(f"  [!] Note: Error parsing __NEXT_DATA__ JSON: {e}")

    return parsed


def parse_json_ld(soup: BeautifulSoup) -> List[Dict]:
    parsed: List[Dict] = []
    scripts = soup.find_all("script", type="application/ld+json")
    for s in scripts:
        if not s.string:
            continue
        try:
            data = json.loads(s.string)
            items = data if isinstance(data, list) else data.get("@graph", [data])
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "Review":
                    text = clean_text(item.get("reviewBody") or "")
                    headline = clean_text(item.get("headline") or "")
                    full_text = f"{headline}. {text}".strip() if headline and headline not in text else text
                    rating = item.get("reviewRating", {}).get("ratingValue")
                    date_val = item.get("datePublished")
                    date_str = str(date_val)[:10] if date_val else ""
                    if full_text:
                        parsed.append({
                            "text": full_text,
                            "rating": rating,
                            "date": date_str
                        })
        except Exception:
            continue
    return parsed


def collect_trustpilot() -> List[Dict]:
    records: List[Dict] = []
    seen_texts: Set[str] = set()

    print("[*] Starting Trustpilot collection for urbancompany.com (Pages 1-3)...")

    for page in range(1, 4):
        if len(records) >= MAX_REVIEWS:
            break

        url = f"https://www.trustpilot.com/review/urbancompany.com?page={page}"
        print(f"  -> Fetching page {page}: {url}")

        try:
            resp = requests.get(url, headers=HEADERS, timeout=12)
            if resp.status_code == 403:
                print(f"  [!] Trustpilot request blocked with HTTP 403 on page {page}.")
                print("  [!] Gracefully continuing without crashing per specification.")
                break
            elif resp.status_code != 200:
                print(f"  [!] Trustpilot returned status code {resp.status_code} on page {page}.")
                break

            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Primary strategy: __NEXT_DATA__
            page_reviews = parse_next_data(soup)
            # Fallback strategy: JSON-LD schema
            if not page_reviews:
                page_reviews = parse_json_ld(soup)

            print(f"     Extracted {len(page_reviews)} raw review items from page {page}")

            for item in page_reviews:
                raw_text = clean_text(item.get("text") or "")
                words = raw_text.split()
                if len(words) < 15:
                    continue

                norm_text = raw_text.lower()
                if norm_text in seen_texts:
                    continue
                seen_texts.add(norm_text)

                city = detect_city(raw_text)

                records.append({
                    "id": "",  # Assigned at end
                    "source": SOURCE,
                    "query_type": QUERY_TYPE,
                    "rating_or_upvotes": item.get("rating") or "",
                    "city_hint": city,
                    "date": item.get("date") or "",
                    "text": raw_text
                })

                if len(records) >= MAX_REVIEWS:
                    break

        except Exception as e:
            print(f"  [!] Error connecting to Trustpilot on page {page}: {e}")
            print("  [!] Continuing gracefully without crashing.")
            break

        time.sleep(1.5)

    return records


def main():
    records = collect_trustpilot()
    df = pd.DataFrame(records, columns=[
        "id", "source", "query_type", "rating_or_upvotes", "city_hint", "date", "text"
    ])

    if not df.empty:
        df["word_count"] = df["text"].apply(lambda t: len(str(t).split()))
        df = df[df["word_count"] >= 15].drop(columns=["word_count"])
        df = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
        df["id"] = [f"TP_{i:03d}" for i in range(1, len(df) + 1)]

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")
    print(f"\n[✔] Saved {len(df)} reviews to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
