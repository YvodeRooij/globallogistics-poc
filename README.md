# GlobalLogistics PoC — WAIMAKERS case

Proof-of-concept voor de GlobalLogistics-case (WAIMAKERS interview): een declaranten-werkbank + executive dashboard die laat zien hoe GenAI-extractie met gelaagde validatie en human review werkt.

## Structuur

- `sources/` — het volledige originele case-pakket: case brief, 5 interviewtranscripten, 3 systeemexports (Excel) en de ~500-document Client_Data_Dump. Alles 100% fictief (zie `sources/README — Start here.md`).
- De Next.js-app (werkbank op `/`, dashboard op `/dashboard`) wordt aan de root van deze repo toegevoegd.

## Kernprincipe

> Controleer de AI met wiskunde waar het kan, met AI waar het moet, en met een mens waar het telt.

Extractie is niet het knelpunt (93–98% van de velden lukt) — validatie is de waarde.
