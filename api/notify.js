export default async function handler(req, res) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.CHAT_ID;
  const footballKey = process.env.FOOTBALL_KEY;

  // Helper to get flag emoji from country name
  function getFlag(countryName) {
    const flags = {
      "Brazil": "🇧🇷", "Argentina": "🇦🇷", "France": "🇫🇷",
      "Germany": "🇩🇪", "Spain": "🇪🇸", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁧󠁢󠁥󠁮󠁧󠁧󠁢󠁥󠁮󠁧󠁿",
      "Portugal": "🇵🇹", "Netherlands": "🇳🇱", "Belgium": "🇧🇪",
      "Croatia": "🇭🇷", "Morocco": "🇲🇦", "Japan": "🇯🇵",
      "Senegal": "🇸🇳", "USA": "🇺🇸", "Mexico": "🇲🇽",
      "Australia": "🇦🇺", "South Korea": "🇰🇷", "Serbia": "🇷🇸",
      "Switzerland": "🇨🇭", "Poland": "🇵🇱", "Uruguay": "🇺🇾",
      "Colombia": "🇨🇴", "Ecuador": "🇪🇨", "Qatar": "🇶🇦",
      "Saudi Arabia": "🇸🇦", "Iran": "🇮🇷", "Tunisia": "🇹🇳",
      "Cameroon": "🇨🇲", "Ghana": "🇬🇭", "Costa Rica": "🇨🇷",
      "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Canada": "🇨🇦", "Italy": "🇮🇹",
    };
    return flags[countryName] || "🏳️";
  }

  // Helper to convert UTC to UK time
  function toUKTime(utcDate) {
    return new Date(utcDate).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
    });
  }

  // Get today and yesterday dates
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Fetch yesterday's results
  const resultsRes = await fetch(
    `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${yesterdayStr}&dateTo=${yesterdayStr}`,
    { headers: { "X-Auth-Token": footballKey } }
  );
  const resultsData = await resultsRes.json();

  // Fetch today's fixtures
  const fixturesRes = await fetch(
    `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${todayStr}&dateTo=${todayStr}`,
    { headers: { "X-Auth-Token": footballKey } }
  );
  const fixturesData = await fixturesRes.json();

  // Build message
  let message = "🏆 *World Cup Daily Update*\n\n";

  // Yesterday's results
  const results = resultsData.matches || [];
  if (results.length > 0) {
    message += "📊 *Yesterday's Results:*\n";
    results.forEach((match) => {
      const home = match.homeTeam.name;
      const away = match.awayTeam.name;
      const homeScore = match.score.fullTime.home ?? "-";
      const awayScore = match.score.fullTime.away ?? "-";
      message += `${getFlag(home)} ${home} ${homeScore} - ${awayScore} ${getFlag(away)} ${away}\n`;
    });
    message += "\n";
  } else {
    message += "📊 *Yesterday's Results:*\nNo matches played yesterday\n\n";
  }

  // Today's fixtures
  const fixtures = fixturesData.matches || [];
  if (fixtures.length > 0) {
    message += "📅 *Today's Fixtures:*\n";
    fixtures.forEach((match) => {
      const home = match.homeTeam.name;
      const away = match.awayTeam.name;
      const time = toUKTime(match.utcDate);
      const group = match.group ? `(${match.group}) ` : "";
      message += `⚽ ${getFlag(home)} ${home} vs ${away} ${getFlag(away)} ${group}- ${time}\n`;
    });
  } else {
    message += "📅 *Today's Fixtures:*\nNo matches today\n";
  }

  // Send to Telegram
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });

  res.status(200).json({ ok: true });
}
