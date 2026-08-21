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
  /*
   * The editor shell's departure question. It belongs to no one editor view:
   * a thread, a page and a handout all ask it in the same words.
   */
  editor: {
    unsaved: {
      title: 'Tallentamattomia muutoksia',
      body: 'Jos poistut nyt, kirjoittamasi menetetään.',
      leave: 'Poistu',
      stay: 'Jatka kirjoittamista',
    },
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
