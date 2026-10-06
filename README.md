# Tender Package Builder

A browser-only React application for assembling tender document packages.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in Chrome.

## Usage Workflow

1. **Load Requirements** — Upload `requirements.json` (sample at `public/requirements.json`)
2. **Upload PDFs** — Drag & drop PDF files (max 30 files, 50 MB total)
3. **Match & Dates** — Assign files to requirements; enter expiry dates where needed
4. **Review & Generate** — Check status, generate and download the combined PDF package

## requirements.json Format

```json
{
  "tender_id": "T-2025-001",
  "tender_title": "Supply of Office Equipment",
  "procuring_entity": "Ministry of Finance",
  "bidder": "ABC Corporation Ltd.",
  "submission_deadline": "2025-12-31",
  "requirements": [
    {
      "id": "R01",
      "order": 1,
      "title_en": "Trade License",
      "title_bn": "ট্রেড লাইসেন্স",
      "mandatory": true,
      "has_expiry": true
    }
  ]
}
```

## Tech Stack
- React 19 + Vite 5
- Tailwind CSS 3
- pdf-lib (PDF merging & cover page)
- pdfjs-dist (page counting)
- Web Crypto API (SHA-256 duplicate detection)
