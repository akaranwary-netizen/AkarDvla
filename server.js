import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ZYFY_API_KEY = process.env.ZYFY_API_KEY;
const ZYFY_BACKUP_API_KEY = process.env.ZYFY_BACKUP_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// DVSA MOT History API credentials (keep these only in Render Environment)
const DVSA_API_KEY = process.env.DVSA_API_KEY;
const DVSA_CLIENT_ID = process.env.DVSA_CLIENT_ID;
const DVSA_CLIENT_SECRET = process.env.DVSA_CLIENT_SECRET;
const DVSA_SCOPE = process.env.DVSA_SCOPE;
const DVSA_TOKEN_URL = process.env.DVSA_TOKEN_URL;

let dvsaAccessToken = null;
let dvsaTokenExpiresAt = 0;

async function getDvsaToken() {
  if (dvsaAccessToken && Date.now() < dvsaTokenExpiresAt - 60000) {
    return dvsaAccessToken;
  }

  if (!DVSA_CLIENT_ID || !DVSA_CLIENT_SECRET || !DVSA_SCOPE || !DVSA_TOKEN_URL) {
    return null;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: DVSA_CLIENT_ID,
    client_secret: DVSA_CLIENT_SECRET,
    scope: DVSA_SCOPE
  });

  const response = await fetch(DVSA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`DVSA token error ${response.status}: ${txt.slice(0, 200)}`);
  }

  const data = await response.json();
  dvsaAccessToken = data.access_token;
  dvsaTokenExpiresAt = Date.now() + Number(data.expires_in || 3600) * 1000;
  return dvsaAccessToken;
}

async function fetchDvsaMotHistory(registration) {
  if (!DVSA_API_KEY) return null;
  const token = await getDvsaToken();
  if (!token) return null;

  const response = await fetch(
    `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(registration)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-API-Key": DVSA_API_KEY,
        Accept: "application/json"
      }
    }
  );

  if (response.status === 404) return { motTests: [] };
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`DVSA MOT error ${response.status}: ${txt.slice(0, 200)}`);
  }
  return response.json();
}

function normaliseDvsaMotTests(payload) {
  const tests = Array.isArray(payload?.motTests) ? payload.motTests : [];
  return tests.map(test => {
    const defects = Array.isArray(test.defects) ? test.defects : [];
    return {
      testDate: test.completedDate || test.testDate || null,
      result: test.testResult || test.result || null,
      expiryDate: test.expiryDate || null,
      odometerMiles: test.odometerUnit === "mi" || !test.odometerUnit
        ? Number(test.odometerValue ?? test.odometerMiles ?? 0) || null
        : null,
      odometer: test.odometerValue ?? null,
      odometerUnit: test.odometerUnit || null,
      advisories: defects.map(d => ({
        text: d.text || d.description || d.comment || "",
        type: d.type || d.defectType || null,
        dangerous: Boolean(d.dangerous)
      })).filter(d => d.text)
    };
  });
}


const MOT_SORANI_CACHE = new Map();

async function translateMotTextsToSorani(texts) {
  const cleanTexts = [...new Set((texts || []).map(v => String(v || "").trim()).filter(Boolean))];
  if (!cleanTexts.length || !GEMINI_API_KEY) return {};

  const result = {};
  const missing = [];
  for (const text of cleanTexts) {
    if (MOT_SORANI_CACHE.has(text)) result[text] = MOT_SORANI_CACHE.get(text);
    else missing.push(text);
  }
  if (!missing.length) return result;

  const models = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];

  for (let offset = 0; offset < missing.length; offset += 20) {
    const batch = missing.slice(offset, offset + 20);
    let translated = null;

    for (const model of models) {
      try {
        const prompt = `Translate these UK MOT defect/advisory descriptions from English into natural, clear Kurdish Sorani (Central Kurdish).

STRICT RULES:
- Return ONLY a JSON array of strings.
- Same number of items and same order as the input.
- Translate the meaning fully, including words such as worn, fractured, corroded, play, leaking, insecure, damaged and weakened.
- Keep MOT technical inspection reference codes exactly unchanged, for example (5.3.1 (b) (i)).
- Keep measurements, numbers, tyre sizes, registration numbers and abbreviations unchanged.
- Use wording understandable to an ordinary Kurdish Sorani speaker, while preserving the mechanical meaning.
- Do not add explanations or advice.

INPUT:
${JSON.stringify(batch)}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", maxOutputTokens: 5000 }
            })
          }
        );

        const raw = await response.text();
        let data = null;
        try { data = JSON.parse(raw); } catch {}
        if (!response.ok) continue;

        let modelText = data?.candidates?.[0]?.content?.parts?.map(p => p?.text || "").join("").trim();
        if (!modelText) continue;
        modelText = modelText.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

        let arr = null;
        try { arr = JSON.parse(modelText); } catch {}
        if (Array.isArray(arr) && arr.length === batch.length) {
          translated = arr.map(v => String(v || "").trim());
          break;
        }
      } catch (e) {
        console.error("Gemini MOT Sorani translation error:", e.message);
      }
    }

    if (translated) {
      batch.forEach((source, i) => {
        const target = translated[i] || source;
        MOT_SORANI_CACHE.set(source, target);
        result[source] = target;
      });
    } else {
      batch.forEach(source => { result[source] = source; });
    }
  }

  return result;
}

async function addSoraniToMotHistory(motHistory) {
  if (!Array.isArray(motHistory) || !motHistory.length || !GEMINI_API_KEY) return motHistory;
  const allTexts = [];
  motHistory.forEach(test => {
    const notes = Array.isArray(test.advisories) ? test.advisories : [];
    notes.forEach(note => {
      const text = typeof note === "string" ? note : note?.text;
      if (text) allTexts.push(text);
    });
  });
  const translations = await translateMotTextsToSorani(allTexts);
  return motHistory.map(test => ({
    ...test,
    advisories: (Array.isArray(test.advisories) ? test.advisories : []).map(note => {
      if (typeof note === "string") return { text: note, kurdishText: translations[note] || note, type: null };
      return { ...note, kurdishText: translations[note?.text] || note?.text || "" };
    })
  }));
}

app.use(express.json());
app.use(express.static("public"));

function پاککردنەوەی_ژمارە(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}


app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *
Allow: /

