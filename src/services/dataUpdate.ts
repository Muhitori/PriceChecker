import { convertDataFromStringToArray } from './convertDataFromStringToArray';
import { getDataFromGoogleSheet } from './getDataFromGoogleSheet';
import { parseMessage } from './parseMesssage';

export const dataUpdate = async (dataFromUser: string) => {
  let dataFromUserMsg: any = parseMessage(dataFromUser);
  let dataToUpdate: [string, string][] = [];
  const dataFromSheet: string[][] = convertDataFromStringToArray(
    await getDataFromGoogleSheet(),
  );
  if (!dataFromSheet) {
    return parseMessage(dataFromUser);
  } else {
    const seenNames = new Set<string>();

    // Создаем словарь из dataFromUser для быстрой проверки по названию
    const userMap = new Map<string, string>(dataFromUserMsg);

    // Обрабатываем каждый элемент из dataFromSheet
    for (const [sheetName, sheetPrice] of dataFromSheet) {
      if (userMap.has(sheetName)) {
        const userPrice = userMap.get(sheetName)!;
        // Если цены не совпадают, добавляем элемент с ценой из dataFromUser
        if (sheetPrice !== userPrice) {
          dataToUpdate.push([sheetName, userPrice]);
        } else {
          dataToUpdate.push([sheetName, sheetPrice]); // Если совпадают, добавляем из dataFromSheet
        }
        seenNames.add(sheetName);
      } else {
        // Если совпадений нет, добавляем элемент из dataFromSheet
        dataToUpdate.push([sheetName, sheetPrice]);
      }
    }

    // Добавляем оставшиеся уникальные элементы из dataFromUser
    for (const [userName, userPrice] of dataFromUserMsg) {
      if (!seenNames.has(userName)) {
        dataToUpdate.push([userName, userPrice]);
      }
    }

    return dataToUpdate;
  }
};
