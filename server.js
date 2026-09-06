import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ZYFY_API_KEY = process.env.ZYFY_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json());

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
<meta name="viewport" content="width=device-width,initial-scale=1">
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
.mot-item{padding:12px 0;border-bottom:1px solid var(--line)}
.mot-item:last-child{border-bottom:0}
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
  <a class="quick-action" href="https://www.gov.uk/sold-bought-vehicle" target="_blank" rel="noopener noreferrer">🚗 لۆگ بووک بگۆڕە</a>
</div>

<main class="content">
  <div id="پەیام" class="message"></div>

  <section id="ڕاپۆرت" class="report">
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

<div class="card full">
        <h3><span class="icon">🛠️</span> کێشە دووبارەبووەکانی MOT</h3>
        <div id="کێشە_دووبارە"></div>
      </div>

      <div class="card full">
        <h3><span class="icon">📋</span> وردەکاری مێژووی MOT</h3>
        <div id="مێژووی_MOT"></div>
      </div>

    </div>
  </section>
</main>

<footer>© 2026 Akar's Car Check</footer>

<script>

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


function getTranslationDictionary(){
  const dictionaries = {
    en: EN_TRANSLATIONS,
    ar: AR_TRANSLATIONS,
    fa: FA_TRANSLATIONS,
    tr: TR_TRANSLATIONS,
    fr: FR_TRANSLATIONS,
    de: DE_TRANSLATIONS,
    es: ES_TRANSLATIONS,
    ro: RO_TRANSLATIONS,
    pl: PL_TRANSLATIONS,
    ur: UR_TRANSLATIONS,
    ps: PS_TRANSLATIONS
  };
  return dictionaries[currentLang] || EN_TRANSLATIONS;
}

function translateString(txt){
  if(currentLang === "ckb") return txt;

  const selected = getTranslationDictionary();

  // Always use the complete Kurdish key list.
  // If a chosen language does not yet have a special translation for a phrase,
  // fall back to English rather than leaving Kurdish mixed into the page.
  const entries = Object.entries(EN_TRANSLATIONS)
    .sort(function(a,b){ return b[0].length - a[0].length; });

  for(const pair of entries){
    const ckb = pair[0];
    const english = pair[1];
    if(txt.includes(ckb)){
      const translated = selected[ckb] || english;
      txt = txt.split(ckb).join(translated);
    }
  }
  return txt;
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

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while(node = walker.nextNode()){
    translateTextNode(node);
  }

  document.querySelectorAll("[aria-label],[title]").forEach(function(el){
    ["aria-label","title"].forEach(function(attr){
      const original = el.getAttribute(attr);
      if(!original) return;
      el.setAttribute(attr, translateString(original));
    });
  });

  const input = document.getElementById("ژمارە");
  if(input) input.placeholder = "AB12 CDE";

  const switcher = document.getElementById("languageSwitch");
  if(switcher) switcher.textContent = "🌐 " + (LANGUAGE_NAMES[currentLang] || "Language");
}

