// Visit this URL once in your browser to register the webhook with Telegram:
// https://<your-vercel-domain>/api/setup-webhook

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_TOKEN;
  const host = req.headers.host;
  const webhookUrl = `https://${host}/api/webhook`;

  const r = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
  );
  const data = await r.json();

  if (data.ok) {
    res.status(200).send(`✅ Webhook registered: ${webhookUrl}`);
  } else {
    res.status(500).send(`❌ Failed: ${JSON.stringify(data)}`);
  }
}
