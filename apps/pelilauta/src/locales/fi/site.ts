import type { Locale } from 'src/utils/i18n';

export const site: Locale = {
  assets: {
    title: 'Lataukset',
    description: 'Sivustolle ladatut tiedostot',
    forbidden:
      'Koneellisen luvun ja tiedonkeruun estämiseksi lataukset-listaus vaatii kirjautumisen pelilaudalle. Voit kirjautua alla olevan painikkeen kautta.',
    upload: { success: '{file} ladattu onnistuneesti' },
  },
  contents: {
    title: 'Sivut',
  },
  clocks: {
    title: 'Kellot',
    create: {
      preview: 'Esikatselu',
      default: 'Kello',
    },
    empty: 'Ei kelloja',
  },
  characters: {
    title: 'Hahmot',
    empty: 'Sivustolla ei ole vielä hahmoja',
    count: '{count} hahmoa',
  },
  create: {
    title: 'Luo sivusto',
    description:
      'Voit luoda Pelilaudalle uuden sivuston pelillesi tai kampanjallesi. Sivusto luodaan alla olevaan osoitteeseen, joka muodostetaan pelin nimestä tai automaattisesti.',
    url: 'URL',
    page: {
      title: 'Luo sivu',
      missing: 'Sivua {name} ei vielä ole olemassa, voit luoda sen alta.',
      duplicateKey: 'Sivu osoitteessa {key} on jo olemassa.',
      duplicateKeyLink: 'Avaa sivu',
    },
    system: {
      description:
        'Pelisi tai kampanjasi luokittelu. Käytetään pelien listauksessa ja sivuston ulkoasussa.',
    },
    errors: {
      reserved:
        'Sivuston osoite on varattu. Vaihda sivuston nimeä, tai luo sivu ilman luettavia osoitteita.',
    },
    hidden: {
      description:
        'Sivuston voi piilottaa julkisista listauksista, jolloin se näkyy listauksissa vain sivuston omistajille ja pelaajille - ja verkon hakukoneita pyydetään jättämään sivusto listaamatta. Sivuston sivuja voi tästä huolimatta jakaa suoralla osoitteella.',
    },
    plaintexturls: {
      description:
        'Voit ottaa luettavat osoitteet pois käytöstä, jolloin pelilauta muodostaa sivustolle ja sen sivuille automaattiset osoitteet. Tämä voi olla höydyllistä jos haluat tehdä sivustosta vaikeasti löydettävän.',
    },
  },
  data: {
    title: 'Tuo & vie',
    description: 'Työkalut sivuston tietojen tuontiin ja vientiin',
    export: {
      title: 'Vie',
      asMarkdown: 'Markdown',
      asMarkdownDocument:
        'Sivuston voi viedä yhtenä pitkänä markdown-tiedostona. Tällöin sivut ladotaan peräkkäin yhteen tiedostoon, esimekiksi tulostamista, keinoälytyökaluja tai julkaisua ajatellen.',
    },
    actions: {
      asMarkdonwDocument: 'Vie .md -tiedostona',
    },
  },
  handouts: {
    title: 'Salaisuudet',
    description:
      'Sivustolle lisätty jaettu materiaali, joka on rajattu. Tämä listaus näkyy vain omistajille, mutta itse salaisuudet ovat jaettavissa suoralla linkillä muille.',
    create: {
      title: 'Luo salaisuus',
    },
    metadata: {
      title: 'Lukijat',
    },
    add: {
      reader: 'Lisää lukija',
    },
  },
  import: {
    title: 'Tuo sivuja',
    preview: {
      title: 'Esikatselu',
      description: 'Tuodaan {count} sivua',
      action: 'Toiminto',
      overwrite: 'Korvaa vanha',
      create: 'Luo uusi',
    },
    massImport: {
      description: 'Tuodaan {complete} / {count} sivua',
    },
    'legacy-folder-import': {
      title: 'Tuonti',
    },
  },
  members: {
    title: 'Jäsenet',
  },
  keeper: {
    title: 'Keeper',
    lastUpdated: 'Päivitetty {date}',
    error: {
      title: 'Hahmojen lataus epäonnistui',
    },
    noCharacters: {
      title: 'Ei hahmoja',
      description: 'Sivustolla ei ole vielä hahmoja.',
    },
    noSheet: {
      title: 'Hahmolomaketta ei ole valittu',
      description: 'Valitse hahmolomake nähdäksesi hahmot.',
    },
  },
  options: {
    title: 'Työkalut',
    description:
      'Pelilauta / Mekanismi sisältää joukon pelinjohtamisen ja pelaamisen avuksi tarkoitettuja työkaluja. Voit ottaa työkalut käyttöön alla olevilla painikkeilla.',
    tools: 'Työkalut',
    extras: 'Lisäasetukset',
    useClocks: 'Kellot',
    useHandouts: 'Salaisuudet',
    sidebar: 'Sivupalkki',
    useCharacters: 'Hahmot',
    useCharacterKeeper: 'Hahmokansio',
    useRecentChanges: 'Viimeisimmät muutokset -paneeli',
    useSidebar: 'Käytä sivupalkkia',
    sidebarPage: 'Sivupalkin sisältö',
    selectPage: 'Valitse sivu',
    selectSheet: 'Valitse hahmolomake',
    selectSidebarPage: 'Oletus',
    sidebarPageDescription:
      'Valitse mukautettu sivu sivupalkkia varten. Jos sivua ei valita, käytetään oletussivupalkkia.',
    useDefaultSidebar: 'Käytä oletussivupalkkia',
    homepage: 'Etusivu',
    homepageDescription:
      'Voit valita minkä tahansa sivuston sivun etusivuksi. Etusivu näytetään, kun sivusto avataan ilman tarkempaa osoitetta.',
    navigation: {
      title: 'Rakenne',
      description: 'Sivuston navigaatioon ja rakenteeseen liittyvät asetukset.',
    },
  },
  page: {
    migrateContentInfo:
      'Sivu on tehty aiemmalla versiolla pelilaudasta, ja sen sisältöä ei voi muokata ilman konversiota. Konversio voi joskus muuttaa sivun ulkoasua ja rakennetta.',
    migrateContent: 'Konvertoi',
    revisionCount: 'muokkausta',
    missing: 'Sivua ei löydy, voit luoda sen tästä',
    editor: {
      contentMigrateWarning:
        'Sivun aiempi sisältö on konvertoitu markdown-muotoon',
    },
    created: 'Sivu {key} luotu onnistuneesti',
    history: {
      title: 'Muutokset',
      revision: 'Versio {index}',
      createdAt: '{date}',
    },
  },
  settings: {
    title: 'Asetukset',
    meta: {
      extra: 'Lisäasetukset',
      title: 'Sivuston tiedot',
      fieldset: 'Sivuston perusasetukset',
      configuration: 'Asetukset',
      saved: 'Asetukset tallennettu',
    },
    theming: {
      title: 'Ulkoasu',
    },
  },
  snacks: {
    siteCreated: 'Sivusto {sitename} luotu',
    siteDeleted: 'Sivusto {name} poistettu',
    errorDeletingSite: 'Virhe poistettaessa sivustoa',
    pageCreated: 'Sivu luotu',
    pageUpdated: 'Sivun muutokset tallennettu',
    copied: 'Kopioitu',
  },
  tray: {
    actions: {
      homepage: 'Etusivu',
      toc: 'Hakemisto',
      assets: 'Lataukset',
      clocks: 'Kellot',
    },
  },

  dangerZone: {
    title: 'Poista sivusto',
    description:
      'Tämä toiminto poistaa sivuston lopullisesti. Toimintoa ei voi peruuttaa. Vahvistaaksesi toiminnon, kirjoita alla olevaan kenttään "Olen Aivan Varma" ja paina "Poista sivusto" -painiketta.',
    deleteSiteAction: 'Poista sivusto',
  },
  editor: {
    title: 'Muokkaa sivua',
  },

  frontPage: 'Etusivu',
  owners: {
    title: 'Omistajat',
    description:
      'Sivuston omistajat voivat muokata sivuston asetuksia, sisältöä, käyttöoikeuksia ja ulkoasua.',
    add: 'Lisää omistaja',
  },
  players: {
    title: 'Pelaajat',
    description:
      'Sivustolle voidaan lisätä myös jäseniä, kuten pelaajia - joiden oikeudet ovat rajatummat. Oletuksena pelaaja voi vain muokata ja luoda sivuja.',
    add: 'Lisää pelaaja',
    usePlayers: 'Pelaajat -toiminto',
  },
  siteList: {
    title: 'Julkiset sivustot',
    footer: '{count} julkista peliä tai sivustoa.',
  },
  toc: {
    title: 'Hakemisto',
    uncategorized: 'Luokittelemattomat',
    missing:
      'Sivusto on luotu ennen Pelilaudan versiota 16, joten sivuston hakemisto on luotava uudestaan',
    repair: 'Luo hakemisto',
    admin: {
      title: 'Hallinta',
      info: 'Sivuston hakemiston hallinta. Voit valita sivuston sivujen järjestyksen ja luoda sekä järjestää sivukategorioita.',
      newCategory: 'Uusi aihe',
      noCategories: 'Ei aiheita, voin luoda uuden aiheen alla.',
      categoryPlaceholder: 'Aiheen nimi',
      errorSaving: 'Virhe tallennettaessa kategorioita',
      categories: {
        title: 'Aiheet',
      },
    },
    manualOrder: {
      title: 'Järjestä sivut',
      info: 'Vedä ja pudota sivuja muuttaaksesi niiden järjestystä hakemistossa.',
      saving: 'Tallennetaan järjestystä...',
    },
    regenerate: {
      title: 'Hakemiston luonti',
      info: 'Jos sivuston hakemisto on vioittunut, tai se puuttuu historiallisista syistä, voit luoda hakemiston uudelleen tästä.',
      action: 'Luo hakemisto',
    },
    all: 'Sisältö',
    importExport: {
      title: 'Tuo ja vie',
      description:
        'Voit viedä koko sivuston sisällön markdown-muodossa zip-tiedostona. Sivujen metadata tallennetaan markdown frontmatter -muotoon.',
    },
    import: {
      title: 'Tuo',
      description:
        'Voit tuoda sivuston sisällön markdown-muodossa. Ohjeita frontmatter-metadatasta löytyy dokumentaatiosta {link}.',
      fromFolder: 'Tuo kansio',
    },
  },
  deletePage: {
    info: 'Olet poistamassa sivua {name}. Toimintoa ei voi peruuttaa.',
  },
  latestChanges: {
    title: 'Muutokset',
  },
  license: {
    '0': '-',
    'cc-by': 'CC-BY',
    'cc-by-sa': 'CC-BY-SA',
    'cc-by-nc': 'CC-BY-NC',
    'cc-by-nc-sa': 'CC-BY-NC-SA',
    cc0: 'CC0',
    'public-domain': 'Vapaa (Public Domain)',
    OGL: 'OGL',
    forText: 'Sivuston tekstisisältö ',
    links: {
      'cc-by': 'https://creativecommons.org/licenses/by/4.0/deed.fi',
      'cc-by-sa': 'https://creativecommons.org/licenses/by-sa/4.0/deed.fi',
      'cc-by-nc': 'https://creativecommons.org/licenses/by-nc/4.0/deed.fi',
      'cc-by-nc-sa':
        'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fi',
      cc0: 'https://creativecommons.org/publicdomain/zero/1.0/deed.fi',
    },
  },
  navigation: {
    sidebar: 'Sivulle {name}',
  },
};
