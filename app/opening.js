"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "De Aangiftestraat" — openingsscherm (port van de Claude Design-handoff).
 * 16 intake-documenten gaan door de scanbeam, velden vliegen als chips door
 * vijf validatiepoorten een aangifte in, en de machine versnelt terwijl hij
 * leert (doc 1 ≈ 2,2 s → doc 16 ≈ 0,6 s — het 45→7-verhaal, fysiek verteld).
 * Finale: Learn. Lead. Make. → "Fit for the future." → LET'S GO de cockpit in.
 *
 * Aanpassingen t.o.v. het prototype (Vercel web guidelines):
 * - geen externe deps (Lora/React-CDN/Babel weg); fonts en kleuren uit ons
 *   eigen designsysteem
 * - beam/wipe/progressbar bewegen via transform (composietvriendelijk)
 * - prefers-reduced-motion springt direct naar de finale
 * - onderbreekbaar: Escape of "Overslaan" sluit het scherm meteen
 * - speelt één keer per browsersessie (sessionStorage)
 */

const SESSION_KEY = "aangiftestraat-gezien";

/* Module-scope: blijft staan tijdens client-side navigaties binnen dezelfde
   paginalade. De harde-refresh-check mag alleen gelden voor de eerste mount
   ná het laden van de pagina — niet voor elke terugkeer naar de cockpit. */
let hardeCheckGedaan = false;

const SHIPMENTS = [
  { ref: "CH20246006", vals: { "AFZENDER": "Priya Nair", "DATUM (BRON)": "2024/10/03", "BIJLAGEN": "4 geclaimd", "GOEDEREN": "Mineral waters, sparkling", "WAARDE": "CHF 18.640", "ZENDINGREF": "CH20246006", "GEWICHT": "12.480 kg", "COLLI": "1.040 dozen", "LAND VAN OORSPRONG": "ONTBREEKT", "ONDERTEKEND DOOR": "Émile Laurent" } },
  { ref: "SE20243533", vals: { "AFZENDER": "Lina Berg", "DATUM (BRON)": "2024/10/07", "BIJLAGEN": "3 geclaimd", "GOEDEREN": "Birch plywood panels", "WAARDE": "EUR 42.300", "ZENDINGREF": "SE20243533", "GEWICHT": "18.900 kg", "COLLI": "22 pallets", "LAND VAN OORSPRONG": "SE", "ONDERTEKEND DOOR": "Lina Berg" } },
  { ref: "DE20247781", vals: { "AFZENDER": "Jonas Weiß", "DATUM (BRON)": "2024/10/09", "BIJLAGEN": "5 geclaimd", "GOEDEREN": "Industrial pump units", "WAARDE": "EUR 96.750", "ZENDINGREF": "DE20247781", "GEWICHT": "7.310 kg", "COLLI": "14 kratten", "LAND VAN OORSPRONG": "DE", "ONDERTEKEND DOOR": "K. Hoffmann" } },
  { ref: "FR20242190", vals: { "AFZENDER": "Camille Roux", "DATUM (BRON)": "2024/10/12", "BIJLAGEN": "4 geclaimd", "GOEDEREN": "Cosmetic crèmes", "WAARDE": "EUR 27.480", "ZENDINGREF": "FR20242190", "GEWICHT": "2.140 kg", "COLLI": "96 dozen", "LAND VAN OORSPRONG": "FR", "ONDERTEKEND DOOR": "Camille Roux" } },
];
const DOCTYPES = [
  { tag: "EML", name: "Email", keys: ["AFZENDER", "DATUM (BRON)", "BIJLAGEN"] },
  { tag: "INV", name: "Commercial_Invoice", keys: ["GOEDEREN", "WAARDE", "ZENDINGREF"] },
  { tag: "PKL", name: "Packing_List", keys: ["GEWICHT", "COLLI"] },
  { tag: "COO", name: "Certificate_of_Origin", keys: ["LAND VAN OORSPRONG", "ONDERTEKEND DOOR"] },
];
const ROWKEYS = ["AFZENDER", "ZENDINGREF", "DATUM (BRON)", "GOEDEREN", "WAARDE", "GEWICHT", "COLLI", "LAND VAN OORSPRONG", "BIJLAGEN", "ONDERTEKEND DOOR"];
const FINDINGS = {
  0: { sev: "CHECK", text: "4 bijlagen geclaimd · 3 gevonden in datadump" },
  1: { sev: "CHECK", text: "Afzender (Priya Nair) ≠ ondertekenaar (Émile Laurent)" },
  3: { sev: "FOUT", text: "Land van oorsprong ontbreekt op certificaat" },
  6: { sev: "CHECK", text: "Brutogewicht wijkt 2,8% af van factuur" },
  9: { sev: "FOUT", text: "Valuta orderregels (USD) ≠ factuur (EUR)" },
  11: { sev: "CHECK", text: "HS-code 8413.70 ≠ 8413.81 in orderregels" },
  14: { sev: "CHECK", text: "Colli-aantal ≠ paklijst (84 vs 86)" },
};
const STATUS = ["Datadump lezen…", "Documenten classificeren…", "Velden extraheren…", "Vijf lagen valideren…", "Onzekerheden markeren…", "Aangifte samenstellen…"];
const GATEX = [1150, 1196, 1242, 1288, 1334];
const ORANJE = "#f05a28", INKT = "#16233b", GROEN = "#177245";

