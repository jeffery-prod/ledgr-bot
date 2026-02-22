import * as dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

fetch(`https://api.telegram.org/bot${token}/deleteWebhook`)
  .then(res => res.json())
  .then((data: any) => {
    if (data.ok) {
      console.log('Webhook deleted. Bot is now in polling mode.');
    } else {
      console.error('Failed to delete webhook:', data.description);
    }
  });
