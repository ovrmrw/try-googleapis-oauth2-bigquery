export function safeJsonParse(json: any, fallbackValue: any = {}): Record<string, any> | null {
  let result = fallbackValue;
  try {
    result = JSON.parse(json);
  } catch (e) {
    console.warn(e);
  }
  return result;
}
