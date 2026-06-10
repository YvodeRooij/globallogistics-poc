# GlobalLogistics PoC — GenAI Aangiftecockpit (WAIMAKERS EM case)
**Learn. Lead. Make.**

Werkende proof-of-concept: van rommelige intake (mail, scan, foto) naar gevalideerde aangifte, via een 8-stappen pipeline. De gouden regel: **laat een LLM nooit doen wat code kan, en laat code nooit beoordelen wat alleen taalbegrip kan.** De declarant beslist — het systeem stelt voor.

## Draaien

```bash
npm install && npm run dev
# → /          Aangiftecockpit (wachtrij · brondocument · bevindingen · besluit)
# → /pipeline  Live pipeline (8 stages, live trace, .eml/PDF-intake)
# → /dashboard Executive dashboard (4 scoreboards + 5 pilot-learnings, live)
```

`ANTHROPIC_API_KEY` in de omgeving of `.env.local` activeert de live-analyse; zonder key werkt alles op de fixtures.

### Mail-intake (live demo)

```bash
npm run mail-watcher   # pollt Gmail en stuurt PDF-bijlagen door de pipeline
```

Vereist in `.env.local`: `GMAIL_USER` + `GMAIL_APP_PASSWORD` (app-wachtwoord, 2FA: https://myaccount.google.com/apppasswords) en `POC_URL` (waar de dev-server draait). Vangnet zonder Gmail: sleep een `.eml` (Gmail → Bericht downloaden) of PDF in de app.

## De pipeline (lib/pipeline.js)

| # | Stage | Wie |
|---|---|---|
| 0 | Intake: magic bytes, sha256-dedupe, mail-metadata | code |
| 1 | Classificatie op inhoud (nooit bestandsnaam) | AI · opus |
| 2 | Extractie: velden + regels, datums ruw, niets verzonnen | AI · opus |
| 3 | Deterministische validatie: rekenregels, ISO 6346, injectie-scan | code |
| 4 | Dossier-assemblage & kruisvalidatie, verrijking als suggestie | code |
| 5 | HS-sanity: formaat + precedent | code |
| 6 | Judges: per-veld verificatie + HS-advocaat van de duivel | AI · **ander model** (sonnet) |
| 7 | Risicoscore & routing; pharma/accijns/injectie altijd senior | code |
| 8 | Besluit declarant; correcties → precedentbibliotheek | mens |

Guardrails: documentinhoud = data, nooit instructie (prompt-injectie); modelversie gepind + request-ids in de trace (determinisme); pipeline kapot = werken zoals vandaag (graceful degradation).

## Structuur

- `app/` — cockpit (`/`), live pipeline (`/pipeline`), dashboard (`/dashboard`)
- `lib/pipeline.js` — de acht stages · `lib/validate.js` — de rekenregels · `lib/store.js` — in-memory demo-store
- `fixtures/` — extractie + bevindingen van de 14-doc steekproef · `CHECKS.md` — de 5-laags validatie-architectuur
- `public/docs/` — de 14 originele brondocumenten
- `sources/` — het volledige case-pakket (brief, 5 interviews, 3 exports, ~500-doc dump). 100% fictief.

## Kernconclusie

Extractie is niet het knelpunt (93–98% van de velden lukt) — **validatie is de waarde.** First-time-right zonder mens is een illusie; first-time-right mét gerichte review is het product.
