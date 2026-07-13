// Description: A simple i18n utility function to handle nested translations.
//
//
// Does not support any interpolation or pluralization.

import { locales } from '../locales'; // Your default locale structure

// Define a recursive type to handle nested translations
export type NestedTranslation = string | { [key: string]: NestedTranslation };

export type Locale = {
  [namespace: string]: NestedTranslation;
};

export interface Locales {
  [locale: string]: {
    [namespace: string]: NestedTranslation;
  };
}

export interface LocaleSubstitutions {
  [key: string]: string | number;
}

const defaultLocale = 'fi'; // Your default locale

export function t(
  key: string,
  subs?: LocaleSubstitutions,
  currentLocale = defaultLocale,
): string {
  // Split the key into namespace (optional) and path
  const [namespace = 'app', ...pathSegments] = key.split(':');
  const path = pathSegments.join(':'); // Join the remaining segments

  // Function to recursively traverse and find the translation
  function findTranslation(
    obj: NestedTranslation | undefined,
    path: string,
  ): string | undefined {
    if (!obj) return undefined; // Handle undefined object

    const keys = path.split('.');
    let currentObj = obj;

    for (const key of keys) {
      if (typeof currentObj === 'string') return undefined; // Reached a string before the end of the path
      currentObj = currentObj[key];
      if (currentObj === undefined) return undefined; // Key not found
    }

    return currentObj as string; // Found the translation
  }

  // Start with default locale
  let translation = findTranslation(locales[currentLocale]?.[namespace], path);

  // If not found in default locale, check the current locale (you'll need to get this from somewhere)
  if (!translation) {
    // ... logic to get currentLocale ...
    translation = findTranslation(locales[defaultLocale]?.[namespace], path);
  }

  // Replace substitutions, if translation found, and subs provided
  if (translation && subs) {
    for (const [key, value] of Object.entries(subs)) {
      translation = translation.replace(
        new RegExp(`{${key}}`, 'g'),
        `${value}`,
      );
    }
  }

  // Return original input if no translation found
  return translation ?? key;
}
