import Context from 'telegraf/typings/context';
import { SHEETS } from '../constants/constants';
import { SHEET_ID } from '../constants/environment';
import { createHeaders } from './createHeaders';
import { parseMessage } from './parseMesssage';

const postDataToGoogleSheet = async (ctx: Context) => {
  // const client = await auth.getClient();
  await createHeaders();
  if (ctx.message && 'text' in ctx.message) {
    const message = ctx.message.text;

    const range = 'Sheet2!B2:C2';

    const requestBody = {
      range,
      majorDimension: 'ROWS',
      values: parseMessage(message).map(
        (value) => value,
      ) as unknown as string[][],
    };
    const response = await SHEETS.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody,
    });
  }
};

export { postDataToGoogleSheet };
