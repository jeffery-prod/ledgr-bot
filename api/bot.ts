import { webhookCallback } from 'grammy';
import { bot } from '../src/bot/index';

export default webhookCallback(bot, 'http');
