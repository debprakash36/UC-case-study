# Urban Company (UC) Case Study

A comprehensive end-to-end case study architecture spanning discovery, automated data classification pipelines, and prototype MVP.

```
uc_case_study/
├── python_pipeline/   # Local scripts for scraping, tagging & Golden Set eval
├── discovery_web/     # Next.js site deployed to Vercel -> Deliverable 1 (Product & Market Discovery)
└── mvp_web/           # Next.js site deployed to Vercel -> Deliverable 3 (Solution MVP Prototype)
```

---

## Architecture Overview

### 1. `python_pipeline/`
Automated Python workflow designed for:
- **Scraping (`scraper.py`)**: Data collection for service catalog, user reviews, and competitor pricing.
- **Tagging (`tagger.py`)**: Rule-based and LLM-assisted multi-class tagging (e.g., sentiment, intent, issue category).
- **Evaluation (`evaluate_golden_set.py`)**: Benchmarking against a human-verified Golden Dataset (Precision, Recall, F1, Accuracy).

### 2. `discovery_web/` (Deliverable 1)
Modern Next.js web application showcasing:
- User personas, journey mapping, and pain point analysis.
- Market opportunity matrix and unit economics.
- Key research findings and strategic hypotheses.

### 3. `mvp_web/` (Deliverable 3)
Functional interactive Next.js prototype showcasing:
- The core proposed feature/solution.
- End-to-end user experience flow.
- Value proposition validation in action.

---

## Getting Started

### Python Pipeline
```bash
cd python_pipeline
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
python sample_run.py
```

### Discovery Web (Deliverable 1)
```bash
cd discovery_web
npm install
npm run dev
```

### MVP Web (Deliverable 3)
```bash
cd mvp_web
npm install
npm run dev
```
