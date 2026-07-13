---
name: "Markdown & Wikisyntaksi"
shortname: 'Wikisyntaksi'
noun: 'info'
---

Pelilaudan Wikit käyttävät Markdown-syntaksia. Markdown on yksinkertainen merkintäkieli, joka muuntuu helposti HTML:ksi. Markdownin avulla voit kirjoittaa tekstejä nopeasti ja helposti ilman, että sinun tarvitsee huolehtia liikaa ulkoasusta.

## Laajennokset

Pelilaudan sivustot tukevat joukkoa laajennoksia Markdown-syntaksin lisäksi. Tässä on lista tuetuista laajennoksista:

## Wikilinkit

- `[sivu tässä wikissä]` - Pikalinkkaaminen samaan wikiin, ilman sivun täyttä osoitetta.
- `[toinen wiki/sivu]` - Pikalinkkaaminen toiseen wikiin, ilman sivun täyttä osoitetta
- `[linkin teksti](sivu tässä wikissä)` - Pikalinkkaaminen samaan wikiin, ilman sivun täyttä osoitetta.
- `[linkin teksti](toinen wiki/sivu)` - Pikalinkkaaminen toiseen wikiin, ilman sivun täyttä osoitetta

### Liitteet

`Attach:liitetiedosto_tai_kuva_tähän.jpg` tuottaa pikalinkin liitteeseen, joko
1. Jos liite löytyy, se näytetään kuvana (tai latauslinkkinä, PDF:lle ja muille vastaaville)
2. Jos liitettä ei löydy, se näytetään linkkinä liitteen lisäysssivuun

### Nopat

Pelilauta tukee Mekanismin wikin noppanotaatiota

1. `dice:20` tulostaa: <cn-dice sides="20"></cn-dice>
2. `dice:6:2` tulostaa: <cn-dice sides="6" value="2"></cn-dice>

