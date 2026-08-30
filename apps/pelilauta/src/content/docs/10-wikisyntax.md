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

Pelilauta tukee Mekanismin wikin noppanotaatiota leipätekstissä ja linkkien tekstissä.

- `dice:<silmäluku>` piirtää nopan, jonka arvo on silmäluku. Esimerkiksi `dice:20` piirtää d20:n.
- `dice:<silmäluku>:<arvo>` piirtää nopan, jonka tulos on arvo. Esimerkiksi `dice:6:2` piirtää d6:n tuloksella 2.
- `target:<silmäluku>` ja `target:<silmäluku>+` piirtävät saman tavoitenopan, jonka arvo on silmäluku. Esimerkiksi `target:6` ja `target:6+` piirtävät saman tavoite-d6:n.
- `target:<silmäluku>:<arvo>` ja `target:<silmäluku>:<arvo>+` piirtävät saman tavoitenopan, jonka arvo on annettu arvo. Esimerkiksi `target:6:2` ja `target:6:2+` piirtävät saman tavoite-d6:n arvolla 2.

Notaatio hyväksyy silmäluvut 2, 4, 6, 8, 10, 12 ja 20. Arvo on kokonaisluku yhdestä silmälukuun asti.

Notaatio muuntuu leipätekstissä ja linkin tekstissä, myös pikalinkeissä ja Obsidian-tyylisissä wikilinkeissä. Se pysyy muuttumattomana koodinpätkässä, koodilohkossa sekä HTML-elementin lasten ja attribuuttien arvoissa.

