import * as dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const vercelUrl = process.env.VERCEL_URL;
const secretToken = process.env.SECRET_TOKEN;

if (!token || !vercelUrl || !secretToken) {
  console.error('Missing TELEGRAM_BOT_TOKEN, VERCEL_URL, or SECRET_TOKEN in .env');
  process.exit(1);
}

const webhookUrl = `${vercelUrl}/api/bot`;

fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}&secret_token=${secretToken}`)
  .then(res => res.json())
  .then((data: any) => {
    if (data.ok) {
      console.log(`Webhook set to: ${webhookUrl}`);
    } else {
      console.error('Failed to set webhook:', data.description);
    }
  });
