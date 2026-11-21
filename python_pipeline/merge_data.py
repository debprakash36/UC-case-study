"""
Merges all available feedback datasets:
- playstore_reviews.csv
- reddit_posts.csv
- youtube_comments.csv
- trustpilot_reviews.csv
Drops empty/duplicate texts, enforces the 7 canonical columns,
saves to raw_feedback.csv, and prints a summary table of row counts by source and query_type.
"""

import os
from typing import List
import pandas as pd
from tabulate import tabulate

FILES_TO_MERGE = [
    "playstore_reviews.csv",
    "playstore_nonbranded_reviews.csv",
    "reddit_posts.csv",
    "youtube_comments.csv",
    "trustpilot_reviews.csv"
]

CANONICAL_COLUMNS = [
    "id",
    "source",
    "query_type",
    "rating_or_upvotes",
    "city_hint",
    "date",
    "text"
]

OUTPUT_FILE = "raw_feedback.csv"


def merge_datasets():
    dfs: List[pd.DataFrame] = []

    print("[*] Merging available CSV datasets...")
    for filename in FILES_TO_MERGE:
        if os.path.exists(filename):
            try:
                df = pd.read_csv(filename)
                if not df.empty:
                    # Validate columns
                    missing_cols = [c for c in CANONICAL_COLUMNS if c not in df.columns]
                    if missing_cols:
                        print(f"  [!] Warning: {filename} missing columns: {missing_cols}. Aligning...")
                        for c in missing_cols:
                            df[c] = ""
                    df = df[CANONICAL_COLUMNS]
                    dfs.append(df)
                    print(f"  [+] Loaded {len(df):>4} rows from {filename}")
                else:
                    print(f"  [-] {filename} is empty. Skipping.")
            except Exception as e:
                print(f"  [!] Error reading {filename}: {e}")
        else:
            print(f"  [-] {filename} not found (may not be generated yet). Skipping.")

    if not dfs:
        print("[!] No datasets found to merge.")
        return

    merged_df = pd.concat(dfs, ignore_index=True)
    initial_count = len(merged_df)

    # 1. Drop rows with empty or whitespace-only text
    merged_df = merged_df[merged_df["text"].notna() & (merged_df["text"].astype(str).str.strip() != "")]

    # 2. Filter fewer than 15 words
    merged_df["word_count"] = merged_df["text"].apply(lambda t: len(str(t).split()))
    merged_df = merged_df[merged_df["word_count"] >= 15].drop(columns=["word_count"])

    # 3. Deduplicate by text (case-insensitive)
    merged_df["_norm_text"] = merged_df["text"].str.strip().str.lower()
    merged_df = merged_df.drop_duplicates(subset=["_norm_text"]).drop(columns=["_norm_text"]).reset_index(drop=True)

    final_count = len(merged_df)
    print(f"\n[✔] Merged: {initial_count} raw rows -> {final_count} unique rows (filtered < 15 words & duplicates)")

    # Save to raw_feedback.csv
    merged_df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")
    print(f"[✔] Successfully saved merged dataset to {OUTPUT_FILE}")

    # Summary table by source and query_type
    summary = merged_df.groupby(["source", "query_type"]).size().unstack(fill_value=0)
    summary["Total"] = summary.sum(axis=1)
    
    total_row = summary.sum(axis=0)
    total_row.name = "All Sources"
    summary_with_total = pd.concat([summary, pd.DataFrame([total_row])])

    print("\n" + "=" * 60)
    print("FEEDBACK DATASET SUMMARY (ROW COUNTS)")
    print("=" * 60)
    print(tabulate(summary_with_total, headers="keys", tablefmt="github"))
    print("=" * 60)


if __name__ == "__main__":
    merge_datasets()
