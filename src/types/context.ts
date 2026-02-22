import { Context } from 'grammy';
import { ConversationFlavor } from '@grammyjs/conversations';

export type MyContext = Context & ConversationFlavor<Context>;
