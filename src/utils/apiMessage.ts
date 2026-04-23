import type { TFunction } from 'i18next';

/**
 * Translates an API message code (e.g. "PROFILE_UPDATED") into a localized string.
 * Falls back to the raw code if no translation is found.
 */
export function translateApiMessage(code: string, t: TFunction): string {
  const key = `api.${code}`;
  const translated = t(key);
  return translated !== key ? translated : code;
}
