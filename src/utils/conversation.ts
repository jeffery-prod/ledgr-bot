import type { Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types/context';

type CallbackCtx = Awaited<ReturnType<Conversation<MyContext, MyContext>['waitForCallbackQuery']>>;

export async function waitOrCancel(
  conversation: Conversation<MyContext, MyContext>,
  pattern: Parameters<Conversation<MyContext, MyContext>['waitForCallbackQuery']>[0]
): Promise<CallbackCtx | null> {
  const ctx = await conversation.waitForCallbackQuery(pattern);
  await ctx.answerCallbackQuery();
  if (ctx.callbackQuery.data === 'cancel') {
    await ctx.editMessageText('Cancelled.');
    return null;
  }
  return ctx;
}
