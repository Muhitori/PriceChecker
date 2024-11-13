import * as dotenv from 'dotenv';

dotenv.config();
export const GOOGLE_SERVICE_ACCOUNT_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
export const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
export const SHEET_ID = process.env.SHEET_ID;
export const API_KEY = process.env.API_KEY;
