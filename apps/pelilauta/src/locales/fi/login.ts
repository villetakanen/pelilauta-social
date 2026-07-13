import type { Locale } from 'src/utils/i18n';

export const login: Locale = {
  title: 'Kirjaudu',
  info: 'Jos et ole aiemmin kirjautunut Pelilaudalle, luomme sinulle uuden tunnuksen automaattisesti.',
  withEmail: {
    title: 'Linkillä',
    info: 'Voit kirjautua sovellukseen sähköpostiosoitteen avulla. Syötä sähköpostiosoitteesi allaolevaan kenttään ja paina kirjaudu. Lähetämme sähköpostiisi maagisen linkin, jonka avulla voit kirjautua Pelilaudalle.',
    placeholder: 'Sähköpostiosoite',
    sent: 'Linkki lähetetty sähköpostiisi. Kirjaudu linkkiä klikkaamalla.',
    label: 'Kirjaudu sähköpostiosoitteellasi',
    sendAction: 'Lähetä linkki',
  },
  withProvider: {
    title: 'Tunnuksella',
    info: 'Kirjaudu Pelilaudalle käyttämällä jonkin seuraavista palveluista tunnistautumista.',
  },
  withGoogle: {
    action: 'Google-tilillä',
  },
  eula: {
    title: 'Tervetuloa!',
    nickTaken: 'Tunnus on käytössä. Valitse toinen.',
    profileInfo:
      'Kun kirjaudut ensimmäistä kertaa Pelilaudalle, luomme sinulle profiilin. Profiilin avulla voit osallistua keskusteluihin ja jakaa sisältöä muiden käyttäjien kanssa.',
    decline: 'Keskeytä, ja kirjaudu ulos',
    accept: 'Hyväksy ja jatka',
    updateNotice: {
      title: 'Miksi näen tämän?',
      description:
        'Olemme päivittäneet tietosuojakäytäntöjä ja käyttöehtoja sovelluksen version 16 myötä, ja siksi joudumme pyytämään sinulta uudelleen suostumuksen tietojesi käsittelyyn.',
    },
  },
  error: {
    credentialsRequired: 'Sähköposti ja salasana vaaditaan.',
    invalidCredentials: 'Virheellinen sähköposti tai salasana.',
    emailRequired: 'Sähköpostiosoite vaaditaan.',
    provider: 'Kirjautuminen {provider}-palveluun epäonnistui.',
    linkVerificationFailed: 'Linkin vahvistus epäonnistui.',
    sendLinkFailed: 'Linkin lähettäminen epäonnistui.',
  },
  snacks: {
    success: 'Kirjautuminen onnistui!',
  },
};