function boot(root, onDone) {
  const $ = (s) => root.querySelector(s);
  const stage = $(".ls-stage"), fx = $(".ls-fx"), pileEl = $(".ls-pile");
  const cv = $(".ls-canvas"), ctx = cv.getContext("2d");
  const beam = $(".ls-beam"), scanName = $(".ls-scanname"), scanTime = $(".ls-scantime");
  const decl = $(".ls-decl"), declRef = $(".ls-declref"), declPill = $(".ls-declpill"), drows = $(".ls-drows");
  const findBox = $(".ls-findings"), queueEl = $(".ls-queue"), statusEl = $(".ls-statustxt");
  const bigN = $(".ls-bign"), mFields = $(".ls-m-fields"), mFind = $(".ls-m-findings"), mDecls = $(".ls-m-decls");
  const bar = $(".ls-bar"), pctEl = $(".ls-pct"), overlay = $(".ls-complete"), wipeEl = $(".ls-wipe");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const docs = [];
  SHIPMENTS.forEach((s, si) => DOCTYPES.forEach((t) => docs.push({
    ship: si, ref: s.ref, tag: t.tag, name: t.name + "_" + s.ref,
    fields: t.keys.map((k) => ({ key: k, val: s.vals[k] })),
  })));

  const rowEls = {};
  ROWKEYS.forEach((k) => {
    const r = document.createElement("div");
    r.className = "ls-drow";
    const kEl = document.createElement("span"); kEl.className = "k"; kEl.textContent = k;
    const vEl = document.createElement("span"); vEl.className = "v"; vEl.textContent = "—";
    r.appendChild(kEl); r.appendChild(vEl);
    drows.appendChild(r); rowEls[k] = r;
  });
  const gateEls = Array.from(root.querySelectorAll(".ls-gate"));
  const slotEls = Array.from(root.querySelectorAll(".ls-slots i"));

  function fit() {
    const sc = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = "scale(" + sc + ")";
  }
  addEventListener("resize", fit); fit();

  let simT = 0, last = performance.now(), epoch = 0, completed = false, alive = true, rafId = 0;
  const anims = [], waiters = [];
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const lin = (p) => p;
  function wait(ms) { return new Promise((res) => waiters.push({ at: simT + ms, res })); }
  function animate(dur, fn, ease) {
    const t0 = simT, e = ease || easeIO;
    return new Promise((res) => anims.push({ t0, dur, fn, ease: e, res }));
  }

  const parts = [], ambient = [];
  for (let i = 0; i < 26; i++) {
    ambient.push({ x: Math.random() * 1920, y: Math.random() * 1080, v: 4 + Math.random() * 10, o: 0.04 + Math.random() * 0.05, s: 2 + Math.random() * 2 });
  }
  function burst(x, y, color, n, sp) {
    if (reduced) return;
    for (let i = 0; i < (n || 14); i++) {
      const a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 200) * (sp || 1);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: 0, life: 0.5 + Math.random() * 0.4, s: 2 + Math.random() * 3, c: color });
    }
  }
  const GLYPHS = "0123456789€#§<>=/";
  function glyph(x, y) {
    if (reduced || parts.length > 420) return;
    parts.push({ x, y, vx: (Math.random() - 0.5) * 26, vy: 50 + Math.random() * 110, t: 0, life: 0.45 + Math.random() * 0.3, c: INKT, ch: GLYPHS[(Math.random() * GLYPHS.length) | 0], g: 60 });
  }
  function trail(x, y) {
    if (reduced || parts.length > 420) return;
    parts.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, t: 0, life: 0.32, s: 2, c: ORANJE, g: 0 });
  }
  function drawFx(dt) {
    ctx.clearRect(0, 0, 1920, 1080);
    if (!reduced) {
      for (const a of ambient) {
        a.y -= a.v * dt;
        if (a.y < -10) { a.y = 1090; a.x = Math.random() * 1920; }
        ctx.globalAlpha = a.o; ctx.fillStyle = INKT; ctx.fillRect(a.x, a.y, a.s, a.s);
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      p.vy += (p.g != null ? p.g : 420) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.c;
      if (p.ch) { ctx.font = "600 11px ui-monospace, Menlo, monospace"; ctx.fillText(p.ch, p.x, p.y); }
      else { ctx.fillRect(p.x, p.y, p.s, p.s); }
    }
    ctx.globalAlpha = 1;
  }

  function cubic(a, b, c, d, p) {
    const q = 1 - p;
    return {
      x: q * q * q * a.x + 3 * q * q * p * b.x + 3 * q * p * p * c.x + p * p * p * d.x,
      y: q * q * q * a.y + 3 * q * q * p * b.y + 3 * q * p * p * c.y + p * p * p * d.y,
    };
  }
  function flyEl(el, from, to, dur, o) {
    o = o || {};
    const arc = o.arc != null ? o.arc : 120;
    const c1 = { x: from.x + (to.x - from.x) * 0.35, y: Math.min(from.y, to.y) - arc };
    const c2 = { x: from.x + (to.x - from.x) * 0.72, y: to.y - arc * 0.35 };
    const r0 = o.r0 || 0, r1 = o.r1 || 0, s0 = o.s0 != null ? o.s0 : 1, s1 = o.s1 != null ? o.s1 : 1;
    return animate(dur, (e) => {
      const pt = cubic(from, c1, c2, to, e);
      el.style.transform = "translate(" + pt.x + "px," + pt.y + "px) rotate(" + (r0 + (r1 - r0) * e) + "deg) scale(" + (s0 + (s1 - s0) * e) + ")";
      if (o.onUpdate) o.onUpdate(pt, e);
    }, o.ease);
  }

  function buildPile() {
    pileEl.innerHTML = "";
    docs.forEach((d, i) => {
      const el = document.createElement("div");
      el.className = "ls-doccard";
      el.innerHTML = '<span class="dtag">' + d.tag + "</span><i></i><i></i><i></i><i></i><i></i>";
      const col = i % 4, row = (i / 4) | 0;
      const x = 152 + col * 58 + (Math.random() * 16 - 8);
      const y = 336 + row * 48 + (Math.random() * 12 - 6);
      const r = Math.random() * 12 - 6;
      d.home = { x, y, r }; d.el = el;
      el.style.zIndex = String(40 - i);
      el.style.transform = "translate(" + x + "px," + y + "px) rotate(" + r + "deg)";
      pileEl.appendChild(el);
    });
  }

  let docsDone = 0, fieldsN = 0, findingsN = 0, declsDone = 0;
  function updateHud() {
    bigN.textContent = String(docsDone).padStart(2, "0");
    mFields.textContent = String(fieldsN);
    mFind.textContent = String(findingsN);
    mDecls.textContent = declsDone + "/4";
    const pr = Math.round((docsDone / 16) * 100);
    bar.style.transform = "scaleX(" + pr / 100 + ")";
    pctEl.textContent = pr + "%";
  }

  const rowShip = {};
  function setRow(key, val, ship) {
    const r = rowEls[key], v = r.querySelector(".v");
    rowShip[key] = ship;
    if (val === "ONTBREEKT") {
      v.textContent = "";
      const m = document.createElement("span"); m.className = "ls-miss"; m.textContent = "ONTBREEKT";
      v.appendChild(m);
    } else { v.textContent = val; }
    r.classList.remove("flash"); void r.offsetWidth; r.classList.add("flash");
  }
  function rowTarget(key) {
    const r = rowEls[key];
    return { x: 1462, y: decl.offsetTop + drows.offsetTop + r.offsetTop + r.offsetHeight / 2 - 12 };
  }
  function popBig() {
    bigN.classList.remove("pop"); void bigN.offsetWidth; bigN.classList.add("pop");
  }
  function pulseGate(g) {
    const el = gateEls[g];
    el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse");
  }
  function addFinding(f) {
    const t = document.createElement("div");
    t.className = "ls-finding";
    const pill = document.createElement("span"); pill.className = "fpill " + f.sev; pill.textContent = f.sev;
    const txt = document.createElement("span"); txt.textContent = f.text;
    t.appendChild(pill); t.appendChild(txt);
    findBox.prepend(t);
    while (findBox.children.length > 3) findBox.removeChild(findBox.lastChild);
    findingsN++; updateHud();
  }

  let scanLock = Promise.resolve();
  function acquireScanner() {
    let release;
    const p = new Promise((r) => { release = r; });
    const prev = scanLock;
    scanLock = prev.then(() => p);
    return prev.then(() => release);
  }

  async function emitChip(f, k, ep, ship) {
    await wait(60 + k * 110);
    if (ep !== epoch) return;
    const chip = document.createElement("div");
    chip.className = "ls-chip"; chip.textContent = f.key;
    fx.appendChild(chip);
    const target = rowTarget(f.key);
    let gi = 0;
    await flyEl(chip, { x: 1075, y: 452 }, target, 560, {
      arc: 70,
      onUpdate: (pt) => {
        while (gi < GATEX.length && pt.x >= GATEX[gi]) { pulseGate(gi); gi++; }
        if (Math.random() < 0.5) trail(pt.x + 8, pt.y + 12);
      },
    });
    chip.remove();
    if (ep !== epoch) return;
    setRow(f.key, f.val, ship);
    burst(1466, target.y + 10, ORANJE, 6, 0.5);
    fieldsN++; updateHud();
  }

  async function docPipeline(i, ep) {
    const d = docs[i], el = d.el, t = i / (docs.length - 1);
    el.style.zIndex = "300";
    const stagX = 656 + Math.random() * 24, stagY = 432 + Math.random() * 40;
    await flyEl(el, { x: d.home.x, y: d.home.y }, { x: stagX, y: stagY }, lerp(560, 330, t), { r0: d.home.r, r1: Math.random() * 6 - 3, arc: 160 });
    if (ep !== epoch) return;
    const release = await acquireScanner();
    if (ep !== epoch) { release(); return; }
    scanName.textContent = d.name;
    scanTime.textContent = "⌀ " + lerp(2.2, 0.6, t).toFixed(1).replace(".", ",") + " S PER DOCUMENT";
    await flyEl(el, { x: stagX, y: stagY }, { x: 892, y: 408 }, lerp(280, 180, t), { s0: 1, s1: 1.5, arc: 30 });
    if (ep !== epoch) { release(); return; }
    beam.classList.add("on");
    const bars = el.querySelectorAll("i");
    await animate(lerp(560, 260, t), (e) => {
      const bx = e * 264;
      beam.style.transform = "translateX(" + bx + "px)";
      bars.forEach((b, j) => { if (e > (j + 1) / 6) b.classList.add("hot"); });
      if (Math.random() < 0.6) glyph(782 + bx + Math.random() * 28, 430 + Math.random() * 130);
    }, lin);
    beam.classList.remove("on");
    if (ep !== epoch) { release(); return; }
    const chipPs = d.fields.map((f, k) => emitChip(f, k, ep, d.ship));
    burst(940, 470, ORANJE, 18);
    burst(940, 470, INKT, 10);
    animate(220, (e) => { el.style.opacity = String(1 - e); }).then(() => el.remove());
    docsDone++; updateHud(); popBig();
    release();
    if (FINDINGS[i]) {
      wait(350).then(() => { if (ep === epoch) addFinding(FINDINGS[i]); });
    }
    await Promise.all(chipPs);
    if (ep !== epoch) return;
    if (i % 4 === 3) await stampDecl(d.ship, ep);
  }

  async function stampDecl(si, ep) {
    await wait(180);
    if (ep !== epoch) return;
    declPill.textContent = "GEVALIDEERD";
    declPill.className = "ls-pill ok";
    decl.classList.add("stamp");
    burst(1626, 300, GROEN, 20);
    declsDone++;
    slotEls[si].classList.add("full");
    updateHud();
    await wait(lerp(550, 350, si / 3));
    if (ep !== epoch) return;
    decl.classList.remove("stamp");
    if (si < 3) {
      declRef.textContent = "AANGIFTE · " + SHIPMENTS[si + 1].ref;
      declPill.textContent = "CONCEPT";
      declPill.className = "ls-pill";
      ROWKEYS.forEach((k) => {
        // alleen waarden van de gestempelde zending wissen — chips van de
        // volgende zending kunnen op hoog tempo al geland zijn
        if (rowShip[k] !== undefined && rowShip[k] > si) return;
        rowEls[k].querySelector(".v").textContent = "—";
        rowEls[k].classList.remove("flash");
      });
    }
  }

  async function statusLoop(ep) {
    let i = 0;
    while (ep === epoch && !completed && alive) {
      statusEl.textContent = STATUS[i % STATUS.length];
      i++;
      await wait(1600);
    }
  }

  async function run(ep) {
    await wait(400);
    for (let i = 0; i < docs.length; i++) {
      if (ep !== epoch) return;
      docPipeline(i, ep);
      queueEl.textContent = (docs.length - i - 1) + " in wachtrij";
      await wait(lerp(1050, 320, i / (docs.length - 1)));
    }
    while (docsDone < docs.length && ep === epoch) await wait(150);
    if (ep !== epoch) return;
    await wait(850);
    if (ep !== epoch) return;
    finish();
  }

  function stagePos(el) {
    let x = 0, y = 0, n = el;
    while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
  }

  function finish() {
    completed = true;
    statusEl.textContent = "Gereed voor beoordeling";
    if (reduced) {
      overlay.classList.add("show");
    } else {
      wipeEl.style.opacity = "1";
      animate(750, (e) => {
        wipeEl.style.transform = "translateX(" + e * 1990 + "px)";
        if (e > 0.38) overlay.classList.add("show");
      }, lin).then(() => { wipeEl.style.opacity = "0"; });
      [730, 1180, 1630].forEach((tm, i) => {
        wait(tm).then(() => {
          if (!completed || !alive) return;
          const el = $(".ls-cw" + (i + 1));
          const p = stagePos(el);
          burst(p.x, p.y, ORANJE, 26, 1.3);
          burst(p.x, p.y, INKT, 10, 0.8);
        });
      });
    }
  }

  function tick(now) {
    if (!alive) return;
    const dt = Math.min(50, now - last);
    last = now;
    simT += dt;
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (simT >= waiters[i].at) { const w = waiters.splice(i, 1)[0]; w.res(); }
    }
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i];
      let p = (simT - a.t0) / a.dur;
      if (p >= 1) p = 1;
      a.fn(a.ease(p), p);
      if (p === 1) { anims.splice(i, 1); a.res(); }
    }
    drawFx(dt / 1000);
    rafId = requestAnimationFrame(tick);
  }

  $(".ls-go").addEventListener("click", onDone);
  $(".ls-skip").addEventListener("click", onDone);
  const onKey = (e) => { if (e.key === "Escape") onDone(); };
  addEventListener("keydown", onKey);

  buildPile();
  updateHud();
  rafId = requestAnimationFrame(tick);
  if (reduced) {
    docsDone = 16; fieldsN = 40; findingsN = 7; declsDone = 4;
    slotEls.forEach((s) => s.classList.add("full"));
    updateHud();
    finish();
  } else {
    statusLoop(0);
    run(0);
  }

  return () => {
    alive = false;
    epoch++;
    cancelAnimationFrame(rafId);
    removeEventListener("resize", fit);
    removeEventListener("keydown", onKey);
    waiters.splice(0).forEach((w) => w.res());
    anims.splice(0).forEach((a) => a.res());
  };
}

