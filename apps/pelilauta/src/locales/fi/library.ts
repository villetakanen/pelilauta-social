import type { Locale } from 'src/utils/i18n';

export const library: Locale = {
  title: 'Kirjasto',
  description:
    'Pelauta.fi - Kirjasto. Omat pelisi, pelit joissa pelaat, ja sivustot joita ylläpidät',
  sites: {
    title: 'Pelit ja sivustot',
    count: '{count} sivustoa.',
  },
  characters: {
    title: 'Hahmot',
    description:
      'Vielä hieman kokeellinen toiminto hahmojen luomiseen ja muokkaamiseen.',
    empty: 'Ei hahmoja, voit luoda uuden hahmon altakulman painikkeesta.',
    count: '{count} hahmoa.',
  },
};
