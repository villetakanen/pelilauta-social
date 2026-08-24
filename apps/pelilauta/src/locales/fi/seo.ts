/*
 * What the service is, in one line. The front page and the login page make the
 * same claim — a login page describes the service a reader is about to join,
 * not a page of its own — so they read one string rather than two that drift.
 */
const service =
  'Keskustele roolipeleistä ja luo kampanjawikejä. Suomalainen roolipelisivusto pelaajilta pelaajille.';

export const seo = {
  frontPage: {
    title: 'Pelilauta',
    description: service,
  },
  channels: {
    title: 'Keskustelualueet',
    description:
      'Selaa keskustelualueita ja osallistu roolipelikeskusteluihin. Etsi vastauksia kysymyksiisi tai käynnistä uusi keskustelu.',
  },
  sites: {
    title: 'Sivustot ja pelit',
    description:
      'Selaa kampanjawikejä ja pelisivustoja. Luo ja jaa omia roolipelien maailmoja, NPC:itä, sijainteja ja peliresursseja.',
    fallback:
      '{name} - Roolipelin kampanjasivusto Pelilaudalla. Tutustu peliin, hahmoihin ja tarinoihin.',
  },
  tag: {
    title: 'Aihe',
    description:
      'Keskustelut aiheesta #{tag}. Tutustu keskusteluihin ja jaa omia ajatuksiasi Pelilaudan roolipelifoorumilla.',
    fallback:
      'Selaa keskusteluja ja kampanjasivustoja aiheesta #{tag}. Löydä inspiraatiota ja jaa omia ideoitasi.',
  },
  library: {
    title: 'Kirjasto',
    description:
      'Selaa Pelilaudan julkista kirjastoa. Löydä hahmoja, resursseja ja inspiraatiota omiin roolipeliseikkailuihisi.',
  },
  profile: {
    fallback:
      '{nick} - Pelilauta-käyttäjä ja roolipelien harrastaja. Tutustu profiiliin ja julkaistuun sisältöön.',
  },
  search: {
    title: 'Haku',
    description:
      'Hae Pelilaudan sisällöstä: keskustelut, kampanjasivustot ja roolipeliresurssit. Löydä vastaukset kysymyksiisi.',
  },
  login: {
    title: 'Kirjaudu',
    description: service,
  },
  eula: {
    title: 'Käyttöehdot',
    description:
      'Pelilauta käyttöehdot ja käyttöoikeussopimus. Tutustu ehtoihin ennen palvelun käyttöä.',
  },
  error404: {
    title: 'Sivua ei löydy',
    description:
      'Etsimääsi sivua ei löydy. Palaa Pelilaudan etusivulle selailemaan keskusteluja ja kampanjasivustoja.',
  },
  error403: {
    title: 'Ei käyttöoikeutta',
    description:
      'Sinulla ei ole oikeutta nähdä tätä sivua. Kirjaudu sisään tai pyydä pääsyä sivuston omistajalta.',
  },
  docs: {
    fallback:
      'Pelilaudan dokumentaatio ja ohjeet. Opi käyttämään sivustoa ja luomaan sisältöä.',
  },
  description: {
    length:
      'Suosittelemme kuvauksessa olevan 120-160 merkkiä. Tekstin pituus: {length} / 160',
  },
};
