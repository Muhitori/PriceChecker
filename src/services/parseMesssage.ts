export const parseMessage = (message: string): string[] => {
  const messageToObj = JSON.parse(message.replace(/'/g, '"'));

  let result: string[] = [];
  for (const [key, value] of Object.entries(messageToObj)) {
    let subRes = [];
    subRes.push(key);

    if (Array.isArray(value)) {
      subRes.push(value.join(', '));
      result.push(subRes as any);
    } else {
      console.warn(`Unexpected type for key "${key}"`);
    }
  }
  return result;
};
