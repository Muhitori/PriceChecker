import { API_KEY, SHEET_ID } from '../constants/environment';

import axios from 'axios';

const getDataFromGoogleSheet = async () => {
  const response = await axios.get(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet2!B2:C19`,
    { params: { key: API_KEY } },
  );
  return response.data.values;
};

export { getDataFromGoogleSheet };
