# AI Discovery Engine - Python Pipeline

Data ingestion, classification taxonomy, and benchmark evaluation for public customer feedback across 4 key channels.

## Architecture

```text
python_pipeline/
├── .venv/                   # Dedicated Python virtual environment
├── .env.example             # Template for API keys and query configuration
├── .env                     # Local configuration (never committed to git)
├── requirements.txt         # Pinned project dependencies
├── models.py                # Standardized Pydantic data schema (CustomerFeedback)
├── collect_playstore.py     # Google Play Store reviews collector
├── collect_reddit.py        # Reddit discussions & comments collector (PRAW)
├── collect_youtube.py       # YouTube Data API v3 video comments collector
├── collect_trustpilot.py    # Trustpilot public profile reviews collector
├── tagger.py                # NLP taxonomy classifier (Category, Sentiment, Urgency)
├── evaluate_golden_set.py   # Accuracy, Precision, Recall, Macro-F1 benchmark
└── data/
    ├── raw/                 # Ingested feedback datasets
    ├── processed/           # Model outputs & tagged records
    └── golden_set/          # Human-labeled benchmark dataset
```

---

## 1. Setup & Environment

The Python virtual environment is already initialized. To activate it in your terminal:

**Windows (PowerShell):**
```powershell
cd python_pipeline
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**
```bash
cd python_pipeline
source .venv/bin/activate
```

Dependencies are pinned in `requirements.txt`:
```bash
pip install -r requirements.txt
```

---

## 2. Configuration (`.env`)

Configure your target credentials in `python_pipeline/.env`:

| Source | Access Method | Key Environment Variables |
|---|---|---|
| **Google Play Store** | Authorized Public Scraper | `PLAYSTORE_APP_ID`, `PLAYSTORE_COUNTRY`, `PLAYSTORE_LANGUAGE` |
| **Reddit** | Official Reddit API (OAuth) | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` |
| **YouTube** | YouTube Data API v3 | `YOUTUBE_API_KEY`, `YOUTUBE_SEARCH_QUERIES` |
| **Trustpilot** | Public Profile Scraper | `TRUSTPILOT_BUSINESS_DOMAIN` |

> [!IMPORTANT]
> All credentials are read via `python-dotenv` at runtime. **No API keys are hardcoded in the codebase**, and `.env` is listed in `.gitignore`.

---

## 3. Data Collection Modules (Ready on Demand)

*Data collection has **not** started yet. When ready, you can invoke any collector independently:*

1. **Google Play Store:**
   ```bash
   python collect_playstore.py
   ```
2. **Reddit:**
   ```bash
   python collect_reddit.py
   ```
3. **YouTube:**
   ```bash
   python collect_youtube.py
   ```
4. **Trustpilot:**
   ```bash
   python collect_trustpilot.py
   ```

All collectors output standardized JSON records complying with the `CustomerFeedback` schema in `models.py`.
