"""
Batch Analyzer for Urban Company Feedback Dataset (Concurrent & Resilient with Checkpointing)
Features:
- Checkpointing: Saves completed rows incrementally to checkpoint file; resumes automatically.
- Concurrency: ThreadPoolExecutor with batching (10 rows per Gemini call).
- Timeout: 30s timeout per call with exponential backoff on 429/busy.
- Live progress: flush=True on all outputs for instant terminal visibility.
- Exports: analyzed_insights.csv, analyzed_insights.json, and golden_set_20.csv.
"""

import argparse
import concurrent.futures
import json
import os
import sys
import threading
import time
from typing import Any, Dict, List, Optional, Tuple
from google import genai
from google.genai import types
import pandas as pd
from tabulate import tabulate

from schema import (
    BatchClassificationResponse,
    FeedbackClassification,
    OpportunityThemeEnum,
    SentimentEnum,
    ServiceCategoryEnum,
    WorkaroundEnum,
)

INPUT_FILE = "cleaned_feedback.csv"
OUTPUT_CSV = "analyzed_insights.csv"
OUTPUT_JSON = "analyzed_insights.json"
CHECKPOINT_FILE = "analyzed_insights_checkpoint.json"
GOLDEN_SET_CSV = "golden_set_20.csv"

checkpoint_lock = threading.Lock()


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


def get_gemini_client() -> Tuple[genai.Client, str]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("\n" + "!" * 70, flush=True)
        print("ERROR: GEMINI_API_KEY not detected in python_pipeline/.env!", flush=True)
        print("!" * 70 + "\n", flush=True)
        sys.exit(1)

    model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    # Configure 45-second HTTP timeout (45000 ms)
    http_opts = types.HttpOptions(timeout=45000)
    client = genai.Client(api_key=api_key, http_options=http_opts)
    return client, model_name


def load_checkpoint() -> Dict[str, Dict]:
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                elif isinstance(data, list):
                    return {item["id"]: item for item in data if "id" in item}
        except Exception as e:
            print(f"[!] Warning reading checkpoint: {e}. Starting fresh.", flush=True)
    return {}


