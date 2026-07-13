import type { Locale } from 'src/utils/i18n';

export const search: Locale = {
  title: 'Haku',
  results: 'Löydetyt tulokset: {count}',
  empty: 'Ei tuloksia',
  searchPlaceholder: 'Etsi...',
  channel: {
    placeholder: 'Etsi kanavalta {channel}...',
    loginRequired: 'Kirjaudu sisään hakeaksesi tältä kanavalta',
    loginPrompt: 'hakeaksesi tältä kanavalta',
    clearFilter: 'Poista suodatus',
    filterActive: 'Haetaan kanavalta: {channel}',
  },
};
