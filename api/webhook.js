// To register this webhook with Telegram, run once:
// curl "https://api.telegram.org/bot<TELEGRAM_TOKEN>/setWebhook?url=https://<your-vercel-domain>/api/webhook"
//
// Supported commands: /today  /results  /standings  /scorers  /help

import { getFlag, toUKTime, stageLabel, scoreDetail, fetchJson, sendMessage } from "./_helpers.js";

const BASE = "https://api.football-data.org/v4/competitions/WC";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { message } = req.body ?? {};
  if (!message?.text) return res.status(200).end();

  const token = process.env.TELEGRAM_TOKEN;
  const footballKey = process.env.FOOTBALL_KEY;
  const chatId = message.chat.id;
  const hdrs = { "X-Auth-Token": footballKey };

  // Strip @botname suffix Telegram appends in group chats
  const command = message.text.split("@")[0].toLowerCase().trim();

  try {
    if (command === "/today" || command === "/fixtures") {
      const todayStr = new Date().toISOString().split("T")[0];
      const data = await fetchJson(`${BASE}/matches?dateFrom=${todayStr}&dateTo=${todayStr}`, { headers: hdrs });
      const matches = data?.matches ?? [];

      if (matches.length === 0) {
        await sendMessage(token, chatId, "📅 No matches today.");
      } else {
        let msg = "📅 *Today's Fixtures*\n\n";
        for (const m of matches) {
          const home = m.homeTeam.name;
          const away = m.awayTeam.name;
          msg += `${getFlag(home)} ${home} vs ${away} ${getFlag(away)}\n`;
          msg += `_🕐 ${toUKTime(m.utcDate)} UK  •  ${stageLabel(m)}`;
          if (m.venue) msg += `  •  📍 ${m.venue}`;
          msg += "_\n\n";
        }
        await sendMessage(token, chatId, msg);
      }

    } else if (command === "/results" || command === "/yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split("T")[0];
      const data = await fetchJson(`${BASE}/matches?dateFrom=${dateStr}&dateTo=${dateStr}`, { headers: hdrs });
      const matches = data?.matches ?? [];

      if (matches.length === 0) {
        await sendMessage(token, chatId, "📊 No matches yesterday.");
      } else {
        let msg = "📊 *Yesterday's Results*\n\n";
        for (const m of matches) {
          const home = m.homeTeam.name;
          const away = m.awayTeam.name;
          msg += `${getFlag(home)} ${home}  ${scoreDetail(m)}  ${away} ${getFlag(away)}\n`;
          msg += `_${stageLabel(m)}`;
          if (m.venue) msg += `  •  📍 ${m.venue}`;
          msg += "_\n\n";
        }
        await sendMessage(token, chatId, msg);
      }

    } else if (command === "/standings") {
      const data = await fetchJson(`${BASE}/standings`, { headers: hdrs });
      const groups = (data?.standings ?? []).filter(s => s.type === "TOTAL");

      if (groups.length === 0) {
        await sendMessage(token, chatId, "📋 Standings not available yet.");
      } else {
        let msg = "📋 *Group Standings*\n\n";
        for (const group of groups) {
          const gName = group.group.replace("GROUP_", "Group ");
          msg += `*${gName}*\n`;
          for (const r of group.table) {
            const gd = r.goalDifference >= 0 ? `+${r.goalDifference}` : `${r.goalDifference}`;
            const name = r.team.shortName || r.team.name;
            msg += `${r.position}. ${getFlag(r.team.name)} ${name}  `;
            msg += `${r.won}-${r.draw}-${r.lost}  GD${gd}  *${r.points}pts*\n`;
          }
          msg += "\n";
        }
        await sendMessage(token, chatId, msg);
      }

    } else if (command === "/scorers") {
      const data = await fetchJson(`${BASE}/scorers?limit=10`, { headers: hdrs });
      const scorers = data?.scorers ?? [];

      if (scorers.length === 0) {
        await sendMessage(token, chatId, "🥅 No scorer data available yet.");
      } else {
        let msg = "🥅 *Top Scorers*\n\n";
        for (let i = 0; i < scorers.length; i++) {
          const s = scorers[i];
          msg += `${i + 1}. ${getFlag(s.team.name)} ${s.player.name} — ${s.goals} ⚽`;
          if (s.penalties) msg += ` (${s.penalties} pen)`;
          if (s.assists) msg += `  ${s.assists} 🅰️`;
          msg += "\n";
        }
        await sendMessage(token, chatId, msg);
      }

    } else if (command === "/help" || command === "/start") {
      const help =
        "🏆 *WC26 Bot Commands*\n\n" +
        "/today — today's fixtures\n" +
        "/results — yesterday's results\n" +
        "/standings — group standings\n" +
        "/scorers — top 10 scorers\n\n" +
        "_Daily updates are also sent automatically at 08:00 UK time._";
      await sendMessage(token, chatId, help);
    }
    // Unknown commands are silently ignored

  } catch (err) {
    console.error("webhook handler error:", err);
  }

  res.status(200).end();
}