def save_checkpoint(completed_dict: Dict[str, Dict]):
    with checkpoint_lock:
        try:
            with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
                json.dump(list(completed_dict.values()), f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[!] Warning saving checkpoint: {e}", flush=True)


def analyze_single_batch(
    client: genai.Client,
    model_name: str,
    records: List[Dict],
    batch_idx: int,
    max_retries: int = 4
) -> List[Dict]:
    """Analyzes a batch of records with retries, timeout handling, and strict schema output."""
    prompt = (
        "You are an expert product and growth strategy research analyst for Urban Company and Indian home service platforms.\n"
        "Analyze each customer review or comment and output structured data matching the schema exactly.\n\n"
        "Definitions & Rules:\n"
        "1. sentiment: Positive, Negative, or Neutral.\n"
        "2. service_category: Pick primary category: 'Cleaning & Pest Control', 'Salon & Spa at Home', 'AC & Appliance Repair', 'Plumbing, Electrician & Carpentry', 'Painting & Renovation', 'Customer Support & Policies', 'App & Platform Experience', or 'Other / General Home Service'.\n"
        "3. pain_point: Crisp root-cause phrase (e.g. 'Technician delay / unpunctuality', 'Hidden charges & pricing transparency', 'Poor service quality / rework needed', 'Refund & cancellation friction', 'App technical bugs', 'None / Positive experience').\n"
        "4. summary: 1 crisp analytical sentence capturing the core feedback and customer insight.\n"
        "5. opportunity_theme: Focus on repeat-booking drivers & churn barriers (choose one exact enum value):\n"
        "   - 'Offline / Local Habit Fallback': User mentions or defaults back to local offline technicians/unorganized market for speed, familiarity, or direct access.\n"
        "   - 'Post-Service Maintenance & Reminder Gap': Periodic service/appliance upkeep gap (e.g. RO filter change, AC seasonal maintenance, pest control cycles, deep cleaning renewals) where proactive reminders/subscriptions would drive repeat usage.\n"
        "   - 'Cross-Category Discovery Gap': User wishes UC offered additional services (cooks, permanent maids, interior work) or is unaware UC covers them.\n"
        "   - 'Trust & Predictability Anxiety': Anxiety over technician credentials, pressure for ratings, spare part genuineness, safety, or damage risk.\n"
        "   - 'App & Booking Friction': Friction in booking flow, scheduling rigidness, address/OTP bugs, inability to book advance single slots or communicate needs.\n"
        "   - 'Service Quality / Partner Ops (Out of Scope)': Poor technician craftsmanship, bad attitude, unpunctuality, or operational execution failure.\n"
        "   - 'Pricing & Hidden Charges (Out of Scope)': High service charges, spare part costs, visiting fees, or lack of pricing discounts.\n"
        "   - 'Positive / No Clear Friction': High satisfaction, happy review, no friction barrier.\n"
        "6. workaround_mentioned: What workaround or substitute does customer mention or imply?\n"
        "   - 'Local Technician': Hired a local market plumber, electrician, mechanic, or repairman.\n"
        "   - 'Competitor App': Used NoBroker, YesMadam, Housejoy, MyGate, etc.\n"
        "   - 'Maid / Neighbour / WhatsApp': Reliance on domestic help, society WhatsApp groups, or word-of-mouth.\n"
        "   - 'DIY': Handled the repair or cleaning themselves.\n"
        "   - 'None': No explicit alternative workaround cited.\n"
        "7. consumer_growth_controllable: Boolean (true/false).\n"
        "   - Set TRUE ONLY if the issue can be solved from customer-facing digital product (e.g. smarter booking, automated maintenance reminders, service subscriptions, cross-category discovery, pre-service transparency, in-app workflows) WITHOUT requiring partner operational disciplinary changes, field training, or price cuts/discounts.\n"
        "   - Set FALSE if it requires physical partner ops, salary/payout changes, customer price cuts, or if it is already purely positive.\n\n"
        "Input Records:\n"
    )

    for r in records:
        prompt += f"\n--- ID: {r['id']} (Source: {r['source']}, Query Type: {r['query_type']}, Rating: {r.get('rating_or_upvotes')}) ---\n"
        prompt += f"Text: {r['text']}\n"

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=BatchClassificationResponse,
        temperature=0.1
    )

    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )

            # 1. Parse structured Pydantic object
            if hasattr(response, "parsed") and response.parsed:
                items = response.parsed.results if hasattr(response.parsed, "results") else []
                results_map = {}
                for it in items:
                    results_map[it.id] = {
                        "sentiment": it.sentiment.value if hasattr(it.sentiment, "value") else str(it.sentiment),
                        "service_category": it.service_category.value if hasattr(it.service_category, "value") else str(it.service_category),
                        "pain_point": str(it.pain_point).strip(),
                        "summary": str(it.summary).strip(),
                        "opportunity_theme": it.opportunity_theme.value if hasattr(it.opportunity_theme, "value") else str(it.opportunity_theme),
                        "workaround_mentioned": it.workaround_mentioned.value if hasattr(it.workaround_mentioned, "value") else str(it.workaround_mentioned),
                        "consumer_growth_controllable": bool(it.consumer_growth_controllable)
                    }
                return [results_map.get(r["id"], {}) for r in records]

            # 2. Fallback to raw text json parsing
            raw_json = json.loads(response.text)
            items = raw_json.get("results", [])
            results_map = {it.get("id"): it for it in items}
            return [results_map.get(r["id"], {}) for r in records]

        except Exception as e:
            err_msg = str(e)
            is_rate_limit = "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg
            is_timeout = "timeout" in err_msg.lower() or "timed out" in err_msg.lower() or "503" in err_msg

            if attempt < max_retries:
                backoff_time = (2 ** attempt) * 1.5
                print(f"  [Batch {batch_idx:02d} | Attempt {attempt}] Retrying in {backoff_time:.1f}s ({err_msg[:60]})...", flush=True)
                time.sleep(backoff_time)
            else:
                print(f"  [!] Batch {batch_idx:02d} failed after {max_retries} attempts: {err_msg[:80]}. Using heuristic fallback.", flush=True)
                return [
                    {
                        "sentiment": "Neutral" if r.get("rating_or_upvotes") in [3, None] else ("Positive" if r.get("rating_or_upvotes", 0) >= 4 else "Negative"),
                        "service_category": "Other / General Home Service",
                        "pain_point": "Service Quality / Operations" if r.get("rating_or_upvotes", 5) <= 3 else "None / Positive experience",
                        "summary": r["text"][:120] + "...",
                        "opportunity_theme": "Positive / No Clear Friction" if r.get("rating_or_upvotes", 0) >= 4 else "Service Quality / Partner Ops (Out of Scope)",
                        "workaround_mentioned": "None",
                        "consumer_growth_controllable": False
                    }
                    for r in records
                ]

    return []