Sitemap: https://dvlabyakar.onrender.com/sitemap.xml
`);
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://dvlabyakar.onrender.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="ckb" dir="rtl">
<head>
<meta name="google-site-verification" content="qFWdo65b2VIDInQWb2JmLyN2mY8LqHA_u4fNw5dUP74" />
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#070809">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Akar’s Car Check">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<meta name="description" content="Check any UK vehicle registration for MOT, tax, mileage, fuel cost, Clean Air Zone information and market price guidance with Akar's Car Check." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Akar's Car Check – Free UK MOT, Tax, Mileage & CAZ Check" />
  <meta property="og:description" content="Check any UK vehicle registration for MOT, tax, mileage, fuel cost, Clean Air Zone information and market price guidance with Akar's Car Check." />
  <meta property="og:url" content="https://dvlabyakar.onrender.com/" />
  <meta property="og:site_name" content="Akar's Car Check" />
  <meta name="twitter:card" content="summary" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
<link rel="canonical" href="https://dvlabyakar.onrender.com/">
<title>Akar's Car Check – Free UK MOT, Tax, Mileage & CAZ Check</title>

<style>
:root{
  --bg:#070809;
  --panel:#111419;
  --panel2:#171a20;
  --gold:#d7b36a;
  --gold2:#f4d99a;
  --text:#f7f7f7;
  --muted:#9da4ad;
  --line:#252a31;
  --green:#5dd39e;
  --amber:#f7c76d;
  --red:#ff7070;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  font-family:Arial,Tahoma,sans-serif;
  background:
    radial-gradient(circle at 20% 0%,rgba(215,179,106,.10),transparent 34%),
    linear-gradient(180deg,#050607 0%,#0b0d10 45%,#08090b 100%);
  color:var(--text);
}
.topbar{
  position:sticky;top:0;z-index:20;
  background:rgba(6,7,9,.82);
  backdrop-filter:blur(16px);
  border-bottom:1px solid rgba(255,255,255,.05);
}
.topbar-inner{
  max-width:1180px;margin:auto;padding:18px 22px;
  display:flex;justify-content:space-between;align-items:center;
}
.brand{direction:ltr;font-weight:900;font-size:22px;letter-spacing:.5px}
.brand span{color:var(--gold)}
.tag{
  border:1px solid #2d3239;background:#111319;color:#d8dce1;
  border-radius:999px;padding:8px 12px;font-size:12px
}
.hero{
  min-height:590px;position:relative;overflow:hidden;display:flex;align-items:center
}
.hero::after{
  content:"";position:absolute;inset:0;
  background:linear-gradient(90deg,rgba(7,8,9,.99),rgba(7,8,9,.83) 46%,rgba(7,8,9,.15));
}
.hero-art{
  position:absolute;right:-3%;bottom:15px;width:min(760px,62vw);
  filter:drop-shadow(0 35px 50px #000);opacity:.96
}
.hero-inner{
  position:relative;z-index:2;width:100%;max-width:1180px;
  margin:auto;padding:86px 22px 108px
}
.eyebrow{
  display:inline-block;color:var(--gold2);
  border:1px solid rgba(215,179,106,.25);
  background:rgba(215,179,106,.08);
  padding:8px 12px;border-radius:999px;font-size:12px;font-weight:800
}
.hero h1{
  max-width:670px;margin:20px 0 12px;
  font-size:clamp(40px,7vw,72px);line-height:1.02;font-weight:900
}
.hero h1 span{color:var(--gold2)}
.hero p{
  max-width:620px;color:#b7bdc6;font-size:17px;line-height:1.8;margin:0 0 28px
}
.search-wrap{
  max-width:670px;background:rgba(18,21,26,.90);
  border:1px solid rgba(215,179,106,.18);border-radius:20px;
  padding:14px;display:flex;gap:12px;direction:ltr;
  box-shadow:0 20px 60px rgba(0,0,0,.35);backdrop-filter:blur(14px)
}
.plate-input{
  flex:1;min-width:0;background:#f7d33c;color:#111;border:0;border-radius:12px;
  padding:17px;text-align:center;font-size:25px;font-weight:900;
  letter-spacing:3px;text-transform:uppercase;outline:none;
  box-shadow:inset 0 0 0 2px #111
}
.primary-btn{
  border:0;border-radius:12px;padding:0 24px;font-weight:900;font-size:15px;
  cursor:pointer;background:linear-gradient(135deg,var(--gold2),var(--gold));
  color:#16120b;box-shadow:0 12px 30px rgba(215,179,106,.18)
}
.primary-btn:disabled{opacity:.55;cursor:wait}
.check-another-wrap{display:flex;justify-content:center;margin:28px 0 4px}
.check-another-btn{
  width:min(520px,100%);border:1px solid rgba(215,179,106,.32);border-radius:15px;
  padding:16px 22px;background:linear-gradient(145deg,rgba(27,30,35,.98),rgba(14,16,20,.98));
  color:var(--gold2);font-size:16px;font-weight:900;cursor:pointer;
  box-shadow:0 14px 35px rgba(0,0,0,.22);
}
.check-another-btn:hover{border-color:rgba(215,179,106,.6);transform:translateY(-1px)}


/* Compare two cars */
.compare-action{grid-column:1/-1;border-color:rgba(215,179,106,.32);background:linear-gradient(135deg,rgba(215,179,106,.13),rgba(18,21,26,.98));cursor:pointer;font:inherit}
.compare-action:hover{transform:translateY(-2px);border-color:rgba(215,179,106,.5)}
.compare-modal{width:min(980px,100%);max-height:92vh;overflow:auto;background:linear-gradient(145deg,#15181d,#0b0d10);border:1px solid rgba(215,179,106,.28);border-radius:24px;padding:22px;box-shadow:0 28px 90px rgba(0,0,0,.6)}
.compare-input-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0}
.compare-input-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:16px}
.compare-input-card label{display:block;font-weight:900;margin-bottom:8px}
.compare-plate{width:100%;background:#f7d33c;color:#111;border:0;border-radius:10px;padding:14px;text-align:center;font-size:21px;font-weight:900;letter-spacing:2px;text-transform:uppercase;outline:none;box-shadow:inset 0 0 0 2px #151515}
.compare-run-btn{width:100%;border:0;border-radius:13px;padding:15px 18px;font-weight:900;font-size:15px;cursor:pointer;background:linear-gradient(135deg,var(--gold2),var(--gold));color:#17120a}
.compare-run-btn:disabled{opacity:.6;cursor:wait}
.compare-status{display:none;margin:14px 0;padding:12px;border-radius:12px;background:rgba(215,179,106,.07);border:1px solid rgba(215,179,106,.15);color:#d7dbe0;text-align:center}
.compare-results{display:none;margin-top:18px}
.compare-head-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.compare-car{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:16px}
.compare-car.winner{border-color:rgba(93,211,158,.45);box-shadow:0 0 0 1px rgba(93,211,158,.12) inset}
.compare-car h3{margin:0 0 4px;font-size:20px}.compare-reg{color:var(--gold2);font-weight:900;direction:ltr}
.compare-score{font-size:28px;font-weight:900;margin:10px 0;color:var(--gold2)}
.compare-table{margin-top:14px;border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden}
.compare-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid var(--line)}
.compare-row:last-child{border-bottom:0}.compare-row>div{padding:11px 12px;font-size:12px}.compare-row>div:not(:last-child){border-left:1px solid var(--line)}
.compare-row .compare-label{color:var(--muted);font-weight:800}.compare-row .compare-value{direction:ltr;text-align:center;font-weight:800}
.compare-ai{margin-top:16px;background:radial-gradient(circle at 85% 0%,rgba(215,179,106,.12),transparent 35%),rgba(255,255,255,.035);border:1px solid rgba(215,179,106,.2);border-radius:18px;padding:18px}
.compare-ai h3{margin:0 0 10px}.compare-verdict{font-size:18px;font-weight:900;color:var(--gold2);margin-bottom:10px}.compare-summary{line-height:1.8;color:#d4d8dd}
.compare-points{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.compare-point{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px;font-size:12px;line-height:1.55}
@media(max-width:700px){.compare-input-grid,.compare-head-grid,.compare-points{grid-template-columns:1fr}.compare-row{grid-template-columns:1fr 1fr 1fr}.compare-row>div{padding:9px 6px;font-size:11px}}

.report-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:28px 0 4px}
.report-actions .check-another-btn{width:min(360px,100%)}
.print-report-btn{
  width:min(360px,100%);border:0;border-radius:15px;padding:16px 22px;
  background:linear-gradient(135deg,var(--gold2),var(--gold));color:#17120a;
  font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 14px 35px rgba(215,179,106,.16)
}
.print-report-btn:hover{filter:brightness(1.04);transform:translateY(-1px)}
.print-only{display:none}
@media print{
  @page{size:A4;margin:12mm}
  html,body{background:#fff!important;color:#111!important}
  body{font-family:Arial,Tahoma,sans-serif!important}
  .topbar,.hero,.quick-actions,.message,footer,.report-actions,.action-row,.caz-pay-button,.language-modal,.language-loading-overlay,.modal-overlay{display:none!important}
  .content{max-width:none!important;padding:0!important;margin:0!important}
  .report{display:block!important}
  .print-only{display:block!important}
  .summary,.card,.mot-item,.mot-section,.fuel-cost-box,.market-box,.caz-row,.issue-item,.service-item,.repair-item{
    background:#fff!important;color:#111!important;box-shadow:none!important;border-color:#bbb!important;
    break-inside:avoid;page-break-inside:avoid
  }
  .grid{display:block!important}
  .card{margin:0 0 12px!important;padding:14px!important}
  .card.full{display:block!important}
  .expand-box{display:block!important}
  .section-title{margin:16px 0 10px!important}
  .section-title h2,.card h3,.car-name,.issue-title,.repair-title{color:#111!important}
  .label,.muted,.small,.car-sub,.note,.mot-line,.mot-section-title{color:#333!important}
  .value,.plate,.mot-date,.market-box strong,.fuel-cost-box strong{color:#111!important}
  .plate{border:1px solid #111!important;background:#f4d33d!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .score{background:none!important;border:2px solid #444!important;width:64px!important;height:64px!important}
  .score::before{display:none!important}
  .score strong{color:#111!important}
  #printReportHeader{display:flex!important;justify-content:space-between;align-items:flex-end;gap:20px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:16px}
  #printReportHeader strong{font-size:20px}
  #printReportMeta{font-size:11px;color:#444;text-align:end}
  #printRepairSection{margin-top:12px}
  .repair-price-grid{grid-template-columns:repeat(3,1fr)!important}
  a{color:#111!important;text-decoration:none!important}
}
.hero-note{margin-top:12px;color:#7f8791;font-size:12px}

.quick-actions{
  max-width:1180px;margin:-44px auto 0;position:relative;z-index:5;
  padding:0 22px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px
}
.quick-action{
  text-decoration:none;color:#f4f4f4;
  background:linear-gradient(145deg,rgba(20,23,28,.97),rgba(11,13,16,.97));
  border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:17px;
  display:flex;justify-content:center;align-items:center;gap:9px;font-weight:800;
  box-shadow:0 20px 55px rgba(0,0,0,.25)
}
.quick-action.gold{color:var(--gold2);border-color:rgba(215,179,106,.25)}
.quick-action:hover{transform:translateY(-2px);border-color:rgba(215,179,106,.28)}

.content{max-width:1180px;margin:auto;padding:24px 22px 80px}
.message{
  display:none;border-radius:14px;padding:14px 16px;margin:4px 0 16px;
  background:#13171c;border:1px solid var(--line);color:#dfe3e8
}
.message.error{background:#281316;border-color:#592328;color:#ffb7b7}
.report{display:none}

.summary{
  background:linear-gradient(145deg,rgba(20,23,28,.96),rgba(11,13,16,.96));
  border:1px solid rgba(215,179,106,.18);border-radius:22px;padding:22px;
  display:grid;grid-template-columns:1.2fr .8fr;gap:18px;
  box-shadow:0 25px 80px rgba(0,0,0,.30)
}
.summary-main{display:flex;align-items:center;gap:18px}
.plate{
  direction:ltr;background:#f7d33c;color:#111;border-radius:9px;
  padding:12px 18px;font-size:23px;font-weight:900;letter-spacing:2px;
  box-shadow:inset 0 0 0 2px #151515
}
.car-name{font-size:24px;font-weight:900;margin-bottom:5px}
.car-sub{color:var(--muted);font-size:13px;direction:ltr;text-align:right}
.scorebox{
  border-right:1px solid var(--line);padding-right:20px;
  display:flex;align-items:center;justify-content:space-between;gap:14px
}
.score{
  min-width:78px;width:78px;height:78px;border-radius:50%;display:grid;place-items:center;
  background:conic-gradient(var(--green) 0 68%,#272c33 68% 100%);position:relative
}
.score::before{content:"";position:absolute;inset:7px;border-radius:50%;background:#12151a}
.score strong{position:relative;font-size:20px}
.score-text small{color:var(--muted)}
.score-text b{display:block;margin-top:4px}

.section-title{margin:30px 0 16px}
.section-title h2{margin:0 0 5px;font-size:28px}
.section-title p{margin:0;color:var(--muted);font-size:13px}

.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{
  background:linear-gradient(180deg,rgba(20,23,28,.96),rgba(13,15,18,.96));
  border:1px solid rgba(255,255,255,.055);border-radius:18px;padding:20px;
  box-shadow:0 12px 35px rgba(0,0,0,.16)
}
.card:hover{border-color:rgba(215,179,106,.22)}
.card.full{grid-column:1/-1}
.card h3{margin:0 0 16px;font-size:16px;display:flex;align-items:center;gap:8px}
.icon{
  width:34px;height:34px;border-radius:10px;display:grid;place-items:center;
  background:rgba(215,179,106,.1);border:1px solid rgba(215,179,106,.18)
}
.row{
  display:flex;justify-content:space-between;gap:16px;padding:10px 0;
  border-bottom:1px solid var(--line);font-size:13px
}
.row:last-child{border-bottom:0}
.label{color:#8e96a0}
.value{font-weight:700;text-align:left;direction:ltr;max-width:58%}
.good{color:var(--green)}
.warn{color:var(--amber)}
.bad{color:var(--red)}
.muted{color:var(--muted);line-height:1.7}
.note{
  margin-top:13px;background:rgba(215,179,106,.07);
  border:1px solid rgba(215,179,106,.15);border-radius:12px;
  color:#c7cbd1;padding:12px;line-height:1.65;font-size:12px
}
.mot-item{margin:0 0 16px;padding:16px;border:1px solid rgba(215,179,106,.18);background:rgba(255,255,255,.025);border-radius:14px}
.mot-item:last-child{margin-bottom:0}
.mot-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--line)}
.mot-date{font-weight:900;color:var(--gold2);font-size:15px;direction:ltr}
.mot-result{font-weight:900;border-radius:999px;padding:5px 10px;font-size:12px;direction:ltr}
.mot-result.pass{color:var(--green);background:rgba(93,211,158,.10);border:1px solid rgba(93,211,158,.25)}
.mot-result.fail{color:var(--red);background:rgba(255,112,112,.10);border:1px solid rgba(255,112,112,.25)}
.mot-section{margin-top:12px;padding:11px 12px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05)}
.mot-section-title{font-size:12px;font-weight:900;margin-bottom:7px;color:#d9dde2}
.mot-line{font-size:12px;color:#b9c0c8;line-height:1.65;padding:4px 0}
.mot-line.dangerous{color:#ff8e8e}.mot-line.major{color:#ff9f7a}.mot-line.minor{color:#f7c76d}.mot-line.advisory{color:#c4c9d0}
.small{font-size:12px;color:#a8afb8;line-height:1.6}


.fuel-cost-card{grid-column:1/-1;position:relative;overflow:hidden;background:radial-gradient(circle at 88% 12%,rgba(244,217,154,.10),transparent 30%),linear-gradient(145deg,rgba(18,21,26,.98),rgba(11,13,16,.98));border:1px solid rgba(215,179,106,.22)}
.fuel-cost-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px}
.fuel-cost-box{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:16px;text-align:center}
.fuel-cost-box small{display:block;color:var(--muted);margin-bottom:8px}
.fuel-cost-box strong{display:block;direction:ltr;color:var(--gold2);font-size:20px}
.fuel-meta{margin-top:14px;display:flex;flex-wrap:wrap;gap:9px}
.fuel-pill{background:rgba(215,179,106,.08);border:1px solid rgba(215,179,106,.16);border-radius:999px;padding:7px 10px;color:#c7cbd1;font-size:12px}
@media(max-width:760px){.fuel-cost-grid{grid-template-columns:1fr 1fr}}
@media(max-width:440px){.fuel-cost-grid{grid-template-columns:1fr}}




.caz-card{
  grid-column:1/-1;
  background:linear-gradient(145deg,rgba(14,22,18,.98),rgba(10,14,12,.98));
  border:1px solid rgba(114,190,137,.22);
}
.caz-list{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.caz-row{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);
  border-radius:13px;padding:13px 14px
}
.caz-city{font-weight:900;color:#f3f4f5}
.caz-status{font-weight:900;text-align:left;direction:ltr}
.caz-pay-button{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  margin-top:14px;padding:12px 16px;border-radius:12px;
  background:linear-gradient(135deg,var(--gold),var(--gold2));
  color:#111;font-weight:900;text-decoration:none;border:0;
}
.caz-pay-button:hover{filter:brightness(1.04)}

.caz-ok{color:#7fd59a}
.caz-pay{color:#ffb36b}
.caz-check{color:#f2d17f}
@media(max-width:650px){.caz-list{grid-template-columns:1fr}}

.similar-card{
  grid-column:1/-1;
  background:linear-gradient(145deg,rgba(17,20,25,.98),rgba(10,12,15,.98));
  border:1px solid rgba(215,179,106,.18);
}

.similar-chart{
  display:flex;
  flex-direction:column;
  gap:14px;
  margin-top:16px;
}
.market-summary{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
  margin-bottom:16px;
}
.market-box{
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.07);
  border-radius:14px;
  padding:15px;
  text-align:center;
}
.market-box small{
  display:block;
  color:var(--muted);
  margin-bottom:7px;
  font-size:11px;
}
.market-box strong{
  display:block;
  color:var(--gold2);
  font-size:20px;
  direction:ltr;
}
.market-bar-row{
  display:grid;
  grid-template-columns:150px 1fr 88px;
  gap:12px;
  align-items:center;
}
.market-bar-label{
  color:#cfd3d8;
  font-size:12px;
  font-weight:800;
}
.market-bar-track{
  height:30px;
  border-radius:10px;
  overflow:hidden;
  background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.06);
}
.market-bar{
  height:100%;
  min-width:4px;
  border-radius:9px;
  background:linear-gradient(90deg,rgba(215,179,106,.55),var(--gold));
}
.market-bar-value{
  text-align:left;
  direction:ltr;
  font-size:12px;
  font-weight:900;
  color:var(--gold2);
}
@media(max-width:700px){
  .market-summary{grid-template-columns:1fr}
  .market-bar-row{grid-template-columns:110px 1fr 76px}
}
  }

.language-switch{
  border:1px solid rgba(215,179,106,.28);
  background:rgba(215,179,106,.08);
  color:var(--gold2);
  border-radius:999px;
  padding:8px 12px;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
}
.language-modal{
  position:fixed;
  inset:0;
  z-index:9999;
  display:none;
  align-items:center;
  justify-content:center;
  padding:22px;
  background:rgba(0,0,0,.76);
  backdrop-filter:blur(12px);
}
.language-modal.show{display:flex}
.language-box{
  width:min(430px,100%);
  background:linear-gradient(145deg,#16191e,#0d0f12);
  border:1px solid rgba(215,179,106,.28);
  border-radius:24px;
  padding:26px;
  text-align:center;
  box-shadow:0 28px 90px rgba(0,0,0,.55);
}
.language-box h2{
  margin:0 0 8px;
  color:#fff;
  font-size:27px;
}
.language-box p{
  margin:0 0 20px;
  color:var(--muted);
  line-height:1.7;
}
.language-choice{
  width:100%;
  border:1px solid var(--line);
  background:#12151a;
  color:#fff;
  padding:16px 18px;
  border-radius:14px;
  font-size:17px;
  font-weight:900;
  cursor:pointer;
  margin-top:10px;
}
.language-choice.default{
  background:linear-gradient(135deg,var(--gold2),var(--gold));
  color:#17120a;
  border-color:transparent;
}
.language-note{
  margin-top:14px;
  color:#7e8690;
  font-size:11px;
}

/* Extra vehicle insight cards */
.insight-card{grid-column:1/-1;background:linear-gradient(145deg,rgba(20,23,28,.98),rgba(11,13,16,.98));border:1px solid rgba(215,179,106,.18)}
.insight-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px}
.insight-box{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:15px;text-align:center;min-height:92px;display:flex;flex-direction:column;justify-content:center}
.insight-box small{display:block;color:var(--muted);font-size:11px;margin-bottom:8px}
.insight-box strong{display:block;color:var(--gold2);font-size:19px;direction:ltr}
.action-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.secondary-btn{border:1px solid rgba(215,179,106,.24);background:rgba(215,179,106,.08);color:var(--gold2);border-radius:12px;padding:12px 15px;font-weight:900;cursor:pointer}
.secondary-btn:hover{background:rgba(215,179,106,.14)}
.secondary-btn:disabled{opacity:.5;cursor:not-allowed}
.expand-box{display:none;margin-top:14px;border-top:1px solid var(--line);padding-top:12px}
.expand-box.show{display:block}
.issue-item,.service-item{padding:12px 0;border-bottom:1px solid var(--line)}
.issue-item:last-child,.service-item:last-child{border-bottom:0}
.issue-title{font-weight:900;color:#f2f3f4;margin-bottom:5px}
.issue-meta{font-size:11px;color:var(--gold2);margin-bottom:5px}
.modal-overlay{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(10px)}
.modal-overlay.show{display:flex}
.repair-modal{width:min(680px,100%);max-height:85vh;overflow:auto;background:linear-gradient(145deg,#171a20,#0c0e11);border:1px solid rgba(215,179,106,.3);border-radius:22px;padding:22px;box-shadow:0 30px 90px #000}
.modal-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
.modal-head h2{margin:0;font-size:22px}
.modal-close{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:#12151a;color:#fff;font-size:20px;cursor:pointer}
.repair-item{padding:14px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);border-radius:13px;margin-top:10px}
.repair-title{font-weight:900;margin-bottom:9px}
.repair-price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.repair-price{background:rgba(0,0,0,.18);border-radius:9px;padding:10px;text-align:center}
.repair-price small{display:block;color:var(--muted);margin-bottom:5px}
.repair-price b{direction:ltr;color:var(--gold2)}
.source-chip{display:inline-block;margin-top:10px;border-radius:999px;padding:6px 9px;font-size:10px;background:rgba(215,179,106,.08);border:1px solid rgba(215,179,106,.15);color:#bbb}
@media(max-width:800px){.insight-grid{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.insight-grid,.repair-price-grid{grid-template-columns:1fr}}


.language-loading-overlay{
  position:fixed;inset:0;z-index:10050;display:none;align-items:center;justify-content:center;
  padding:22px;background:rgba(4,5,7,.88);backdrop-filter:blur(14px)
}
.language-loading-overlay.show{display:flex}
.language-loading-box{
  width:min(460px,100%);background:linear-gradient(145deg,#171a1f,#0d0f12);
  border:1px solid rgba(215,179,106,.30);border-radius:24px;padding:26px;
  box-shadow:0 30px 100px rgba(0,0,0,.58);text-align:center
}
.language-loading-icon{font-size:34px;margin-bottom:10px}
.language-loading-title{font-size:22px;font-weight:900;color:#fff;margin-bottom:7px}
.language-loading-status{font-size:13px;color:#aeb5be;min-height:20px;margin-bottom:16px}
.language-progress-track{
  direction:ltr;width:100%;height:12px;border-radius:999px;overflow:hidden;
  background:#252a31;border:1px solid rgba(255,255,255,.07)
}
.language-progress-bar{
  width:0%;height:100%;border-radius:999px;
  background:linear-gradient(90deg,var(--gold),var(--gold2));
  transition:width .35s ease
}
.language-progress-percent{direction:ltr;margin-top:9px;color:var(--gold2);font-weight:900;font-size:13px}

footer{
  border-top:1px solid rgba(255,255,255,.05);
  text-align:center;color:#717984;font-size:12px;padding:28px 22px 40px
}

@media(max-width:900px){
  .hero{min-height:560px}
  .hero-art{width:780px;right:-300px;opacity:.55}
  .hero::after{background:linear-gradient(90deg,rgba(7,8,9,.99),rgba(7,8,9,.88) 60%,rgba(7,8,9,.55))}
  .summary{grid-template-columns:1fr}
  .scorebox{border-right:0;border-top:1px solid var(--line);padding:18px 0 0}
  .grid{grid-template-columns:1fr 1fr}
}
@media(max-width:640px){
  .tag{display:none}
  .hero-inner{padding-top:64px}
  .search-wrap{flex-direction:column}
  .primary-btn{padding:16px}
  .quick-actions{grid-template-columns:1fr;margin-top:-28px}
  .grid{grid-template-columns:1fr}
  .card.full{grid-column:auto}
  .summary-main{align-items:flex-start;flex-direction:column}
}

/* iPhone / PWA enhancements */
body{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
.pwa-install-hint{display:none;position:fixed;left:14px;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:9998;background:rgba(17,20,25,.97);border:1px solid rgba(215,179,106,.30);border-radius:16px;padding:14px 16px;box-shadow:0 18px 50px rgba(0,0,0,.45);direction:ltr}
.pwa-install-hint.show{display:flex;gap:12px;align-items:flex-start}
.pwa-install-hint strong{display:block;color:var(--gold2);margin-bottom:4px}
.pwa-install-hint span{display:block;color:#c6cbd2;font-size:12px;line-height:1.5}
.pwa-install-close{margin-left:auto;background:transparent;border:0;color:#fff;font-size:20px;cursor:pointer}
@media(display-mode:standalone){.pwa-install-hint{display:none!important}}

</style>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Akar's Car Check","url":"https://dvlabyakar.onrender.com/","description":"Check any UK vehicle registration for MOT, tax, mileage, fuel cost, Clean Air Zone information and market price guidance with Akar's Car Check.","inLanguage":["ckb","en-GB"]}</script>
</head>

<body>

<div id="languageModal" class="language-modal" aria-modal="true" role="dialog">
  <div class="language-box">
    <h2>زمان هەڵبژێرە</h2>
    <p>زمانەکەت هەڵبژێرە</p>

    <button type="button" onclick="setLanguage('ckb')">کوردی سۆرانی</button>
      <button type="button" onclick="setLanguage('en')">English</button>
      <button type="button" onclick="setLanguage('ar')">العربية</button>
      <button type="button" onclick="setLanguage('fa')">فارسی</button>
      <button type="button" onclick="setLanguage('tr')">Türkçe</button>
      <button type="button" onclick="setLanguage('fr')">Français</button>
      <button type="button" onclick="setLanguage('de')">Deutsch</button>
      <button type="button" onclick="setLanguage('es')">Español</button>
      <button type="button" onclick="setLanguage('ro')">Română</button>
      <button type="button" onclick="setLanguage('pl')">Polski</button>
      <button type="button" onclick="setLanguage('ur')">اردو</button>
      <button type="button" onclick="setLanguage('ps')">پښتو</button>

    <div class="language-note">کوردی سۆرانی زمانی بنەڕەتییە</div>
  </div>
</div>

<div id="languageLoadingOverlay" class="language-loading-overlay" aria-live="polite" aria-busy="true">
  <div class="language-loading-box">
    <div class="language-loading-icon">🌐</div>
    <div id="languageLoadingTitle" class="language-loading-title">Preparing language...</div>
    <div id="languageLoadingStatus" class="language-loading-status">Please wait while the language is loaded.</div>
    <div class="language-progress-track"><div id="languageProgressBar" class="language-progress-bar"></div></div>
    <div id="languageProgressPercent" class="language-progress-percent">0%</div>
  </div>
</div>


<header class="topbar">
  <div class="topbar-inner">
    <div class="brand">AKAR'S <span>CAR CHECK</span></div>
<button id="languageSwitch" class="language-switch" type="button" onclick="openLanguageModal()">🌐 زمان</button>
    <div class="tag">پشکنینی ئۆتۆمبێلی بەریتانیا</div>
  </div>
</header>

<section class="hero">
  <svg class="hero-art" viewBox="0 0 1100 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="carBody" x1="0" x2="1">
        <stop offset="0%" stop-color="#4f535b"/>
        <stop offset="45%" stop-color="#171a1e"/>
        <stop offset="100%" stop-color="#353940"/>
      </linearGradient>
      <linearGradient id="glass" x1="0" x2="1">
        <stop offset="0%" stop-color="#1b2a33"/>
        <stop offset="100%" stop-color="#070a0d"/>
      </linearGradient>
      <linearGradient id="goldLine" x1="0" x2="1">
        <stop offset="0%" stop-color="#8d7446"/>
        <stop offset="50%" stop-color="#f0d18d"/>
        <stop offset="100%" stop-color="#8d7446"/>
      </linearGradient>
    </defs>
    <ellipse cx="570" cy="440" rx="430" ry="36" fill="#000" opacity=".65"/>
    <path d="M160 365 C200 282 300 240 420 222 L552 129 C590 100 660 89 744 102 L834 126 C886 140 932 174 964 225 L1007 298 C1024 327 1024 359 1005 382 C982 409 945 422 902 424 L260 424 C212 424 180 406 160 382 Z" fill="url(#carBody)"/>
    <path d="M440 226 L575 145 C604 126 647 116 699 118 L796 137 C831 144 861 163 888 195 L911 226 Z" fill="url(#glass)"/>
    <path d="M579 145 L572 226" stroke="#8c9298" stroke-width="4" opacity=".5"/>
    <path d="M320 287 C497 252 743 250 933 273" fill="none" stroke="url(#goldLine)" stroke-width="3" opacity=".7"/>
    <path d="M230 348 C391 326 737 318 979 338" fill="none" stroke="#70757d" stroke-width="3" opacity=".4"/>
    <circle cx="355" cy="413" r="73" fill="#08090a"/>
    <circle cx="355" cy="413" r="48" fill="#252a31"/>
    <circle cx="355" cy="413" r="25" fill="#b49a63"/>
    <circle cx="355" cy="413" r="10" fill="#111"/>
    <circle cx="844" cy="413" r="73" fill="#08090a"/>
    <circle cx="844" cy="413" r="48" fill="#252a31"/>
    <circle cx="844" cy="413" r="25" fill="#b49a63"/>
    <circle cx="844" cy="413" r="10" fill="#111"/>
    <path d="M925 281 L996 304 L1001 333 L928 320 Z" fill="#f4e3b5" opacity=".9"/>
    <path d="M165 323 L222 307 L240 332 L173 345 Z" fill="#f35757" opacity=".85"/>
  </svg>

  <div class="hero-inner">
    <div class="eyebrow">✦ پشکنینی زیرەکی ئۆتۆمبێل</div>
    <h1>پێش کڕین، <span>دڵنیابەوە.</span></h1>
    <p>ژمارەی تۆماری ئۆتۆمبێل بنووسە بۆ بینینی MOT، باج، مایلیج و زانیارییە گرنگەکان لە یەک شوێندا.</p>

    <div class="search-wrap">
      <input id="ژمارە" class="plate-input" maxlength="8" placeholder="AB12 CDE" aria-label="ژمارەی تۆمار">
      <button id="دوگمە" class="primary-btn" onclick="پشکنین()">پشکنینی ئۆتۆمبێل</button>
    </div>
    <div class="hero-note">زانیاری ڕاستەوخۆ لە سەرچاوەی داتا وەردەگیرێت.</div>
  </div>
</section>

<div class="quick-actions">
  <a class="quick-action gold" href="https://enquiry.navigate.mib.org.uk/checkyourvehicle" target="_blank" rel="noopener noreferrer">🛡️ پشکنینی بیمەی ئۆتۆمبێل</a>
  <a class="quick-action" href="https://www.gov.uk/vehicle-tax" target="_blank" rel="noopener noreferrer">💷 باجی ڕێگاوبان بدە</a>
  <button type="button" class="quick-action compare-action" onclick="openCompareModal()">⚔️ بەراوردکردنی 2 ئۆتۆمبێل</button>
  <a class="quick-action" href="https://www.gov.uk/sold-bought-vehicle" target="_blank" rel="noopener noreferrer">🚗 لۆگ بووک بگۆڕە</a>
</div>

<main class="content">
  <div id="پەیام" class="message"></div>

  <section id="ڕاپۆرت" class="report">
    <div id="printReportHeader" class="print-only">
      <strong>AKAR'S CAR CHECK</strong>
      <div id="printReportMeta"></div>
    </div>
    <div class="summary">
      <div class="summary-main">
        <div id="تابلۆ" class="plate">—</div>
        <div>
          <div id="سەردێڕ" class="car-name">ڕاپۆرتی ئۆتۆمبێل</div>
          <div id="کورتەی_ئۆتۆمبێل" class="car-sub">—</div>
        </div>
      </div>

      <div class="scorebox">
        <div class="score-text">
          <small>هەڵسەنگاندنی گشتی</small>
          <b id="دەقی_هەڵسەنگاندن">—</b>
        </div>
        <div id="دایرەی_هەڵسەنگاندن" class="score"><strong id="نمرە">—</strong></div>
      </div>
    </div>
<div class="section-title">
      <h2>ڕاپۆرتی ئۆتۆمبێل</h2>
      <p>زانیارییەکان بە پێی ئەو داتایەی سەرچاوە بۆ ئەم ئۆتۆمبێلە دەگەڕێنێتەوە.</p>
    </div>

    <div class="grid">

      <div class="card">
        <h3><span class="icon">🚘</span> زانیاری سەرەکی</h3>
        <div class="row"><span class="label">مارکە</span><span id="مارکە" class="value">—</span></div>
        <div class="row"><span class="label">مۆدێل</span><span id="مۆدێل" class="value">—</span></div>
        <div class="row"><span class="label">ڕەنگ</span><span id="ڕەنگ" class="value">—</span></div>
        <div class="row"><span class="label">سووتەمەنی</span><span id="سووتەمەنی" class="value">—</span></div>
        <div class="row"><span class="label">قەبارەی ئەنجن</span><span id="ئەنجن" class="value">—</span></div>
        <div class="row"><span class="label">ساڵی دروستکردن</span><span id="ساڵ" class="value">—</span></div>
        <div class="row"><span class="label">تەمەنی ئۆتۆمبێل</span><span id="تەمەن" class="value">—</span></div>
        <div class="row"><span class="label">یەکەم تۆمارکردن</span><span id="یەکەم_تۆمار" class="value">—</span></div>
        <div class="row"><span class="label">دوا V5C</span><span id="V5C" class="value">—</span></div>
        <div class="row"><span class="label">بۆ هەناردە نیشان کراوە؟</span><span id="هەناردە" class="value">—</span></div>
      </div>

      <div class="card">
        <h3><span class="icon">🧾</span> MOT و باج</h3>
        <div class="row"><span class="label">دۆخی MOT</span><span id="MOT" class="value">—</span></div>
        <div class="row"><span class="label">بەرواری بەسەرچوونی MOT</span><span id="MOT_بەسەرچوون" class="value">—</span></div>
        <div class="row"><span class="label">ڕۆژانی ماوە تا MOT</span><span id="MOT_ڕۆژ" class="value">—</span></div>
        <div class="row"><span class="label">دۆخی باجی ڕێگا</span><span id="باج" class="value">—</span></div>
        <div class="row"><span class="label">بەرواری باجی داهاتوو</span><span id="باج_بەروار" class="value">—</span></div>
        <div class="row"><span class="label">ڕۆژانی ماوە تا باج</span><span id="باج_ڕۆژ" class="value">—</span></div>
        <div class="row"><span class="label">دوا MOT</span><span id="دوا_MOT_بەروار" class="value">—</span></div>
        <div class="row"><span class="label">ئەنجامی دوا MOT</span><span id="دوا_MOT_ئەنجام" class="value">—</span></div>
        <div class="row"><span class="label">کۆی MOT</span><span id="کۆی_MOT" class="value">—</span></div>
        <div class="row"><span class="label">کۆی شکستهێنان</span><span id="شکست" class="value">—</span></div>
        <div class="row"><span class="label">کۆی تێبینی</span><span id="تێبینی_کۆ" class="value">—</span></div>
        <div class="row"><span class="label">تێبینی لە دوا MOT</span><span id="تێبینی_دوا" class="value">—</span></div>
        <div class="row"><span class="label">ڕێژەی سەرکەوتن</span><span id="ڕێژەی_MOT" class="value">—</span></div>
      </div>

      <div class="card">
        <h3><span class="icon">📈</span> مایلیج</h3>
        <div class="row"><span class="label">دوا مایلیج</span><span id="مایلیج" class="value">—</span></div>
        <div class="row"><span class="label">مایلیجی ساڵانە</span><span id="مایلیج_ساڵانە" class="value">—</span></div>
        <div class="row"><span class="label">ڕەوتی مایلیج</span><span id="ڕەوتی_مایلیج" class="value">—</span></div>
        <div class="row"><span class="label">مەترسی دەستکاری مایلیج</span><span id="مەترسی_مایلیج" class="value">—</span></div>
        <div class="row"><span class="label">بەراورد بە ناوەندی بازاڕ</span><span id="بەراوردی_مایلیج" class="value">—</span></div>
      </div>

      <div class="card">
        <h3><span class="icon">🌿</span> ژینگە و ULEZ</h3>
        <div class="row"><span class="label">ستانداردی Euro</span><span id="Euro" class="value">—</span></div>
        <div class="row"><span class="label">دەرچوونی CO₂</span><span id="CO2" class="value">—</span></div>
        <div class="row"><span class="label">گونجاوە بۆ ULEZ؟</span><span id="ULEZ" class="value">—</span></div>
        <div class="row"><span class="label">دەرچوونی گاز لە شۆفێری ڕاستەقینە</span><span id="RDE" class="value">—</span></div>
      </div>

      <div class="card">
        <h3><span class="icon">⚠️</span> هەڵسەنگاندنی مەترسی</h3>
        <div class="row"><span class="label">مەترسی گشتی</span><span id="مەترسی_گشتی" class="value">—</span></div>
        <div class="row"><span class="label">مەترسی MOT</span><span id="مەترسی_MOT" class="value">—</span></div>
        <div class="row"><span class="label">مەترسی نائاسایی مایلیج</span><span id="مەترسی_نائاسایی" class="value">—</span></div>
        <div class="row"><span class="label">گۆڕینی ڕەنگ نیشان دراوە؟</span><span id="گۆڕینی_ڕەنگ" class="value">—</span></div>
        <div class="row"><span class="label">Recall هەیە؟</span><span id="Recall" class="value">—</span></div>
        <div class="row"><span class="label">NCAP</span><span id="NCAP" class="value">—</span></div>
      </div>

      <div class="card">
        <h3><span class="icon">⭐</span> کورتەی پێشنیاری کڕین</h3>
        <div class="row"><span class="label">پێشنیاری کڕین</span><span id="پێشنیار" class="value">—</span></div>
        <div class="row"><span class="label">دۆخی گشتی</span><span id="دۆخ" class="value">—</span></div>
        <div class="row"><span class="label">خزمەتگوزاری و چاککردنەوە</span><span id="چاککردنەوە" class="value">—</span></div>
        <div class="note">
          ئەم هەڵسەنگاندنە تەنها لەسەر ئەو داتایەیە کە API بۆ ئەم ئۆتۆمبێلە دەگەڕێنێتەوە.
          ئەگەر خانەیەک بەردەست نەبێت «بەردەست نییە» پیشان دەدرێت.
        </div>
      </div>

      
      <div class="card fuel-cost-card">
        <h3><span class="icon">⛽</span> <span>تێچووی سووتەمەنی</span></h3>
        <div id="سووتەمەنی_AI_بارکردن" class="ai-loading">دوای پشکنینی ئۆتۆمبێل، MPG خەمڵێنرێت...</div>
        <div id="سووتەمەنی_AI_ئەنجام" style="display:none">
          <div class="fuel-cost-grid">
            <div class="fuel-cost-box"><small>MPG ـی خەمڵێنراو</small><strong id="سووتەمەنی_MPG">—</strong></div>
            <div class="fuel-cost-box"><small>تێچووی 1 مایل</small><strong id="سووتەمەنی_1">—</strong></div>
            <div class="fuel-cost-box"><small>تێچووی 100 مایل</small><strong id="سووتەمەنی_100">—</strong></div>
            <div class="fuel-cost-box"><small>تێچووی 12,000 مایل</small><strong id="سووتەمەنی_12000">—</strong></div>
          </div>

          <div class="fuel-meta">
            <div id="سووتەمەنی_نرخ" class="fuel-pill">—</div>
            <div id="سووتەمەنی_دڵنیایی" class="fuel-pill">—</div>
          </div>

          <div id="سووتەمەنی_هۆکار" class="ai-reason"></div>

          <div class="note">
            ئەمە خەمڵاندنێکە. تێچووی ڕاستەقینە بە نرخی سووتەمەنی، شێوازی شۆفێری، ترافیک و دۆخی ئۆتۆمبێل دەگۆڕێت.
          </div>
        </div>
      </div>

      <div id="CAZ_کارت" class="card caz-card" style="display:none">
        <h3><span class="icon">🌿</span> <span>پشکنینی ناوچەی هەوای پاک بۆ دیزڵ</span></h3>
        <div id="CAZ_کورتە" class="muted"></div>
        <div id="CAZ_لیست" class="caz-list"></div>
        <a class="caz-pay-button" href="https://www.gov.uk/clean-air-zones" target="_blank" rel="noopener noreferrer">
          💳 <span>پارەی ناوچەی هەوای پاک بدە</span>
        </a>
        <div class="note">
          ئەم ئەنجامە بۆ ئۆتۆمبێلی تایبەتی ئاساییە و لەسەر یاساکانی CAZ و ستانداردی Euro ـی ئۆتۆمبێلەکە هەژمار دەکرێت. تاکسی، ڤان، مینیباس، ئۆتۆمبێلی بازرگانی و هەندێک بەخشین دەتوانن یاسای جیاواز هەبێت.
        </div>
      </div>

      <div class="card similar-card">
        <h3><span class="icon">🚗</span> <span>ڕێنمای نرخی بازاڕ</span></h3>
        <div id="هاوشێوە_بارکردن" class="ai-loading">ئۆتۆمبێلی هاوشێوە دەگەڕێندرێت...</div>
        <div id="هاوشێوە_کورتە" class="muted" style="display:none"></div>
        <div id="هاوشێوە_ئەنجام" class="similar-chart"></div>
        <div class="note">
          ئەم بەراوردە لەسەر نرخی داواکراوی ئێستای ئۆتۆمبێلە هاوشێوەکانە؛ نرخی فرۆشتنی کۆتایی نییە.
        </div>
      </div>


      <div class="card insight-card">
        <h3><span class="icon">🧰</span> <span>زانیاریی بەسوود بۆ خاوەن ئۆتۆمبێل</span></h3>
        <div id="insight_loading" class="ai-loading">زانیاریی زیاتر دەهێنرێت...</div>
        <div id="insight_content" style="display:none">
          <!-- Performance/spec fields are intentionally hidden until a verified specification API is connected. -->
          <div style="display:none" aria-hidden="true">
            <span id="extra_060">—</span><span id="extra_bhp">—</span><span id="extra_torque">—</span>
            <span id="extra_top_speed">—</span><span id="extra_insurance">—</span><span id="extra_timing">—</span>
            <span id="extra_front_tyre">—</span><span id="extra_rear_tyre">—</span><span id="extra_timing_note"></span>
          </div>
          <div class="action-row">
            <button type="button" class="secondary-btn" onclick="toggleExtraBox('commonProblemsBox')">🔧 کێشە باوەکان</button>
            <button type="button" class="secondary-btn" onclick="toggleExtraBox('serviceScheduleBox')">🧰 خشتەی خزمەتگوزاری</button>
            <button type="button" class="secondary-btn" onclick="openRepairModal()">💷 نرخی چاککردنەوە</button>
            <button type="button" class="secondary-btn" onclick="toggleExtraBox('saleHistoryBox')">🏷️ مێژووی ڕیکلام/فرۆشتن</button>
          </div>
          <div id="commonProblemsBox" class="expand-box"><div id="commonProblemsList"></div></div>
          <div id="serviceScheduleBox" class="expand-box"><div id="serviceScheduleList"></div></div>
          <div id="saleHistoryBox" class="expand-box"><div id="saleHistoryList" class="muted">—</div></div>
          <span id="extra_source" class="source-chip"></span>
        </div>
      </div>

<div class="card full">
        <h3><span class="icon">🛠️</span> کێشە دووبارەبووەکانی MOT</h3>
        <div id="کێشە_دووبارە"></div>
      </div>

      <div class="card full">
        <h3><span class="icon">📋</span> وردەکاری مێژووی MOT</h3>
        <div id="مێژووی_MOT"></div>
      </div>

      <div id="printRepairSection" class="card full print-only">
        <h3><span class="icon">💷</span> <span>خەمڵاندنی نرخی چاککردنەوە</span></h3>
        <div id="printRepairList"></div>
        <div class="note">ئەم نرخانە خەمڵاندنی بازاڕی UK ـن، نەک نرخنامەی گەراج. نرخی ڕاستەقینە بە شوێن، جۆری پارچە و کاتی کار دەگۆڕێت.</div>
      </div>

    </div>
    <div class="report-actions">
      <button type="button" class="print-report-btn" onclick="printVehicleReport()">📄 چاپ / پاشەکەوتکردنی ڕاپۆرت</button>
      <button type="button" class="check-another-btn" onclick="checkAnotherCar()">🔄 پشکنینی ئۆتۆمبێلێکی تر</button>
    </div>
  </section>
</main>

<div id="compareModal" class="modal-overlay" onclick="closeCompareModal(event)">
  <div class="compare-modal" onclick="event.stopPropagation()">
    <div class="modal-head">
      <h2>⚔️ بەراوردکردنی 2 ئۆتۆمبێل</h2>
      <button type="button" class="modal-close" onclick="closeCompareModal()">×</button>
    </div>
    <div class="muted">دوو ژمارەی تۆمار بنووسە. MOT، مایلیج، نرخی بازاڕ، سووتەمەنی، مەترسی چاککردنەوە و زانیارییە گرنگەکان بەراورد دەکرێن.</div>
    <div class="compare-input-grid">
      <div class="compare-input-card"><label>ئۆتۆمبێلی 1</label><input id="compareReg1" class="compare-plate" maxlength="8" placeholder="AB12 CDE"></div>
      <div class="compare-input-card"><label>ئۆتۆمبێلی 2</label><input id="compareReg2" class="compare-plate" maxlength="8" placeholder="XY65 XYZ"></div>
    </div>
    <button id="compareRunBtn" class="compare-run-btn" type="button" onclick="runCarComparison()">⚔️ بەراوردی ئۆتۆمبێلەکان</button>
    <div id="compareStatus" class="compare-status"></div>
    <div id="compareResults" class="compare-results">
      <div class="compare-head-grid">
        <div id="compareCar1" class="compare-car"></div>
        <div id="compareCar2" class="compare-car"></div>
      </div>
      <div id="compareTable" class="compare-table"></div>
      <div class="compare-ai">
        <h3>✨ کورتەی AI</h3>
        <div id="compareVerdict" class="compare-verdict"></div>
        <div id="compareSummary" class="compare-summary"></div>
        <div id="comparePoints" class="compare-points"></div>
      </div>
    </div>
  </div>
</div>

<div id="repairModal" class="modal-overlay" onclick="closeRepairModal(event)">
  <div class="repair-modal" onclick="event.stopPropagation()">
    <div class="modal-head">
      <h2>💷 خەمڵاندنی نرخی چاککردنەوە</h2>
      <button type="button" class="modal-close" onclick="closeRepairModal()">×</button>
    </div>
    <div id="repairVehicleName" class="muted"></div>
    <div id="repairList"></div>
    <div class="note">ئەم نرخانە خەمڵاندنی بازاڕی UK ـن، نەک نرخنامەی گەراج. نرخی ڕاستەقینە بە شوێن، جۆری پارچە و کاتی کار دەگۆڕێت.</div>
  </div>
</div>


<div id="pwaInstallHint" class="pwa-install-hint" role="status" aria-live="polite">
  <div>📱</div>
  <div><strong>Install Akar’s Car Check</strong><span>On iPhone: tap Share in Safari, then “Add to Home Screen”.</span></div>
  <button class="pwa-install-close" type="button" aria-label="Close" onclick="dismissPwaHint()">×</button>
</div>

<footer>© 2026 Akar's Car Check</footer>

<script>

// PWA / iPhone install support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(err => console.warn("Service worker:", err));
  });
}
function isIosDevice(){ return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isStandaloneApp(){ return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function dismissPwaHint(){
  localStorage.setItem("akar_pwa_hint_dismissed","1");
  const el=document.getElementById("pwaInstallHint"); if(el) el.classList.remove("show");
}
window.addEventListener("load",()=>{
  if(isIosDevice() && !isStandaloneApp() && !localStorage.getItem("akar_pwa_hint_dismissed")){
    setTimeout(()=>document.getElementById("pwaInstallHint")?.classList.add("show"),1500);
  }
});

const SUPPORTED_LANGS = ["ckb","en","ar","fa","tr","fr","de","es","ro","pl","ur","ps"];
let currentLang = SUPPORTED_LANGS.includes(localStorage.getItem("akar_language"))
  ? localStorage.getItem("akar_language")
  : "ckb";

const EN_TRANSLATIONS = {
  "پشکنینی ئۆتۆمبێلی بەریتانیا":"UK vehicle check",
  "پشکنینی زیرەکی ئۆتۆمبێل":"Smart vehicle check",
  "پێش کڕین، دڵنیابەوە.":"Check before you buy.",
  "ژمارەی تۆماری ئۆتۆمبێل بنووسە بۆ بینینی MOT، باج، مایلیج و زانیارییە گرنگەکان لە یەک شوێندا.":"Enter a vehicle registration to see MOT, tax, mileage and important vehicle information in one place.",
  "پشکنینی ئۆتۆمبێل":"Check vehicle",
  "پشکنینی ئۆتۆمبێلێکی تر":"Check another car",
  "بەراوردکردنی 2 ئۆتۆمبێل":"Compare 2 cars",
  "ئۆتۆمبێلی 1":"Car 1",
  "ئۆتۆمبێلی 2":"Car 2",
  "بەراوردی ئۆتۆمبێلەکان":"Compare cars",
  "کورتەی AI":"AI summary",
  "چاپ / پاشەکەوتکردنی ڕاپۆرت":"Print / Save report",
  "ڕاپۆرت دروستکرا":"Report generated",
  "زانیاری ڕاستەوخۆ لە سەرچاوەی داتا وەردەگیرێت.":"Live information is retrieved from the data source.",
  "پشکنینی بیمەی ئۆتۆمبێل":"Check vehicle insurance",
  "باجی ڕێگاوبان بدە":"Pay road tax",
  "لۆگ بووک بگۆڕە":"Change log book",
  "ڕاپۆرتی ئۆتۆمبێل":"Vehicle report",
  "هەڵسەنگاندنی گشتی":"Overall assessment",
  "زانیاری سەرەکی":"Vehicle details",
  "مارکە":"Make",
  "مۆدێل":"Model",
  "ڕەنگ":"Colour",
  "سووتەمەنی":"Fuel",
  "قەبارەی ئەنجن":"Engine size",
  "ساڵی دروستکردن":"Year of manufacture",
  "تەمەنی ئۆتۆمبێل":"Vehicle age",
  "یەکەم تۆمارکردن":"First registration",
  "بۆ هەناردە نیشان کراوە؟":"Marked for export?",
  "MOT و باج":"MOT & Tax",
  "دۆخی MOT":"MOT status",
  "بەرواری بەسەرچوونی MOT":"MOT expiry date",
  "ڕۆژانی ماوە تا MOT":"Days until MOT",
  "دۆخی باجی ڕێگا":"Tax status",
  "بەرواری باجی داهاتوو":"Tax due date",
  "ڕۆژانی ماوە تا باج":"Days until tax",
  "دوا MOT":"Last MOT",
  "ئەنجامی دوا MOT":"Last MOT result",
  "کۆی MOT":"Total MOT tests",
  "کۆی شکستهێنان":"Total MOT failures",
  "کۆی تێبینی":"Total advisories",
  "تێبینی لە دوا MOT":"Latest advisories",
  "ڕێژەی سەرکەوتن":"MOT pass rate",
  "مایلیج":"Mileage",
  "دوا مایلیج":"Latest mileage",
  "مایلیجی ساڵانە":"Typical annual mileage",
  "ڕەوتی مایلیج":"Mileage trend",
  "مەترسی دەستکاری مایلیج":"Mileage tampering risk",
  "بەراورد بە ناوەندی بازاڕ":"Compared with average",
  "ژینگە و ULEZ":"Emissions & ULEZ",
  "ستانداردی Euro":"Euro standard",
  "دەرچوونی CO₂":"CO₂ emissions",
  "گونجاوە بۆ ULEZ؟":"ULEZ compliant?",
  "هەڵسەنگاندنی مەترسی":"Risk assessment",
  "مەترسی گشتی":"Overall risk",
  "مەترسی MOT":"MOT risk",
  "مەترسی نائاسایی مایلیج":"Mileage anomaly risk",
  "گۆڕینی ڕەنگ نیشان دراوە؟":"Colour change indicated?",
  "Recall هەیە؟":"Outstanding recall?",
  "کورتەی پێشنیاری کڕین":"Buying summary",
  "پێشنیاری کڕین":"Buying recommendation",
  "دۆخی گشتی":"Overall condition",
  "خزمەتگوزاری و چاککردنەوە":"Maintenance",
  "زانیاریی بەسوود بۆ خاوەن ئۆتۆمبێل":"Useful information for vehicle owners",
  "زانیاریی زیاتر دەهێنرێت...":"Loading additional vehicle information...",
  "کێشە باوەکان":"Common problems",
  "خشتەی خزمەتگوزاری":"Service schedule",
  "نرخی چاککردنەوە":"Repair costs",
  "مێژووی ڕیکلام/فرۆشتن":"Previous sale/ad history",
  "خەمڵاندنی نرخی چاککردنەوە":"Repair cost estimate",
  "پارچە":"Parts",
  "کار":"Labour",
  "کۆی گشتی":"Total",
  "زانیاری بەردەست نییە.":"Information unavailable.",
  "خەمڵاندنی نرخی چاککردنەوە بەردەست نییە.":"Repair-cost estimate unavailable.",
  "هیچ مێژووی ڕیکلام/فرۆشتنی پێشووی پشتڕاستکراوە لە سەرچاوەکانی ئێستا بەردەست نییە.":"No verified previous sale/ad history is available from the current data sources.",
  "ئەم نرخانە خەمڵاندنی بازاڕی UK ـن، نەک نرخنامەی گەراج. نرخی ڕاستەقینە بە شوێن، جۆری پارچە و کاتی کار دەگۆڕێت.":"These are estimated UK market repair costs, not a garage quotation. Actual prices vary by location, parts used and labour time.",
  "کێشە دووبارەبووەکانی MOT":"Recurring MOT issues",
  "جۆری کێشە":"Issue type",
  "وردەکاری مێژووی MOT":"MOT history details",
  "بەروار":"Date",
  "ئەنجام":"Result",
  "بەردەست نییە":"Not available",
  "بەڵێ":"Yes",
  "نەخێر":"No",
  "بەنزین":"Petrol",
  "دیزڵ":"Diesel",
  "کارەبایی":"Electric",
  "هایبرێد":"Hybrid",
  "دروستە":"Valid",
  "بەسەرچووە":"Expired",
  "سەرکەوتوو":"Passed",
  "شکستی هێنا":"Failed",
  "باجی دراوە":"Taxed",
  "باجی نەدراوە":"Untaxed",
  "گونجاوە":"Compliant",
  "گونجاو نییە":"Not compliant",
  "نزم":"Low",
  "مامناوەند":"Medium",
  "بەرز":"High",
  "هیچ":"None",
  "باش":"Good",
  "لاواز":"Poor",
  "بە وردی بپشکنە":"Consider",
  "باشە بۆ کڕین":"Good to buy",
  "باشترە نەیکڕیت":"Avoid",
  "ئاسایی و یەکسان":"Consistent",
  "نایەکسان":"Inconsistent",
  "لە ناوەند زیاتر":"Above average",
  "لە ناوەند کەمتر":"Below average",
  "سیستەمی سەسپێنشن":"Suspension",
  "تایەرەکان":"Tyres",
  "چراغەکان":"Lights",
  "لاشی ئۆتۆمبێل":"Bodywork",
  "ئەگزۆز":"Exhaust",
  "برێکەکان":"Brakes",
  "فەرمان":"Steering",
  "بینین":"Visibility",
  "شوشەی پێشەوە":"Windscreen",
  "ئاوێنەکان":"Mirrors",
  "دەرچوونی گاز":"Emissions",
  "زمان هەڵبژێرە":"Choose your language",
  "دوا V5C":"Latest V5C",
  "دەرچوونی گاز لە شۆفێری ڕاستەقینە":"Real driving emissions",
  "زانیارییەکان بە پێی ئەو داتایەی سەرچاوە بۆ ئەم ئۆتۆمبێلە دەگەڕێنێتەوە.":"Information is shown according to the data returned for this vehicle.",
  "ئەم هەڵسەنگاندنە تەنها لەسەر ئەو داتایەیە کە API بۆ ئەم ئۆتۆمبێلە دەگەڕێنێتەوە.":"This assessment is based only on the data returned by the API for this vehicle.",
  "ئەگەر خانەیەک بەردەست نەبێت «بەردەست نییە» پیشان دەدرێت.":"If a field is unavailable, “Not available” will be shown.",
  "تێچووی سووتەمەنی":"Fuel cost",
  "دوای پشکنینی ئۆتۆمبێل، MPG خەمڵێنرێت...":"After the vehicle check, MPG will be estimated...",
  "MPG ـی خەمڵێنراو":"Estimated MPG",
  "تێچووی 1 مایل":"Cost for 1 mile",
  "تێچووی 100 مایل":"Cost for 100 miles",
  "تێچووی 12,000 مایل":"Cost for 12,000 miles",
  "ئەمە خەمڵاندنێکی AI ـە. تێچووی ڕاستەقینە بە نرخی سووتەمەنی، شێوازی شۆفێری، ترافیک و دۆخی ئۆتۆمبێل دەگۆڕێت.":"This is an AI estimate. Actual fuel cost varies with fuel price, driving style, traffic and vehicle condition.",
  "ڕێنمای نرخی بازاڕ":"Market Price Guide",
  "ئۆتۆمبێلی هاوشێوە دەگەڕێندرێت...":"Finding similar cars currently for sale...",
  "ئەممانە نرخی داواکراوی ئۆتۆمبێلە هاوشێوەکانی ئێستای بازاڕن، نە نرخی فرۆشتنی دڵنیابوو.":"Based on current asking prices for similar cars. These are not confirmed sold prices.",
  "ئەم بەراوردە لەسەر نرخی داواکراوی ئێستای ئۆتۆمبێلە هاوشێوەکانە؛ نرخی فرۆشتنی کۆتایی نییە.":"Based on current asking prices for similar cars. These are not confirmed sold prices.",
  "ئەمە خەمڵاندنێکە. تێچووی ڕاستەقینە بە نرخی سووتەمەنی، شێوازی شۆفێری، ترافیک و دۆخی ئۆتۆمبێل دەگۆڕێت.":"This is an estimate. Actual fuel cost varies with fuel price, driving style, traffic and vehicle condition.",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"Diesel Clean Air Zone Check",
  "ئەم ئەنجامە بۆ ئۆتۆمبێلی تایبەتی ئاساییە و لەسەر یاساکانی CAZ و ستانداردی Euro ـی ئۆتۆمبێلەکە هەژمار دەکرێت. تاکسی، ڤان، مینیباس، ئۆتۆمبێلی بازرگانی و هەندێک بەخشین دەتوانن یاسای جیاواز هەبێت.":"This result is for a normal private car and is calculated from CAZ rules and the vehicle's Euro standard. Taxis, vans, minibuses, commercial vehicles and some exemptions can have different rules.",
  "پارەی ناوچەی هەوای پاک بدە":"Pay Clean Air Zone charge",
  "زمانەکەت هەڵبژێرە":"Choose your language",
  "کوردی سۆرانی":"Sorani Kurdish",
  "ئینگلیزی":"English",
  "کوردی سۆرانی زمانی بنەڕەتییە":"Sorani Kurdish is the default language",
  "ژمارەی تۆمار":"Registration number",
  "ساڵ":"year",
  "مایل":"miles",
  "پێش کڕین،":"Check before",
  "دڵنیابەوە.":"you buy."
};



let ACTIVE_LANGUAGE_PACK = {};
let languagePackReady = false;

const EXTRA_UI_ENGLISH = [
  "Please enter a valid registration.",
  "Checking...",
  "Retrieving live vehicle information...",
  "Vehicle check failed.",
  "Vehicle report",
  "Needs further checking",
  "Shows a good overall condition",
  "Check carefully",
  "Estimating MPG and fuel costs...",
  "Fuel-cost estimate unavailable:",
  "Fuel estimate failed",
  "Unknown error",
  "Estimated from the available vehicle details.",
  "Confidence:",
  "Low","Medium","High",
  "Finding similar cars currently for sale...",
  "No similar live listings were found.",
  "similar live listings shown",
  "No similar asking prices were found.",
  "No usable asking-price data was found.",
  "Based on",
  "similar live asking prices.",
  "Typical market asking price:",
  "Lowest asking price",
  "Typical asking price",
  "Highest asking price",
  "Average",
  "Lowest",
  "Typical",
  "Highest",
  "Similar listings unavailable:",
  "Similar vehicle search failed",
  "Diesel vehicle",
  "CAZ result for a normal private car:",
  "No charge",
  "Euro standard unavailable",
  "year","years","mile","miles","miles/year",
  "litre",
  "Issue type","Date","Result","Mileage",
  "No additional recurring-issue information is available.",
  "The data source did not return a full test-by-test MOT history for this vehicle.",
  "Above average","Below average","Consistent","Inconsistent",
  "Valid","Expired","Taxed","Untaxed",
  "Petrol","Diesel","Electric","Hybrid",
  "Passed","Failed","Compliant","Not compliant",
  "None","Possible","Good","Poor","Excellent","Very good","Very poor",
  "Consider","Good to buy","Avoid","Recommended","Not recommended",
  "Increasing","Decreasing","Stable","Anomaly","No anomaly",
  "Advisory","Advisories","Dangerous","Major","Minor","Recall",
  "Suspension","Tyres","Tyre","Lights","Light","Bodywork","Exhaust",
  "Brakes","Brake","Steering","Visibility","Windscreen","Wipers","Washers",
  "Seatbelts","Seats","Doors","Mirrors","Horn","Registration plate",
  "Emissions","Fuel system","Electrical","Engine","Chassis","Corrosion","Structure",
  "MOT expiry","Test number","Dangerous defects","Refusal reasons / Major defects",
  "Minor defects","Advisories","Other comments","Notes",
  "No defects or advisories were recorded.",
  "Loading additional vehicle information...","Additional information unavailable:",
  "Vehicle data + Gemini guidance; estimates are indicative",
  "Repair cost estimate","Parts","Labour","Total","Print / Save report","Report generated",
  "Information unavailable.","Repair-cost estimate unavailable.",
  "No verified previous sale/ad history is available from the current data sources.",
  "These are estimated UK market repair costs, not a garage quotation. Actual prices vary by location, parts used and labour time."
]

function builtInLanguageSeed(lang){
  const tables = {
    ar:typeof AR_TRANSLATIONS!=="undefined"?AR_TRANSLATIONS:null,
    fa:typeof FA_TRANSLATIONS!=="undefined"?FA_TRANSLATIONS:null,
    tr:typeof TR_TRANSLATIONS!=="undefined"?TR_TRANSLATIONS:null,
    fr:typeof FR_TRANSLATIONS!=="undefined"?FR_TRANSLATIONS:null,
    de:typeof DE_TRANSLATIONS!=="undefined"?DE_TRANSLATIONS:null,
    es:typeof ES_TRANSLATIONS!=="undefined"?ES_TRANSLATIONS:null,
    ro:typeof RO_TRANSLATIONS!=="undefined"?RO_TRANSLATIONS:null,
    pl:typeof PL_TRANSLATIONS!=="undefined"?PL_TRANSLATIONS:null,
    ur:typeof UR_TRANSLATIONS!=="undefined"?UR_TRANSLATIONS:null,
    ps:typeof PS_TRANSLATIONS!=="undefined"?PS_TRANSLATIONS:null
  };
  const table=tables[lang]||{};
  const seed={};
  Object.entries(table).forEach(function(pair){
    const english=EN_TRANSLATIONS[pair[0]];
    if(english) seed[english]=pair[1];
  });
  return seed;
}

async function ensureLanguageTexts(texts){
  if(currentLang === "ckb" || currentLang === "en") return;
  const clean=Array.from(new Set((texts||[]).map(function(v){return String(v??"").trim();}).filter(Boolean)));
  const missing=clean.filter(function(t){return !Object.prototype.hasOwnProperty.call(ACTIVE_LANGUAGE_PACK,t);});
  if(!missing.length) return;
  try{
    const response=await fetch("/api/language-pack",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({language:currentLang,texts:missing})
    });
    const data=await response.json();
    if(response.ok && data.ok && data.translations){
      Object.assign(ACTIVE_LANGUAGE_PACK,data.translations);
      try{localStorage.setItem("akar_language_pack_v8_"+currentLang,JSON.stringify(ACTIVE_LANGUAGE_PACK));}catch{}
    }
  }catch(error){
    console.error("On-demand translation failed:",error?.message||error);
  }
}

async function loadLanguagePack(){
  if(currentLang === "ckb" || currentLang === "en"){
    ACTIVE_LANGUAGE_PACK = {};
    languagePackReady = true;
    return;
  }

  const cacheKey = "akar_language_pack_v8_" + currentLang;
  ACTIVE_LANGUAGE_PACK = builtInLanguageSeed(currentLang);

  try{
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if(cached && typeof cached === "object"){
      Object.assign(ACTIVE_LANGUAGE_PACK,cached);
      if(Object.keys(cached).length >= 60){
        languagePackReady = true;
        return;
      }
    }
  }catch{}

  const englishTexts = Array.from(new Set(
    Object.values(EN_TRANSLATIONS).concat(EXTRA_UI_ENGLISH)
  )).filter(Boolean);

  let lastError = null;

  for(let attempt=0; attempt<2; attempt++){
    try{
      const response = await fetch("/api/language-pack",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({language:currentLang,texts:englishTexts})
      });

      const data = await response.json();

      if(response.ok && data.ok && data.translations){
        Object.assign(ACTIVE_LANGUAGE_PACK,data.translations);
        languagePackReady = true;
        try{ localStorage.setItem(cacheKey, JSON.stringify(ACTIVE_LANGUAGE_PACK)); }catch{}
        return;
      }

      lastError = data?.error || "Language pack failed";
    }catch(error){
      lastError = error?.message || String(error);
    }
  }

  console.error("Language pack unavailable:", lastError);
  languagePackReady = true;
}
function translateString(txt){
  if(currentLang === "ckb") return txt;

  let out = String(txt ?? "");

  // First convert every known Sorani phrase to canonical English.
  const ckbEntries = Object.entries(EN_TRANSLATIONS)
    .sort(function(a,b){ return b[0].length - a[0].length; });

  for(const pair of ckbEntries){
    if(out.includes(pair[0])){
      out = out.split(pair[0]).join(pair[1]);
    }
  }

  if(currentLang === "en") return out;

  // Then convert canonical English into the selected language.
  const targetEntries = Object.entries(ACTIVE_LANGUAGE_PACK)
    .sort(function(a,b){ return b[0].length - a[0].length; });

  for(const pair of targetEntries){
    if(out.includes(pair[0])){
      out = out.split(pair[0]).join(pair[1]);
    }
  }

  return out;
}

function translateTextNode(node){
  if(currentLang === "ckb") return;
  if(node.nodeType !== Node.TEXT_NODE) return;
  const txt = node.nodeValue;
  if(!txt || !txt.trim()) return;
  node.nodeValue = translateString(txt);
}

function translateElementTree(root=document.body){
  if(currentLang === "ckb") return;

  const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
  let node;
  while(node = walker.nextNode()){
    const parent = node.parentElement;
    if(parent && !["SCRIPT","STYLE","NOSCRIPT"].includes(parent.tagName)){
      translateTextNode(node);
    }
  }

  document.querySelectorAll("[aria-label],[title]").forEach(function(el){
    ["aria-label","title"].forEach(function(attr){
      const original = el.getAttribute(attr);
      if(original) el.setAttribute(attr, translateString(original));
    });
  });

  const input = document.getElementById("ژمارە");
  if(input) input.placeholder = "AB12 CDE";

  const switcher = document.getElementById("languageSwitch");
  if(switcher) switcher.textContent = "🌐 " + (LANGUAGE_NAMES[currentLang] || "Language");
}

async function applyLanguage(){
  applyLanguageDirection();

  if(currentLang === "ckb"){
    document.documentElement.lang = "ckb";
    document.documentElement.dir = "rtl";
    document.body.dir = "rtl";
    const switcher = document.getElementById("languageSwitch");
    if(switcher) switcher.textContent = "🌐 " + (LANGUAGE_NAMES[currentLang] || "زمان");
    return;
  }

  if(!languagePackReady) await loadLanguagePack();
  translateElementTree(document.body);
}

const AR_TRANSLATIONS = {
  "زمان":"اللغة",
  "زمانەکەت هەڵبژێرە":"اختر لغتك",
  "کوردی سۆرانی":"الكردية السورانية",
  "ئینگلیزی":"الإنجليزية",
  "پشکنینی زیرەکی ئۆتۆمبێل":"فحص ذكي للمركبة",
  "پێش کڕین،":"افحص قبل",
  "دڵنیابەوە.":"الشراء.",
  "پشکنینی ئۆتۆمبێل":"فحص المركبة",
  "ژمارەی تۆمار":"رقم التسجيل",
  "تێچووی سووتەمەنی":"تكلفة الوقود",
  "ڕێنمای نرخی بازاڕ":"دليل سعر السوق",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"فحص منطقة الهواء النظيف للديزل",
  "پارەی ناوچەی هەوای پاک بدە":"دفع رسوم منطقة الهواء النظيف"
};

const FA_TRANSLATIONS = {
  "زمان":"زبان",
  "زمانەکەت هەڵبژێرە":"زبان خود را انتخاب کنید",
  "کوردی سۆرانی":"کردی سورانی",
  "ئینگلیزی":"انگلیسی",
  "پشکنینی زیرەکی ئۆتۆمبێل":"بررسی هوشمند خودرو",
  "پێش کڕین،":"قبل از خرید",
  "دڵنیابەوە.":"بررسی کنید.",
  "پشکنینی ئۆتۆمبێل":"بررسی خودرو",
  "ژمارەی تۆمار":"شماره ثبت",
  "تێچووی سووتەمەنی":"هزینه سوخت",
  "ڕێنمای نرخی بازاڕ":"راهنمای قیمت بازار",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"بررسی منطقه هوای پاک برای دیزل",
  "پارەی ناوچەی هەوای پاک بدە":"پرداخت هزینه منطقه هوای پاک"
};

const TR_TRANSLATIONS = {
  "زمان":"Dil",
  "زمانەکەت هەڵبژێرە":"Dilinizi seçin",
  "کوردی سۆرانی":"Soranice Kürtçe",
  "ئینگلیزی":"İngilizce",
  "پشکنینی زیرەکی ئۆتۆمبێل":"Akıllı araç kontrolü",
  "پێش کڕین،":"Satın almadan önce",
  "دڵنیابەوە.":"kontrol edin.",
  "پشکنینی ئۆتۆمبێل":"Aracı kontrol et",
  "ژمارەی تۆمار":"Plaka",
  "تێچووی سووتەمەنی":"Yakıt maliyeti",
  "ڕێنمای نرخی بازاڕ":"Piyasa fiyat rehberi",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"Dizel Temiz Hava Bölgesi kontrolü",
  "پارەی ناوچەی هەوای پاک بدە":"Temiz Hava Bölgesi ücretini öde"
};

const FR_TRANSLATIONS = {
  "زمان":"Langue",
  "زمانەکەت هەڵبژێرە":"Choisissez votre langue",
  "کوردی سۆرانی":"Kurde sorani",
  "ئینگلیزی":"Anglais",
  "پشکنینی زیرەکی ئۆتۆمبێل":"Contrôle intelligent du véhicule",
  "پێش کڕین،":"Vérifiez avant",
  "دڵنیابەوە.":"d'acheter.",
  "پشکنینی ئۆتۆمبێل":"Vérifier le véhicule",
  "ژمارەی تۆمار":"Immatriculation",
  "تێچووی سووتەمەنی":"Coût du carburant",
  "ڕێنمای نرخی بازاڕ":"Guide du prix du marché",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"Vérification de zone à faibles émissions diesel",
  "پارەی ناوچەی هەوای پاک بدە":"Payer la zone à faibles émissions"
};

const DE_TRANSLATIONS = {
  "زمان":"Sprache",
  "زمانەکەت هەڵبژێرە":"Sprache auswählen",
  "کوردی سۆرانی":"Sorani-Kurdisch",
  "ئینگلیزی":"Englisch",
  "پشکنینی زیرەکی ئۆتۆمبێل":"Intelligenter Fahrzeugcheck",
  "پێش کڕین،":"Vor dem Kauf",
  "دڵنیابەوە.":"prüfen.",
  "پشکنینی ئۆتۆمبێل":"Fahrzeug prüfen",
  "ژمارەی تۆمار":"Kennzeichen",
  "تێچووی سووتەمەنی":"Kraftstoffkosten",
  "ڕێنمای نرخی بازاڕ":"Marktpreis-Leitfaden",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"Diesel-Umweltzonenprüfung",
  "پارەی ناوچەی هەوای پاک بدە":"Umweltzonen-Gebühr zahlen"
};

const ES_TRANSLATIONS = {
  "زمان":"Idioma",
  "زمانەکەت هەڵبژێرە":"Elige tu idioma",
  "کوردی سۆرانی":"Kurdo sorani",
  "ئینگلیزی":"Inglés",
  "پشکنینی زیرەکی ئۆتۆمبێل":"Comprobación inteligente del vehículo",
  "پێش کڕین،":"Comprueba antes",
  "دڵنیابەوە.":"de comprar.",
  "پشکنینی ئۆتۆمبێل":"Comprobar vehículo",
  "ژمارەی تۆمار":"Matrícula",
  "تێچووی سووتەمەنی":"Coste de combustible",
  "ڕێنمای نرخی بازاڕ":"Guía de precio de mercado",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"Comprobación de zona de aire limpio para diésel",
  "پارەی ناوچەی هەوای پاک بدە":"Pagar cargo de zona de aire limpio"
};

const RO_TRANSLATIONS = {
  "زمان":"Limbă",
  "زمانەکەت هەڵبژێرە":"Alege limba",
  "کوردی سۆرانی":"Kurdă sorani",
  "ئینگلیزی":"Engleză",
  "پشکنینی زیرەکی ئۆتۆمبێل":"Verificare inteligentă a vehiculului",
  "پێش کڕین،":"Verifică înainte",
  "دڵنیابەوە.":"să cumperi.",
  "پشکنینی ئۆتۆمبێل":"Verifică vehiculul",
  "ژمارەی تۆمار":"Număr de înmatriculare",
  "تێچووی سووتەمەنی":"Cost combustibil",
  "ڕێنمای نرخی بازاڕ":"Ghid de preț de piață",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"Verificare zonă cu aer curat pentru diesel",
  "پارەی ناوچەی هەوای پاک بدە":"Plătește taxa pentru zona cu aer curat"
};

const PL_TRANSLATIONS = {
  "زمان":"Język",
  "زمانەکەت هەڵبژێرە":"Wybierz język",
  "کوردی سۆرانی":"Kurdyjski sorani",
  "ئینگلیزی":"Angielski",
  "پشکنینی زیرەکی ئۆتۆمبێل":"Inteligentne sprawdzenie pojazdu",
  "پێش کڕین،":"Sprawdź przed",
  "دڵنیابەوە.":"zakupem.",
  "پشکنینی ئۆتۆمبێل":"Sprawdź pojazd",
  "ژمارەی تۆمار":"Numer rejestracyjny",
  "تێچووی سووتەمەنی":"Koszt paliwa",
  "ڕێنمای نرخی بازاڕ":"Przewodnik cen rynkowych",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"Sprawdzenie strefy czystego powietrza dla diesla",
  "پارەی ناوچەی هەوای پاک بدە":"Zapłać opłatę za strefę czystego powietrza"
};

const UR_TRANSLATIONS = {
  "زمان":"زبان",
  "زمانەکەت هەڵبژێرە":"اپنی زبان منتخب کریں",
  "کوردی سۆرانی":"سورانی کردی",
  "ئینگلیزی":"انگریزی",
  "پشکنینی زیرەکی ئۆتۆمبێل":"سمارٹ گاڑی چیک",
  "پێش کڕین،":"خریدنے سے پہلے",
  "دڵنیابەوە.":"چیک کریں۔",
  "پشکنینی ئۆتۆمبێل":"گاڑی چیک کریں",
  "ژمارەی تۆمار":"رجسٹریشن نمبر",
  "تێچووی سووتەمەنی":"ایندھن کی لاگت",
  "ڕێنمای نرخی بازاڕ":"مارکیٹ قیمت گائیڈ",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"ڈیزل کلین ایئر زون چیک",
  "پارەی ناوچەی هەوای پاک بدە":"کلین ایئر زون چارج ادا کریں"
};

const PS_TRANSLATIONS = {
  "زمان":"ژبه",
  "زمانەکەت هەڵبژێرە":"خپله ژبه وټاکئ",
  "کوردی سۆرانی":"سوراني کردي",
  "ئینگلیزی":"انګلیسي",
  "پشکنینی زیرەکی ئۆتۆمبێل":"هوښیار د موټر چک",
  "پێش کڕین،":"له اخیستو مخکې",
  "دڵنیابەوە.":"چک یې کړئ.",
  "پشکنینی ئۆتۆمبێل":"موټر چک کړئ",
  "ژمارەی تۆمار":"د ثبت شمېره",
  "تێچووی سووتەمەنی":"د سون توکو لګښت",
  "ڕێنمای نرخی بازاڕ":"د بازار د بیې لارښود",
  "پشکنینی ناوچەی هەوای پاک بۆ دیزڵ":"د ډیزل پاکې هوا سیمې چک",
  "پارەی ناوچەی هەوای پاک بدە":"د پاکې هوا سیمې فیس ورکړئ"
};


const LANGUAGE_NAMES = {
  ckb:"زمان",
  en:"Language",
  ar:"اللغة",
  fa:"زبان",
  tr:"Dil",
  fr:"Langue",
  de:"Sprache",
  es:"Idioma",
  ro:"Limbă",
  pl:"Język",
  ur:"زبان",
  ps:"ژبه"
};


const LANGUAGE_LOADING_TEXT = {
  ckb:{title:"زمان ئامادە دەکرێت...",start:"تکایە چاوەڕێ بکە.",load:"وەرگێڕان بار دەکرێت...",apply:"زمان جێبەجێ دەکرێت...",done:"تەواو بوو ✓"},
  en:{title:"Preparing language...",start:"Please wait while the language is loaded.",load:"Loading translations...",apply:"Applying language...",done:"Language ready ✓"},
  ar:{title:"جارٍ تجهيز اللغة...",start:"يرجى الانتظار بينما يتم تحميل اللغة.",load:"جارٍ تحميل الترجمات...",apply:"جارٍ تطبيق اللغة...",done:"اللغة جاهزة ✓"},
  fa:{title:"در حال آماده‌سازی زبان...",start:"لطفاً تا بارگذاری زبان صبر کنید.",load:"در حال بارگذاری ترجمه‌ها...",apply:"در حال اعمال زبان...",done:"زبان آماده است ✓"},
  tr:{title:"Dil hazırlanıyor...",start:"Dil yüklenirken lütfen bekleyin.",load:"Çeviriler yükleniyor...",apply:"Dil uygulanıyor...",done:"Dil hazır ✓"},
  fr:{title:"Préparation de la langue...",start:"Veuillez patienter pendant le chargement.",load:"Chargement des traductions...",apply:"Application de la langue...",done:"Langue prête ✓"},
  de:{title:"Sprache wird vorbereitet...",start:"Bitte warten Sie, während die Sprache geladen wird.",load:"Übersetzungen werden geladen...",apply:"Sprache wird angewendet...",done:"Sprache bereit ✓"},
  es:{title:"Preparando idioma...",start:"Espera mientras se carga el idioma.",load:"Cargando traducciones...",apply:"Aplicando idioma...",done:"Idioma listo ✓"},
  ro:{title:"Se pregătește limba...",start:"Așteptați cât timp se încarcă limba.",load:"Se încarcă traducerile...",apply:"Se aplică limba...",done:"Limba este gata ✓"},
  pl:{title:"Przygotowywanie języka...",start:"Poczekaj, aż język zostanie załadowany.",load:"Ładowanie tłumaczeń...",apply:"Stosowanie języka...",done:"Język gotowy ✓"},
  ur:{title:"زبان تیار کی جا رہی ہے...",start:"زبان لوڈ ہونے تک انتظار کریں۔",load:"ترجمے لوڈ ہو رہے ہیں...",apply:"زبان لاگو کی جا رہی ہے...",done:"زبان تیار ہے ✓"},
  ps:{title:"ژبه چمتو کېږي...",start:"مهرباني وکړئ د ژبې د پورته کېدو انتظار وکړئ.",load:"ژباړې پورته کېږي...",apply:"ژبه پلي کېږي...",done:"ژبه چمتو ده ✓"}
};

let languageProgressTimer = null;
function languageLoadingText(){ return LANGUAGE_LOADING_TEXT[currentLang] || LANGUAGE_LOADING_TEXT.en; }
function setLanguageProgress(percent,status){
  const pct=Math.max(0,Math.min(100,Math.round(Number(percent)||0)));
  const bar=document.getElementById("languageProgressBar");
  const label=document.getElementById("languageProgressPercent");
  const statusEl=document.getElementById("languageLoadingStatus");
  if(bar) bar.style.width=pct+"%";
  if(label) label.textContent=pct+"%";
  if(statusEl && status) statusEl.textContent=status;
}
function showLanguageLoading(startAt){
  const overlay=document.getElementById("languageLoadingOverlay");
  const title=document.getElementById("languageLoadingTitle");
  const t=languageLoadingText();
  if(title) title.textContent=t.title;
  if(overlay) overlay.classList.add("show");
  setLanguageProgress(startAt==null?8:startAt,t.start);
}
function startLanguageProgress(from,to,status){
  if(languageProgressTimer) clearInterval(languageProgressTimer);
  let value=from;
  setLanguageProgress(value,status);
  languageProgressTimer=setInterval(function(){
    if(value>=to){clearInterval(languageProgressTimer);languageProgressTimer=null;return;}
    value=Math.min(to,value+Math.max(1,Math.ceil((to-value)/8)));
    setLanguageProgress(value,status);
  },180);
}
function finishLanguageLoading(){
  if(languageProgressTimer){clearInterval(languageProgressTimer);languageProgressTimer=null;}
  const t=languageLoadingText();
  setLanguageProgress(100,t.done);
  setTimeout(function(){
    const overlay=document.getElementById("languageLoadingOverlay");
    if(overlay) overlay.classList.remove("show");
    try{sessionStorage.removeItem("akar_language_loading");}catch{}
  },450);
}

function applyLanguageDirection(){
  const rtl = ["ckb","ar","fa","ur","ps"].includes(currentLang);
  document.documentElement.lang = currentLang === "ckb" ? "ckb" : currentLang;
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  if(document.body) document.body.dir = rtl ? "rtl" : "ltr";
}

function setLanguage(lang){
  const supported = ["ckb","en","ar","fa","tr","fr","de","es","ro","pl","ur","ps"];
  currentLang = supported.includes(lang) ? lang : "ckb";
  localStorage.setItem("akar_language", currentLang);
  localStorage.setItem("akar_language_chosen", "1");
  try{sessionStorage.setItem("akar_language_loading","1");}catch{}
  closeLanguageModal();
  showLanguageLoading(5);
  startLanguageProgress(5,28,languageLoadingText().start);
  setTimeout(function(){ location.reload(); },420);
}

function openLanguageModal(){
  const modal = document.getElementById("languageModal");
  if(modal) modal.classList.add("show");
}

function closeLanguageModal(){
  const modal = document.getElementById("languageModal");
  if(modal) modal.classList.remove("show");
}

document.addEventListener("DOMContentLoaded",async ()=>{
  let switching=false;
  try{switching=sessionStorage.getItem("akar_language_loading")==="1";}catch{}
  if(switching){
    showLanguageLoading(30);
    startLanguageProgress(30,72,languageLoadingText().load);
  }

  await applyLanguage();

  if(switching){
    startLanguageProgress(74,96,languageLoadingText().apply);
    setTimeout(finishLanguageLoading,420);
  }

  if(!localStorage.getItem("akar_language_chosen")){
    setTimeout(openLanguageModal,250);
  }


});


const دۆزینەوە = id => document.getElementById(id);

function وەرگێڕانی_بەها(v){
  const notAvailable = currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە");

  if(v === null || v === undefined || v === "") return notAvailable;
  if(v === true) return currentLang === "ckb" ? "بەڵێ" : translateString("بەڵێ");
  if(v === false) return currentLang === "ckb" ? "نەخێر" : translateString("نەخێر");

  const raw = String(v).trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g,"_");

  const enMap = {
    petrol:"Petrol", diesel:"Diesel", electric:"Electric", hybrid:"Hybrid",
    phev:"Plug-in hybrid", lpg:"LPG", cng:"CNG",
    car:"Car", motorcycle:"Motorcycle", van:"Van", truck:"Truck", bus:"Bus",
    valid:"Valid", expired:"Expired", pass:"Passed", passed:"Passed",
    fail:"Failed", failed:"Failed", taxed:"Taxed", untaxed:"Untaxed",
    sorn:"SORN", compliant:"Compliant", non_compliant:"Not compliant",
    unknown:"Unknown", unavailable:"Not available",
    low:"Low", medium:"Medium", high:"High", very_low:"Very low", very_high:"Very high",
    none:"None", possible:"Possible", possible_clocking:"Possible mileage tampering",
    excellent:"Excellent", very_good:"Very good", good:"Good", fair:"Fair",
    poor:"Poor", very_poor:"Very poor", average:"Average",
    above_average:"Above average", below_average:"Below average",
    buy:"Good to buy", consider:"Consider carefully", caution:"Caution",
    avoid:"Avoid", recommended:"Recommended", not_recommended:"Not recommended",
    consistent:"Consistent", inconsistent:"Inconsistent", increasing:"Increasing",
    decreasing:"Decreasing", stable:"Stable", anomaly:"Anomaly", no_anomaly:"No anomaly",
    yes:"Yes", no:"No", true:"Yes", false:"No",
    advisory:"Advisory", advisories:"Advisories", dangerous:"Dangerous",
    major:"Major", minor:"Minor", recall:"Recall",
    outstanding_recall:"Outstanding recall", marked_for_export:"Marked for export",
    suspension:"Suspension", tyres:"Tyres", tyre:"Tyre", lights:"Lights", light:"Light",
    bodywork:"Bodywork", exhaust:"Exhaust", brakes:"Brakes", brake:"Brake",
    steering:"Steering", visibility:"Visibility", windscreen:"Windscreen",
    wipers:"Wipers", washers:"Washers", seatbelts:"Seatbelts", seats:"Seats",
    doors:"Doors", mirrors:"Mirrors", horn:"Horn", registration_plate:"Registration plate",
    emissions:"Emissions", fuel_system:"Fuel system", electrical:"Electrical",
    engine:"Engine", chassis:"Chassis", corrosion:"Corrosion", structure:"Structure"
  };

  const ckbMap = {
    petrol:"بەنزین", diesel:"دیزڵ", electric:"کارەبایی", hybrid:"هایبرێد",
    phev:"هایبرێدی شەحنکراو", lpg:"گازی LPG", cng:"گازی CNG",
    car:"ئۆتۆمبێل", motorcycle:"ماتۆڕ", van:"ڤان", truck:"لۆری", bus:"پاس",
    valid:"دروستە", expired:"بەسەرچووە", pass:"سەرکەوتوو", passed:"سەرکەوتوو",
    fail:"شکستی هێنا", failed:"شکستی هێنا", taxed:"باجی دراوە", untaxed:"باجی نەدراوە",
    sorn:"SORN کراوە", compliant:"گونجاوە", non_compliant:"گونجاو نییە",
    unknown:"نادیارە", unavailable:"بەردەست نییە",
    low:"نزم", medium:"مامناوەند", high:"بەرز", very_low:"زۆر نزم", very_high:"زۆر بەرز",
    none:"هیچ", possible:"ئەگەری هەیە", possible_clocking:"ئەگەری دەستکاری مایلیج هەیە",
    excellent:"زۆر باش", very_good:"زۆر باش", good:"باش", fair:"مامناوەند",
    poor:"لاواز", very_poor:"زۆر لاواز", average:"ناوەند",
    above_average:"لە ناوەند زیاتر", below_average:"لە ناوەند کەمتر",
    buy:"باشە بۆ کڕین", consider:"بە وردی بپشکنە", caution:"بە وریاییەوە",
    avoid:"باشترە نەیکڕیت", recommended:"پێشنیار دەکرێت", not_recommended:"پێشنیار ناکرێت",
    consistent:"ئاسایی و یەکسان", inconsistent:"نایەکسان", increasing:"زیاد دەبێت",
    decreasing:"کەم دەبێت", stable:"جێگیرە", anomaly:"نائاساییە", no_anomaly:"هیچ نائاساییەک نییە",
    yes:"بەڵێ", no:"نەخێر", true:"بەڵێ", false:"نەخێر",
    advisory:"تێبینی", advisories:"تێبینییەکان", dangerous:"مەترسیدار",
    major:"گەورە", minor:"بچووک", recall:"بانگهێشتی چاککردنەوە",
    outstanding_recall:"بانگهێشتی چاککردنەوە هەیە", marked_for_export:"بۆ هەناردە نیشان کراوە",
    suspension:"سیستەمی سەسپێنشن", tyres:"تایەرەکان", tyre:"تایەر",
    lights:"چراغەکان", light:"چراغ", bodywork:"لاشی ئۆتۆمبێل", exhaust:"ئەگزۆز",
    brakes:"برێکەکان", brake:"برێک", steering:"فەرمان", visibility:"بینین",
    windscreen:"شوشەی پێشەوە", wipers:"وایپەرەکان", washers:"شوشتنەوەی شوشە",
    seatbelts:"کەمەربەندی سەلامەتی", seats:"کورسییەکان", doors:"دەرگاکان",
    mirrors:"ئاوێنەکان", horn:"هۆرن", registration_plate:"تابلۆی ژمارە",
    emissions:"دەرچوونی گاز", fuel_system:"سیستەمی سووتەمەنی",
    electrical:"سیستەمی کارەبایی", engine:"ئەنجن", chassis:"شاسی",
    corrosion:"گەنین / زەنگ", structure:"پێکهاتەی لاشە"
  };

  const map = currentLang !== "ckb" ? enMap : ckbMap;
  if(map[key]){
    return currentLang === "ckb" ? map[key] : translateString(map[key]);
  }

  if(currentLang !== "ckb"){
    if(key.includes("above_average")) return translateString("Above average");
    if(key.includes("below_average")) return translateString("Below average");
    if(key.includes("consistent")) return translateString("Consistent");
    if(key.includes("inconsistent")) return translateString("Inconsistent");
    if(key.includes("valid")) return translateString("Valid");
    if(key.includes("expired")) return translateString("Expired");
    if(key.includes("taxed")) return translateString("Taxed");
    if(key.includes("untaxed")) return translateString("Untaxed");
    return raw;
  }

  if(key.includes("above_average")) return "لە ناوەند زیاتر";
  if(key.includes("below_average")) return "لە ناوەند کەمتر";
  if(key.includes("consistent")) return "ئاسایی و یەکسان";
  if(key.includes("inconsistent")) return "نایەکسان";
  if(key.includes("valid")) return "دروستە";
  if(key.includes("expired")) return "بەسەرچووە";
  if(key.includes("taxed")) return "باجی دراوە";
  if(key.includes("untaxed")) return "باجی نەدراوە";

  return raw;
}

function بەها(v){
  return وەرگێڕانی_بەها(v);
}

function بەروار(v){
  if(!v) return currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە");
  const d = new Date(v);
  if(isNaN(d)) return String(v);
  return d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
}

function وەرگرتن(obj, paths){
  for(const path of paths){
    const parts = path.split(".");
    let cur = obj;
    for(const p of parts){
      if(cur === null || cur === undefined || !(p in cur)){
        cur = undefined; break;
      }
      cur = cur[p];
    }
    if(cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return null;
}

function دانان(id,v){ دۆزینەوە(id).textContent = بەها(v); }
function دانانی_بەروار(id,v){ دۆزینەوە(id).textContent = بەروار(v); }

function ژمارە_لەگەڵ_یەکە(v,unit){
  if(v === null || v === undefined || v === "") return currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە");
  const n = Number(v);
  if(Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-GB") + unit;
}

function پاراستنی_دەق(text){
  return String(text)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function ڕەنگی_بەها(id,v){
  const el = دۆزینەوە(id);
  if(!el) return;
  el.classList.remove("good","warn","bad");
  const x = String(v ?? "").toLowerCase();

  if(["valid","taxed","pass","passed","low","good","consistent","compliant","none","no","نەخێر"].some(k=>x.includes(k))){
    el.classList.add("good");
  }else if(["high","poor","fail","failed","expired","untaxed","avoid","possible"].some(k=>x.includes(k))){
    el.classList.add("bad");
  }else if(["medium","fair","consider","average","amber"].some(k=>x.includes(k))){
    el.classList.add("warn");
  }
}

function هەڵسەنگاندن(summary,s){
  let score = 75;

  const vr = String(summary.vehicleRiskLevel || "").toLowerCase();
  const mr = String(summary.motRiskLevel || "").toLowerCase();
  const mm = String(summary.mileageAnomalyRisk || "").toLowerCase();
  const maintenance = String(summary.maintenanceBand || summary.maintenanceRisk || "").toLowerCase();

  if(vr==="low") score += 8;
  if(vr==="medium") score -= 5;
  if(vr==="high") score -= 20;

  if(mr==="low") score += 6;
  if(mr==="medium") score -= 4;
  if(mr==="high") score -= 15;

  if(mm && mm!=="none" && mm!=="low") score -= 12;
  if(maintenance==="poor") score -= 10;
  if(maintenance==="good") score += 5;

  if(Number(s.motPassRate) >= .8) score += 5;
  if(Number(s.motPassRate) < .6 && s.motPassRate !== null && s.motPassRate !== undefined) score -= 8;

  score = Math.max(10,Math.min(95,Math.round(score)));

  let text = currentLang !== "ckb" ? translateString("Needs further checking") : "پێویستی بە پشکنینی زیاتر هەیە";
  let colour = "#f7c76d";
  if(score >= 80){ text = currentLang !== "ckb" ? translateString("Shows a good overall condition") : "دۆخی باش پیشان دەدات"; colour = "#5dd39e"; }
  if(score < 55){ text = currentLang !== "ckb" ? translateString("Check carefully") : "بە وریاییەوە بپشکنە"; colour = "#ff7070"; }

  دۆزینەوە("نمرە").textContent = score;
  دۆزینەوە("دەقی_هەڵسەنگاندن").textContent = text;
  دۆزینەوە("دەقی_هەڵسەنگاندن").style.color = colour;
  دۆزینەوە("دایرەی_هەڵسەنگاندن").style.background =
    "conic-gradient("+colour+" 0 "+score+"%,#272c33 "+score+"% 100%)";
}


function پۆند(v){
  const n = Number(v);
  if(!Number.isFinite(n)) return "—";
  return "£" + Math.round(n).toLocaleString("en-GB");
}

function پارەی_دوو_خانە(v){
  const n = Number(v);
  if(!Number.isFinite(n)) return "—";
  return "£" + n.toFixed(2);
}

async function خەمڵاندنی_سووتەمەنی_AI(d){
  const loading = دۆزینەوە("سووتەمەنی_AI_بارکردن");
  const resultBox = دۆزینەوە("سووتەمەنی_AI_ئەنجام");
  if(!loading || !resultBox) return;

  loading.style.display = "block";
  loading.textContent = currentLang !== "ckb"
    ? translateString("Estimating MPG and fuel costs...")
    : "MPG و تێچووی سووتەمەنی خەمڵێنرێت...";
  resultBox.style.display = "none";

  try{
    const response = await fetch("/api/fuel-estimate",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        registration:d.registration || d.registrationNumber || d.vrm || null,
        make:d.make || null,
        model:d.model || null,
        yearOfManufacture:d.yearOfManufacture || null,
        monthOfFirstRegistration:d.monthOfFirstRegistration || null,
        vehicleAgeYears:d.vehicleAgeYears || null,
        fuelType:d.fuelType || null,
        engineCapacityCc:d.engineCapacityCc || null,
        latestOdometerMiles:d.signals?.latestOdometerMiles ?? null,
        language:currentLang
      })
    });

    const result = await response.json();
    if(!response.ok || !result.ok){
      throw new Error(result.error || "Fuel estimate failed");
    }

    const f = result.fuel || {};

    دۆزینەوە("سووتەمەنی_MPG").textContent =
      Number.isFinite(Number(f.estimatedMpg)) ? Number(f.estimatedMpg).toFixed(1)+" MPG" : "—";

    دۆزینەوە("سووتەمەنی_1").textContent = پارەی_دوو_خانە(f.cost1MileGbp);
    دۆزینەوە("سووتەمەنی_100").textContent = پارەی_دوو_خانە(f.cost100MilesGbp);
    دۆزینەوە("سووتەمەنی_12000").textContent =
      Number.isFinite(Number(f.cost12000MilesGbp))
        ? "£"+Math.round(Number(f.cost12000MilesGbp)).toLocaleString("en-GB")
        : "—";

    const price = Number(f.pricePerLitreGbp);
    const fuelName = f.fuelType || d.fuelType || "";
    دۆزینەوە("سووتەمەنی_نرخ").textContent =
      currentLang !== "ckb"
        ? (translateString(fuelName) + ": £" + price.toFixed(3) + "/" + translateString("litre"))
        : (وەرگێڕانی_بەها(fuelName) + ": £" + price.toFixed(3) + "/لیتر");

    const c = f.confidence || "low";
    const cText = currentLang !== "ckb"
      ? translateString(({low:"Low",medium:"Medium",high:"High"}[c] || c))
      : ({low:"نزم",medium:"مامناوەند",high:"بەرز"}[c] || c);

    دۆزینەوە("سووتەمەنی_دڵنیایی").textContent =
      currentLang !== "ckb" ? translateString("Confidence:")+" "+cText : "ئاستی دڵنیایی: "+cText;

    دۆزینەوە("سووتەمەنی_هۆکار").textContent =
      f.reason || (currentLang !== "ckb"
        ? translateString("Estimated from the available vehicle details.")
        : "بەپێی زانیارییە بەردەستەکانی ئۆتۆمبێل خەمڵێنراوە.");

    loading.style.display = "none";
    resultBox.style.display = "block";
    setTimeout(refreshSelectedLanguage, 50);
  }catch(error){
    loading.textContent =
      (currentLang !== "ckb" ? translateString("Fuel-cost estimate unavailable:")+" " : "خەمڵاندنی تێچووی سووتەمەنی بەردەست نییە: ")
      + (error?.message || (currentLang !== "ckb" ? translateString("Unknown error") : "هەڵەی نەناسراو"));
  }
}


async function دۆزینەوەی_هاوشێوە(d){
  const loading = دۆزینەوە("هاوشێوە_بارکردن");
  const resultBox = دۆزینەوە("هاوشێوە_ئەنجام");
  const summaryBox = دۆزینەوە("هاوشێوە_کورتە");
  if(!loading || !resultBox) return;

  loading.style.display = "block";
  loading.textContent = currentLang !== "ckb"
    ? translateString("Finding similar cars currently for sale...")
    : "ئۆتۆمبێلی هاوشێوە دەگەڕێندرێت...";
  resultBox.innerHTML = "";
  if(summaryBox) summaryBox.style.display = "none";

  try{
    const response = await fetch("/api/similar-listings",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        make:d.make || null,
        model:d.model || null,
        year:d.yearOfManufacture || null,
        mileage:d.signals?.latestOdometerMiles ?? null,
        fuelType:d.fuelType || null
      })
    });

    const result = await response.json();
    if(!response.ok || !result.ok){
      throw new Error(result.error || "Similar vehicle search failed");
    }

    const cars = Array.isArray(result.cars) ? result.cars : [];

    if(!cars.length){
      loading.textContent = currentLang !== "ckb"
        ? translateString("No similar live listings were found.")
        : "هیچ ڕیکلامێکی زیندووی هاوشێوە نەدۆزرایەوە.";
      return;
    }

    loading.style.display = "none";

    if(summaryBox){
      const countText = currentLang !== "ckb"
        ? (cars.length + " " + translateString("similar live listings shown"))
        : (cars.length + " ئۆتۆمبێلی هاوشێوە پیشان دەدرێت");
      summaryBox.textContent = countText;
      summaryBox.style.display = "block";
    }

    const validCars = cars.filter(function(car){
      const p = Number(car.price);
      return Number.isFinite(p) && p > 0;
    });

    if(!validCars.length){
      loading.textContent = currentLang !== "ckb"
        ? translateString("No usable asking-price data was found.")
        : "هیچ داتایەکی بەکارهاتووی نرخی داواکراو نەدۆزرایەوە.";
      return;
    }

    const prices = validCars.map(function(car){ return Number(car.price); }).sort(function(a,b){ return a-b; });
    const minPrice = prices[0];
    const maxPrice = prices[prices.length-1];
    const averagePrice = prices.reduce(function(sum,p){ return sum+p; },0) / prices.length;
    const middle = Math.floor(prices.length/2);
    const medianPrice = prices.length % 2
      ? prices[middle]
      : (prices[middle-1] + prices[middle]) / 2;

    const formatPrice = function(v){
      return "£" + Math.round(v).toLocaleString("en-GB");
    };

    if(summaryBox){
      summaryBox.textContent = currentLang !== "ckb"
        ? (translateString("Based on") + " " + validCars.length + " " + translateString("similar live asking prices.") + " " + translateString("Typical market asking price:") + " " + formatPrice(medianPrice) + ".")
        : ("بەپێی " + validCars.length + " نرخی داواکراوی زیندووی هاوشێوە. نرخی ئاسایی بازاڕ: " + formatPrice(medianPrice) + ".");
      summaryBox.style.display = "block";
    }

    const summaryHtml =
      '<div class="market-summary">'+
        '<div class="market-box">'+
          '<small>'+(currentLang !== "ckb" ? translateString("Lowest asking price") : "نزمترین نرخی داواکراو")+'</small>'+
          '<strong>'+formatPrice(minPrice)+'</strong>'+
        '</div>'+
        '<div class="market-box">'+
          '<small>'+(currentLang !== "ckb" ? translateString("Typical asking price") : "نرخی ئاسایی داواکراو")+'</small>'+
          '<strong>'+formatPrice(medianPrice)+'</strong>'+
        '</div>'+
        '<div class="market-box">'+
          '<small>'+(currentLang !== "ckb" ? translateString("Highest asking price") : "بەرزترین نرخی داواکراو")+'</small>'+
          '<strong>'+formatPrice(maxPrice)+'</strong>'+
        '</div>'+
      '</div>';

    const maxScale = maxPrice > 0 ? maxPrice : 1;
    const bars = [
      {label:currentLang !== "ckb" ? translateString("Lowest") : "نزمترین", value:minPrice},
      {label:currentLang !== "ckb" ? translateString("Typical") : "ئاسایی", value:medianPrice},
      {label:currentLang !== "ckb" ? translateString("Average") : "ناوەند", value:averagePrice},
      {label:currentLang !== "ckb" ? translateString("Highest") : "بەرزترین", value:maxPrice}
    ];

    const barsHtml = bars.map(function(item){
      const width = Math.max(6, Math.round((item.value / maxScale) * 100));
      return '<div class="market-bar-row">'+
        '<div class="market-bar-label">'+پاراستنی_دەق(item.label)+'</div>'+
        '<div class="market-bar-track"><div class="market-bar" style="width:'+width+'%"></div></div>'+
        '<div class="market-bar-value">'+formatPrice(item.value)+'</div>'+
      '</div>';
    }).join("");

    resultBox.innerHTML = summaryHtml + barsHtml;
    setTimeout(refreshSelectedLanguage, 50);

  }catch(error){
    loading.textContent =
      (currentLang !== "ckb" ? translateString("Similar listings unavailable:")+" " : "ڕیکلامی هاوشێوە بەردەست نییە: ")
      + (error?.message || (currentLang !== "ckb" ? translateString("Unknown error") : "هەڵەی نەناسراو"));
  }
}



function نیشاندانی_CAZ_بۆ_دیزڵ(d){
  const card = دۆزینەوە("CAZ_کارت");
  const list = دۆزینەوە("CAZ_لیست");
  const summary = دۆزینەوە("CAZ_کورتە");
  if(!card || !list || !summary) return;

  const fuel = String(d?.fuelType || "").toLowerCase();
  if(!fuel.includes("diesel")){
    card.style.display = "none";
    list.innerHTML = "";
    summary.textContent = "";
    return;
  }

  card.style.display = "block";

  const rawEuro = String(d?.signals?.euroEmissionStandard || "").toUpperCase();
  const match = rawEuro.match(/(?:EURO\s*)?([0-9]+)/);
  const euro = match ? Number(match[1]) : null;
  const euro6 = Number.isFinite(euro) ? euro >= 6 : null;

  summary.textContent = currentLang !== "ckb"
    ? (translateString("Diesel vehicle") + (rawEuro ? " · " + rawEuro : "") + ". " + translateString("CAZ result for a normal private car:"))
    : ("ئۆتۆمبێلی دیزڵ" + (rawEuro ? " · " + rawEuro : "") + " ـە. ئەنجامی CAZ بۆ ئۆتۆمبێلی تایبەتی ئاسایی:");

  function row(city, type, textCkb, textEn){
    const cls = type === "ok" ? "caz-ok" : (type === "pay" ? "caz-pay" : "caz-check");
    return '<div class="caz-row">'+
      '<span class="caz-city">'+پاراستنی_دەق(city)+'</span>'+
      '<span class="caz-status '+cls+'">'+پاراستنی_دەق(currentLang !== "ckb" ? translateString(textEn) : textCkb)+'</span>'+
    '</div>';
  }

  let html = "";
  html += row("Bath","ok","✅ پارە نادات","✅ No charge");
  html += row("Bradford","ok","✅ پارە نادات","✅ No charge");
  html += row("Portsmouth","ok","✅ پارە نادات","✅ No charge");
  html += row("Sheffield","ok","✅ پارە نادات","✅ No charge");
  html += row("Tyneside","ok","✅ پارە نادات","✅ No charge");

  if(euro6 === true){
    html += row("Birmingham","ok","✅ پارە نادات","✅ No charge");
    html += row("Bristol","ok","✅ پارە نادات","✅ No charge");
  }else if(euro6 === false){
    html += row("Birmingham","pay","⚠️ £8 / ڕۆژ","⚠️ £8 / day");
    html += row("Bristol","pay","⚠️ £9 / ڕۆژ","⚠️ £9 / day");
  }else{
    html += row("Birmingham","check","⚠️ Euro بەردەست نییە","⚠️ Euro standard unavailable");
    html += row("Bristol","check","⚠️ Euro بەردەست نییە","⚠️ Euro standard unavailable");
  }

  list.innerHTML = html;
  setTimeout(refreshSelectedLanguage, 60);
}



async function refreshSelectedLanguage(){
  if(currentLang === "ckb") return;
  if(!languagePackReady) await loadLanguagePack();
  translateElementTree(document.body);
}


let latestExtraInsights = null;
let latestCheckedVehicle = null;

function toggleExtraBox(id){
  const el = دۆزینەوە(id);
  if(el) el.classList.toggle("show");
}

function moneyRange(min,max){
  const a=Number(min), b=Number(max);
  if(!Number.isFinite(a) && !Number.isFinite(b)) return "—";
  if(Number.isFinite(a) && Number.isFinite(b)) return "£"+Math.round(a).toLocaleString("en-GB")+"–£"+Math.round(b).toLocaleString("en-GB");
  const n=Number.isFinite(a)?a:b;
  return "£"+Math.round(n).toLocaleString("en-GB");
}

function renderExtraInsights(x){
  latestExtraInsights=x||{};
  const perf=x?.performance||{};
  const tyres=x?.tyres||{};
  const timing=x?.timing||{};
  const val=(v,suffix)=> (v===null||v===undefined||v==="") ? "—" : String(v)+(suffix||"");
  دۆزینەوە("extra_060").textContent=val(perf.zeroTo60Seconds," sec");
  دۆزینەوە("extra_bhp").textContent=val(perf.bhp," BHP");
  دۆزینەوە("extra_torque").textContent=val(perf.torqueNm," Nm");
  دۆزینەوە("extra_top_speed").textContent=val(perf.topSpeedMph," mph");
  دۆزینەوە("extra_insurance").textContent=x?.insuranceGroup || "—";
  دۆزینەوە("extra_timing").textContent=timing.type || "—";
  دۆزینەوە("extra_front_tyre").textContent=tyres.front || "—";
  دۆزینەوە("extra_rear_tyre").textContent=tyres.rear || tyres.front || "—";
  const tn=دۆزینەوە("extra_timing_note");
  if(timing.note){tn.textContent=timing.note;tn.style.display="block"}else{tn.style.display="none"}

  const problems=Array.isArray(x?.commonProblems)?x.commonProblems:[];
  دۆزینەوە("commonProblemsList").innerHTML=problems.length?problems.map(function(i){
    return '<div class="issue-item"><div class="issue-title">'+پاراستنی_دەق(i.title||"—")+'</div><div class="issue-meta">'+پاراستنی_دەق(i.risk||"")+'</div><div class="small">'+پاراستنی_دەق(i.description||"")+'</div></div>';
  }).join(""):'<div class="muted">زانیاری بەردەست نییە.</div>';

  const service=Array.isArray(x?.serviceSchedule)?x.serviceSchedule:[];
  دۆزینەوە("serviceScheduleList").innerHTML=service.length?service.map(function(i){
    return '<div class="service-item"><div class="issue-title">'+پاراستنی_دەق(i.item||"—")+'</div><div class="small">'+پاراستنی_دەق(i.interval||"—")+(i.note?' · '+پاراستنی_دەق(i.note):'')+'</div></div>';
  }).join(""):'<div class="muted">زانیاری بەردەست نییە.</div>';

  const hist=Array.isArray(x?.previousSaleHistory)?x.previousSaleHistory:[];
  دۆزینەوە("saleHistoryList").innerHTML=hist.length?hist.map(function(i){
    return '<div class="row"><span class="label">'+پاراستنی_دەق(i.date||"—")+'</span><span class="value">'+پاراستنی_دەق(i.price||"—")+(i.mileage?' · '+پاراستنی_دەق(i.mileage):'')+'</span></div>';
  }).join(""):'هیچ مێژووی ڕیکلام/فرۆشتنی پێشووی پشتڕاستکراوە لە سەرچاوەکانی ئێستا بەردەست نییە.';

  دۆزینەوە("extra_source").textContent=x?.sourceLabel || "Vehicle data + AI guidance";
  دۆزینەوە("insight_loading").style.display="none";
  دۆزینەوە("insight_content").style.display="block";
}

async function loadExtraInsights(d){
  latestCheckedVehicle=d; latestExtraInsights=null;
  const loading=دۆزینەوە("insight_loading"), content=دۆزینەوە("insight_content");
  loading.style.display="block"; content.style.display="none";
  loading.textContent=currentLang==="ckb"?"زانیاریی زیاتر دەهێنرێت...":"Loading additional vehicle information...";
  try{
    const r=await fetch("/api/vehicle-insights",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      registration:d.registration||d.registrationNumber||d.vrm||null, make:d.make||null, model:d.model||null, year:d.yearOfManufacture||null,
      fuelType:d.fuelType||null, engineCapacityCc:d.engineCapacityCc||null, mileage:d.signals?.latestOdometerMiles??null,
      insuranceGroup:وەرگرتن(d,["insuranceGroup","signals.insuranceGroup","summary.insuranceGroup"]),
      bhp:وەرگرتن(d,["bhp","powerBhp","signals.bhp","signals.powerBhp"]), torqueNm:وەرگرتن(d,["torqueNm","signals.torqueNm"]),
      topSpeedMph:وەرگرتن(d,["topSpeedMph","signals.topSpeedMph"]), zeroTo60Seconds:وەرگرتن(d,["zeroTo60Seconds","signals.zeroTo60Seconds"]),
      language:currentLang
    })});
    const j=await r.json(); if(!r.ok||!j.ok) throw new Error(j.error||"Extra vehicle information failed");
    renderExtraInsights(j.insights||{});
    setTimeout(refreshSelectedLanguage,100);
  }catch(e){loading.textContent=(currentLang==="ckb"?"زانیاریی زیاتر بەردەست نییە: ":"Additional information unavailable: ")+(e.message||"");}
}

function openRepairModal(){
  const m=دۆزینەوە("repairModal"); if(!m)return;
  const v=latestCheckedVehicle||{};
  دۆزینەوە("repairVehicleName").textContent=[v.make,v.model,v.yearOfManufacture].filter(Boolean).join(" ");
  const repairs=Array.isArray(latestExtraInsights?.repairCosts)?latestExtraInsights.repairCosts:[];
  دۆزینەوە("repairList").innerHTML=repairs.length?repairs.map(function(i){
    return '<div class="repair-item"><div class="repair-title">'+پاراستنی_دەق(i.repair||"—")+'</div><div class="repair-price-grid">'+
      '<div class="repair-price"><small>پارچە</small><b>'+moneyRange(i.partsMinGbp,i.partsMaxGbp)+'</b></div>'+
      '<div class="repair-price"><small>کار</small><b>'+moneyRange(i.labourMinGbp,i.labourMaxGbp)+'</b></div>'+
      '<div class="repair-price"><small>کۆی گشتی</small><b>'+moneyRange(i.totalMinGbp,i.totalMaxGbp)+'</b></div>'+
      '</div>'+(i.note?'<div class="small" style="margin-top:9px">'+پاراستنی_دەق(i.note)+'</div>':'')+'</div>';
  }).join(""):'<div class="muted">خەمڵاندنی نرخی چاککردنەوە بەردەست نییە.</div>';
  m.classList.add("show"); document.body.style.overflow="hidden";
  setTimeout(refreshSelectedLanguage,50);
}
function closeRepairModal(event){if(event&&event.target!==دۆزینەوە("repairModal"))return;const m=دۆزینەوە("repairModal");if(m)m.classList.remove("show");document.body.style.overflow=""}


function compareText(ckb,en){ return currentLang==="ckb" ? ckb : translateString(en); }
function openCompareModal(){
  const m=دۆزینەوە("compareModal"); if(!m)return;
  m.classList.add("show"); document.body.style.overflow="hidden";
  دۆزینەوە("compareResults").style.display="none";
  دۆزینەوە("compareStatus").style.display="none";
  setTimeout(refreshSelectedLanguage,30);
}
function closeCompareModal(event){
  if(event&&event.target!==دۆزینەوە("compareModal"))return;
  const m=دۆزینەوە("compareModal");if(m)m.classList.remove("show");document.body.style.overflow="";
}
function cleanCompareReg(v){return String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"");}
function compareMedianPrice(cars){
  const nums=(Array.isArray(cars)?cars:[]).map(x=>Number(x?.price)).filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>a-b);
  if(!nums.length)return null; const mid=Math.floor(nums.length/2); return nums.length%2?nums[mid]:(nums[mid-1]+nums[mid])/2;
}
function compareMoney(v){return Number.isFinite(Number(v))?"£"+Math.round(Number(v)).toLocaleString("en-GB"):"—";}
function compareMiles(v){return Number.isFinite(Number(v))?Math.round(Number(v)).toLocaleString("en-GB")+" mi":"—";}
function comparePercent(v){const n=Number(v);return Number.isFinite(n)?Math.round(n*100)+"%":"—";}
function compareVehicleName(d){return [d?.make,d?.model,d?.yearOfManufacture].filter(Boolean).join(" ")||"—";}
function compareAvgRepair(insights){
  const arr=Array.isArray(insights?.repairCosts)?insights.repairCosts:[];
  const vals=arr.map(x=>{const a=Number(x.totalMinGbp),b=Number(x.totalMaxGbp);return Number.isFinite(a)&&Number.isFinite(b)?(a+b)/2:null}).filter(Number.isFinite);
  return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null;
}
async function comparePost(url,body){
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({})); if(!r.ok||j.ok===false)throw new Error(j.error||"Request failed"); return j;
}
async function compareEnrich(d){
  const base={registration:d.registration||d.registrationNumber||d.vrm||null,make:d.make||null,model:d.model||null,year:d.yearOfManufacture||null,fuelType:d.fuelType||null,engineCapacityCc:d.engineCapacityCc||null,mileage:d.signals?.latestOdometerMiles??null,language:currentLang};
  const [marketR,fuelR,insightR]=await Promise.allSettled([
    comparePost("/api/similar-listings",{make:base.make,model:base.model,year:base.year,mileage:base.mileage}),
    comparePost("/api/fuel-estimate",base),
    comparePost("/api/vehicle-insights",base)
  ]);
  return {
    marketCars:marketR.status==="fulfilled"?(marketR.value.cars||[]):[],
    marketPrice:marketR.status==="fulfilled"?compareMedianPrice(marketR.value.cars):null,
    fuel:fuelR.status==="fulfilled"?(fuelR.value.fuel||null):null,
    insights:insightR.status==="fulfilled"?(insightR.value.insights||null):null
  };
}
function comparePack(d,e){
  const s=d.signals||{},q=d.summary||{};
  return {registration:d.registration||d.registrationNumber||d.vrm||null,name:compareVehicleName(d),make:d.make||null,model:d.model||null,year:d.yearOfManufacture||null,age:d.vehicleAgeYears??null,fuelType:d.fuelType||null,engineCapacityCc:d.engineCapacityCc??null,mileage:s.latestOdometerMiles??null,motStatus:s.motStatus??null,taxStatus:s.taxStatus??null,motPassRate:s.motPassRate??null,totalMotTests:s.totalMotTests??null,totalMotFailures:s.totalMotFailures??null,totalAdvisories:s.totalMotAdvisories??s.totalAdvisories??q.totalMotAdvisories??null,latestAdvisories:s.latestMotAdvisoryCount??s.latestAdvisoryCount??null,mileageRisk:q.mileageAnomalyRisk??null,motRisk:q.motRiskLevel??null,vehicleRisk:q.vehicleRiskLevel??null,buyRecommendation:q.buyRecommendation??null,marketPrice:e.marketPrice??null,annualFuelCost:e.fuel?.cost12000MilesGbp??null,estimatedMpg:e.fuel?.estimatedMpg??null,commonProblems:Array.isArray(e.insights?.commonProblems)?e.insights.commonProblems.slice(0,4):[],averageRepair:e.insights?compareAvgRepair(e.insights):null};
}
function renderCompareCar(el,c,score,winner){
  el.classList.toggle("winner",!!winner);
  el.innerHTML='<div class="compare-reg">'+پاراستنی_دەق(c.registration||"—")+'</div><h3>'+پاراستنی_دەق(c.name||"—")+'</h3><div class="compare-score">'+پاراستنی_دەق(score!=null?score+"/100":"—")+'</div><div class="small">'+پاراستنی_دەق([c.fuelType,c.engineCapacityCc?c.engineCapacityCc+" cc":null].filter(Boolean).join(" · "))+'</div>';
}
function compareRow(label,a,b){return '<div class="compare-row"><div class="compare-label">'+پاراستنی_دەق(label)+'</div><div class="compare-value">'+پاراستنی_دەق(a??"—")+'</div><div class="compare-value">'+پاراستنی_دەق(b??"—")+'</div></div>';}
async function runCarComparison(){
  const r1=cleanCompareReg(دۆزینەوە("compareReg1").value), r2=cleanCompareReg(دۆزینەوە("compareReg2").value);
  if(r1.length<2||r2.length<2){alert(compareText("تکایە هەردوو ژمارەی تۆمار بنووسە.","Please enter both registrations."));return;}
  if(r1===r2){alert(compareText("دوو ژمارەی جیاواز بنووسە.","Please enter two different registrations."));return;}
  const btn=دۆزینەوە("compareRunBtn"),status=دۆزینەوە("compareStatus"),results=دۆزینەوە("compareResults");
  btn.disabled=true;results.style.display="none";status.style.display="block";status.textContent=compareText("زانیاری هەردوو ئۆتۆمبێل دەهێنرێت...","Checking both vehicles...");
  try{
    await ensureLanguageTexts(["Compare 2 cars","Car 1","Car 2","Compare cars","AI summary","Please enter both registrations.","Please enter two different registrations.","Checking both vehicles...","Comparing market price, MOT, mileage, fuel and repair risk...","Market price guide","Mileage","MOT pass rate","MOT failures","MOT advisories","Annual fuel estimate","Average repair estimate","Overall risk","MOT status","Tax status","Overall winner","Best value","Lower running cost","Lower repair risk","Better MOT history"]);
    const [c1r,c2r]=await Promise.all([comparePost("/api/check",{registration:r1}),comparePost("/api/check",{registration:r2})]);
    const d1=c1r.data||{},d2=c2r.data||{};
    status.textContent=compareText("نرخی بازاڕ، MOT، مایلیج، سووتەمەنی و مەترسی چاککردنەوە بەراورد دەکرێت...","Comparing market price, MOT, mileage, fuel and repair risk...");
    const [e1,e2]=await Promise.all([compareEnrich(d1),compareEnrich(d2)]);
    const p1=comparePack(d1,e1),p2=comparePack(d2,e2);
    const summaryR=await comparePost("/api/compare-summary",{language:currentLang,car1:p1,car2:p2});
    const a=summaryR.comparison||{};
    renderCompareCar(دۆزینەوە("compareCar1"),p1,a.car1Score,a.overallWinner==="car1");
    renderCompareCar(دۆزینەوە("compareCar2"),p2,a.car2Score,a.overallWinner==="car2");
    دۆزینەوە("compareTable").innerHTML=
      compareRow(currentLang==="ckb"?"نرخی بازاڕ":translateString("Market price guide"),compareMoney(p1.marketPrice),compareMoney(p2.marketPrice))+
      compareRow(currentLang==="ckb"?"مایلیج":translateString("Mileage"),compareMiles(p1.mileage),compareMiles(p2.mileage))+
      compareRow(currentLang==="ckb"?"ڕێژەی سەرکەوتنی MOT":translateString("MOT pass rate"),comparePercent(p1.motPassRate),comparePercent(p2.motPassRate))+
      compareRow(currentLang==="ckb"?"شکستی MOT":translateString("MOT failures"),p1.totalMotFailures??"—",p2.totalMotFailures??"—")+
      compareRow(currentLang==="ckb"?"تێبینییەکانی MOT":translateString("MOT advisories"),p1.totalAdvisories??"—",p2.totalAdvisories??"—")+
      compareRow(currentLang==="ckb"?"سووتەمەنی ساڵانە":translateString("Annual fuel estimate"),compareMoney(p1.annualFuelCost),compareMoney(p2.annualFuelCost))+
      compareRow(currentLang==="ckb"?"ناوەندی چاککردنەوە":translateString("Average repair estimate"),compareMoney(p1.averageRepair),compareMoney(p2.averageRepair))+
      compareRow(currentLang==="ckb"?"مەترسی گشتی":translateString("Overall risk"),p1.vehicleRisk||"—",p2.vehicleRisk||"—")+
      compareRow(currentLang==="ckb"?"دۆخی MOT":translateString("MOT status"),p1.motStatus||"—",p2.motStatus||"—")+
      compareRow(currentLang==="ckb"?"دۆخی باج":translateString("Tax status"),p1.taxStatus||"—",p2.taxStatus||"—");
    دۆزینەوە("compareVerdict").textContent=a.verdict||"";
    دۆزینەوە("compareSummary").textContent=a.summary||"";
    const points=[];
    if(a.bestValue)points.push((currentLang==="ckb"?"باشترین بەها: ":translateString("Best value")+": ")+a.bestValue);
    if(a.lowerRunningCost)points.push((currentLang==="ckb"?"کەمترین تێچووی بەکارهێنان: ":translateString("Lower running cost")+": ")+a.lowerRunningCost);
    if(a.lowerRepairRisk)points.push((currentLang==="ckb"?"کەمترین مەترسی چاککردنەوە: ":translateString("Lower repair risk")+": ")+a.lowerRepairRisk);
    if(a.betterMotHistory)points.push((currentLang==="ckb"?"باشترین مێژووی MOT: ":translateString("Better MOT history")+": ")+a.betterMotHistory);
    (Array.isArray(a.keyReasons)?a.keyReasons:[]).forEach(x=>points.push(x));
    دۆزینەوە("comparePoints").innerHTML=points.map(x=>'<div class="compare-point">'+پاراستنی_دەق(x)+'</div>').join("");
    results.style.display="block";status.style.display="none";
  }catch(e){status.style.display="block";status.textContent=(currentLang==="ckb"?"بەراوردکردن سەرکەوتوو نەبوو: ":"Comparison failed: ")+(e.message||e);}
  finally{btn.disabled=false;}
}

async function printVehicleReport(){
  if(!latestCheckedVehicle){return;}
  try{
    await ensureLanguageTexts(["Print / Save report","Report generated","Repair cost estimate","Parts","Labour","Total","Repair-cost estimate unavailable.","These are estimated UK market repair costs, not a garage quotation. Actual prices vary by location, parts used and labour time."]);
    refreshSelectedLanguage();
  }catch{}

  const v=latestCheckedVehicle||{};
  const reg=String(v.registration||v.registrationNumber||v.vrm||document.getElementById("تابلۆ")?.textContent||"").trim();
  const generatedLabel=currentLang==="ckb"?"ڕاپۆرت دروستکرا":translateString("ڕاپۆرت دروستکرا");
  const localeMap={ckb:"ckb-IQ",en:"en-GB",ar:"ar",fa:"fa-IR",tr:"tr-TR",fr:"fr-FR",de:"de-DE",es:"es-ES",ro:"ro-RO",pl:"pl-PL",ur:"ur-PK",ps:"ps-AF"};
  let dateText="";
  try{dateText=new Intl.DateTimeFormat(localeMap[currentLang]||"en-GB",{dateStyle:"long",timeStyle:"short"}).format(new Date())}catch{dateText=new Date().toLocaleString("en-GB")}
  const meta=document.getElementById("printReportMeta");
  if(meta) meta.innerHTML=(reg?'<div style="font-weight:800;direction:ltr">'+پاراستنی_دەق(reg)+'</div>':'')+'<div>'+پاراستنی_دەق(generatedLabel)+': '+پاراستنی_دەق(dateText)+'</div>';

  const repairs=Array.isArray(latestExtraInsights?.repairCosts)?latestExtraInsights.repairCosts:[];
  const list=document.getElementById("printRepairList");
  if(list){
    const partsLabel=currentLang==="ckb"?"پارچە":translateString("Parts");
    const labourLabel=currentLang==="ckb"?"کار":translateString("Labour");
    const totalLabel=currentLang==="ckb"?"کۆی گشتی":translateString("Total");
    list.innerHTML=repairs.length?repairs.map(function(i){
      return '<div class="repair-item"><div class="repair-title">'+پاراستنی_دەق(i.repair||"—")+'</div><div class="repair-price-grid">'+
        '<div class="repair-price"><small>'+پاراستنی_دەق(partsLabel)+'</small><b>'+moneyRange(i.partsMinGbp,i.partsMaxGbp)+'</b></div>'+ 
        '<div class="repair-price"><small>'+پاراستنی_دەق(labourLabel)+'</small><b>'+moneyRange(i.labourMinGbp,i.labourMaxGbp)+'</b></div>'+ 
        '<div class="repair-price"><small>'+پاراستنی_دەق(totalLabel)+'</small><b>'+moneyRange(i.totalMinGbp,i.totalMaxGbp)+'</b></div>'+ 
        '</div>'+(i.note?'<div class="small" style="margin-top:9px">'+پاراستنی_دەق(i.note)+'</div>':'')+'</div>';
    }).join(""):'<div class="muted">'+پاراستنی_دەق(currentLang==="ckb"?"خەمڵاندنی نرخی چاککردنەوە بەردەست نییە.":translateString("Repair-cost estimate unavailable."))+'</div>';
  }

  const oldTitle=document.title;
  document.title=(reg?reg+" - ":"")+"Akar's Car Check";
  setTimeout(function(){window.print();setTimeout(function(){document.title=oldTitle;},500);},120);
}

function checkAnotherCar(){
  window.location.reload();
}

async function پشکنین(){
  const vrm = دۆزینەوە("ژمارە").value.toUpperCase().replace(/[^A-Z0-9]/g,"");

  if(vrm.length < 2){
    alert(currentLang === "ckb" ? "تکایە ژمارەی تۆماری دروست بنووسە." : translateString("تکایە ژمارەی تۆماری دروست بنووسە."));
    return;
  }

  دۆزینەوە("دوگمە").disabled = true;
  دۆزینەوە("دوگمە").textContent = currentLang === "ckb" ? "لە پشکنین دایە..." : translateString("لە پشکنین دایە...");
  دۆزینەوە("پەیام").className = "message";
  دۆزینەوە("پەیام").style.display = "block";
  دۆزینەوە("پەیام").textContent = currentLang === "ckb" ? "زانیاری ڕاستەوخۆ وەردەگیرێت..." : translateString("زانیاری ڕاستەوخۆ وەردەگیرێت...");
  دۆزینەوە("ڕاپۆرت").style.display = "none";

  try{
    const response = await fetch("/api/check",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({registration:vrm})
    });

    const result = await response.json();
    if(!response.ok || !result.ok){
      throw new Error(result.error || (currentLang === "ckb" ? "پشکنینی ئۆتۆمبێل سەرکەوتوو نەبوو." : translateString("پشکنینی ئۆتۆمبێل سەرکەوتوو نەبوو.")));
    }

    const d = result.data || {};
    const s = d.signals || {};
    const summary = d.summary || {};

    const reg = d.registration || d.registrationNumber || d.vrm || vrm;
    دۆزینەوە("تابلۆ").textContent = reg;
    دۆزینەوە("سەردێڕ").textContent = [d.make,d.model].filter(Boolean).join(" ") || (currentLang === "ckb" ? "ڕاپۆرتی ئۆتۆمبێل" : translateString("ڕاپۆرتی ئۆتۆمبێل"));
    دۆزینەوە("کورتەی_ئۆتۆمبێل").textContent =
      [d.fuelType,d.engineCapacityCc ? (d.engineCapacityCc+" cc") : null,d.colour,d.yearOfManufacture].filter(Boolean).join(" · ") || "—";

    دانان("مارکە",d.make);
    دانان("مۆدێل",d.model);
    دانان("ڕەنگ",d.colour);
    دانان("سووتەمەنی",d.fuelType);

    دۆزینەوە("ئەنجن").textContent =
      d.engineCapacityCc !== null && d.engineCapacityCc !== undefined
      ? Number(d.engineCapacityCc).toLocaleString("en-GB")+" cc"
      : (currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە"));

    دانان("ساڵ",d.yearOfManufacture);
    دۆزینەوە("تەمەن").textContent =
      d.vehicleAgeYears !== null && d.vehicleAgeYears !== undefined
      ? d.vehicleAgeYears + (currentLang !== "ckb" ? " " + translateString("years") : " ساڵ") : (currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە"));
    دانان("یەکەم_تۆمار",d.monthOfFirstRegistration);

    دانانی_بەروار("V5C",وەرگرتن(d,[
      "signals.v5cLastIssued","signals.latestV5CIssuedDate",
      "signals.lastV5CIssuedDate","latestV5CIssuedDate","dateOfLastV5CIssued"
    ]));
    دانان("هەناردە",وەرگرتن(d,["signals.markedForExport","markedForExport"]));

    دانان("MOT",s.motStatus);
    دانانی_بەروار("MOT_بەسەرچوون",s.motExpiryDate);
    دانان("MOT_ڕۆژ",وەرگرتن(d,["signals.motDaysRemaining","signals.daysToMotExpiry"]));
    دانان("باج",s.taxStatus);
    دانانی_بەروار("باج_بەروار",s.taxDueDate);
    دانان("باج_ڕۆژ",وەرگرتن(d,["signals.taxDaysRemaining","signals.daysToTaxDue"]));
    دانانی_بەروار("دوا_MOT_بەروار",s.lastMotDate);
    دانان("دوا_MOT_ئەنجام",s.lastMotResult);
    دانان("کۆی_MOT",s.totalMotTests);
    دانان("شکست",s.totalMotFailures);
    دانان("تێبینی_کۆ",وەرگرتن(d,["signals.totalMotAdvisories","signals.totalAdvisories","summary.totalMotAdvisories"]));
    دانان("تێبینی_دوا",وەرگرتن(d,["signals.latestMotAdvisoryCount","signals.latestAdvisoryCount"]));

    دۆزینەوە("ڕێژەی_MOT").textContent =
      s.motPassRate !== null && s.motPassRate !== undefined
      ? Math.round(Number(s.motPassRate)*100)+"%" : (currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە"));

    دۆزینەوە("مایلیج").textContent =
      s.latestOdometerMiles !== null && s.latestOdometerMiles !== undefined
      ? Number(s.latestOdometerMiles).toLocaleString("en-GB") + (currentLang !== "ckb" ? " " + translateString("miles") : " مایل") : (currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە"));

    دۆزینەوە("مایلیج_ساڵانە").textContent =
      ژمارە_لەگەڵ_یەکە(
        وەرگرتن(d,["signals.typicalAnnualMileageMiles","signals.typicalAnnualMileage","signals.annualMileage","summary.typicalAnnualMileage"]),
        (currentLang !== "ckb" ? " " + translateString("miles/year") : " مایل/ساڵ")
      );

    دانان("ڕەوتی_مایلیج",s.odometerTrend);
    دانان("مەترسی_مایلیج",summary.mileageAnomalyRisk);
    دانان("بەراوردی_مایلیج",وەرگرتن(d,["signals.odometerVsFleetAverage","signals.mileageVsFleetAverage","summary.mileageVsFleetAverage"]));

    دانان("Euro",s.euroEmissionStandard);
    const co2 = وەرگرتن(d,["signals.co2EmissionsGPerKm","signals.co2Emissions","co2EmissionsGPerKm","co2Emissions"]);
    دۆزینەوە("CO2").textContent = co2 !== null && co2 !== undefined ? بەها(co2)+" g/km" : (currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە"));
    دانان("ULEZ",s.ulezCompliant);
    دانان("RDE",وەرگرتن(d,["signals.realDrivingEmissions","realDrivingEmissions"]));

    دانان("مەترسی_گشتی",summary.vehicleRiskLevel);
    دانان("مەترسی_MOT",summary.motRiskLevel);
    دانان("مەترسی_نائاسایی",summary.mileageAnomalyRisk);
    دانان("گۆڕینی_ڕەنگ",summary.colourChangeIndicated);
    دانان("Recall",وەرگرتن(d,["signals.hasOutstandingRecall","signals.outstandingRecall","summary.outstandingRecall"]));

    const ncap = وەرگرتن(d,[
      "signals.ncapSafetyRating.overallStars","signals.ncapSafetyRating.stars",
      "signals.ncapRating","ncapSafetyRating.overallStars"
    ]);
    دۆزینەوە("NCAP").textContent = ncap !== null && ncap !== undefined ? بەها(ncap)+" ⭐" : (currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە"));

    دانان("پێشنیار",summary.buyRecommendation);
    دانان("دۆخ",وەرگرتن(d,["summary.conditionBand","summary.condition","summary.vehicleCondition","signals.condition"]));
    دانان("چاککردنەوە",وەرگرتن(d,["summary.maintenanceBand","summary.maintenanceRisk","signals.maintenanceRisk","summary.maintenanceCondition"]));

    ["MOT","باج","دوا_MOT_ئەنجام","ڕەوتی_مایلیج","مەترسی_مایلیج","ULEZ","مەترسی_گشتی","مەترسی_MOT","مەترسی_نائاسایی","پێشنیار","دۆخ","چاککردنەوە"].forEach(id=>{
      ڕەنگی_بەها(id,دۆزینەوە(id).textContent);
    });

    هەڵسەنگاندن(summary,s);

    const clusters = وەرگرتن(d,["signals.failureClusters","summary.failureClusters"]);
    if(Array.isArray(clusters) && clusters.length){
      دۆزینەوە("کێشە_دووبارە").innerHTML = clusters.map(item=>{
        if(typeof item==="string"){
          return '<div class="row"><span class="label">'+(currentLang === "ckb" ? "جۆری کێشە" : translateString("جۆری کێشە"))+'</span><span class="value">'+پاراستنی_دەق(وەرگێڕانی_بەها(item))+'</span></div>';
        }
        const name = item.category || item.name || item.type || "کێشە";
        const count = item.count ?? item.total ?? item.occurrences ?? "—";
        return '<div class="row"><span class="label">'+پاراستنی_دەق(وەرگێڕانی_بەها(name))+'</span><span class="value">'+پاراستنی_دەق(count)+'</span></div>';
      }).join("");
    }else{
      دۆزینەوە("کێشە_دووبارە").innerHTML =
        '<div class="muted">'+(currentLang !== "ckb" ? translateString("No additional recurring-issue information is available.") : "هیچ زانیارییەکی زیاتر بۆ کێشە دووبارەبووەکان بەردەست نییە.")+'</div>';
    }

    const motDetails = وەرگرتن(d,["motHistory","mot_history","signals.motHistory","motTests"]);
    if(Array.isArray(motDetails) && motDetails.length){
      if(currentLang !== "ckb" && currentLang !== "en"){
        const motEnglishTexts=[];
        motDetails.forEach(function(test){
          const rawNotes=test.rfrAndComments||test.defects||test.advisories||[];
          (Array.isArray(rawNotes)?rawNotes:[]).forEach(function(a){
            const obj=typeof a==="string"?{text:a}:(a||{});
            const t=String(obj.text||obj.comment||obj.description||"").trim();
            if(t) motEnglishTexts.push(t);
          });
        });
        await ensureLanguageTexts(motEnglishTexts);
      }
      دۆزینەوە("مێژووی_MOT").innerHTML = motDetails.map(test=>{
        const testDate = test.testDate || test.test_date || test.date || "—";
        const resultText = String(test.result || test.testResult || "—");
        const mileageVal = test.odometerMiles ?? test.odometer ?? test.mileage ?? null;
        const expiryDate = test.expiryDate || test.expiry_date || null;
        const motTestNumber = test.motTestNumber || test.testNumber || null;
        const rawNotes = test.rfrAndComments || test.defects || test.advisories || [];
        const notes = Array.isArray(rawNotes) ? rawNotes : [];

        const groups = { dangerous:[], major:[], minor:[], advisory:[], other:[] };
        notes.forEach(a=>{
          const obj = typeof a === "string" ? {text:a,type:""} : (a || {});
          const englishText = obj.text || obj.comment || obj.description || "";
          const kurdishText = obj.kurdishText || obj.kurdish_text || "";
          const text = currentLang === "ckb"
            ? (kurdishText || englishText)
            : (currentLang === "en" ? englishText : translateString(englishText));
          const type = String(obj.type || obj.defectType || obj.category || "").toLowerCase();
          if(!text) return;
          if(type.includes("danger")) groups.dangerous.push(text);
          else if(type.includes("major") || type.includes("fail")) groups.major.push(text);
          else if(type.includes("minor")) groups.minor.push(text);
          else if(type.includes("advis")) groups.advisory.push(text);
          else groups.other.push(text);
        });

        const section = (title,items,cls)=> items.length
          ? '<div class="mot-section"><div class="mot-section-title">'+title+'</div>'+items.map(x=>'<div class="mot-line '+cls+'">• '+پاراستنی_دەق(x)+'</div>').join('')+'</div>'
          : '';

        const isPass = resultText.toUpperCase().includes("PASS");
        const isFail = resultText.toUpperCase().includes("FAIL");
        const resultClass = isPass ? "pass" : (isFail ? "fail" : "");
        const resultLabel = isPass ? (currentLang === "ckb" ? "دەرچوو" : "PASS") : isFail ? (currentLang === "ckb" ? "ڕەتکرایەوە" : "FAIL") : پاراستنی_دەق(وەرگێڕانی_بەها(resultText));

        return '<div class="mot-item">'+
          '<div class="mot-head"><div class="mot-date">'+پاراستنی_دەق(بەروار(testDate))+'</div><div class="mot-result '+resultClass+'">'+resultLabel+'</div></div>'+
          '<div class="row"><span class="label">'+(currentLang === "ckb" ? "مایلیج" : translateString("Mileage"))+'</span><span class="value">'+
          (mileageVal !== null ? Number(mileageVal).toLocaleString("en-GB") + (currentLang !== "ckb" ? " "+translateString("miles") : " مایل") : (currentLang === "ckb" ? "بەردەست نییە" : translateString("Not available")))+'</span></div>'+
          (expiryDate ? '<div class="row"><span class="label">'+(currentLang === "ckb" ? "بەسەرچوونی MOT" : translateString("MOT expiry"))+'</span><span class="value">'+پاراستنی_دەق(بەروار(expiryDate))+'</span></div>' : '')+
          (motTestNumber ? '<div class="row"><span class="label">'+(currentLang === "ckb" ? "ژمارەی تاقیکردنەوە" : translateString("Test number"))+'</span><span class="value">'+پاراستنی_دەق(motTestNumber)+'</span></div>' : '')+
          section(currentLang === "ckb" ? "کێشەی مەترسیدار" : translateString("Dangerous defects"),groups.dangerous,"dangerous")+
          section(currentLang === "ckb" ? "هۆکاری ڕەتکردنەوە / کێشەی گەورە" : translateString("Refusal reasons / Major defects"),groups.major,"major")+
          section(currentLang === "ckb" ? "کێشەی بچووک" : translateString("Minor defects"),groups.minor,"minor")+
          section(currentLang === "ckb" ? "تێبینییەکان" : translateString("Advisories"),groups.advisory,"advisory")+
          section(currentLang === "ckb" ? "تێبینیی تر" : translateString("Other comments"),groups.other,"advisory")+
          ((!notes.length) ? '<div class="mot-section"><div class="mot-section-title">'+(currentLang === "ckb" ? "تێبینی" : translateString("Notes"))+'</div><div class="mot-line">'+(currentLang === "ckb" ? "هیچ کێشە یان تێبینییەک تۆمار نەکراوە." : translateString("No defects or advisories were recorded."))+'</div></div>' : '')+
          '</div>';
      }).join("");
    }else{
      دۆزینەوە("مێژووی_MOT").innerHTML =
        '<div class="muted">'+(currentLang !== "ckb" ? translateString("The data source did not return a full test-by-test MOT history for this vehicle.") : "سەرچاوەی داتا مێژووی تەواوی هەر MOT بە جیاوازی بۆ ئەم ئۆتۆمبێلە نەگەڕاندووەتەوە.")+'</div>';
    }

    خەمڵاندنی_سووتەمەنی_AI(d);
    نیشاندانی_CAZ_بۆ_دیزڵ(d);
    دۆزینەوەی_هاوشێوە(d);
    loadExtraInsights(d);

    دۆزینەوە("پەیام").style.display = "none";
    دۆزینەوە("ڕاپۆرت").style.display = "block";
    setTimeout(refreshSelectedLanguage,120);
    setTimeout(refreshSelectedLanguage,650);
    setTimeout(refreshSelectedLanguage,1200);
    setTimeout(refreshSelectedLanguage, 60);
    setTimeout(refreshSelectedLanguage, 700);
    setTimeout(refreshSelectedLanguage, 1600);
    دۆزینەوە("ڕاپۆرت").scrollIntoView({behavior:"smooth",block:"start"});

  }catch(error){
    دۆزینەوە("پەیام").className = "message error";
    دۆزینەوە("پەیام").textContent = error.message;
  }finally{
    دۆزینەوە("دوگمە").disabled = false;
    دۆزینەوە("دوگمە").textContent = currentLang === "ckb" ? "پشکنینی ئۆتۆمبێل" : translateString("پشکنینی ئۆتۆمبێل");
  }
}

دۆزینەوە("ژمارە").addEventListener("keydown",event=>{
  if(event.key==="Enter") پشکنین();
});
</script>

</body>
</html>`);
});

