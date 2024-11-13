import { Markup, Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';

import { FmtString } from 'telegraf/typings/format';
import { about } from './commands';
import { dataUpdate } from './services/dataUpdate';
import { getDataFromGoogleSheet } from './services/getDataFromGoogleSheet';
import { postDataToGoogleSheet } from './services/postDataToGoogleSheet';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);
const userMessages = new Map<number, string>();
bot.command('about', about());
let message = '';

bot.on('message', async (ctx) => {
  try {
    const chatId = ctx.message.chat.id;

    if (ctx.message && 'text' in ctx.message) {
      message = ctx.message.text;
      userMessages.set(chatId, message);
      await ctx.reply(message as string | FmtString<string>);
      await ctx.replyWithHTML(
        'Если все ок, нажимай кнопку ниже',
        Markup.inlineKeyboard([
          [Markup.button.callback('Подтвердить', 'btn_accept')],
        ]),
      );
    }
  } catch (err) {
    console.error(err);
  }
});
bot.action('btn_accept', async (ctx) => {
  try {
    const chatId = ctx.chat?.id;
    if (chatId) {
      // Retrieve the message from the cache
      const message = userMessages.get(chatId);
      const dataFromSheet = await getDataFromGoogleSheet();
      if (message) {
        // dataUpdate(dataFromSheet, message);
        await postDataToGoogleSheet(message);
        userMessages.delete(chatId); // Clean up the cache if necessary
      }
    }
  } catch (err) {
    console.error(err);
  }
});
//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};
//dev mode
ENVIRONMENT !== 'production' && development(bot);
