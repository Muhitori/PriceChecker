import { SHEET_ID } from '../constants/environment';
import { auth } from './auth';
import axios from 'axios';
import { createHeaders } from './createHeaders';
import { dataUpdate } from './dataUpdate';

const postDataToGoogleSheet = async (message: string) => {
  const data = await dataUpdate(message);
  // Create headers for the API request
  await createHeaders();

  // Define the range and request body
  const range = 'Sheet2!B2:C2';
  const requestBody = {
    range,
    majorDimension: 'ROWS',
    values: data.map((value) => value),
  };
  // Make the POST request using axios
  try {
    const response = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${auth.gtoken?.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error posting data to Google Sheet:', error.message);
    } else {
      console.error('An unknown error occurred.');
    }
  }
};

export { postDataToGoogleSheet };
