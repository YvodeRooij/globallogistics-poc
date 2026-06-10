# Validatie-architectuur — "de grondige check" (5 lagen)

Principe: **controleer de AI met wiskunde waar het kan, met AI waar het moet, en met een mens waar het telt.**
Elke laag is goedkoper en harder dan de volgende; pas als een laag niets meer kan zeggen, schakelt de volgende in.

## Laag 1 — Compleetheid (schema-checks, deterministisch)
- Verplichte velden aanwezig? (origin, incoterms, valuta, gewichten, referentie)
- Gevonden in steekproef: origin ontbreekt op CH20246006 én DE20248224
- Actie bij ontbreken: eerst zoeken in dossier (CoO leverde origin voor CH!), anders auto-conceptmail naar klant

## Laag 2 — Interne consistentie (rekenregels, deterministisch)
- qty × stukprijs = regelbedrag; Σ regels = factuurtotaal
- Σ regelgewichten = kopgewicht (faalde op 5 van 6 paklijsten!)
- netto ≤ bruto; datumformaat-detectie (4 formaten gevonden: dd-mm-yyyy, dd.mm.yy, yyyy/mm/dd, mm/dd/yyyy)
- decimaalnormalisatie (punt én komma in één bestand)
- plausibiliteit: prijs/eenheid (CHF 894/liter water), gewicht/stuk (27 gram per tapijt)

## Laag 3 — Kruisvalidatie binnen dossier (deterministisch)
- factuur ↔ paklijst ↔ orderregels-Excel: hoeveelheden, refs, totalen (CH: 7/7 match ✓)
- e-mail: geclaimde bijlagen vs aanwezige documenten (SE: claimt 1, dossier heeft 3)
- documenttype op INHOUD, nooit bestandsnaam (Rechnung bleek CMR; Istanbul_factuur bleek paklijst)
- verrijking: ontbrekend veld uit zusterdocument halen → mens bevestigt

## Laag 4 — AI-confidence + precedent (probabilistisch)
- confidence per geëxtraheerd veld; onder drempel → review-queue
- HS-suggestie ALTIJD met: redenering + precedenten + confidence; nooit autonoom
- self-check pass: tweede AI-ronde die extractie tegen brondocument verifieert
- golden set: historische aangiftes met bekende uitkomst als poortwachter vóór elke release

## Laag 5 — Mens (HITL, het slot op de deur)
- review-queue gesorteerd op risicoscore; ONZEKERE velden eerst (anti-rubber-stamping: geen muur van groene vinkjes)
- pharma/accijns/intra-company → altijd senior
- elke correctie → precedentbibliotheek + golden set (het systeem wordt béter van fouten = antifragiel)
- naam van de declarant blijft op de aangifte; volledige audit trail per veld (welk document, welke pagina, wat las het model)
