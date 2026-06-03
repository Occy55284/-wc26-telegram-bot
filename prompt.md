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
- [x] Yesterday's match results — full-time score, half-time score, AET, penalty shootout result
- [x] Today's fixtures — kick-off time (UK), group/round label, venue (when provided by API)
- [x] Stage labels — Group A–L, Round of 16, Quarter-Final, Semi-Final, 3rd Place Play-off, Final
- [x] Group standings — all groups, W-D-L record, goal difference, points (sent as separate message)
- [x] Top 10 scorers — goals, penalties, assists (sent as separate message)
- [x] Country flag emoji mapping for 60+ nations (covers all likely WC 2026 qualifiers)
- [x] `getFlag(name)` helper
- [x] `toUKTime(utcDate)` helper
- [x] `stageLabel(match)` helper
- [x] `scoreDetail(match)` helper — composes full score string with HT/AET/pens
- [x] All four API calls made in parallel (`Promise.all`)
- [x] Standings and scorers messages only sent when data is available (skipped pre-tournament)
- [x] Cron automation via `vercel.json`

---

## Message Structure (3 messages per day)

| Message | Content |
|---------|---------|
| 1 — Daily Update | Yesterday's results (score, HT, AET/pens, stage, venue) + Today's fixtures (time, stage, venue) |
| 2 — Group Standings | All groups: position, flag, team, W-D-L, GD, points |
| 3 — Top Scorers | Top 10: flag, name, goals, penalties, assists |

---

## Known Gaps / Potential Next Steps

- [ ] Per-team subscription (users opt in to their team only)
- [ ] Live score updates mid-match (needs more frequent trigger or webhook)
- [ ] Match statistics detail (possession, shots, cards — requires higher API tier)
- [ ] Inline keyboard buttons for on-demand queries
- [ ] Knockout bracket view
- [ ] Unit tests for helper functions

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
