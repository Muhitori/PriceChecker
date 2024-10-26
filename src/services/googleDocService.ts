import { GOOGLE_PRIVATE_KEY, SHEET_ID } from '../constants/environment';

const postDataToGoogleSheet = async () => {
  const range = 'Sheet2!B2:C2';

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const requestBody = {
    range: range,
    majorDimension: 'ROWS',
    values: [['Hello', 'World']],
  };
  console.log(SHEET_ID);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GOOGLE_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();
  console.log(result);
};
postDataToGoogleSheet();
export { postDataToGoogleSheet };