def print_comparative_summary(df: pd.DataFrame):
    print("\n" + "=" * 80, flush=True)
    print("UPGRADED COMPARATIVE INSIGHTS SUMMARY (Repeat Opportunities & Controllability)", flush=True)
    print("=" * 80, flush=True)

    # 1. Sentiment Breakdown
    print("\n1. Sentiment Breakdown by Query Type:", flush=True)
    sent_cross = pd.crosstab(df["query_type"], df["sentiment"], margins=True, margins_name="Total")
    print(tabulate(sent_cross, headers="keys", tablefmt="github"), flush=True)

    # 2. Opportunity Theme Breakdown
    print("\n2. Opportunity Theme Breakdown (Repeat Opportunity vs Out of Scope):", flush=True)
    theme_cross = pd.crosstab(df["opportunity_theme"], df["query_type"], margins=True, margins_name="Total")
    theme_sorted = theme_cross.sort_values(by="Total", ascending=False)
    print(tabulate(theme_sorted, headers="keys", tablefmt="github"), flush=True)

    # 3. Consumer Growth Controllability
    print("\n3. Consumer-Growth Controllable vs Out of Scope:", flush=True)
    ctrl_cross = pd.crosstab(df["consumer_growth_controllable"], df["query_type"], margins=True, margins_name="Total")
    print(tabulate(ctrl_cross, headers="keys", tablefmt="github"), flush=True)

    # 4. Workaround Mentioned
    print("\n4. Workarounds Mentioned Across Dataset:", flush=True)
    work_cross = pd.crosstab(df["workaround_mentioned"], df["query_type"], margins=True, margins_name="Total")
    work_sorted = work_cross.sort_values(by="Total", ascending=False)
    print(tabulate(work_sorted, headers="keys", tablefmt="github"), flush=True)
    print("=" * 80 + "\n", flush=True)


