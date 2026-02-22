import { InlineKeyboard } from 'grammy';
import { CATEGORY_LABELS as L } from '../constants/labels';

export const categoryKeyboard = new InlineKeyboard()
  .text(L.cat_alcohol, 'cat_alcohol').text(L.cat_clothing, 'cat_clothing').row()
  .text(L.cat_education, 'cat_education').text(L.cat_electric, 'cat_electric').row()
  .text(L.cat_electronics, 'cat_electronics').text(L.cat_entertainment, 'cat_entertainment').row()
  .text(L.cat_food, 'cat_food').text(L.cat_gas, 'cat_gas').row()
  .text(L.cat_gifts, 'cat_gifts').text(L.cat_groceries, 'cat_groceries').row()
  .text(L.cat_gym, 'cat_gym').text(L.cat_health, 'cat_health').row()
  .text(L.cat_insurance, 'cat_insurance').text(L.cat_internet, 'cat_internet').row()
  .text(L.cat_maintenance, 'cat_maintenance').text(L.cat_medical, 'cat_medical').row()
  .text(L.cat_other, 'cat_other').text(L.cat_parking, 'cat_parking').row()
  .text(L.cat_personal_care, 'cat_personal_care').text(L.cat_phone, 'cat_phone').row()
  .text(L.cat_public_transit, 'cat_public_transit').text(L.cat_rent, 'cat_rent').row()
  .text(L.cat_rideshare, 'cat_rideshare').text(L.cat_shopping, 'cat_shopping').row()
  .text(L.cat_taxes, 'cat_taxes').text(L.cat_travel, 'cat_travel').row()
  .text(L.cat_water, 'cat_water').row()
  .text('Cancel', 'cancel');
