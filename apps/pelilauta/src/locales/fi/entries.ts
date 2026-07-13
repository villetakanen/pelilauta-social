import type { Locale } from 'src/utils/i18n';

export const entries: Locale = {
  account: {
    lastLogin: 'Viimeisin kirjautuminen',
    lightMode: 'Tumma tila',
    uid: 'UID',
    updatedAt: 'Päivitetty',
    showAdminTools: 'Näytä admin-työkalut',
    language: 'Kieli',
  },
  assets: {
    name: 'Nimi',
    description: 'Kuvaus',
    license: 'Lisenssi',
  },
  handout: {
    title: 'Otsikko',
  },
  profile: {
    uid: 'Tunniste',
    nick: 'Nick',
    avatar: 'Avatar',
    bio: 'Kuvaus',
    username: 'Käyttäjätunnus',
  },
  site: {
    key: 'Avain',
    name: 'Nimi',
    description: 'Kuvaus',
    system: 'Peli, järjestelmä tai luokittelu',
    homePage: 'Etusivu',
    flowTime: 'Muutettu',
    sortOrder: 'Sivujen järjestys',
    sortOrders: {
      name: 'Aakkosjärjestyksessä',
      createdAt: 'Luomisajan mukaan',
      flowTime: 'Muokkausajan mukaan',
      manual: 'Manuaalinen järjestys',
    },
    avatarURL: 'Kuvake',
    posterURL: 'Kansikuva',
    backgroundURL: 'Taustakuva',
    hidden: 'Piilotettu sivusto',
    customPageKeys: 'Luettavat osoitteet',
    placeholders: {
      name: 'Sivuston tai pelin nimi',
      description: 'Sivuston kuvaus. Kopioidaan kotisivun tekstiksi.',
    },
  },
  thread: {
    title: 'Otsikko',
    channel: 'Aihe',
    placeholders: {
      title: 'Otsikko',
      content: 'Viesti...',
    },
    meta: {
      entryName: 'Viesti',
      entryNamePlural: 'Viestit',
    },
  },
  reply: {
    placeholders: {
      markdownContent: 'Kirjoita viesti...',
    },
  },
  default: 'Oletus',
  page: {
    name: 'Sivun nimi',
    category: 'Luokka',
    markdownContent: 'Markdonwn',
    defaults: {
      name: '[Sivun nimi]',
      category: '-',
    },
  },
  clock: {
    label: 'Kellon otsake',
    tickIndex: 'Askel',
    tickSize: 'Koko',
    ticks: 'Askeleet',
  },
  character: {
    name: 'Nimi',
    description: 'Kuvaus',
    site: 'Peli / Sivusto',
    placeholders: {
      name: 'Esim. Gandalf Harmaa',
      description: 'Hahmon kuvaus tai taustatarina...',
    },
    sheet: 'Hahmolomake',
  },
};
