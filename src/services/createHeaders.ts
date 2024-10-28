import { HEADERS, RANGE, SHEETS } from '../constants/constants';

import { SHEET_ID } from '../constants/environment';

export const createHeaders = async () => {
  const headerResponse = await SHEETS.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
    // If no headers exist, add them
    await SHEETS.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: HEADERS,
      },
    });
    console.log('Headers added to Google Sheets.');
  } else {
    console.log('Headers already exist in Google Sheets.');
  }
};
