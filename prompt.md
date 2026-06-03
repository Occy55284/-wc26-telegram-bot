# WC26 Telegram Bot — Progress Log

## Project Overview

A World Cup 2026 Telegram notification bot deployed on Vercel. It runs on a daily cron schedule and sends a formatted message to a Telegram chat with the previous day's match results and today's upcoming fixtures.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Runtime | Vercel serverless (Node.js) |
| Trigger | Cron job — `0 8 * * *` (08:00 UTC daily) |
| Data source | [football-data.org](https://www.football-data.org/) v4 API |
| Output | Telegram Bot API |

### Environment variables required

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_TOKEN` | Telegram bot API token |
| `CHAT_ID` | Target Telegram chat/group ID |
| `FOOTBALL_KEY` | football-data.org API key |

---

## File Structure

```
.
├── api/
│   └── notify.js   # Serverless handler — fetches data, formats and sends the message
├── vercel.json     # Cron schedule configuration
└── prompt.md       # This file
```

---

## Commit History

| Hash | Description |
|------|-------------|
| `bc02991` | Initial commit |
| `3dff51c` | Add Telegram notification handler |
| `de13e21` | Fetch World Cup fixtures and send Telegram message |
| `121cd26` | Add cron job for API notification |
| `7fa831e` | Refactor notify.js to include helper functions |

---

## Completed Features

- [x] Daily Telegram message sent automatically at 08:00 UTC
- [x] Yesterday's match results (scores, teams, group)
- [x] Today's fixtures (kick-off times converted to UK timezone)
- [x] Country flag emoji mapping for 33 national teams
- [x] Markdown-formatted message with clear sections
- [x] `getFlag(team)` helper — returns emoji flag for a given team name
- [x] `toUKTime(utcDate)` helper — converts UTC date string to `Europe/London` local time
- [x] Error surfacing via Telegram message on handler failure
- [x] Cron automation via `vercel.json`

---

## Known Gaps / Potential Next Steps

- [ ] Group-stage standings / points table
- [ ] Knockout-round bracket view
- [ ] Per-team subscription (users opt in to their team only)
- [ ] Live score updates mid-match (separate webhook or more frequent cron)
- [ ] Match statistics detail (possession, goals, cards)
- [ ] Inline keyboard buttons for on-demand queries
- [ ] Expand flag map to cover all 48 WC 2026 nations
- [ ] Unit tests for `getFlag` and `toUKTime` helpers

---

## How to Run Locally

```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variables in .env.local
TELEGRAM_TOKEN=...
CHAT_ID=...
FOOTBALL_KEY=...

# Start dev server
vercel dev

# Trigger the handler manually
curl http://localhost:3000/api/notify
```

---

## Deployment

Push to `main` — Vercel auto-deploys. The cron job defined in `vercel.json` runs the handler each day without any further intervention.
