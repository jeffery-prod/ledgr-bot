import { InlineKeyboard } from 'grammy';

export const categoryKeyboard = new InlineKeyboard()
  .text('Alcohol', 'cat_alcohol').text('Clothing', 'cat_clothing').row()
  .text('Education', 'cat_education').text('Electric', 'cat_electric').row()
  .text('Electronics', 'cat_electronics').text('Entertainment', 'cat_entertainment').row()
  .text('Food', 'cat_food').text('Gas/Fuel', 'cat_gas').row()
  .text('Gifts', 'cat_gifts').text('Groceries', 'cat_groceries').row()
  .text('Gym', 'cat_gym').text('Health', 'cat_health').row()
  .text('Insurance', 'cat_insurance').text('Internet', 'cat_internet').row()
  .text('Maintenance', 'cat_maintenance').text('Medical', 'cat_medical').row()
  .text('Other', 'cat_other').text('Parking', 'cat_parking').row()
  .text('Personal Care', 'cat_personal_care').text('Phone', 'cat_phone').row()
  .text('Public Transit', 'cat_public_transit').text('Rent', 'cat_rent').row()
  .text('Rideshare', 'cat_rideshare').text('Shopping', 'cat_shopping').row()
  .text('Taxes', 'cat_taxes').text('Travel', 'cat_travel').row()
  .text('Water', 'cat_water').row()
  .text('Cancel', 'cancel');
