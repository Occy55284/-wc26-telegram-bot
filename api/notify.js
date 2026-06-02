export default async function handler(req, res) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.CHAT_ID;
  const message = "👋 Hello from your WC26 Bot! Setup is working!";

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
