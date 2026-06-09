// To register this webhook with Telegram, visit once in your browser:
// https://<your-vercel-domain>/api/setup-webhook
//
// Commands: /today  /results  /next  /live  /standings  /group <A-L>  /scorers  /team <name>  /help

import { getFlag, toUKTime, stageLabel, scoreDetail, ordinal, fetchJson, sendMessage } from "./_helpers.js";

const BASE = "https://api.football-data.org/v4/competitions/WC";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { message } = req.body ?? {};
  if (!message?.text) return res.status(200).end();

  const token = process.env.TELEGRAM_TOKEN;
  const footballKey = process.env.FOOTBALL_KEY;
  const chatId = message.chat.id;
  const hdrs = { "X-Auth-Token": footballKey };

  // Split command from arguments: "/team England" → cmd="/team", args="England"
  const fullText = message.text.split("@")[0].trim();
  const [rawCmd, ...argParts] = fullText.split(" ");
  const cmd = rawCmd.toLowerCase();
  const args = argParts.join(" ").trim();

  try {
    if (cmd === "/today" || cmd === "/fixtures") {
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

    } else if (cmd === "/results" || cmd === "/yesterday") {
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

    } else if (cmd === "/next") {
      const today = new Date();
      const future = new Date(today);
      future.setDate(today.getDate() + 7);
      const todayStr = today.toISOString().split("T")[0];
      const futureStr = future.toISOString().split("T")[0];
      const data = await fetchJson(`${BASE}/matches?dateFrom=${todayStr}&dateTo=${futureStr}`, { headers: hdrs });
      const scheduled = (data?.matches ?? []).filter(m => m.status === "SCHEDULED" || m.status === "TIMED");
      if (scheduled.length === 0) {
        await sendMessage(token, chatId, "📅 No upcoming matches in the next 7 days.");
      } else {
        // Group by date, show only the first (nearest) match day
        const byDate = {};
        for (const m of scheduled) {
          const d = m.utcDate.split("T")[0];
          if (!byDate[d]) byDate[d] = [];
          byDate[d].push(m);
        }
        const firstDate = Object.keys(byDate).sort()[0];
        const label = new Date(firstDate + "T12:00:00Z").toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long",
        });
        let msg = `📅 *Next Fixtures — ${label}*\n\n`;
        for (const m of byDate[firstDate]) {
          const home = m.homeTeam.name;
          const away = m.awayTeam.name;
          msg += `${getFlag(home)} ${home} vs ${away} ${getFlag(away)}\n`;
          msg += `_🕐 ${toUKTime(m.utcDate)} UK  •  ${stageLabel(m)}`;
          if (m.venue) msg += `  •  📍 ${m.venue}`;
          msg += "_\n\n";
        }
        await sendMessage(token, chatId, msg);
      }

    } else if (cmd === "/live") {
      const todayStr = new Date().toISOString().split("T")[0];
      const data = await fetchJson(`${BASE}/matches?dateFrom=${todayStr}&dateTo=${todayStr}`, { headers: hdrs });
      const liveStatuses = ["IN_PLAY", "PAUSED", "HALF_TIME", "EXTRA_TIME", "PENALTY_SHOOTOUT"];
      const matches = (data?.matches ?? []).filter(m => liveStatuses.includes(m.status));
      if (matches.length === 0) {
        await sendMessage(token, chatId, "📡 No matches live right now.");
      } else {
        const statusLabel = {
          "IN_PLAY": "▶️ Live",
          "PAUSED": "⏸ Paused",
          "HALF_TIME": "⏱ Half Time",
          "EXTRA_TIME": "▶️ Extra Time",
          "PENALTY_SHOOTOUT": "🥅 Penalties",
        };
        let msg = "📡 *Live Now*\n\n";
        for (const m of matches) {
          const home = m.homeTeam.name;
          const away = m.awayTeam.name;
          const ft = m.score.fullTime;
          const score = `${ft.home ?? "-"} - ${ft.away ?? "-"}`;
          msg += `${getFlag(home)} ${home}  *${score}*  ${away} ${getFlag(away)}\n`;
          msg += `_${statusLabel[m.status] || m.status}  •  ${stageLabel(m)}`;
          if (m.venue) msg += `  •  📍 ${m.venue}`;
          msg += "_\n\n";
        }
        await sendMessage(token, chatId, msg);
      }

    } else if (cmd === "/standings") {
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

    } else if (cmd === "/group") {
      const groupArg = args.toUpperCase().replace(/^GROUP\s*/, "").trim();
      if (!groupArg) {
        await sendMessage(token, chatId, "❓ Please specify a group, e.g. /group A");
      } else {
        const data = await fetchJson(`${BASE}/standings`, { headers: hdrs });
        const groups = (data?.standings ?? []).filter(s => s.type === "TOTAL");
        const group = groups.find(g => g.group === `GROUP_${groupArg}`);
        if (!group) {
          await sendMessage(token, chatId, `❓ Group "${groupArg}" not found. Try /group A through /group L`);
        } else {
          const gName = group.group.replace("GROUP_", "Group ");
          let msg = `📋 *${gName} Standings*\n\n`;
          for (const r of group.table) {
            const gd = r.goalDifference >= 0 ? `+${r.goalDifference}` : `${r.goalDifference}`;
            const name = r.team.shortName || r.team.name;
            msg += `${r.position}. ${getFlag(r.team.name)} ${name}  `;
            msg += `${r.won}-${r.draw}-${r.lost}  GD${gd}  *${r.points}pts*\n`;
          }
          await sendMessage(token, chatId, msg);
        }
      }

    } else if (cmd === "/scorers") {
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

    } else if (cmd === "/team") {
      if (!args) {
        await sendMessage(token, chatId, "❓ Please specify a team, e.g. /team England");
      } else {
        const query = args.toLowerCase();
        const teamMatch = name => name.toLowerCase().includes(query);

        const today = new Date();
        const past = new Date(today); past.setDate(today.getDate() - 30);
        const future = new Date(today); future.setDate(today.getDate() + 30);
        const todayStr = today.toISOString().split("T")[0];
        const pastStr = past.toISOString().split("T")[0];
        const futureStr = future.toISOString().split("T")[0];

        const [pastData, futureData, standingsData] = await Promise.all([
          fetchJson(`${BASE}/matches?dateFrom=${pastStr}&dateTo=${todayStr}`, { headers: hdrs }),
          fetchJson(`${BASE}/matches?dateFrom=${todayStr}&dateTo=${futureStr}`, { headers: hdrs }),
          fetchJson(`${BASE}/standings`, { headers: hdrs }),
        ]);

        const lastResult = (pastData?.matches ?? [])
          .filter(m => m.status === "FINISHED" && (teamMatch(m.homeTeam.name) || teamMatch(m.awayTeam.name)))
          .at(-1);

        const nextFixture = (futureData?.matches ?? [])
          .find(m => (m.status === "SCHEDULED" || m.status === "TIMED") && (teamMatch(m.homeTeam.name) || teamMatch(m.awayTeam.name)));

        let teamRow = null, groupName = null, teamName = null;
        for (const group of (standingsData?.standings ?? []).filter(s => s.type === "TOTAL")) {
          const row = group.table.find(r => teamMatch(r.team.name));
          if (row) {
            teamRow = row;
            groupName = group.group.replace("GROUP_", "Group ");
            teamName = row.team.name;
            break;
          }
        }

        if (!teamRow && !lastResult && !nextFixture) {
          await sendMessage(token, chatId, `❓ Couldn't find a team matching "${args}"`);
        } else {
          const displayName = teamName
            || (lastResult && (teamMatch(lastResult.homeTeam.name) ? lastResult.homeTeam.name : lastResult.awayTeam.name))
            || args;

          let msg = `${getFlag(displayName)} *${displayName}*\n\n`;

          if (teamRow) {
            const gd = teamRow.goalDifference >= 0 ? `+${teamRow.goalDifference}` : `${teamRow.goalDifference}`;
            msg += `📋 *${groupName}* — ${ordinal(teamRow.position)} place\n`;
            msg += `${teamRow.won}-${teamRow.draw}-${teamRow.lost}  GD${gd}  *${teamRow.points}pts*\n\n`;
          }

          if (lastResult) {
            const home = lastResult.homeTeam.name;
            const away = lastResult.awayTeam.name;
            msg += `📊 *Last Result*\n${getFlag(home)} ${home}  ${scoreDetail(lastResult)}  ${away} ${getFlag(away)}\n`;
            msg += `_${stageLabel(lastResult)}_\n\n`;
          }

          if (nextFixture) {
            const home = nextFixture.homeTeam.name;
            const away = nextFixture.awayTeam.name;
            msg += `📅 *Next Match*\n${getFlag(home)} ${home} vs ${away} ${getFlag(away)}\n`;
            msg += `_🕐 ${toUKTime(nextFixture.utcDate)} UK  •  ${stageLabel(nextFixture)}`;
            if (nextFixture.venue) msg += `  •  📍 ${nextFixture.venue}`;
            msg += "_\n";
          }

          await sendMessage(token, chatId, msg);
        }
      }

    } else if (cmd === "/help" || cmd === "/start") {
      const help =
        "🏆 *WC26 Bot Commands*\n\n" +
        "/today — today's fixtures\n" +
        "/results — yesterday's results\n" +
        "/next — next upcoming match day\n" +
        "/live — matches in progress right now\n" +
        "/standings — all group standings\n" +
        "/group A — single group standings (A–L)\n" +
        "/scorers — top 10 scorers\n" +
        "/team England — a team's result, next match & standing\n\n" +
        "_Daily updates sent at 08:00 UK · Evening reminder at 18:00 UK_";
      await sendMessage(token, chatId, help);
    }
    // Unknown commands silently ignored

  } catch (err) {
    console.error("webhook handler error:", err);
  }

  res.status(200).end();
}
