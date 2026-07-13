import type { Locale } from 'src/utils/i18n';

export const common: Locale = {
  error: {
    generic: 'Tapahtui odottamaton virhe. Yritä uudelleen.',
    networkError: 'Verkkovirhe. Tarkista internet-yhteytesi.',
    unauthorized: 'Sinulla ei ole oikeutta tähän toimintoon.',
    notFound: 'Etsimääsi sisältöä ei löytynyt.',
    serverError: 'Palvelinvirhe. Yritä myöhemmin uudelleen.',
  },
  success: {
    saved: 'Tallennettu onnistuneesti.',
    deleted: 'Poistettu onnistuneesti.',
    updated: 'Päivitetty onnistuneesti.',
  },
  action: {
    cancel: 'Peruuta',
    save: 'Tallenna',
    delete: 'Poista',
    edit: 'Muokkaa',
    close: 'Sulje',
    confirm: 'Vahvista',
    back: 'Takaisin',
    next: 'Seuraava',
    loading: 'Ladataan...',
  },
};
