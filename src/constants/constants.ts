import { auth } from '../services/auth';
import { google } from 'googleapis';

export const SHEETS = google.sheets({ version: 'v4', auth });
export const RANGE = 'Sheet2!B1:C1';
export const HEADERS = [['Articul', 'Price']];
