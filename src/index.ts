import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';

import { Telegraf } from 'telegraf';
import { about } from './commands';
import { greeting } from './text';
import { postDataToGoogleSheet } from './services/googleDocService';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

bot.command('about', about());
// bot.on('message', greeting());
bot.on('message', async (ctx) => {
  if (ctx.message) {
    postDataToGoogleSheet();
  }
});

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};
//dev mode
ENVIRONMENT !== 'production' && development(bot);
