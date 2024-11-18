import { Markup, Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';
import OpenAI from 'openai';

import {
  postDataToGoogleSheet,
  setupTable,
} from './services/postDataToGoogleSheet';

import * as fs from 'fs';
import * as path from 'path';
import { SHEET_ID } from './constants/environment';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ACCURACY = process.env.ACCURACY || '';
const MAX_MESSAGE_LENGTH = 4096;

const bot = new Telegraf(BOT_TOKEN);
const client = new OpenAI({
  apiKey: OPENAI_API_KEY, // This is the default and can be omitted
});

let lastData = {};

console.log(BOT_TOKEN, OPENAI_API_KEY, SHEET_ID);

async function sendInChunks(ctx: any, message: string) {
  let chunkStart = 0;

  while (chunkStart < message.length) {
    // Find the position to cut the message, ensuring it does not cut HTML tags
    let chunkEnd = chunkStart + MAX_MESSAGE_LENGTH;

    // If chunkEnd cuts in the middle of a tag, adjust it
    if (message[chunkEnd] === '<' && message[chunkEnd - 1] !== '>') {
      let openTagCount = 1;
      while (openTagCount > 0) {
        chunkEnd--;
        if (message[chunkEnd] === '>') openTagCount--;
        if (message[chunkEnd] === '<') openTagCount++;
      }
    }

    const chunk = message.slice(chunkStart, chunkEnd);
    await ctx.replyWithHTML(chunk); // Send the chunk with HTML formatting
    chunkStart = chunkEnd; // Move to the next chunk
  }
}

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
    const filePath = path.join(__dirname, 'articles.txt');
    let articles: string[] = [];

    console.log('start file reading');
    const data = fs.readFile(filePath, 'utf-8', async (err, data) => {
      if (err) {
        console.error('Error reading the file:', err);
        return;
      }

      articles = data.split('\n').map((row) => row.trim());

      console.log('articules parsing');
      if (!articles.length) {
        ctx.reply('Ошибка чтения артикулов.');
        return;
      }

      if (ctx.message && 'text' in ctx.message) {
        ctx.reply('Обработка данных...');

        console.log('before gpt');
        const chatCompletion = await client.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: `Im sending you message that contains devices and their prices ${ctx.message.text}, also im sending list of my device names ${articles.join(',')} please apply price of device to my device name and return them in json format {deviceName: price}. Count devices equal if their names at least ${ACCURACY}% compatible in lower case. Return result in json format only. Without markup. Without nesting, just plain {device: price}. Return valid json only. Ignore device if toy cant parse its value. Return only devices wit price. Ignore devices with null and unknown prices.`,
            },
          ],
          model: 'gpt-4o-mini',
        });
        console.log('after gpt');

        if (!chatCompletion.choices[0].message.content) {
          await ctx.reply('Совпадений не найдено.');
          return;
        }

        lastData = JSON.parse(chatCompletion.choices[0].message.content);

        console.log('data saved');
        const userResponse = Object.entries(lastData)
          .map(([name, price]) => `<u>${name}</u>: <b>${price}</b>`)
          .join('\n');

        console.log('after response');
        await sendInChunks(ctx, userResponse);
        await ctx.replyWithHTML(
          'Если все ок, нажимай кнопку ниже',
          Markup.inlineKeyboard([
            [Markup.button.callback('Подтвердить', 'btn_accept')],
          ]),
        );
      }
    });
  } catch (err) {
    ctx.reply('Ошибка');
    console.error(err);
  }
});

bot.action('btn_accept', async (ctx) => {
  try {
    if (Object.keys(lastData).length) {
      const sheetId = await postDataToGoogleSheet(lastData);
      lastData = {};

      ctx.reply(
        `Таблица обновлена. \n https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sheetId}`,
      );
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
