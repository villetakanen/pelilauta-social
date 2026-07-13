import type { Locale } from 'src/utils/i18n';

export const admin: Locale = {
  title: 'Foorumin hallinta',
  description:
    'Hallitse foorumin kanavia ja aiheita. Luo uusia kanavia, päivitä tilastoja ja järjestä foorumin rakennetta.',
  shortcuts: {
    refreshAll: 'Päivitä kaikki',
    addChannel: 'Lisää kanava',
    addTopic: 'Lisää alue',
  },
  channels: {
    title: 'Kanavat',
    addChannel: 'Lisää kanava',
    refreshAll: 'Päivitä kaikki',
    add: {
      title: 'Lisää kanava',
      shortTitle: 'Lisää kanava',
      description:
        'Luo uusi kanava nimellä, aihealueella ja kuvakkeella. Kanava on käytettävissä heti - sen ilmestyminen foorumin etusivulle voi viedä hetken johtuen CDN-välimuistista.',
      form: {
        name: 'Kanavan nimi',
        namePlaceholder: 'Syötä kanavan nimi',
        nameRequired: 'Nimi ja kategoria ovat pakollisia.',
        category: 'Aiheluokka',
        categoryPlaceholder: 'Valitse kategoria',
        categoryRequired: 'Aiheluokka',
        categoryEmpty: 'Ei kategorioita saatavilla',
        categoryEmptyHelper:
          'Aiheluokkia ei löytynyt. Luo ensin aihe pääkanavien hallintasivulta.',
        icon: 'Kuvake',
        iconPlaceholder: 'Valitse kuvake...',
        iconHelper: 'Valitse kuvake, joka kuvaa kanavan tarkoitusta',
        urlSlugPrefix: 'URL-tunnus:',
        actions: {
          cancel: 'Peruuta',
          reset: 'Tyhjennä lomake',
          create: 'Luo kanava',
        },
      },
      guidelines: {
        title: 'Huomaa',
        items: {
          unique:
            'Kanavan nimestä luotava polku on yksilöllinen, ja sitä ei voi muuttaa myöhemmin. Näyttönimen voi muuttaa milloin tahansa.',
          category: 'Valitse sopiva aiheluokka olemassa olevista aiheista',
          icon: 'Valitse kuvake, joka kuvaa kanavan tarkoitusta',
          slug: 'Kanavien URL-tunnukset luodaan automaattisesti nimistä',
        },
      },
      success: 'Kanava "{name}" luotu onnistuneesti! Ohjataan...',
    },
    noChannels: {
      title: 'Kanavia ei löytynyt',
      description: 'Luo ensimmäinen kanavasi aloittaaksesi.',
    },
    loading: 'Ladataan kanavia...',
    actions: {
      edit: 'Muokkaa',
      delete: 'Poista',
      refresh: 'Päivitä tilastot',
    },
    delete: {
      confirm: 'POISTA KANAVA',
      warning: 'Tämä poistaa kanavan pysyvästi.',
      details: {
        threads: 'Nykyiset keskustelut',
        category: 'Kategoria',
      },
      cannotUndo: 'Tätä toimintoa ei voi perua!',
      typeToConfirm: 'Kirjoita kanavan nimi vahvistaaksesi poiston:',
      namePrompt: 'Kirjoita "{name}" vahvistaaksesi poiston:',
      nameMismatch: 'Kanavan nimi ei täsmää. Poisto peruttu.',
      hasThreads:
        'Kanavaa, jossa on keskusteluja, ei voi poistaa. Siirrä tai poista keskustelut ensin.',
      success: 'Kanava poistettu onnistuneesti',
      failed: 'Kanavan poistaminen epäonnistui',
    },
    edit: {
      namePrompt: 'Muokkaa kanavan nimeä (nykyinen: "{current}"):',
      success: 'Kanava päivitetty onnistuneesti',
      failed: 'Kanavan päivittäminen epäonnistui',
      name: 'Kanavan nimi',
      characters: 'merkkiä',
      tooLong: 'yli suositellun pituuden, katkaistaan hakukoneissa',
    },
    create: {
      success: 'Kanava "{name}" luotu onnistuneesti',
      failed: 'Kanavan luominen epäonnistui',
    },
    refresh: {
      success: 'Kanavan tilastot päivitetty',
      allSuccess: 'Kaikkien kanavien tilastot päivitetty',
      failed: 'Kanavan tilastojen päivittäminen epäonnistui',
    },
  },
  topics: {
    addTopic: 'Lisää alue',
    create: {
      title: 'Luo uusi alue',
      name: 'Alueen nimi',
      placeholder: 'Syötä alueen nimi',
      description: 'Alueet auttavat järjestämään kanavat loogisiin ryhmiin.',
      save: 'Luo alue',
      success: 'Alue "{name}" luotu onnistuneesti',
      failed: 'Alueen luominen epäonnistui',
    },
    moveUp: 'Siirrä aihetta ylös',
    moveDown: 'Siirrä aihetta alas',
    delete: 'Poista aihe',
    deleteDisabled: 'Aihetta ei voi poistaa, koska siinä on kanavia',
  },
  errors: {
    loadFailed: 'Kanavien lataaminen epäonnistui',
    retry: 'Yritä uudelleen',
  },
  labels: {
    title: 'Ylläpidon tunnisteet',
    addLabel: 'Lisää tunniste',
    addPlaceholder: 'Syötä tunnisteen nimi',
    noLabels: 'Ei ylläpidon tunnisteita',
    removeLabel: 'Poista tunniste',
    legend:
      'Tunnisteet ovat ylläpidon määrittämiä tageja, jotka säilyvät muokkausten aikana',
    success: {
      added: 'Tunniste "{label}" lisätty',
      removed: 'Tunniste "{label}" poistettu',
    },
    errors: {
      addFailed: 'Tunnisteen lisääminen epäonnistui',
      removeFailed: 'Tunnisteen poistaminen epäonnistui',
      emptyLabel: 'Tunniste ei voi olla tyhjä',
      alreadyExists: 'Tunniste "{label}" on jo olemassa',
    },
  },
};
