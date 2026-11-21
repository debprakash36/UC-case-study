"""
Collects public Reddit posts across target Indian subreddits:
- r/india, r/bangalore, r/mumbai, r/delhi, r/pune, r/hyderabad
Categories:
- ~100 branded_uc ("Urban Company")
- ~100 non_branded_home_service ("AC service OR plumber OR deep cleaning OR geyser repair OR MyGate")
Uses public Reddit .json search endpoints with a custom User-Agent and a 2-second sleep between requests.
Supports authorized Reddit API fallback via .env credentials if unauthenticated .json is blocked by network security.
Saves to reddit_posts.csv with exact 7 columns:
id,source,query_type,rating_or_upvotes,city_hint,date,text
"""

import os
import re
import time
from datetime import datetime, timezone
from typing import Dict, List, Set
import pandas as pd
import requests

def load_env_file():
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

load_env_file()

OUTPUT_FILE = "reddit_posts.csv"
SOURCE = "Reddit"

SUBREDDIT_CITY_MAP = {
    "bangalore": "Bengaluru",
    "mumbai": "Mumbai",
    "delhi": "Delhi NCR",
    "pune": "Pune",
    "hyderabad": "Hyderabad",
    "india": ""
}

SUBREDDITS = ["india", "bangalore", "mumbai", "delhi", "pune", "hyderabad"]

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

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) UrbanCompanyResearch/1.0 (Feedback Data Pipeline)"
}


def detect_city(text: str, default_city: str = "") -> str:
    text_lower = text.lower()
    for pattern, city_name in CITIES_REGEX:
        if re.search(pattern, text_lower):
            return city_name
    return default_city


def clean_text(text: str) -> str:
    return " ".join((text or "").split())


def fetch_via_public_json(query: str, subreddits: List[str], target_count: int, query_type: str, seen_texts: Set[str]) -> List[Dict]:
    collected: List[Dict] = []
    print(f"\n[+] Searching Reddit public .json for '{query_type}' (Query: '{query}', Target: ~{target_count})...")

    for sub in subreddits:
        if len(collected) >= target_count:
            break

        url = f"https://www.reddit.com/r/{sub}/search.json"
        params = {
            "q": query,
            "restrict_sr": 1,
            "sort": "relevance",
            "limit": 100,
            "t": "all"
        }

        print(f"  -> Querying r/{sub} for '{query}'...")
        try:
            resp = requests.get(url, headers=HEADERS, params=params, timeout=12)
            if resp.status_code == 403:
                print(f"  [!] Reddit public endpoint blocked (HTTP 403: Network Security) on r/{sub}.")
                time.sleep(2.0)
                continue
            elif resp.status_code == 429:
                print(f"  [!] Rate limited (429) on r/{sub}. Sleeping for 5 seconds...")
                time.sleep(5.0)
                continue
            elif resp.status_code != 200:
                print(f"  [!] Status {resp.status_code} on r/{sub}")
                time.sleep(2.0)
                continue

            data = resp.json()
            children = data.get("data", {}).get("children", [])
            print(f"     Received {len(children)} posts from r/{sub}")

            for post in children:
                pdata = post.get("data", {})
                title = clean_text(pdata.get("title", ""))
                selftext = clean_text(pdata.get("selftext", ""))

                if selftext in ["[removed]", "[deleted]"]:
                    selftext = ""

                combined_text = f"{title} {selftext}".strip()
                if len(combined_text) > 1500:
                    combined_text = combined_text[:1500].rsplit(" ", 1)[0]

                words = combined_text.split()
                if len(words) < 15:
                    continue

                norm_text = combined_text.lower()
                if norm_text in seen_texts:
                    continue
                seen_texts.add(norm_text)

                upvotes = int(pdata.get("score", 0))
                created_utc = pdata.get("created_utc")
                date_str = datetime.fromtimestamp(created_utc, tz=timezone.utc).strftime("%Y-%m-%d") if created_utc else ""

                default_city = SUBREDDIT_CITY_MAP.get(sub, "")
                city_hint = detect_city(combined_text, default_city=default_city)

                collected.append({
                    "id": "",
                    "source": SOURCE,
                    "query_type": query_type,
                    "rating_or_upvotes": upvotes,
                    "city_hint": city_hint,
                    "date": date_str,
                    "text": combined_text
                })

                if len(collected) >= target_count:
                    break

        except Exception as e:
            print(f"  [!] Exception querying r/{sub}: {e}")

        # 2-second sleep between requests per specification
        time.sleep(2.0)

    print(f"  [✔] Public .json collected {len(collected)} posts for '{query_type}'")
    return collected