function applyLanguage(){
  applyLanguageDirection();

  if(currentLang === "ckb"){
    document.documentElement.lang = "ckb";
    document.documentElement.dir = "rtl";
    document.body.dir = "rtl";
    const switcher = document.getElementById("languageSwitch");
    if(switcher) switcher.textContent = "🌐 " + (LANGUAGE_NAMES[currentLang] || "زمان");
    return;
  }

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


function applyLanguageDirection(){
  const rtl = ["ckb","ar","fa","ur","ps"].includes(currentLang);
  document.documentElement.lang = currentLang === "ckb" ? "ckb" : currentLang;
  document.documentElement.dir = rtl ? "rtl" : "ltr";
}

function setLanguage(lang){
  const supported = ["ckb","en","ar","fa","tr","fr","de","es","ro","pl","ur","ps"];
  currentLang = supported.includes(lang) ? lang : "ckb";
  localStorage.setItem("akar_language", currentLang);
  localStorage.setItem("akar_language_chosen", "1");
  location.reload();
}

function openLanguageModal(){
  const modal = document.getElementById("languageModal");
  if(modal) modal.classList.add("show");
}

function closeLanguageModal(){
  const modal = document.getElementById("languageModal");
  if(modal) modal.classList.remove("show");
}

document.addEventListener("DOMContentLoaded",()=>{
  applyLanguage();

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

  const map = currentLang === "en" ? enMap : ckbMap;
  if(map[key]) return map[key];

  if(currentLang === "en"){
    if(key.includes("above_average")) return "Above average";
    if(key.includes("below_average")) return "Below average";
    if(key.includes("consistent")) return "Consistent";
    if(key.includes("inconsistent")) return "Inconsistent";
    if(key.includes("valid")) return "Valid";
    if(key.includes("expired")) return "Expired";
    if(key.includes("taxed")) return "Taxed";
    if(key.includes("untaxed")) return "Untaxed";
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

  let text = currentLang === "en" ? "Needs further checking" : "پێویستی بە پشکنینی زیاتر هەیە";
  let colour = "#f7c76d";
  if(score >= 80){ text = currentLang === "en" ? "Shows a good overall condition" : "دۆخی باش پیشان دەدات"; colour = "#5dd39e"; }
  if(score < 55){ text = currentLang === "en" ? "Check carefully" : "بە وریاییەوە بپشکنە"; colour = "#ff7070"; }

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
  loading.textContent = currentLang === "en"
    ? "Estimating MPG and fuel costs..."
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
      currentLang === "en"
        ? (fuelName + ": £" + price.toFixed(3) + "/litre")
        : (وەرگێڕانی_بەها(fuelName) + ": £" + price.toFixed(3) + "/لیتر");

    const c = f.confidence || "low";
    const cText = currentLang === "en"
      ? ({low:"Low",medium:"Medium",high:"High"}[c] || c)
      : ({low:"نزم",medium:"مامناوەند",high:"بەرز"}[c] || c);

    دۆزینەوە("سووتەمەنی_دڵنیایی").textContent =
      currentLang === "en" ? "Confidence: "+cText : "ئاستی دڵنیایی: "+cText;

    دۆزینەوە("سووتەمەنی_هۆکار").textContent =
      f.reason || (currentLang === "en"
        ? "Estimated from the available vehicle details."
        : "بەپێی زانیارییە بەردەستەکانی ئۆتۆمبێل خەمڵێنراوە.");

    loading.style.display = "none";
    resultBox.style.display = "block";
  }catch(error){
    loading.textContent =
      (currentLang === "en" ? "Fuel-cost estimate unavailable: " : "خەمڵاندنی تێچووی سووتەمەنی بەردەست نییە: ")
      + (error?.message || (currentLang === "en" ? "Unknown error" : "هەڵەی نەناسراو"));
  }
}


async function دۆزینەوەی_هاوشێوە(d){
  const loading = دۆزینەوە("هاوشێوە_بارکردن");
  const resultBox = دۆزینەوە("هاوشێوە_ئەنجام");
  const summaryBox = دۆزینەوە("هاوشێوە_کورتە");
  if(!loading || !resultBox) return;

  loading.style.display = "block";
  loading.textContent = currentLang === "en"
    ? "Finding similar cars currently for sale..."
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
      loading.textContent = currentLang === "en"
        ? "No similar live listings were found."
        : "هیچ ڕیکلامێکی زیندووی هاوشێوە نەدۆزرایەوە.";
      return;
    }

    loading.style.display = "none";

    if(summaryBox){
      const countText = currentLang === "en"
        ? (cars.length + " similar live listings shown")
        : (cars.length + " ئۆتۆمبێلی هاوشێوە پیشان دەدرێت");
      summaryBox.textContent = countText;
      summaryBox.style.display = "block";
    }

    const validCars = cars.filter(function(car){
      const p = Number(car.price);
      return Number.isFinite(p) && p > 0;
    });

    if(!validCars.length){
      loading.textContent = currentLang === "en"
        ? "No usable asking-price data was found."
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
      summaryBox.textContent = currentLang === "en"
        ? ("Based on " + validCars.length + " similar live asking prices. Typical market asking price: " + formatPrice(medianPrice) + ".")
        : ("بەپێی " + validCars.length + " نرخی داواکراوی زیندووی هاوشێوە. نرخی ئاسایی بازاڕ: " + formatPrice(medianPrice) + ".");
      summaryBox.style.display = "block";
    }

    const summaryHtml =
      '<div class="market-summary">'+
        '<div class="market-box">'+
          '<small>'+(currentLang === "en" ? "Lowest asking price" : "نزمترین نرخی داواکراو")+'</small>'+
          '<strong>'+formatPrice(minPrice)+'</strong>'+
        '</div>'+
        '<div class="market-box">'+
          '<small>'+(currentLang === "en" ? "Typical asking price" : "نرخی ئاسایی داواکراو")+'</small>'+
          '<strong>'+formatPrice(medianPrice)+'</strong>'+
        '</div>'+
        '<div class="market-box">'+
          '<small>'+(currentLang === "en" ? "Highest asking price" : "بەرزترین نرخی داواکراو")+'</small>'+
          '<strong>'+formatPrice(maxPrice)+'</strong>'+
        '</div>'+
      '</div>';

    const maxScale = maxPrice > 0 ? maxPrice : 1;
    const bars = [
      {label:currentLang === "en" ? "Lowest" : "نزمترین", value:minPrice},
      {label:currentLang === "en" ? "Typical" : "ئاسایی", value:medianPrice},
      {label:currentLang === "en" ? "Average" : "ناوەند", value:averagePrice},
      {label:currentLang === "en" ? "Highest" : "بەرزترین", value:maxPrice}
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

  }catch(error){
    loading.textContent =
      (currentLang === "en" ? "Similar listings unavailable: " : "ڕیکلامی هاوشێوە بەردەست نییە: ")
      + (error?.message || (currentLang === "en" ? "Unknown error" : "هەڵەی نەناسراو"));
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

  summary.textContent = currentLang === "en"
    ? ("Diesel vehicle" + (rawEuro ? " · " + rawEuro : "") + ". CAZ result for a normal private car:")
    : ("ئۆتۆمبێلی دیزڵ" + (rawEuro ? " · " + rawEuro : "") + " ـە. ئەنجامی CAZ بۆ ئۆتۆمبێلی تایبەتی ئاسایی:");

  function row(city, type, textCkb, textEn){
    const cls = type === "ok" ? "caz-ok" : (type === "pay" ? "caz-pay" : "caz-check");
    return '<div class="caz-row">'+
      '<span class="caz-city">'+پاراستنی_دەق(city)+'</span>'+
      '<span class="caz-status '+cls+'">'+پاراستنی_دەق(currentLang === "en" ? textEn : textCkb)+'</span>'+
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
}

async function پشکنین(){
  const vrm = دۆزینەوە("ژمارە").value.toUpperCase().replace(/[^A-Z0-9]/g,"");

  if(vrm.length < 2){
    alert(currentLang === "en" ? "Please enter a valid registration." : "تکایە ژمارەی تۆماری دروست بنووسە.");
    return;
  }

  دۆزینەوە("دوگمە").disabled = true;
  دۆزینەوە("دوگمە").textContent = currentLang === "en" ? "Checking..." : "لە پشکنین دایە...";
  دۆزینەوە("پەیام").className = "message";
  دۆزینەوە("پەیام").style.display = "block";
  دۆزینەوە("پەیام").textContent = currentLang === "en" ? "Retrieving live vehicle information..." : "زانیاری ڕاستەوخۆ وەردەگیرێت...";
  دۆزینەوە("ڕاپۆرت").style.display = "none";

  try{
    const response = await fetch("/api/check",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({registration:vrm})
    });

    const result = await response.json();
    if(!response.ok || !result.ok){
      throw new Error(result.error || (currentLang === "en" ? "Vehicle check failed." : "پشکنینی ئۆتۆمبێل سەرکەوتوو نەبوو."));
    }

    const d = result.data || {};
    const s = d.signals || {};
    const summary = d.summary || {};

    const reg = d.registration || d.registrationNumber || d.vrm || vrm;
    دۆزینەوە("تابلۆ").textContent = reg;
    دۆزینەوە("سەردێڕ").textContent = [d.make,d.model].filter(Boolean).join(" ") || (currentLang === "en" ? "Vehicle report" : "ڕاپۆرتی ئۆتۆمبێل");
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
      ? d.vehicleAgeYears + (currentLang === "en" ? " years" : " ساڵ") : (currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە"));
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
      ? Number(s.latestOdometerMiles).toLocaleString("en-GB") + (currentLang === "en" ? " miles" : " مایل") : (currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە"));

    دۆزینەوە("مایلیج_ساڵانە").textContent =
      ژمارە_لەگەڵ_یەکە(
        وەرگرتن(d,["signals.typicalAnnualMileageMiles","signals.typicalAnnualMileage","signals.annualMileage","summary.typicalAnnualMileage"]),
        (currentLang === "en" ? " miles/year" : " مایل/ساڵ")
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
          return '<div class="row"><span class="label">'+(currentLang === "en" ? "Issue type" : "جۆری کێشە")+'</span><span class="value">'+پاراستنی_دەق(وەرگێڕانی_بەها(item))+'</span></div>';
        }
        const name = item.category || item.name || item.type || "کێشە";
        const count = item.count ?? item.total ?? item.occurrences ?? "—";
        return '<div class="row"><span class="label">'+پاراستنی_دەق(وەرگێڕانی_بەها(name))+'</span><span class="value">'+پاراستنی_دەق(count)+'</span></div>';
      }).join("");
    }else{
      دۆزینەوە("کێشە_دووبارە").innerHTML =
        '<div class="muted">'+(currentLang === "en" ? "No additional recurring-issue information is available." : "هیچ زانیارییەکی زیاتر بۆ کێشە دووبارەبووەکان بەردەست نییە.")+'</div>';
    }

    const motDetails = وەرگرتن(d,["motHistory","mot_history","signals.motHistory","motTests"]);
    if(Array.isArray(motDetails) && motDetails.length){
      دۆزینەوە("مێژووی_MOT").innerHTML = motDetails.map(test=>{
        const testDate = test.testDate || test.test_date || test.date || "—";
        const resultText = test.result || test.testResult || "—";
        const mileageVal = test.odometerMiles ?? test.odometer ?? test.mileage ?? null;
        const notes = test.advisories || test.defects || test.rfrAndComments || [];
        const notesHtml = Array.isArray(notes) ? notes.map(a=>{
          const t = typeof a==="string" ? a : (a.text || a.comment || a.description || "");
          return t ? '<div class="small">• '+پاراستنی_دەق(t)+'</div>' : "";
        }).join("") : "";

        return '<div class="mot-item">'+
          '<div class="row"><span class="label">'+(currentLang === "en" ? "Date" : "بەروار")+'</span><span class="value">'+پاراستنی_دەق(بەروار(testDate))+'</span></div>'+
          '<div class="row"><span class="label">'+(currentLang === "en" ? "Result" : "ئەنجام")+'</span><span class="value">'+پاراستنی_دەق(وەرگێڕانی_بەها(resultText))+'</span></div>'+
          '<div class="row"><span class="label">'+(currentLang === "en" ? "Mileage" : "مایلیج")+'</span><span class="value">'+
          (mileageVal !== null ? Number(mileageVal).toLocaleString("en-GB") + (currentLang === "en" ? " miles" : " مایل") : (currentLang === "ckb" ? "بەردەست نییە" : translateString("بەردەست نییە")))+
          '</span></div>'+notesHtml+'</div>';
      }).join("");
    }else{
      دۆزینەوە("مێژووی_MOT").innerHTML =
        '<div class="muted">'+(currentLang === "en" ? "The data source did not return a full test-by-test MOT history for this vehicle." : "سەرچاوەی داتا مێژووی تەواوی هەر MOT بە جیاوازی بۆ ئەم ئۆتۆمبێلە نەگەڕاندووەتەوە.")+'</div>';
    }

    خەمڵاندنی_سووتەمەنی_AI(d);
    نیشاندانی_CAZ_بۆ_دیزڵ(d);
    دۆزینەوەی_هاوشێوە(d);

    دۆزینەوە("پەیام").style.display = "none";
    دۆزینەوە("ڕاپۆرت").style.display = "block";
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

  if (!ZYFY_API_KEY) {
    return res.status(500).json({
      ok:false,
      error:"کلیلی پەیوەندی بە سەرچاوەی داتا لە Render دانەنراوە."
    });
  }

  try {
    const url =
      `https://zyfy.uk/v1/vehicle/${encodeURIComponent(vrm)}`;

    const response = await fetch(url, {
      headers: {
        "X-Api-Key": ZYFY_API_KEY,
        "Accept":"application/json"
      }
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {raw:text};
    }

    if (!response.ok) {
      return res.status(response.status).json({
        ok:false,
        error:
          data?.message ||
          data?.error ||
          data?.detail ||
          `هەڵە لە پشکنین: ${response.status}`
      });
    }

    return res.json({
      ok:true,
      data
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok:false,
      error:"نەتوانرا پەیوەندی بە سەرچاوەی زانیاری بکرێت."
    });
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
      error: car.language === "en"
        ? "This MPG estimate is for petrol, diesel and hybrid vehicles."
        : "ئەم خەمڵاندنەی MPG بۆ ئۆتۆمبێلی بەنزین، دیزڵ و هایبرێدە."
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
- If language is "en", write reason in English. Otherwise write it in Kurdish Sorani.

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