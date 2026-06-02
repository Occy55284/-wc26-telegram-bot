export default async function handler(req, res) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.CHAT_ID;
  const footballKey = process.env.FOOTBALL_KEY;

  // Fetch World Cup fixtures
  const response = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=SCHEDULED",
    {
      headers: { "X-Auth-Token": footballKey },
    }
  );

  const data = await response.json();

  // Grab just the first 5 fixtures
  const matches = data.matches?.slice(0, 5) || [];

  let message = "🏆 Upcoming World Cup Fixtures:\n\n";

  if (matches.length === 0) {
    message += "No fixtures found yet!";
  } else {
    matches.forEach((match) => {
      const date = new Date(match.utcDate).toDateString();
      message += `📅 ${date}\n`;
      message += `⚽ ${match.homeTeam.name} vs ${match.awayTeam.name}\n\n`;
    });
  }

  // Send to Telegram
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });

  res.status(200).json({ ok: true, message });
}