app.post("/api/check", async (req, res) => {
  const vrm = پاککردنەوەی_ژمارە(req.body?.registration);

  if (!vrm || vrm.length < 2 || vrm.length > 8) {
    return res.status(400).json({
      ok:false,
      error:"تکایە ژمارەی تۆماری دروست بنووسە."
    });
  }

  if (!ZYFY_API_KEY && !ZYFY_BACKUP_API_KEY) {
    return res.status(500).json({
      ok:false,
      error:"هیچ کلیلی Zyfy لە Render دانەنراوە."
    });
  }

  async function callZyfy(apiKey){
    const url =
      `https://zyfy.uk/v1/vehicle/${encodeURIComponent(vrm)}`;

    const response = await fetch(url, {
      headers: {
        "X-Api-Key": apiKey,
        "Accept":"application/json"
      }
    });

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = {raw};
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  }

  function messageFrom(result){
    return String(
      result?.data?.message ||
      result?.data?.error ||
      result?.data?.detail ||
      result?.data?.raw ||
      ""
    );
  }

  function shouldUseBackup(result){
    if (!result || result.ok) return false;

    const msg = messageFrom(result).toLowerCase();

    return (
      result.status === 429 ||
      msg.includes("monthly request limit") ||
      msg.includes("request limit reached") ||
      msg.includes("monthly limit") ||
      msg.includes("quota") ||
      msg.includes("rate limit")
    );
  }

  try {
    let result = null;

    if (ZYFY_API_KEY) {
      result = await callZyfy(ZYFY_API_KEY);
    }

    if (
      (!result || shouldUseBackup(result)) &&
      ZYFY_BACKUP_API_KEY
    ) {
      console.log("Using Zyfy backup key for", vrm);
      result = await callZyfy(ZYFY_BACKUP_API_KEY);
    }

    if (!result) {
      return res.status(500).json({
        ok:false,
        error:"هیچ کلیلی Zyfy بەردەست نییە."
      });
    }

    if (!result.ok) {
      return res.status(result.status || 502).json({
        ok:false,
        error:
          result?.data?.message ||
          result?.data?.error ||
          result?.data?.detail ||
          `هەڵە لە پشکنین: ${result.status || 502}`
      });
    }

    let dvsaMot = null;
    let motHistory = [];
    let dvsaMotError = null;

    try {
      dvsaMot = await fetchDvsaMotHistory(vrm);
      motHistory = normaliseDvsaMotTests(dvsaMot);
      motHistory = await addSoraniToMotHistory(motHistory);
    } catch (motError) {
      console.error("DVSA MOT lookup failed for", vrm, motError.message);
      dvsaMotError = motError.message;
    }

    const combinedData = {
      ...(result.data && typeof result.data === "object" ? result.data : {}),
      motHistory,
      motTests: motHistory,
      dvsaMot: dvsaMot || null,
      motHistorySource: motHistory.length ? "DVSA" : null,
      dvsaMotError
    };

    return res.json({
      ok:true,
      data:combinedData
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok:false,
      error:"نەتوانرا پەیوەندی بە سەرچاوەی زانیاری بکرێت."
    });
  }
});



