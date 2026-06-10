# GlobalLogistics PoC — GenAI Declaratie-werkbank (WAIMAKERS EM case)
**Learn. Lead. Make.**

Werkende proof-of-concept op een gestratificeerde steekproef (14 docs, 3 kwaliteitsniveaus) uit de Client_Data_Dump: GenAI-extractie met 5-laags validatie en human review. De declarant beslist — het systeem stelt voor.

## Draaien

```bash
npm install && npm run dev
# → localhost:3000 (werkbank) · localhost:3000/dashboard (executive dashboard)
```

## Structuur

- `app/` — Next.js werkbank (`/`) + executive dashboard (`/dashboard`)
- `fixtures/dossiers.json` — extractie + validatiebevindingen + HS-suggestie + metrics per tier
- `fixtures/CHECKS.md` — de 5-laags validatie-architectuur
- `public/docs/` — de 14 originele brondocumenten uit de steekproef (getoond in de werkbank)
- `sources/` — het volledige originele case-pakket: brief, 5 interviewtranscripten, 3 systeemexports en de ~500-document Client_Data_Dump. Alles 100% fictief (zie `sources/README — Start here.md`).

## Kernprincipe

> Controleer de AI met wiskunde waar het kan, met AI waar het moet, en met een mens waar het telt.

Extractie is niet het knelpunt (93–98% van de velden lukt) — validatie is de waarde. Alle 14 documenten in de steekproef bevatten minstens één bevinding: first-time-right zonder mens is een illusie; first-time-right mét gerichte review is het product.
