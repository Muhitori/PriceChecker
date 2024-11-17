import * as devices from '../../devices.json';

export const namesToArticles = (names: Record<string, string>) =>
  Object.entries(names).reduce((acc, [name, price]) => {
    for (const [article, possibleNames] of Object.entries(devices)) {
      if (possibleNames.includes(name)) {
        return { ...acc, [article]: price };
      }
    }

    return acc;
  }, {});