export default function OpeningScreen() {
  const [zichtbaar, setZichtbaar] = useState(true);
  const [vervaagd, setVervaagd] = useState(false);
  const rootRef = useRef(null);
  const dichtRef = useRef(false);

  useEffect(() => {
    /* Harde refresh (Ctrl+Shift+R) speelt opnieuw af; gewone reload en
       navigatie niet. Detectie: bij een harde refresh komen de immutable
       /_next/static-assets opnieuw over het netwerk (transferSize > 0),
       bij een zachte reload komen ze uit de browsercache. */
    let hardeRefresh = false;
    try {
      // alleen de eerste mount na de paginalade, en alleen kort erna —
      // een latere klik op "Aangiftecockpit" is navigatie, geen refresh
      if (!hardeCheckGedaan && performance.now() < 5000) {
        const nav = performance.getEntriesByType("navigation")[0];
        if (nav?.type === "reload") {
          const statisch = performance.getEntriesByType("resource").filter((r) => r.name.includes("/_next/static/"));
          hardeRefresh = statisch.length > 0 && statisch.some((r) => r.transferSize > 0 && r.deliveryType !== "cache");
        }
      }
    } catch { /* oude browser — val terug op sessiegedrag */ }
    hardeCheckGedaan = true;
    if (sessionStorage.getItem(SESSION_KEY) && !hardeRefresh) { setZichtbaar(false); return; }
    const sluit = () => {
      if (dichtRef.current) return;
      dichtRef.current = true;
      sessionStorage.setItem(SESSION_KEY, "1");
      setVervaagd(true);
      setTimeout(() => setZichtbaar(false), 550);
    };
    const cleanup = boot(rootRef.current, sluit);
    return cleanup;
  }, []);

  if (!zichtbaar) return null;

  return (
    <div className={`ls-root ${vervaagd ? "weg" : ""}`} ref={rootRef} role="status" aria-label="Aangiftecockpit wordt geladen">
      <div className="ls-stage">
        <svg className="ls-routes" viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true">
          <path className="route r1" d="M -60 760 C 420 520 980 1010 1980 640" />
          <path className="route r2" d="M -60 320 C 520 540 1240 160 1980 420" />
          <path className="route r3" d="M -60 980 C 700 820 1300 1060 1980 880" />
        </svg>
        <div className="ls-routedots" aria-hidden="true">
          <div className="rdot d1" /><div className="rdot d2" /><div className="rdot d3" />
        </div>

        <header className="ls-brand">
          <div className="wordmark"><span className="wm">WAIMAKERS</span><span className="x">×</span><span className="gl">GLOBALLOGISTICS</span></div>
          <div className="sub">VAN INTAKE TOT AANGIFTE</div>
          <div className="rule" />
        </header>
        <div className="ls-zlabel ls-zl-intake">INTAKE · KLANT-DATADUMP<span className="ls-queue">16 in wachtrij</span></div>
        <div className="ls-pile" />

        <div className="ls-connector c1" />
        <div className="ls-connector c2" />

        <div className="ls-scanner">
          <div className="shead"><span>EXTRACTIE</span><span className="live"><span className="dot" /><span>ANALYSEER LIVE</span></span></div>
          <div className="sbody">
            <div className="corner tl" /><div className="corner tr" />
            <div className="corner bl" /><div className="corner br" />
          </div>
        </div>
        <div className="ls-beam" />
        <div className="ls-scanname">—</div>
        <div className="ls-scantime" />

        <div className="ls-gates">
          <span className="ls-gate" data-n="1" /><span className="ls-gate" data-n="2" /><span className="ls-gate" data-n="3" /><span className="ls-gate" data-n="4" /><span className="ls-gate" data-n="5" />
        </div>
        <div className="ls-zlabel ls-zl-gates">VIJF VALIDATIELAGEN</div>

        <div className="ls-decl">
          <div className="dhead"><span className="ls-declref">AANGIFTE · CH20246006</span><span className="ls-pill ls-declpill">CONCEPT</span></div>
          <div className="ls-drows" />
        </div>
        <div className="ls-stack">
          <span className="slabel">AANGIFTEN GEREED</span>
          <span className="ls-slots"><i /><i /><i /><i /></span>
        </div>

        <div className="ls-zlabel ls-zl-find">BEVINDINGEN · ONZEKERHEID EERST</div>
        <div className="ls-findings" />

        <div className="ls-hud">
          <div className="big">
            <div className="num"><span className="ls-bign">00</span><span className="of">/ 16</span></div>
            <div className="lbl">DOCUMENTEN VERWERKT</div>
          </div>
          <div className="status"><span className="dot" /><span className="ls-statustxt">Datadump lezen…</span></div>
          <div className="minis">
            <div className="mini"><span className="mn ls-m-fields">0</span><span className="ml">VELDEN</span></div>
            <div className="mini"><span className="mn ls-m-findings">0</span><span className="ml">BEVINDINGEN</span></div>
            <div className="mini"><span className="mn ls-m-decls">0/4</span><span className="ml">AANGIFTEN</span></div>
          </div>
        </div>
        <div className="ls-progress"><div className="ls-bar" /></div>
        <div className="ls-pct">0%</div>

        <canvas className="ls-canvas" width="1920" height="1080" aria-hidden="true" />
        <div className="ls-fx" />
        <div className="ls-wipe" />

        <div className="ls-complete">
          <div className="cinner">
            <div className="cbrand">WAIMAKERS × GLOBALLOGISTICS</div>
            <div className="cwords">
              <span className="cw ls-cw1">Learn<span className="o">.</span></span>
              <span className="cw ls-cw2">Lead<span className="o">.</span></span>
              <span className="cw ls-cw3">Make<span className="o">.</span></span>
            </div>
            <h1 className="cfit">Fit for the future<span className="o">.</span></h1>
            <div className="crule" />
            <button className="ls-go" type="button">LET&apos;S GO →</button>
          </div>
        </div>
      </div>
      <button className="ls-skip" type="button">Overslaan →</button>
    </div>
  );
}
