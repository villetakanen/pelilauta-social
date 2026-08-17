import type { Locale } from '../../utils/i18n';
import { actions } from './actions';
import { admin } from './admin';
import { base } from './base';
import { common } from './common';
import { entries } from './entries';
import { frontPage } from './frontPage';
import { library } from './library';
import { login } from './login';
import { search } from './search';
import { seo } from './seo';
import { site } from './site';
import { snack } from './snack';
import { tag } from './tag';
import { threads } from './threads';

export const en: Locale = {
  actions,
  admin,
  app: {
    title: 'Pelilauta 2 -  Version 16 – Alpha release',
    shortname: 'Pelilauta',
    errors: {
      fetchingThreads:
        'Failed to load threads. Please try refreshing the page.',
    },
  },
  base,
  common,
  entries,
  frontPage,
  library,
  login,
  search,
  seo,
  site,
  snack,
  tag,
  threads,
};
