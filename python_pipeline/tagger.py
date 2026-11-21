"""
Tagger Module for Urban Company Case Study
Performs intent classification, sentiment analysis, and issue taxonomy tagging.
Supports both deterministic rule-based tagging and optional LLM classification.
"""

import json
import logging
import os
import re
from typing import Dict, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


class UCTagger:
    CATEGORIES = {
        "Punctuality & Equipment": [
            r"\blate\b", r"\bdelayed?\b", r"\bon time\b", r"\btime\b", 
            r"\btools?\b", r"\bequipment\b", r"\buniform\b", r"\bkit\b"
        ],
        "Pricing & Transparency": [
            r"\bcharg(ed?|ing)\b", r"\bprice\b", r"\bexpensive\b", r"\brates?\b",
            r"\bcost\b", r"\binvoice\b", r"\bbill(ing)?\b", r"\bhidden\b", r"\bextra\b"
        ],
        "Customer Support": [
            r"\bsupport\b", r"\bhelpdesk\b", r"\brefund\b", r"\bcancell?ation\b",
            r"\bcall center\b", r"\bresponse\b", r"\bexecutive\b"
        ],
        "Hygiene & Safety": [
            r"\bhygiene\b", r"\bmask\b", r"\bsanitiz\w*\b", r"\bclean(liness)?\b",
            r"\bsheets?\b", r"\bgloves?\b"
        ],
        "App & Tech Experience": [
            r"\bcrash(ed)?\b", r"\bapp\b", r"\bpayment\b", r"\bupi\b", 
            r"\bcheckout\b", r"\blogin\b", r"\botp\b", r"\bbug\b"
        ],
        "Service Quality": [
            r"\bquality\b", r"\bpolite\b", r"\bcourteous\b", r"\bskill(ed)?\b",
            r"\bleak(age)?\b", r"\bprofessional\b", r"\bneat\b", r"\bthorough\b",
            r"\brepair\b", r"\bdeep clean\b"
        ]
    }

    POSITIVE_WORDS = {
        "great", "amazing", "good", "loved", "flawless", "superb", 
        "neat", "polite", "efficient", "courteous", "thorough", "recommend"
    }
    
    NEGATIVE_WORDS = {
        "terrible", "late", "overcharged", "poor", "disappointed", 
        "crash", "crashed", "delayed", "worst", "bad", "horrible", "waste"
    }

    def __init__(self, output_dir: str = "data/processed"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def classify_category(self, text: str) -> str:
        text_lower = text.lower()
        matched_scores = {}
        for cat, patterns in self.CATEGORIES.items():
            score = sum(1 for pattern in patterns if re.search(pattern, text_lower))
            if score > 0:
                matched_scores[cat] = score

        if matched_scores:
            return max(matched_scores.items(), key=lambda x: x[1])[0]
        return "Service Quality"  # Default fallback

    def classify_sentiment(self, text: str) -> str:
        words = set(re.findall(r"\b\w+\b", text.lower()))
        pos_matches = len(words.intersection(self.POSITIVE_WORDS))
        neg_matches = len(words.intersection(self.NEGATIVE_WORDS))

        if pos_matches > neg_matches:
            return "Positive"
        elif neg_matches > pos_matches:
            return "Negative"
        return "Neutral"

    def classify_urgency(self, category: str, sentiment: str) -> str:
        if sentiment == "Negative":
            if category in ["Pricing & Transparency", "Customer Support", "Punctuality & Equipment"]:
                return "High"
            return "Medium"
        elif sentiment == "Neutral":
            return "Medium"
        return "Low"

    def tag_record(self, item: Dict) -> Dict:
        text = item.get("text", "")
        category = self.classify_category(text)
        sentiment = self.classify_sentiment(text)
        urgency = self.classify_urgency(category, sentiment)

        return {
            **item,
            "pred_category": category,
            "pred_sentiment": sentiment,
            "pred_urgency": urgency
        }

    def process_file(self, input_file: str, output_filename: str = "tagged_records.json") -> List[Dict]:
        logging.info(f"Tagging records from {input_file}...")
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        tagged = [self.tag_record(item) for item in data]
        output_path = os.path.join(self.output_dir, output_filename)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(tagged, f, indent=2)

        logging.info(f"Tagged {len(tagged)} records -> {output_path}")
        return tagged


if __name__ == "__main__":
    tagger = UCTagger()
    sample = {"id": "TEST-1", "text": "Plumber arrived 1 hour late and charged hidden inspection fees."}
    print(tagger.tag_record(sample))