const UI_LANGUAGE_PACK_CACHE = new Map();

app.post("/api/language-pack", async (req, res) => {
  try{
    const language = String(req.body?.language || "").trim();
    const texts = Array.isArray(req.body?.texts)
      ? req.body.texts.map(function(v){ return String(v ?? "").trim(); }).filter(Boolean)
      : [];

    const languageNames = {
      ar:"Arabic",
      fa:"Persian (Farsi)",
      tr:"Turkish",
      fr:"French",
      de:"German",
      es:"Spanish",
      ro:"Romanian",
      pl:"Polish",
      ur:"Urdu",
      ps:"Pashto"
    };

    const targetName = languageNames[language];
    if(!targetName) return res.status(400).json({ok:false,error:"Unsupported language"});
    if(!GEMINI_API_KEY) return res.status(503).json({ok:false,error:"Translation service unavailable"});
    if(!texts.length) return res.json({ok:true,translations:{}});

    const cacheKey = language + "::" + texts.join("\u241E");
    if(UI_LANGUAGE_PACK_CACHE.has(cacheKey)){
      return res.json({ok:true,translations:UI_LANGUAGE_PACK_CACHE.get(cacheKey)});
    }

    const translatedMap = {};
    const models = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];

    // Small batches make the response much more reliable than translating the whole page at once.
    for(let offset=0; offset<texts.length; offset+=30){
      const batch = texts.slice(offset,offset+30);
      let finished = false;
      let lastError = "Translation failed";

      for(const model of models){
        try{
          const prompt = `
Translate this JSON array from English into ${targetName}.

STRICT RULES:
- Return ONLY a JSON array of strings.
- Same number of items, same order.
- Translate every normal-language phrase completely.
- Keep these technical abbreviations unchanged where appropriate:
  MOT, ULEZ, CAZ, V5C, CO2, MPG, NCAP.
- Keep vehicle makes/models, registrations, numbers, dates, prices, currency symbols and units unchanged.
- No explanations.

INPUT:
${JSON.stringify(batch)}
`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method:"POST",
              headers:{
                "Content-Type":"application/json",
                "x-goog-api-key":GEMINI_API_KEY
              },
              body:JSON.stringify({
                contents:[{role:"user",parts:[{text:prompt}]}],
                generationConfig:{
                  responseMimeType:"application/json",
                  maxOutputTokens:5000
                }
              })
            }
          );

          const raw = await response.text();
          let data = null;
          try{ data = JSON.parse(raw); }catch{}

          if(!response.ok){
            lastError = data?.error?.message || raw || `HTTP ${response.status}`;
            continue;
          }

          let modelText = data?.candidates?.[0]?.content?.parts?.map(function(p){
            return p?.text || "";
          }).join("").trim();

          if(!modelText){
            lastError = "Empty translation response";
            continue;
          }

          modelText = modelText
            .replace(/^```json\s*/i,"")
            .replace(/^```\s*/,"")
            .replace(/```$/,"")
            .trim();

          let arr;
          try{ arr = JSON.parse(modelText); }
          catch{
            const first = modelText.indexOf("[");
            const last = modelText.lastIndexOf("]");
            if(first >= 0 && last > first) arr = JSON.parse(modelText.slice(first,last+1));
          }

          if(!Array.isArray(arr) || arr.length !== batch.length){
            lastError = "Translation count mismatch";
            continue;
          }

          batch.forEach(function(source,i){
            translatedMap[source] = String(arr[i] ?? source);
          });

          finished = true;
          break;
        }catch(error){
          lastError = error?.message || String(error);
        }
      }

      if(!finished){
        console.error("Language-pack batch failed:",language,lastError);
        // Fall back to English for this batch rather than breaking the page.
        batch.forEach(function(source){ translatedMap[source] = source; });
      }
    }

    UI_LANGUAGE_PACK_CACHE.set(cacheKey,translatedMap);
    return res.json({ok:true,translations:translatedMap});
  }catch(error){
    console.error("Language pack error:",error);
    return res.status(500).json({ok:false,error:"Translation failed"});
  }
});

app.post("/api/fuel-estimate", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ok:false,error:"GEMINI_API_KEY لە Render دانەنراوە."});
  }

  const car = req.body || {};
  const fuelTypeRaw = String(car.fuelType || "").trim();
  const fuelKey = fuelTypeRaw.toLowerCase();

  if (fuelKey.includes("electric")) {
    return res.status(400).json({
      ok:false,
      error: car.language === "ckb"
        ? "ئەم خەمڵاندنەی MPG بۆ ئۆتۆمبێلی بەنزین، دیزڵ و هایبرێدە."
        : "This MPG estimate is for petrol, diesel and hybrid vehicles."
    });
  }

  const petrolPrice = Number(process.env.PETROL_PRICE_PER_LITRE || 1.45);
  const dieselPrice = Number(process.env.DIESEL_PRICE_PER_LITRE || 1.52);
  const pricePerLitre = fuelKey.includes("diesel") ? dieselPrice : petrolPrice;

  const prompt = `
Estimate a realistic UK combined real-world MPG for this used vehicle.

Rules:
- Estimate MPG only. Do not calculate fuel costs.
- Use UK imperial MPG, not US MPG.
- Use make, model, year, fuel type and engine size.
- Prefer a conservative real-world combined-driving estimate.
- If exact trim/spec is missing, lower confidence.
- Return ONLY valid JSON.
- Write "reason" in the language requested by Vehicle.language.
- Language codes: ckb=Kurdish Sorani, en=English, ar=Arabic, fa=Persian (Farsi), tr=Turkish, fr=French, de=German, es=Spanish, ro=Romanian, pl=Polish, ur=Urdu, ps=Pashto.

Return exactly:
{
  "estimatedMpg": 0,
  "confidence": "low|medium|high",
  "reason": "short explanation"
}

Vehicle:
${JSON.stringify(car, null, 2)}
`;

  const models = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];
  let lastError = "Unknown Gemini error";

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "x-goog-api-key":GEMINI_API_KEY
          },
          body:JSON.stringify({
            contents:[{role:"user",parts:[{text:prompt}]}],
            generationConfig:{
              responseMimeType:"application/json",
              maxOutputTokens:350
            }
          })
        }
      );

      const raw = await response.text();
      let data = null;
      try{ data = JSON.parse(raw); }catch{}

      if(!response.ok){
        lastError = data?.error?.message || data?.message || raw || `HTTP ${response.status}`;
        continue;
      }

      const modelText = data?.candidates?.[0]?.content?.parts?.map(p=>p?.text||"").join("").trim();
      if(!modelText){ lastError = "Empty Gemini MPG response"; continue; }

      let mpgResult;
      try{
        mpgResult = JSON.parse(modelText);
      }catch{
        mpgResult = JSON.parse(
          modelText.replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```$/,"").trim()
        );
      }

      const mpg = Number(mpgResult.estimatedMpg);
      if(!Number.isFinite(mpg) || mpg < 5 || mpg > 150){
        lastError = `Invalid MPG: ${mpgResult.estimatedMpg}`;
        continue;
      }

      const litresPerMile = 4.54609 / mpg;
      const cost = miles => Number((litresPerMile * miles * pricePerLitre).toFixed(2));

      return res.json({
        ok:true,
        modelUsed:model,
        fuel:{
          estimatedMpg:Number(mpg.toFixed(1)),
          confidence:["low","medium","high"].includes(mpgResult.confidence) ? mpgResult.confidence : "low",
          reason:String(mpgResult.reason || ""),
          fuelType:fuelTypeRaw || "Petrol",
          pricePerLitreGbp:Number(pricePerLitre.toFixed(3)),
          cost1MileGbp:cost(1),
          cost100MilesGbp:cost(100),
          cost12000MilesGbp:cost(12000)
        }
      });

    } catch (error) {
      lastError = error?.message || String(error);
    }
  }

  return res.status(502).json({ok:false,error:`Gemini fuel estimate failed: ${lastError}`});
});



