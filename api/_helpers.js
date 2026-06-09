export const FLAGS = {
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

export function getFlag(name) {
  return FLAGS[name] || "🏳️";
}

export function toUKTime(utcDate) {
  return new Date(utcDate).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
  });
}

export function stageLabel(match) {
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

export function scoreDetail(match) {
  const { fullTime: ft, halfTime: ht, penalties: pen, duration } = match.score;
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

export async function fetchJson(url, options) {
  const r = await fetch(url, options);
  if (!r.ok) {
    console.error(`HTTP ${r.status} fetching ${url}`);
    return null;
  }
  return r.json();
}

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function sendMessage(token, chatId, text) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  if (!r.ok) console.error("Telegram send failed:", await r.text());
}
