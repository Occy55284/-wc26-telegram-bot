export default async function handler(req, res) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.CHAT_ID;
  const footballKey = process.env.FOOTBALL_KEY;

  const FLAGS = {
    // South America
    "Argentina": "🇦🇷", "Brazil": "🇧🇷", "Colombia": "🇨🇴",
    "Ecuador": "🇪🇨", "Uruguay": "🇺🇾", "Venezuela": "🇻🇪",
    "Paraguay": "🇵🇾", "Chile": "🇨🇱", "Peru": "🇵🇪", "Bolivia": "🇧🇴",
    // CONCACAF
    "USA": "🇺🇸", "Mexico": "🇲🇽", "Canada": "🇨🇦",
    "Panama": "🇵🇦", "Honduras": "🇭🇳", "Costa Rica": "🇨🇷",
    "Jamaica": "🇯🇲", "El Salvador": "🇸🇻", "Guatemala": "🇬🇹",
    // Europe
    "France": "🇫🇷", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Spain": "🇪🇸",
    "Germany": "🇩🇪", "Portugal": "🇵🇹", "Netherlands": "🇳🇱",
    "Belgium": "🇧🇪", "Croatia": "🇭🇷", "Serbia": "🇷🇸",
    "Switzerland": "🇨🇭", "Poland": "🇵🇱", "Austria": "🇦🇹",
    "Denmark": "🇩🇰", "Turkey": "🇹🇷", "Türkiye": "🇹🇷",
    "Czech Republic": "🇨🇿", "Czechia": "🇨🇿",
    "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Italy": "🇮🇹", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    "Ukraine": "🇺🇦", "Hungary": "🇭🇺", "Slovakia": "🇸🇰",
    "Romania": "🇷🇴", "Slovenia": "🇸🇮", "Albania": "🇦🇱",
    "Greece": "🇬🇷", "Norway": "🇳🇴", "Sweden": "🇸🇪",
    "Finland": "🇫🇮", "Iceland": "🇮🇸", "Russia": "🇷🇺",
    "Georgia": "🇬🇪",
    // Africa
    "Morocco": "🇲🇦", "Senegal": "🇸🇳", "Nigeria": "🇳🇬",
    "Ghana": "🇬🇭", "Cameroon": "🇨🇲", "Egypt": "🇪🇬",
    "Tunisia": "🇹🇳", "South Africa": "🇿🇦", "Algeria": "🇩🇿",
    "Mali": "🇲🇱", "Ivory Coast": "🇨🇮", "Côte d'Ivoire": "🇨🇮",
    "DR Congo": "🇨🇩", "Cape Verde": "🇨🇻", "Comoros": "🇰🇲",
    "Tanzania": "🇹🇿", "Uganda": "🇺🇬", "Guinea": "🇬🇳",
    "Zambia": "🇿🇲", "Angola": "🇦🇴",
    // Asia
    "Japan": "🇯🇵", "South Korea": "🇰🇷", "Saudi Arabia": "🇸🇦",
    "Iran": "🇮🇷", "Australia": "🇦🇺", "Qatar": "🇶🇦",
    "Uzbekistan": "🇺🇿", "Jordan": "🇯🇴", "Iraq": "🇮🇶",
    "UAE": "🇦🇪", "China PR": "🇨🇳", "China": "🇨🇳",
    "Indonesia": "🇮🇩", "Bahrain": "🇧🇭", "Kyrgyzstan": "🇰🇬",
    "Oman": "🇴🇲", "Kuwait": "🇰🇼",
    // Oceania
    "New Zealand": "🇳🇿",
  };

  function getFlag(name) {
    return FLAGS[name] || "🏳️";
  }

  function toUKTime(utcDate) {
    return new Date(utcDate).toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
    });
  }

  function stageLabel(match) {
    const stageMap = {
      "GROUP_STAGE": match.group ? "Group " + match.group.replace("GROUP_", "") : "Group Stage",
      "LAST_16": "Round of 16",
      "QUARTER_FINALS": "Quarter-Final",
      "SEMI_FINALS": "Semi-Final",
      "THIRD_PLACE": "3rd Place Play-off",
      "FINAL": "Final",
    };
    return stageMap[match.stage] || (match.stage || "").replace(/_/g, " ");
  }

  function scoreDetail(match) {
    const { fullTime: ft, halfTime: ht, extraTime: et, penalties: pen, duration } = match.score;
    let s = `${ft.home ?? "-"} - ${ft.away ?? "-"}`;
    if (ht?.home !== null && ht?.home !== undefined && ht?.away !== null) {
      s += ` (HT: ${ht.home}-${ht.away})`;
    }
    if (duration === "EXTRA_TIME") s += " AET";
    if (duration === "PENALTY_SHOOTOUT" && pen?.home !== null && pen?.home !== undefined) {
      s += ` (Pens: ${pen.home}-${pen.away})`;
    }
    return s;
  }

  async function send(text) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    if (!r.ok) console.error("Telegram send failed:", await r.text());
  }

  async function fetchJson(url, options) {
    const r = await fetch(url, options);
    if (!r.ok) {
      console.error(`HTTP ${r.status} fetching ${url}`);
      return null;
    }
    return r.json();
  }

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

    await send(msg1);

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
      await send(msg2);
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
      await send(msg3);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("notify handler error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
