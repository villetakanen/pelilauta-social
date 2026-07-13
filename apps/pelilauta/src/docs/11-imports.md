---
name: "Tietojen tuonti sivustoille"
shortname: 'Sivujen tuonti'
noun: 'info'
---

## Sivujen tuonti

Pelilaudalle voi tuoda kokonaisen sivuston, tai sivuston osan markdown-muodossa. Tämä mahdollistaa esimerkiksi
Obsidian.md tai muun markdown-editorin käytön pelilaudan sisällön kirjoittamiseen.

Sivustoja tuotaessa, seuraava metadata (frontmatter) huomioidaan:
```yaml
---
name: (sivun nimi, pakollinen)
createdAt: (sivun luontipäivämäärä, valinnainen)
author: (sivun kirjoittaja, valinnainen)
updated: (sivun viimeisin päivityspäivämäärä, valinnainen)
---
```

Valinnaiset tiedot korvataan automaattisesti. 

## Median tuonti

Sovellus ei toistaiseksi tue median tuontia massana.