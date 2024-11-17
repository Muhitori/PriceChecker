import { Markup, Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';

import {
  postDataToGoogleSheet,
  setupTable,
} from './services/postDataToGoogleSheet';
import { namesToArticles } from './services/namesToArticles';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);
let lastData = {};

bot.command('setup', async (ctx) => {
  try {
    await setupTable();
    ctx.reply(
      'Таблица готова к использованию, перешлите сообщение с ценами для парсинга.',
    );
  } catch (error) {
    ctx.reply('Error while setup table');
  }
});

bot.command('start', async (ctx) => {
  ctx.reply(
    'Если таблица новая или меняли таблицу испульзуй /setup. В остальных случаях просто форварди сообщение с ценами.',
  );
});

bot.on('message', async (ctx) => {
  try {
    if (ctx.message && 'text' in ctx.message) {
      lastData = namesToArticles(JSON.parse(ctx.message.text));
      await ctx.reply(JSON.stringify(lastData));

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
    if (Object.keys(lastData).length) {
      await postDataToGoogleSheet(lastData);
      lastData = {};
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
