# Record Organizer

Catalog vinyl records with track-level notes (genre, vocals/instrumental, when-to-play, description) and generate printable 4×6 PDF labels.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- SQLite via `better-sqlite3` (local file at `./data.db`)
- `@react-pdf/renderer` for PDF labels
- `@tanstack/react-table` for the dashboard grid

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000. The SQLite database is created automatically on first run.

## Features
- Dashboard: filterable/sortable track list (search, genre, vocals/instrumental, when-to-play)
- Add record form with one-or-more tracks per side (A/B only)
- Record detail page with "Generate Label (PDF)" — downloads a 4×6 PDF with all track notes
- REST API at `/api/records` and `/api/tracks`

## Roadmap
- SMS entry flow (Twilio + Claude API) — conversational track entry on the go
- Deploy to Vercel + migrate SQLite → Postgres
- Discogs lookup for record metadata

## Data model
```
records(id, artist, album, year, created_at)
tracks(id, record_id, side, position, title, genre, vocals, when_to_play, description, created_at)
```