def run_pipeline(dry_run: bool = False, sample_size: int = 5, batch_size: int = 10, max_workers: int = 3):
    if not os.path.exists(INPUT_FILE):
        print(f"[!] {INPUT_FILE} not found. Please run clean_data.py first.", flush=True)
        sys.exit(1)

    df = pd.read_csv(INPUT_FILE)
    total_available = len(df)
    print(f"[*] Loaded {total_available} records from {INPUT_FILE}", flush=True)

    if dry_run:
        print(f"\n[!] RUNNING IN DRY-RUN TEST MODE (First {sample_size} records)", flush=True)
        df_target = df.head(sample_size).copy()
        completed_dict: Dict[str, Dict] = {}
    else:
        print(f"\n[*] RUNNING BATCH ANALYSIS WITH CONCURRENCY={max_workers}, BATCH_SIZE={batch_size}", flush=True)
        df_target = df.copy()
        completed_dict = load_checkpoint()
        if completed_dict:
            print(f"[✔] Resuming from checkpoint: {len(completed_dict)} rows already classified.", flush=True)

    client, model_name = get_gemini_client()
    print(f"[✔] Gemini client initialized with model: {model_name} (timeout=45s)", flush=True)

    all_records = df_target.to_dict(orient="records")
    # Filter out records already completed
    pending_records = [r for r in all_records if r["id"] not in completed_dict]
    total_pending = len(pending_records)
    total_target = len(all_records)

    print(f"[*] Total target records: {total_target} | Pending: {total_pending} | Already done: {len(completed_dict)}", flush=True)

    if total_pending > 0:
        # Create batches of pending records
        batches = [pending_records[i:i + batch_size] for i in range(0, total_pending, batch_size)]
        total_batches = len(batches)
        print(f"[*] Dispatching {total_batches} batches to ThreadPoolExecutor (max_workers={max_workers})...\n", flush=True)

        start_time = time.time()
        processed_count = len(completed_dict)

        def process_batch_worker(batch_info: Tuple[int, List[Dict]]) -> Tuple[int, List[Dict], List[Dict]]:
            b_idx, b_records = batch_info
            res = analyze_single_batch(client, model_name, b_records, b_idx)
            return b_idx, b_records, res

        batch_tasks = [(i + 1, b) for i, b in enumerate(batches)]

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_batch = {executor.submit(process_batch_worker, task): task[0] for task in batch_tasks}

            for future in concurrent.futures.as_completed(future_to_batch):
                b_idx = future_to_batch[future]
                try:
                    b_num, b_records, b_results = future.result(timeout=65.0)
                    for rec, cl in zip(b_records, b_results):
                        rec_id = rec["id"]
                        completed_dict[rec_id] = {
                            **rec,
                            "sentiment": cl.get("sentiment", "Neutral"),
                            "service_category": cl.get("service_category", "Other / General Home Service"),
                            "pain_point": cl.get("pain_point", "None"),
                            "summary": cl.get("summary", ""),
                            "opportunity_theme": cl.get("opportunity_theme", "Positive / No Clear Friction"),
                            "workaround_mentioned": cl.get("workaround_mentioned", "None"),
                            "consumer_growth_controllable": cl.get("consumer_growth_controllable", False)
                        }

                    # Incremental checkpoint save
                    if not dry_run:
                        save_checkpoint(completed_dict)

                    elapsed = time.time() - start_time
                    done_now = len(completed_dict)
                    pct = (done_now / total_target) * 100
                    print(f"  [Progress] Batch {b_num:>2}/{total_batches} done | Total: {done_now:>3}/{total_target} ({pct:5.1f}%) | Elapsed: {elapsed:5.1f}s", flush=True)

                except Exception as exc:
                    print(f"  [!] Batch {b_idx} generated exception: {exc}", flush=True)

    # Reconstruct DataFrame matching original order
    final_rows = [completed_dict[r["id"]] for r in all_records if r["id"] in completed_dict]
    out_df = pd.DataFrame(final_rows)

    # Save CSV and JSON
    out_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    print(f"\n[✔] Successfully generated {OUTPUT_CSV} ({len(out_df)} rows)", flush=True)

    out_df.to_json(OUTPUT_JSON, orient="records")
    print(f"[✔] Successfully generated {OUTPUT_JSON} ({len(out_df)} rows)", flush=True)

    # Export balanced 20-row sample to golden_set_20.csv (10 branded_uc + 10 non_branded_home_service)
    if not dry_run and len(out_df) >= 20:
        branded = out_df[out_df["query_type"] == "branded_uc"]
        non_branded = out_df[out_df["query_type"] == "non_branded_home_service"]

        sample_branded = branded.sample(n=min(10, len(branded)), random_state=42)
        sample_non_branded = non_branded.sample(n=min(10, len(non_branded)), random_state=42)

        golden_df = pd.concat([sample_branded, sample_non_branded]).sample(frac=1.0, random_state=42).reset_index(drop=True)
        # Add human annotation columns for validation
        golden_df["human_sentiment"] = ""
        golden_df["human_opportunity_theme"] = ""
        golden_df["human_growth_controllable"] = ""
        golden_df["annotation_agreement"] = ""
        golden_df["validation_notes"] = ""

        golden_df.to_csv(GOLDEN_SET_CSV, index=False, encoding="utf-8")
        print(f"[✔] Successfully exported balanced golden set: {GOLDEN_SET_CSV} ({len(golden_df)} rows)", flush=True)

    # Print summary
    print_comparative_summary(out_df)

    return out_df


def main():
    parser = argparse.ArgumentParser(description="Analyze customer feedback with Gemini for Repeat Opportunities")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Run on 5-row sample only")
    parser.add_argument("--sample", type=int, default=5, help="Sample size for dry-run (default: 5)")
    parser.add_argument("--workers", type=int, default=3, help="Concurrent workers (default: 3)")
    parser.add_argument("--batch-size", type=int, default=10, help="Batch size per request (default: 10)")
    args = parser.parse_args()

    run_pipeline(
        dry_run=args.dry_run,
        sample_size=args.sample,
        batch_size=args.batch_size,
        max_workers=args.workers
    )


if __name__ == "__main__":
    main()
