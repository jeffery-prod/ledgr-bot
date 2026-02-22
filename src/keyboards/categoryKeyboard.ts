import { InlineKeyboard } from 'grammy';

export const categoryKeyboard = new InlineKeyboard()
  .text('Alcohol', 'cat_alcohol').text('Clothing', 'cat_clothing').row()
  .text('Debt', 'cat_debt').text('Education', 'cat_education').row()
  .text('Electric', 'cat_electric').text('Electronics', 'cat_electronics').row()
  .text('Entertainment', 'cat_entertainment').text('Food', 'cat_food').row()
  .text('Gas/Fuel', 'cat_gas').text('Gifts', 'cat_gifts').row()
  .text('Groceries', 'cat_groceries').text('Gym', 'cat_gym').row()
  .text('Health', 'cat_health').text('Insurance', 'cat_insurance').row()
  .text('Internet', 'cat_internet').text('Maintenance', 'cat_maintenance').row()
  .text('Medical', 'cat_medical').text('Other', 'cat_other').row()
  .text('Parking', 'cat_parking').text('Personal Care', 'cat_personal_care').row()
  .text('Phone', 'cat_phone').text('Public Transit', 'cat_public_transit').row()
  .text('Rent', 'cat_rent').text('Rideshare', 'cat_rideshare').row()
  .text('Savings', 'cat_savings').text('Shopping', 'cat_shopping').row()
  .text('Taxes', 'cat_taxes').text('Travel', 'cat_travel').row()
  .text('Water', 'cat_water').row()
  .text('Cancel', 'cancel');
