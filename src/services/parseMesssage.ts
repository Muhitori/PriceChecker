export const parseMessage = (message: string): string[] => {
  const messageToObj = JSON.parse(message.replace(/'/g, '"')) as Record<
    string,
    string[]
  >;

  let result: string[] = [];
  for (const [key, value] of Object.entries(messageToObj)) {
    result.push(key);

    if (Array.isArray(value)) {
      result.push(value.join());
    } else {
      console.warn(`Unexpected type for key "${key}"`);
    }
  }

  return result;
};
