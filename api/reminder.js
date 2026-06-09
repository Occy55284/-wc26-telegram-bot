import { getFlag, toUKTime, stageLabel, fetchJson, sendMessage } from "./_helpers.js";

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.CHAT_ID;
  const footballKey = process.env.FOOTBALL_KEY;

  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const data = await fetchJson(
      `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${todayStr}&dateTo=${todayStr}`,
      { headers: { "X-Auth-Token": footballKey } }
    );

    const upcoming = (data?.matches ?? []).filter(
      m => (m.status === "SCHEDULED" || m.status === "TIMED") && new Date(m.utcDate) > now
    );

    if (upcoming.length === 0) return res.status(200).json({ ok: true, skipped: true });

    let msg = "⚽ *Tonight's Matches*\n\n";
    for (const m of upcoming) {
      const home = m.homeTeam.name;
      const away = m.awayTeam.name;
      msg += `${getFlag(home)} ${home} vs ${away} ${getFlag(away)}\n`;
      msg += `_🕐 ${toUKTime(m.utcDate)} UK  •  ${stageLabel(m)}`;
      if (m.venue) msg += `  •  📍 ${m.venue}`;
      msg += "_\n\n";
    }

    await sendMessage(token, chatId, msg);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("reminder handler error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
