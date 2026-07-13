import { expect, test } from 'vitest';
import { t } from '../../src/utils/i18n';

test('Prints out app name in Finnish', () => {
  expect(t('app:title')).toBe('Pelilauta 2 - Versio 16');
});

test('Prints out app name in English', () => {
  expect(t('app:title', {}, 'en')).toBe(
    'Pelilauta 2 -  Version 16 – Alpha release',
  );
});

test('Prints out the app name in Finnish, if we ask for spanish', () => {
  expect(t('app:title', {}, 'es')).toBe('Pelilauta 2 - Versio 16');
});

test('Prints out the key if not found', () => {
  expect(t('app:missing')).toBe('app:missing');
});

/*test('Substitutes the link in the cross post message', () => {
  expect(t('threads:fork.crossPost', { link: '/threads/123' })).toBe(
    'Jatkoi keskustelua [uudessa langassa](/threads/123).',
  );
});*/
