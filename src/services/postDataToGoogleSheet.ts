import { SHEET_ID } from '../constants/environment';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { auth } from './auth';
import axios from 'axios';

import * as devices from '../../devices.json';

const NAME_COLUMN = 'Артикул';
const PRICE_COLUMN = 'Цена';

const batchUpdate = async (data: unknown) => {
  const response = await axios.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`,
    data,
    {
      headers: {
        Authorization: `Bearer ${auth?.gtoken?.accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return response;
};

const autoResize = async (sheetId: string | number) => {
  const resizeRequest = {
    requests: [
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 2,
          },
        },
      },
    ],
  };

  await batchUpdate(resizeRequest);
};

export const setupTable = async () => {
  try {
    const doc = new GoogleSpreadsheet(SHEET_ID!, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    const sheetId = sheet.sheetId;
    await sheet.clear();

    await sheet.setHeaderRow([NAME_COLUMN, PRICE_COLUMN]);

    const rows = Object.keys(devices).map((device) => ({
      [NAME_COLUMN]: device,
      [PRICE_COLUMN]: 0,
    }));

    await sheet.addRows(rows);

    await autoResize(sheetId);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error posting data to Google Sheet:', error.message);
    } else {
      console.error('An unknown error occurred.');
    }
  }
};

export const postDataToGoogleSheet = async (data: Record<string, string>) => {
  try {
    const doc = new GoogleSpreadsheet(SHEET_ID!, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    for (const row of rows) {
      Object.entries(data).forEach(([name, price]) => {
        if (row.get(NAME_COLUMN) === name) {
          row.set(PRICE_COLUMN, price);
          row.save();
        }
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error posting data to Google Sheet:', error.message);
    } else {
      console.error('An unknown error occurred.');
    }
  }
};
