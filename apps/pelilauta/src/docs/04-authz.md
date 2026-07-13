---
name: 'Tietosuoja'
noun: 'monsters'
---

Pelilauta on avoimen lähdekoodin sovellus, joka on tarkoitettu käytettäväksi yksityishenkilöiden ja yhteisöjen kesken. Sovellus ei kerää käyttäjistään henkilökohtaisia tietoja, mutta käyttäjän itse julkaisema sisältö on julkista ja näkyvissä kaikille sovelluksen käyttäjille.

Sovellus tallentaa käyttäjän antamat tiedot Googlen Firebase -pilvipalveluun EU:n alueelle. Tietoja ei siirretä EU:n ulkopuolelle, mutta Googlen palvelut saattavat käyttää EU:n ulkopuolisia palveluita, kuten kuvien ja sivujen välimuistia.

Sovelluksen tallentamat tiedot käyvät selville sen [avoimen lähdekoodin tietokannan skeemoista](https://github.com/villetakanen/pelilauta-17/tree/main/src/schemas).

## Kirjautuminen ja istuntohallinta

Sovellus käyttää moniporrasta kirjautumismenetelmää:

- **Istuntotiedot**: Kirjautumisen jälkeen luodaan turvallinen istuntoeväste (session cookie), joka on voimassa 5 päivää. Eväste on HTTP-only ja suojattu, eikä sitä voi lukea selainkomponenteilla.
- **API-kutsut**: API-rajapintoja suojataan Bearer-tokeneilla, jotka validoidaan jokaisen pyynnön yhteydessä.
- **Paikallinen välimuisti**: Käyttäjän tila säilytetään paikallisesti selaimen localStorage-muistissa käyttäjäkokemuksen parantamiseksi.

Kirjautumisessa käyttämäsi palvelun (Google, Facebook tai sähköposti) palauttamat yksityiset tiedot on tallennettu Pelilaudan Firebase-kirjautumistietoihin. Näitä tietoja ei tallenneta sovelluksen tietokantaan, eivätkä ne näy muille kuin teknisille ylläpitäjille.

Kirjautumistiedot poistetaan manuaalisesti, kun käyttäjän tili on ensin poistettu sovelluksesta. Tämä tapahtuu 1-2 viikon kuluessa tilin poistamisesta. Kirjautumistiedot eivät poistu automaattisesti, kun poistat tilisi, koska niitä ei tallenneta sovelluksen tietokantaan.

> #### Henkilötietojen käsittelystä sovelluksessa
> Tietojen käsittely perustuu EU:n yleisen tietosuoja-asetuksen (GDPR) artiklaan 6(1)(f): Keräämme vain tietoja, jotka ovat välttämättömiä toimivan verkkoyhteisöalustan tarjoamiseksi roolipelaajille.
> 
> Sovellus seuraa käyttäjien aktiivisuutta päivätasolla, jotta voimme poistaa epäaktiiviset käyttäjät tietosuojan paranemiseksi. Jos et ole kirjautunut sovellukseen 6 kuukauteen, tilisi poistetaan. Aktiivisuuden seurantaan käytetyt tiedot näkyvät vain pääkäyttäjille, ja ne on kuvattu [tilitietojen skeemassa](https://github.com/villetakanen/pelilauta-17/blob/main/src/schemas/AccountSchema.ts).
>
> #### Käyttäjän oikeudet
> Sinulla on oikeus pyytää tietojesi poistamista, siirtämistä tai korjaamista ottamalla yhteyttä ylläpitoon. 
>
> Lisää tietoa siitä, miten Firebase suojaa tallennetut kirjautumistiedot, löytyy Firebasen dokumentaatiosta: https://firebase.google.com/support/privacy