const VEHICLE_INSIGHTS_CACHE = new Map();

app.post("/api/vehicle-insights", async (req, res) => {
  if(!GEMINI_API_KEY) return res.status(503).json({ok:false,error:"GEMINI_API_KEY is not configured."});
  const car=req.body||{};
  if(!car.make || !car.model) return res.status(400).json({ok:false,error:"Vehicle make and model are required."});
  const cacheKey=[car.make,car.model,car.year,car.engineCapacityCc,car.fuelType,car.language].join("|").toLowerCase();
  if(VEHICLE_INSIGHTS_CACHE.has(cacheKey)) return res.json({ok:true,insights:VEHICLE_INSIGHTS_CACHE.get(cacheKey)});

  const langNames={ckb:"Kurdish Sorani",en:"English",ar:"Arabic",fa:"Persian",tr:"Turkish",fr:"French",de:"German",es:"Spanish",ro:"Romanian",pl:"Polish",ur:"Urdu",ps:"Pashto"};
  const targetLanguage=langNames[car.language]||"Kurdish Sorani";
  const prompt=`You are generating cautious UK used-car reference information for a vehicle-check website.

Vehicle: ${JSON.stringify(car)}

Return ONLY JSON matching the schema below.
Rules:
- Use the exact make/model/year/engine/fuel information given.
- If the exact derivative cannot be identified confidently, use null for performance, tyre size or insurance group rather than guessing.
- If an exact field was supplied by the vehicle-data API (insuranceGroup, bhp, torqueNm, topSpeedMph, zeroTo60Seconds), preserve it.
- Common problems must be known model/engine tendencies, not claims that this individual car has the fault.
- Timing information must clearly say chain/belt only when reasonably confident. If uncertain set type to "Unknown".
- Service intervals should be cautious typical guidance and tell the user to verify the manufacturer's schedule where appropriate.
- Repair prices are rough independent-garage UK parts/labour ranges in GBP, including VAT only as an estimate. Give 6 useful repairs maximum.
- previousSaleHistory MUST be [] because no verified historical classified-ad source is connected. Never invent adverts, dates, mileage or prices.
- Human-readable titles/descriptions/notes must be in ${targetLanguage}. Keep units and technical abbreviations such as BHP, Nm, mph, MOT unchanged.

Schema:
{
 "performance":{"zeroTo60Seconds":number|null,"bhp":number|null,"torqueNm":number|null,"topSpeedMph":number|null},
 "insuranceGroup":string|null,
 "timing":{"type":"Timing chain|Timing belt|Unknown","note":string},
 "tyres":{"front":string|null,"rear":string|null,"note":string},
 "commonProblems":[{"title":string,"risk":"Low|Medium|High","description":string}],
 "serviceSchedule":[{"item":string,"interval":string,"note":string}],
 "repairCosts":[{"repair":string,"partsMinGbp":number,"partsMaxGbp":number,"labourMinGbp":number,"labourMaxGbp":number,"totalMinGbp":number,"totalMaxGbp":number,"note":string}],
 "previousSaleHistory":[],
 "sourceLabel":string
}`;

  const models=["gemini-3.5-flash-lite","gemini-3.5-flash"]; let lastError="Unknown error";
  for(const model of models){
    try{
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":GEMINI_API_KEY},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:3000}})});
      const raw=await response.text(); let data=null; try{data=JSON.parse(raw)}catch{}
      if(!response.ok){lastError=data?.error?.message||raw||`HTTP ${response.status}`;continue}
      let text=data?.candidates?.[0]?.content?.parts?.map(p=>p?.text||"").join("").trim(); if(!text){lastError="Empty Gemini response";continue}
      text=text.replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```$/,"").trim(); let insights; try{insights=JSON.parse(text)}catch(e){lastError=e.message;continue}
      insights.previousSaleHistory=[];
      insights.performance=insights.performance||{};
      for(const [bodyKey,outKey] of [["zeroTo60Seconds","zeroTo60Seconds"],["bhp","bhp"],["torqueNm","torqueNm"],["topSpeedMph","topSpeedMph"]]){if(car[bodyKey]!==null&&car[bodyKey]!==undefined&&car[bodyKey]!=="") insights.performance[outKey]=car[bodyKey]}
      if(car.insuranceGroup) insights.insuranceGroup=car.insuranceGroup;
      if(!insights.sourceLabel){
        insights.sourceLabel=targetLanguage==="Kurdish Sorani"
          ? "داتای ئۆتۆمبێل + ڕێنمایی Gemini (خەمڵاندنەکان بە نیشانەی خۆیانەوە)"
          : "Vehicle data + Gemini guidance; estimates are indicative";
      }
      VEHICLE_INSIGHTS_CACHE.set(cacheKey,insights);
      return res.json({ok:true,modelUsed:model,insights});
    }catch(e){lastError=e?.message||String(e)}
  }
  return res.status(502).json({ok:false,error:`Vehicle insights failed: ${lastError}`});
});


app.post("/api/compare-summary", async (req, res) => {
  if(!GEMINI_API_KEY) return res.status(503).json({ok:false,error:"GEMINI_API_KEY is not configured."});
  const body=req.body||{}, car1=body.car1||{}, car2=body.car2||{};
  if(!car1.registration||!car2.registration) return res.status(400).json({ok:false,error:"Two vehicles are required."});
  const langNames={ckb:"Kurdish Sorani",en:"English",ar:"Arabic",fa:"Persian",tr:"Turkish",fr:"French",de:"German",es:"Spanish",ro:"Romanian",pl:"Polish",ur:"Urdu",ps:"Pashto"};
  const targetLanguage=langNames[body.language]||"English";
  const prompt=`Compare these two UK used vehicles using ONLY the supplied data. Do not invent specifications, prices, faults or history.\n\nCAR 1:\n${JSON.stringify(car1,null,2)}\n\nCAR 2:\n${JSON.stringify(car2,null,2)}\n\nRules:\n- Market price is only a guide based on current similar asking prices, not a confirmed valuation.\n- Fuel figures and repair figures are estimates; treat them as estimates.\n- Common problems are model tendencies, not confirmed faults on the individual vehicle.\n- Give each car a fair 0-100 comparison score based on available evidence: MOT record, mileage consistency/risk, running-cost estimate, repair-risk estimate, current MOT/tax state and market-price guidance.\n- Missing data must not count as a negative.\n- If there is no clear winner, use tie.\n- Write all human-readable text in ${targetLanguage}. Vehicle registrations, makes, models, MOT and units stay unchanged.\n- bestValue/lowerRunningCost/lowerRepairRisk/betterMotHistory must be the registration of car1, registration of car2, or \"Tie\" (translated if appropriate).\nReturn ONLY JSON:\n{\n "car1Score":0,\n "car2Score":0,\n "overallWinner":"car1|car2|tie",\n "verdict":"short headline naming the better overall choice or tie",\n "summary":"clear 3-6 sentence comparison including price/value and the most important trade-offs",\n "bestValue":"...",\n "lowerRunningCost":"...",\n "lowerRepairRisk":"...",\n "betterMotHistory":"...",\n "keyReasons":["reason 1","reason 2","reason 3","reason 4"]\n}`;
  const models=["gemini-3.5-flash-lite","gemini-3.5-flash"]; let lastError="Unknown error";
  for(const model of models){
    try{
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":GEMINI_API_KEY},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:1600}})});
      const raw=await response.text();let data=null;try{data=JSON.parse(raw)}catch{}
      if(!response.ok){lastError=data?.error?.message||raw||`HTTP ${response.status}`;continue}
      let text=data?.candidates?.[0]?.content?.parts?.map(p=>p?.text||"").join("").trim();if(!text){lastError="Empty Gemini response";continue}
      text=text.replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```$/,"").trim();let comparison;try{comparison=JSON.parse(text)}catch(e){lastError=e.message;continue}
      comparison.car1Score=Math.max(0,Math.min(100,Math.round(Number(comparison.car1Score)||0)));
      comparison.car2Score=Math.max(0,Math.min(100,Math.round(Number(comparison.car2Score)||0)));
      if(!["car1","car2","tie"].includes(comparison.overallWinner)) comparison.overallWinner="tie";
      comparison.keyReasons=Array.isArray(comparison.keyReasons)?comparison.keyReasons.slice(0,6):[];
      return res.json({ok:true,modelUsed:model,comparison});
    }catch(e){lastError=e?.message||String(e)}
  }
  return res.status(502).json({ok:false,error:`Car comparison failed: ${lastError}`});
});

app.post("/api/similar-listings", async (req, res) => {
  const make = String(req.body?.make || "").trim();
  const model = String(req.body?.model || "").trim();
  const year = Number(req.body?.year);
  const mileage = Number(req.body?.mileage);

  if(!make || !model){
    return res.status(400).json({
      ok:false,
      error:"Vehicle make and model are required."
    });
  }

  async function searchListings(yearMin, yearMax){
    const params = new URLSearchParams({
      make,
      model,
      sort:"relevance",
      page:"1"
    });

    if(Number.isFinite(yearMin)) params.set("year_min", String(yearMin));
    if(Number.isFinite(yearMax)) params.set("year_max", String(yearMax));

    const response = await fetch(
      "https://www.pistontraders.co.uk/api/v1/vehicles/?" + params.toString(),
      {headers:{"Accept":"application/json"}}
    );

    if(!response.ok){
      const raw = await response.text();
      throw new Error("PistonTraders returned HTTP " + response.status + (raw ? ": " + raw.slice(0,180) : ""));
    }

    const data = await response.json();
    return Array.isArray(data?.results?.cars) ? data.results.cars : [];
  }

  try{
    let cars = [];

    if(Number.isFinite(year)){
      cars = await searchListings(year, year);
      if(!cars.length){
        cars = await searchListings(year - 1, year + 1);
      }
    }else{
      cars = await searchListings(null, null);
    }

    // Prefer listings with mileage closest to the checked vehicle.
    if(Number.isFinite(mileage)){
      cars = cars.slice().sort((a,b)=>{
        const am = Number(a?.mileage);
        const bm = Number(b?.mileage);
        const ad = Number.isFinite(am) ? Math.abs(am - mileage) : Number.MAX_SAFE_INTEGER;
        const bd = Number.isFinite(bm) ? Math.abs(bm - mileage) : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      });
    }

    cars = cars.slice(0,5).map(car => ({
      year:car?.year ?? null,
      make:car?.make ?? null,
      model:car?.model ?? null,
      mileage:car?.mileage ?? null,
      fuel_type:car?.fuel_type ?? null,
      transmission:car?.transmission ?? null,
      engine_size:car?.engine_size ?? null,
      price:car?.price ?? null,
      loc:car?.loc ?? null
    }));

    return res.json({
      ok:true,
      source:"PistonTraders",
      cars
    });

  }catch(error){
    console.error("PistonTraders similar-listings error:", error);
    return res.status(502).json({
      ok:false,
      error:"Could not retrieve similar live vehicle listings."
    });
  }
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Akar's Car Check لە پۆرتی ${PORT} کار دەکات`);
});