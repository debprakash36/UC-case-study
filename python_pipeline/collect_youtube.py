"""
YouTube Comments Collector
Collects public comments using youtube-comment-downloader.
Configured with 4 target videos:
- 2 branded_uc (Urban Company)
- 2 non_branded_home_service
Pulls up to 25 qualifying comments (15+ words each) per video into youtube_comments.csv.
Columns: id,source,query_type,rating_or_upvotes,city_hint,date,text
"""

import os
import re
import time
from typing import Dict, List, Set
import pandas as pd
from youtube_comment_downloader import YoutubeCommentDownloader, SORT_BY_POPULAR

OUTPUT_FILE = "youtube_comments.csv"
SOURCE = "YouTube"

VIDEOS = [
    {
        "url": "http://www.youtube.com/watch?v=OIKAZzPiPmw",
        "query_type": "branded_uc"
    },
    {
        "url": "http://www.youtube.com/watch?v=sbn7gpidVkM",
        "query_type": "branded_uc"
    },
    {
        "url": "http://www.youtube.com/watch?v=nnLaE_FXvr0",
        "query_type": "non_branded_home_service"
    },
    {
        "url": "http://www.youtube.com/watch?v=olvbXvP4xhc",
        "query_type": "non_branded_home_service"
    }
]

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


def parse_votes(v) -> int:
    if v is None:
        return 0
    if isinstance(v, (int, float)):
        return int(v)
    v_str = str(v).strip().upper()
    if not v_str:
        return 0
    try:
        if v_str.endswith("K"):
            return int(float(v_str[:-1]) * 1000)
        elif v_str.endswith("M"):
            return int(float(v_str[:-1]) * 1000000)
        return int(float(v_str))
    except Exception:
        return 0


def collect_youtube_comments(max_per_video: int = 25) -> List[Dict]:
    downloader = YoutubeCommentDownloader()
    all_comments: List[Dict] = []
    seen_texts: Set[str] = set()
    counter = 1

    print("[*] Starting YouTube comment collection across 4 videos...")

    for v in VIDEOS:
        url = v["url"]
        qtype = v["query_type"]
        print(f"\n[+] Processing video: {url} (query_type: {qtype})")

        count_for_video = 0
        try:
            comments_generator = downloader.get_comments_from_url(url, sort_by=SORT_BY_POPULAR)

            for c in comments_generator:
                raw_text = clean_text(c.get("text", ""))
                words = raw_text.split()
                if len(words) < 15:
                    continue

                norm_text = raw_text.lower()
                if norm_text in seen_texts:
                    continue
                seen_texts.add(norm_text)

                upvotes = parse_votes(c.get("votes", 0))
                time_str = str(c.get("time", "")).strip()
                city = detect_city(raw_text)

                all_comments.append({
                    "id": f"YT_{counter:03d}",
                    "source": SOURCE,
                    "query_type": qtype,
                    "rating_or_upvotes": upvotes,
                    "city_hint": city,
                    "date": time_str,
                    "text": raw_text
                })

                counter += 1
                count_for_video += 1
                if count_for_video >= max_per_video:
                    break

            print(f"  [✔] Collected {count_for_video} qualifying comments from {url}")

        except Exception as e:
            print(f"  [!] Error fetching comments from {url}: {e}")

        time.sleep(1.0)

    return all_comments


def main():
    comments = collect_youtube_comments(max_per_video=25)
    df = pd.DataFrame(comments, columns=[
        "id", "source", "query_type", "rating_or_upvotes", "city_hint", "date", "text"
    ])
    
    if not df.empty:
        df["word_count"] = df["text"].apply(lambda t: len(str(t).split()))
        df = df[df["word_count"] >= 15].drop(columns=["word_count"])
        df = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
        df["id"] = [f"YT_{i:03d}" for i in range(1, len(df) + 1)]

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")
    print(f"\n[✔] Successfully saved {len(df)} YouTube comments to {OUTPUT_FILE}")
    if not df.empty:
        print(df["query_type"].value_counts())


if __name__ == "__main__":
    main()
