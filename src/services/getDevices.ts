import { TXT_FILE_ID } from '../constants/environment';
import axios from 'axios';

export const getDevices = async () => {
  const googleDriveURL = `https://drive.google.com/uc?id=${TXT_FILE_ID}&export=download`;

  try {
    const { data } = await axios.get(googleDriveURL);

    const devices = data
      .split(/\r?\n/)
      .filter((line: string) => line.trim() !== '');

    return devices;
  } catch (error) {
    console.error('Error fetching or parsing the file:', error);
    return [];
  }
};
