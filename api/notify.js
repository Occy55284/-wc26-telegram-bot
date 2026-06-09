import { getFlag, toUKTime, stageLabel, scoreDetail, fetchJson, sendMessage } from "./_helpers.js";

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.CHAT_ID;
  const footballKey = process.env.FOOTBALL_KEY;

  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const hdrs = { "X-Auth-Token": footballKey };
    const base = "https://api.football-data.org/v4/competitions/WC";

    const [resultsData, fixturesData, standingsData, scorersData] = await Promise.all([
      fetchJson(`${base}/matches?dateFrom=${yesterdayStr}&dateTo=${yesterdayStr}`, { headers: hdrs }),
      fetchJson(`${base}/matches?dateFrom=${todayStr}&dateTo=${todayStr}`, { headers: hdrs }),
      fetchJson(`${base}/standings`, { headers: hdrs }),
      fetchJson(`${base}/scorers?limit=10`, { headers: hdrs }),
    ]);

    const results = resultsData?.matches ?? [];
    const fixtures = fixturesData?.matches ?? [];

    const dateLabel = today.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    // --- Message 1: Results + Fixtures ---
    let msg1 = `🏆 *World Cup 2026 — Daily Update*\n_${dateLabel}_\n\n`;

    if (results.length > 0) {
      msg1 += "📊 *Yesterday's Results*\n\n";
      for (const m of results) {
        const home = m.homeTeam.name;
        const away = m.awayTeam.name;
        msg1 += `${getFlag(home)} ${home}  ${scoreDetail(m)}  ${away} ${getFlag(away)}\n`;
        msg1 += `_${stageLabel(m)}`;
        if (m.venue) msg1 += `  •  📍 ${m.venue}`;
        msg1 += "_\n\n";
      }
    } else {
      msg1 += "📊 *Yesterday's Results*\nNo matches yesterday\n\n";
    }

    if (fixtures.length > 0) {
      msg1 += "📅 *Today's Fixtures*\n\n";
      for (const m of fixtures) {
        const home = m.homeTeam.name;
        const away = m.awayTeam.name;
        msg1 += `${getFlag(home)} ${home} vs ${away} ${getFlag(away)}\n`;
        msg1 += `_🕐 ${toUKTime(m.utcDate)} UK  •  ${stageLabel(m)}`;
        if (m.venue) msg1 += `  •  📍 ${m.venue}`;
        msg1 += "_\n\n";
      }
    } else {
      msg1 += "📅 *Today's Fixtures*\nNo matches today\n";
    }

    await sendMessage(token, chatId, msg1);

    // --- Message 2: Group Standings ---
    const groupStandings = (standingsData?.standings ?? []).filter(s => s.type === "TOTAL");
    if (groupStandings.length > 0) {
      let msg2 = "📋 *Group Standings*\n\n";
      for (const group of groupStandings) {
        const gName = group.group.replace("GROUP_", "Group ");
        msg2 += `*${gName}*\n`;
        for (const r of group.table) {
          const gd = r.goalDifference >= 0 ? `+${r.goalDifference}` : `${r.goalDifference}`;
          const name = r.team.shortName || r.team.name;
          msg2 += `${r.position}. ${getFlag(r.team.name)} ${name}  `;
          msg2 += `${r.won}-${r.draw}-${r.lost}  GD${gd}  *${r.points}pts*\n`;
        }
        msg2 += "\n";
      }
      await sendMessage(token, chatId, msg2);
    }

    // --- Message 3: Top Scorers ---
    const scorers = scorersData?.scorers ?? [];
    if (scorers.length > 0) {
      let msg3 = "🥅 *Top Scorers*\n\n";
      for (let i = 0; i < scorers.length; i++) {
        const s = scorers[i];
        msg3 += `${i + 1}. ${getFlag(s.team.name)} ${s.player.name} — ${s.goals} ⚽`;
        if (s.penalties) msg3 += ` (${s.penalties} pen)`;
        if (s.assists) msg3 += `  ${s.assists} 🅰️`;
        msg3 += "\n";
      }
      await sendMessage(token, chatId, msg3);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("notify handler error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