def fetch_via_oauth_fallback(query: str, subreddits: List[str], target_count: int, query_type: str, seen_texts: Set[str]) -> List[Dict]:
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    if not client_id or not client_secret:
        return []

    import praw
    print(f"  [*] Using configured Reddit API credentials for '{query_type}'...")
    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent="AIDiscoveryEngine/1.0",
        read_only=True
    )

    collected: List[Dict] = []
    for sub_name in subreddits:
        if len(collected) >= target_count:
            break
        try:
            sub = reddit.subreddit(sub_name)
            for post in sub.search(query, sort="relevance", time_filter="all", limit=50):
                title = clean_text(post.title or "")
                selftext = clean_text(post.selftext or "")
                if selftext in ["[removed]", "[deleted]"]:
                    selftext = ""

                combined = f"{title} {selftext}".strip()
                if len(combined) > 1500:
                    combined = combined[:1500].rsplit(" ", 1)[0]

                if len(combined.split()) < 15:
                    continue

                norm = combined.lower()
                if norm in seen_texts:
                    continue
                seen_texts.add(norm)

                created_utc = getattr(post, "created_utc", None)
                date_str = datetime.fromtimestamp(created_utc, tz=timezone.utc).strftime("%Y-%m-%d") if created_utc else ""
                default_city = SUBREDDIT_CITY_MAP.get(sub_name, "")
                city_hint = detect_city(combined, default_city=default_city)

                collected.append({
                    "id": "",
                    "source": SOURCE,
                    "query_type": query_type,
                    "rating_or_upvotes": int(post.score or 0),
                    "city_hint": city_hint,
                    "date": date_str,
                    "text": combined
                })

                if len(collected) >= target_count:
                    break
        except Exception as e:
            print(f"  [!] PRAW error on r/{sub_name}: {e}")

    return collected


def main():
    seen_texts: Set[str] = set()

    # 1. Branded UC (~100 posts)
    branded_records = fetch_via_public_json(
        query="\"Urban Company\" OR UrbanClap",
        subreddits=SUBREDDITS,
        target_count=100,
        query_type="branded_uc",
        seen_texts=seen_texts
    )
    if len(branded_records) < 100:
        extra_branded = fetch_via_oauth_fallback(
            query="\"Urban Company\" OR UrbanClap",
            subreddits=SUBREDDITS,
            target_count=100 - len(branded_records),
            query_type="branded_uc",
            seen_texts=seen_texts
        )
        branded_records.extend(extra_branded)

    # 2. Non-branded home service (~100 posts)
    non_branded_records = fetch_via_public_json(
        query="\"AC service\" OR plumber OR \"deep cleaning\" OR \"geyser repair\" OR MyGate",
        subreddits=SUBREDDITS,
        target_count=100,
        query_type="non_branded_home_service",
        seen_texts=seen_texts
    )
    if len(non_branded_records) < 100:
        extra_non_branded = fetch_via_oauth_fallback(
            query="\"AC service\" OR plumber OR \"deep cleaning\" OR \"geyser repair\" OR MyGate",
            subreddits=SUBREDDITS,
            target_count=100 - len(non_branded_records),
            query_type="non_branded_home_service",
            seen_texts=seen_texts
        )
        non_branded_records.extend(extra_non_branded)

    all_records = branded_records + non_branded_records
    df = pd.DataFrame(all_records, columns=[
        "id", "source", "query_type", "rating_or_upvotes", "city_hint", "date", "text"
    ])

    if not df.empty:
        df["word_count"] = df["text"].apply(lambda t: len(str(t).split()))
        df = df[df["word_count"] >= 15].drop(columns=["word_count"])
        df = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
        df["id"] = [f"RD_{i:03d}" for i in range(1, len(df) + 1)]

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")
    print(f"\n[✔] Successfully saved {len(df)} posts to {OUTPUT_FILE}")
    if not df.empty:
        print(df["query_type"].value_counts())


if __name__ == "__main__":
    main()
