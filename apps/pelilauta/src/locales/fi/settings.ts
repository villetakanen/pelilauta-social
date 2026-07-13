import type { Locale } from 'src/utils/i18n';

export const settings: Locale = {
  actions: {
    title: 'Toiminnot',
  },
  personal: {
    title: 'Omat tiedot',
  },
  profile: {
    title: 'Profiili',
    info: 'Profiilitiedot tallennetaan pelilaudan tietokantaan. Ne näkyvät sovelluksen käyttäjille.',
    dangerZone: {
      title: 'Vaaravyöhyke',
      info: 'Seuraavat toiminnot poistavat tilisi ja profiilisi tiedot tietokannasta. Tämä toimintoa ei voi peruuttaa.',
      confirm: 'Kirjoita alle "olen aivan varma" jatkaaksesi ',
    },
    edit: {
      title: 'Muokkaa profiilia',
    },
  },
  preview: {
    title: 'Esikatselu',
  },
  publicprofile: {
    title: 'Yleiset',
    legend: 'Profiilin julkiset tiedot',
  },
  authz: {
    title: 'Kirjautumistiedot',
    info: 'Kirjautumisessa käyttämäsi palvelun (Google, Facebook tai sähköposti) pelilaudalle luovuttamat yksityistiedot. Nämä tiedot on tallennettu Pelilaudan Firebese-tunnestetietoihin. Tietoja ei tallenneta sovelluksen tietokantaan, eivätkä ne näy sovelluksen käyttäjille',
    fields: {
      uid: 'uid',
      displayName: 'Näyttönimi (displayName)',
      email: 'Sähköposti (email)',
      avatarURL: 'Avatar-URL (photoURL)',
    },
    updateAvatar: 'Päivitä avatar',
  },
  description:
    'Sovelluksen asetukset. Sivu vaatii sisäänkirjautumisen toimiakseen.',
};
