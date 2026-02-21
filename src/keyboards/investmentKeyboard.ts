import { InlineKeyboard } from 'grammy';

export const investmentKeyboard = new InlineKeyboard()
  .text('Fidelity Roth IRA', 'inv_roth_ira').row()
  .text('Fidelity Dividend Kings', 'inv_dividend_kings').row()
  .text('Fidelity Growth Monster', 'inv_growth_monster').row()
  .text('Cancel', 'cancel');
