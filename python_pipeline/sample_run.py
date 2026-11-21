"""
Sample End-to-End Execution Script
Runs Scraper -> Tagger -> Golden Set Evaluation in one unified workflow.
"""

import os
from scraper import UCScraper
from tagger import UCTagger
from evaluate_golden_set import evaluate


def run_pipeline():
    print("▶ STEP 1: Running Scraper / Generating Synthetic Dataset...")
    scraper = UCScraper(output_dir="data/raw")
    raw_data = scraper.generate_synthetic_reviews(count=30)
    print(f"✔ Generated {len(raw_data)} records in data/raw/scraped_reviews.json")

    print("\n▶ STEP 2: Running Tagger Classification Pipeline...")
    tagger = UCTagger(output_dir="data/processed")
    tagged_records = tagger.process_file("data/raw/scraped_reviews.json", "tagged_reviews.json")
    print(f"✔ Tagged {len(tagged_records)} records -> data/processed/tagged_reviews.json")

    print("\n▶ STEP 3: Benchmarking Against Golden Set...")
    golden_path = "data/golden_set/sample_golden_set.json"
    evaluate(golden_path, tagger_instance=tagger)
    print("✔ Pipeline complete!")


if __name__ == "__main__":
    run_pipeline()
