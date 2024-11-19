import { Markup, Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';
import OpenAI from 'openai';

import {
  postDataToGoogleSheet,
  setupTable,
} from './services/postDataToGoogleSheet';

import { SHEET_ID } from './constants/environment';
import { getDevices } from './services/getDevices';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ACCURACY = process.env.ACCURACY || '';
const MAX_MESSAGE_LENGTH = 4096;

const bot = new Telegraf(BOT_TOKEN);
const client = new OpenAI({
  apiKey: OPENAI_API_KEY, // This is the default and can be omitted
});

let lastData: Record<string, string> = {};

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
    ctx.reply('Проверяю артикулы...');
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
    ctx.reply('Проверяю артикулы...');
    const articles: string[] = await getDevices();

    if (!articles.length) {
      ctx.reply('Ошибка чтения артикулов.');
      return;
    }

    if (ctx.message && 'text' in ctx.message) {
      ctx.reply('Обработка данных...');

      // const prompt = `I am sending you a message that contains devices and their prices ${ctx.message.text}, as well as a list of my device names ${articles.join(',')}. Please match the device price with my device name and return them in JSON format: {deviceName: price}. Consider devices to be the same if their names match at least ${ACCURACY}% in lowercase (keep in mind that, for example, “15 256” and “13 256” are different devices and should not overwrite each other’s keys). Return the result only in JSON format. Without formatting. Without nesting, just {device: price}. Ignore a device if its price cannot be parsed. Only return devices with a price. Ignore devices with null and unknown prices. Return result without markup. You are not allowed to change any of my device names, that i provided you as list.`;

      const prompt = `Я отправляю тебе сообщение, которое содержит устройства и их цены ${ctx.message.text}, а также список названий моих устройств ${articles.join(',')}.
  1.  Сопоставь каждое устройство из моего списка с устройствами из прайса, учитывая:
  •  Модель устройства (например, “iPhone 13”).
  •  Объем памяти (например, “256”).
  •  Цвет (например, “midnight” и “Black” должны трактоваться как одно и то же).
  •  Игнорируй дополнительные слова вроде “gb”, если их нет в прайсе.
  2.  Считай устройства одинаковыми, если их названия совпадают хотя бы на ${ACCURACY}% в нижнем регистре, с учетом ключевых параметров.
  3.  На выходе артикулы должны точно соответствовать формату из ${articles.join(',')}. Названия устройств в JSON-ответе не должны отличаться от моего списка.
  4.  Возвращай только те устройства, которые удалось сопоставить. Если цену устройства невозможно разобрать, игнорируй его.
  5.  Результат верни в формате JSON: {deviceName: price}. Без оформления, без вложенности, просто {device: price}.
  6.  Игнорируй устройства с null или неизвестными ценами.
  7.  Верни результат чистым JSON, без дополнительной разметки типа \`\`\`json ... \`\`\`. 

Пример:
Если в прайсе: iPhone 13 256 midnight - 60000, а в моем списке: iPhone 13 256 gb Black, результат должен быть:
{"iPhone 13 256 gb Black": 60000}`;

      const chatCompletion = await client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gpt-4o',
      });

      if (!chatCompletion.choices[0].message.content) {
        await ctx.reply('Совпадений не найдено.');
        return;
      }

      lastData = JSON.parse(chatCompletion.choices[0].message.content);

      for (const key of Object.keys(lastData)) {
        if (!lastData[key]) {
          delete lastData[key];
        }
      }

      const userResponse = Object.entries(lastData)
        .map(([name, price]) => `<u>${name}</u>: <b>${price}</b>`)
        .join('\n');

      await sendInChunks(ctx, userResponse);
      await ctx.replyWithHTML(
        'Если все ок, нажимай кнопку ниже',
        Markup.inlineKeyboard([
          [Markup.button.callback('Подтвердить', 'btn_accept')],
        ]),
      );
    }
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
