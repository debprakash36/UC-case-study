# MVP Web (Deliverable 3)

Functional solution prototype for the Urban Company Case Study.

## Features
- **Guaranteed Digital Rate Card & Pre-Authorization:** Eliminates on-site pricing ambiguity by allowing customers to authorize replacement parts with locked rates and warranty terms.
- **Partner Companion Verification:** Provides service technicians with verified OEM checklists and automatic commission transparency.
- **AI Feedback & Escalation Triage:** Integrates directly with the taxonomy and classification logic from `python_pipeline/tagger.py`, tagging customer input into category, sentiment, and urgency routing.

## Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the MVP simulator.

## Deployment to Vercel
Deploy seamlessly using the Vercel CLI or Git integration:
```bash
npx vercel
```
