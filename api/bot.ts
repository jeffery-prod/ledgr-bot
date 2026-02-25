import { webhookCallback } from 'grammy';
import { bot } from '../src/bot/index';
import type { IncomingMessage, ServerResponse } from 'http';

const SECRET_TOKEN = process.env.SECRET_TOKEN;

const handler = webhookCallback(bot, 'http');

export default async function (req: IncomingMessage, res: ServerResponse) {
  const incoming = req.headers['x-telegram-bot-api-secret-token'];

  if (!SECRET_TOKEN || incoming !== SECRET_TOKEN) {
    res.statusCode = 401;
    res.end('Unauthorized');
    return;
  }

  return handler(req, res);
}
