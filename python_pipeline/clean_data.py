"""
Cleans raw_feedback.csv and outputs cleaned_feedback.csv adhering to exact rules:
1. Exact 7 columns: id,source,query_type,rating_or_upvotes,city_hint,date,text
2. Remove exact and near duplicate rows based on text (normalized & pairwise Jaccard).
3. Remove rows with fewer than 15 words.
4. Verify rating distribution of Google Play Store reviews (split roughly 100 4-5 stars and 100 1-3 stars).
5. Output final row count breakdown by source and query_type, plus 3 sample rows.
"""

import os
import re
from typing import List, Set, Tuple
import pandas as pd
from tabulate import tabulate

INPUT_FILE = "raw_feedback.csv"
OUTPUT_FILE = "cleaned_feedback.csv"

CANONICAL_COLUMNS = [
    "id",
    "source",
    "query_type",
    "rating_or_upvotes",
    "city_hint",
    "date",
    "text"
]


def normalize_text(text: str) -> str:
    """Removes special characters and normalizes whitespaces for near-duplicate comparison."""
    t = str(text or "").lower()
    t = re.sub(r"[^\w\s]", "", t)
    return " ".join(t.split())


def clean_dataset():
    # Merge fresh from component CSVs if raw_feedback needs updating
    from merge_data import merge_datasets
    merge_datasets()

    if not os.path.exists(INPUT_FILE):
        raise FileNotFoundError(f"{INPUT_FILE} does not exist.")

    df = pd.read_csv(INPUT_FILE)
    initial_rows = len(df)
    print(f"\n[*] Starting data cleaning on {initial_rows} records from {INPUT_FILE}...")

    # Rule 1: Ensure exact 7 canonical columns
    for col in CANONICAL_COLUMNS:
        if col not in df.columns:
            df[col] = ""
    df = df[CANONICAL_COLUMNS]

    # Rule 3: Remove rows where text has fewer than 15 words
    df["word_count"] = df["text"].apply(lambda t: len(str(t or "").split()))
    short_rows = len(df[df["word_count"] < 15])
    df = df[df["word_count"] >= 15].drop(columns=["word_count"])
    print(f"  [-] Filtered {short_rows} rows with fewer than 15 words.")

    # Rule 2: Remove exact and near-duplicates based on text
    # 2a. Exact match
    exact_dupes = df.duplicated(subset=["text"]).sum()
    df = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
    print(f"  [-] Removed {exact_dupes} exact duplicate rows.")

    # 2b. Normalized text duplicate match
    df["_norm_text"] = df["text"].apply(normalize_text)
    norm_dupes = df.duplicated(subset=["_norm_text"]).sum()
    df = df.drop_duplicates(subset=["_norm_text"]).drop(columns=["_norm_text"]).reset_index(drop=True)
    print(f"  [-] Removed {norm_dupes} normalized near-duplicate rows.")

    # 2c. Near-duplicate pairwise check (Jaccard similarity >= 0.85)
    word_sets = [set(normalize_text(t).split()) for t in df["text"]]
    indices_to_drop: Set[int] = set()
    for i in range(len(word_sets)):
        if i in indices_to_drop:
            continue
        for j in range(i + 1, len(word_sets)):
            if j in indices_to_drop:
                continue
            s1, s2 = word_sets[i], word_sets[j]
            if not s1 or not s2:
                continue
            sim = len(s1 & s2) / len(s1 | s2)
            if sim >= 0.85:
                indices_to_drop.add(j)

    if indices_to_drop:
        print(f"  [-] Removed {len(indices_to_drop)} Jaccard near-duplicate rows (similarity >= 0.85).")
        df = df.drop(index=list(indices_to_drop)).reset_index(drop=True)
    else:
        print("  [✔] Pairwise near-duplicate check passed: 0 near-duplicates found.")

    # Rule 4: Verify Google Play Store rating split (roughly 100 4-5 stars and 100 1-3 stars)
    ps_df = df[df["source"] == "Play Store"]
    ps_total = len(ps_df)
    
    ps_high = len(ps_df[ps_df["rating_or_upvotes"].astype(float).isin([4.0, 5.0])])
    ps_low = len(ps_df[ps_df["rating_or_upvotes"].astype(float).isin([1.0, 2.0, 3.0])])

    print("\n" + "=" * 65)
    print("RULE 4 VERIFICATION: PLAY STORE RATING SPLIT")
    print("=" * 65)
    print(f"Total Google Play Store rows : {ps_total}")
    print(f"  - High Ratings (4-5 stars) : {ps_high} ({ps_high / ps_total * 100:.1f}%)")
    print(f"  - Low Ratings  (1-3 stars) : {ps_low} ({ps_low / ps_total * 100:.1f}%)")

    # Also show by query_type
    for qtype in ps_df["query_type"].unique():
        sub = ps_df[ps_df["query_type"] == qtype]
        sub_high = len(sub[sub["rating_or_upvotes"].astype(float).isin([4.0, 5.0])])
        sub_low = len(sub[sub["rating_or_upvotes"].astype(float).isin([1.0, 2.0, 3.0])])
        print(f"  * Play Store [{qtype}]: {len(sub)} rows -> 4-5★: {sub_high}, 1-3★: {sub_low}")
    print("=" * 65)

    # Save cleaned files
    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")
    df.to_csv(INPUT_FILE, index=False, encoding="utf-8")
    print(f"[✔] Cleaned dataset saved to {OUTPUT_FILE} and updated {INPUT_FILE}")

    # Rule 5: Print final cleaned row count breakdown by source and query_type
    print("\n" + "=" * 65)
    print("FINAL CLEANED ROW COUNT BREAKDOWN")
    print("=" * 65)
    breakdown = df.groupby(["source", "query_type"]).size().unstack(fill_value=0)
    breakdown["Total"] = breakdown.sum(axis=1)
    
    total_row = breakdown.sum(axis=0)
    total_row.name = "All Sources"
    breakdown_full = pd.concat([breakdown, pd.DataFrame([total_row])])
    print(tabulate(breakdown_full, headers="keys", tablefmt="github"))
    print("=" * 65)

    # Rule 5 (cont.): Print 3 sample rows
    print("\n" + "=" * 65)
    print("SAMPLE RECORDS (3 ROWS)")
    print("=" * 65)
    samples = [
        df[df["source"] == "Play Store"].iloc[0],
        df[df["source"] == "Play Store"].iloc[-1],
        df[df["source"] == "YouTube"].iloc[0]
    ]
    for idx, sample in enumerate(samples, 1):
        print(f"\n[Sample {idx}]")
        for k in CANONICAL_COLUMNS:
            val = str(sample[k])
            if k == "text" and len(val) > 120:
                val = val[:120] + "..."
            print(f"  {k:<18}: {val}")
    print("=" * 65)


if __name__ == "__main__":
    clean_dataset()
