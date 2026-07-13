import type { Locale } from 'src/utils/i18n';

export const social: Locale = {
  inbox: {
    title: 'Tapahtumat',
    notificationCount: 'uutta tapahtumaa',
    description:
      'Viimeaikaiset tapahtumat. Yli 30pv vanhat tapahtumat poistetaan ajoittain automatiikan toimesta.',
  },
  notification: {
    reply: {
      loved: 'tykkäsi kommentista',
    },
    thread: {
      loved: 'tykkäsi ketjusta',
      reply: 'vastasi ketjuusi',
    },
    handout: {
      update: 'päivitti salaisuuttasi',
    },
    site: {
      invited: 'kutsui sinut peliin',
      loved: 'tykkäsi pelistäsi tai sivustostasi',
    },
  },
};
