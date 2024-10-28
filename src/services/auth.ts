import { google } from 'googleapis';

import path = require('path');

export const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../../price-checker-439411-944a58b29d6b.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
