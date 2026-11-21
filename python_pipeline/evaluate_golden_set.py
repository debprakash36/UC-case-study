"""
Golden Set Evaluation Module
Benchmarks model/rule-based predictions against a human-verified Golden Dataset.
Computes Accuracy, Precision, Recall, F1-Score, and error breakdowns.
"""

import json
import logging
import os
from collections import defaultdict
from typing import Dict, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def calculate_metrics(y_true: List[str], y_pred: List[str]) -> Dict:
    classes = sorted(list(set(y_true + y_pred)))
    tp = defaultdict(int)
    fp = defaultdict(int)
    fn = defaultdict(int)
    total = len(y_true)
    correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)

    for true_label, pred_label in zip(y_true, y_pred):
        if true_label == pred_label:
            tp[true_label] += 1
        else:
            fp[pred_label] += 1
            fn[true_label] += 1

    per_class = {}
    f1_sum = 0.0
    for cls in classes:
        precision = tp[cls] / (tp[cls] + fp[cls]) if (tp[cls] + fp[cls]) > 0 else 0.0
        recall = tp[cls] / (tp[cls] + fn[cls]) if (tp[cls] + fn[cls]) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        f1_sum += f1
        per_class[cls] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "support": sum(1 for t in y_true if t == cls)
        }

    macro_f1 = f1_sum / len(classes) if classes else 0.0
    accuracy = correct / total if total > 0 else 0.0

    return {
        "accuracy": round(accuracy, 4),
        "macro_f1": round(macro_f1, 4),
        "total_samples": total,
        "per_class": per_class
    }


def evaluate(golden_file: str, tagger_instance=None):
    if not os.path.exists(golden_file):
        raise FileNotFoundError(f"Golden dataset not found at {golden_file}")

    with open(golden_file, "r", encoding="utf-8") as f:
        golden_data = json.load(f)

    if tagger_instance is None:
        from tagger import UCTagger
        tagger_instance = UCTagger()

    y_true_cat, y_pred_cat = [], []
    y_true_sent, y_pred_sent = [], []
    errors = []

    for item in golden_data:
        pred = tagger_instance.tag_record(item)
        
        true_cat = item["category"]
        pred_cat = pred["pred_category"]
        y_true_cat.append(true_cat)
        y_pred_cat.append(pred_cat)

        true_sent = item["sentiment"]
        pred_sent = pred["pred_sentiment"]
        y_true_sent.append(true_sent)
        y_pred_sent.append(pred_sent)

        if true_cat != pred_cat or true_sent != pred_sent:
            errors.append({
                "id": item.get("id"),
                "text": item.get("text"),
                "expected": {"category": true_cat, "sentiment": true_sent},
                "predicted": {"category": pred_cat, "sentiment": pred_sent}
            })

    cat_metrics = calculate_metrics(y_true_cat, y_pred_cat)
    sent_metrics = calculate_metrics(y_true_sent, y_pred_sent)

    report = {
        "summary": {
            "total_samples": len(golden_data),
            "category_accuracy": cat_metrics["accuracy"],
            "category_macro_f1": cat_metrics["macro_f1"],
            "sentiment_accuracy": sent_metrics["accuracy"],
            "sentiment_macro_f1": sent_metrics["macro_f1"],
            "mismatches_count": len(errors)
        },
        "category_metrics": cat_metrics,
        "sentiment_metrics": sent_metrics,
        "mismatches": errors
    }

    print("=" * 60)
    print("GOLDEN SET BENCHMARK REPORT")
    print("=" * 60)
    print(f"Total Evaluated Samples : {report['summary']['total_samples']}")
    print(f"Category Accuracy       : {report['summary']['category_accuracy'] * 100:.2f}%")
    print(f"Category Macro F1       : {report['summary']['category_macro_f1']:.4f}")
    print(f"Sentiment Accuracy      : {report['summary']['sentiment_accuracy'] * 100:.2f}%")
    print(f"Sentiment Macro F1      : {report['summary']['sentiment_macro_f1']:.4f}")
    print(f"Discrepancies           : {report['summary']['mismatches_count']}")
    print("=" * 60)

    # Save evaluation metrics
    os.makedirs("data/processed", exist_ok=True)
    report_path = "data/processed/golden_set_eval_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"Detailed JSON evaluation report written to {report_path}")

    return report


if __name__ == "__main__":
    evaluate("data/golden_set/sample_golden_set.json")
