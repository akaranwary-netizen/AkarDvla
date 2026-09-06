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
<meta name="description" content="Akar's Car Check - پشکنینی ئۆتۆمبێلی بەریتانیا بۆ MOT، باج، مایلیج و زانیارییەکانی ئۆتۆمبێل.">
<link rel="canonical" href="https://dvlabyakar.onrender.com/">
<title>Akar's Car Check</title>

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


.valuation-card{
  grid-column:1/-1;
  position:relative;
  overflow:hidden;
  background:
    radial-gradient(circle at 85% 15%,rgba(244,217,154,.13),transparent 30%),
    linear-gradient(145deg,rgba(27,25,20,.98),rgba(13,15,18,.98));
  border:1px solid rgba(215,179,106,.30);
}
.valuation-card::before{
  content:"AI";
  position:absolute;
  left:-8px;
  top:-15px;
  font-size:95px;
  font-weight:900;
  color:rgba(215,179,106,.035);
  direction:ltr;
}
.value-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
  margin-top:12px;
}
.value-box{
  background:rgba(255,255,255,.035);
  border:1px solid rgba(255,255,255,.07);
  border-radius:14px;
  padding:16px;
  text-align:center;
}
.value-box small{display:block;color:var(--muted);margin-bottom:8px}
.value-box strong{display:block;direction:ltr;color:var(--gold2);font-size:21px}
.ai-reason{margin-top:14px;color:#c7cbd1;line-height:1.75;font-size:13px}
.ai-loading{color:var(--gold2);padding:8px 0}
@media(max-width:640px){.value-grid{grid-template-columns:1fr}}


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
</head>

<body>

<div id="languageModal" class="language-modal" aria-modal="true" role="dialog">
  <div class="language-box">
    <h2>زمان هەڵبژێرە</h2>
    <p>Choose your language</p>

    <button class="language-choice default" onclick="setLanguage('ckb')">
      کوردی سۆرانی
    </button>

    <button class="language-choice" onclick="setLanguage('en')">
      English
    </button>

    <div class="language-note">کوردی سۆرانی زمانی بنەڕەتییە · Sorani Kurdish is the default language</div>
  </div>
</div>



<header class="topbar">
  <div class="topbar-inner">
    <div class="brand">AKAR'S <span>CAR CHECK</span></div>
<button id="languageSwitch" class="language-switch" type="button" onclick="openLanguageModal()">🌐 کوردی / English</button>
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

      
      <div class="card valuation-card">
        <h3><span class="icon">💎</span> خەمڵاندنی نرخی فرۆشتنی ئۆتۆمبێل بە AI</h3>
        <div id="AI_بارکردن" class="ai-loading">دوای پشکنینی ئۆتۆمبێل، AI نرخەکە خەمڵێنێت...</div>

        <div id="AI_ئەنجام" style="display:none">
          <div class="value-grid" style="grid-template-columns:1fr">
            <div class="value-box">
              <small>نرخی خەمڵێنراوی فرۆشتن</small>
              <strong id="AI_نرخی_تایبەت">—</strong>
            </div>
          </div>

          <div id="AI_هۆکار" class="ai-reason"></div>

          <div class="note">
            ئەمە خەمڵاندنێکی AI ـە، نە نرخی فەرمی یان دڵنیای بازاڕ.
            نرخی ڕاستەقینە دەتوانێت بە پێی مۆدێل، سپێک، دۆخ، شوێن و بازاڕ جیاواز بێت.
          </div>
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

let currentLang = localStorage.getItem("akar_language") || "ckb";

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
  "خەمڵاندنی نرخی فرۆشتنی ئۆتۆمبێل بە AI":"AI estimated selling price",
  "نرخی خەمڵێنراوی فرۆشتن":"Estimated selling price",
  "ئەمە خەمڵاندنێکی AI ـە، نە نرخی فەرمی یان دڵنیای بازاڕ.":"This is an AI estimate, not an official or guaranteed market valuation.",
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
  "AI نرخی ئۆتۆمبێلەکە خەمڵێنێت...":"AI is estimating the vehicle value...",
  "خەمڵاندنی AI لەم کاتەدا بەردەست نییە.":"AI valuation is currently unavailable.",
  "زمان هەڵبژێرە":"Choose your language",
  "دوا V5C":"Latest V5C",
  "دەرچوونی گاز لە شۆفێری ڕاستەقینە":"Real driving emissions",
  "زانیارییەکان بە پێی ئەو داتایەی سەرچاوە بۆ ئەم ئۆتۆمبێلە دەگەڕێنێتەوە.":"Information is shown according to the data returned for this vehicle.",
  "ئەم هەڵسەنگاندنە تەنها لەسەر ئەو داتایەیە کە API بۆ ئەم ئۆتۆمبێلە دەگەڕێنێتەوە.":"This assessment is based only on the data returned by the API for this vehicle.",
  "ئەگەر خانەیەک بەردەست نەبێت «بەردەست نییە» پیشان دەدرێت.":"If a field is unavailable, “Not available” will be shown.",
  "دوای پشکنینی ئۆتۆمبێل، AI نرخەکە خەمڵێنێت...":"After the vehicle check, AI will estimate the selling price.",
  "نرخی ڕاستەقینە دەتوانێت بە پێی مۆدێل، سپێک، دۆخ، شوێن و بازاڕ جیاواز بێت.":"The actual price can vary depending on model, specification, condition, location and market."
};

function translateTextNode(node){
  if(currentLang !== "en") return;
  if(node.nodeType !== Node.TEXT_NODE) return;

  let txt = node.nodeValue;
  if(!txt || !txt.trim()) return;

  for(const [ckb,en] of Object.entries(EN_TRANSLATIONS)){
    if(txt.includes(ckb)){
      txt = txt.split(ckb).join(en);
    }
  }
  node.nodeValue = txt;
}

function translateElementTree(root=document.body){
  if(currentLang !== "en") return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while(node = walker.nextNode()){
    translateTextNode(node);
  }

  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  document.body.dir = "ltr";

  const input = document.getElementById("ژمارە");
  if(input) input.placeholder = "AB12 CDE";

  const switcher = document.getElementById("languageSwitch");
  if(switcher) switcher.textContent = "🌐 English / کوردی";
}

function applyLanguage(){
  if(currentLang === "en"){
    translateElementTree(document.body);
  }else{
    document.documentElement.lang = "ckb";
    document.documentElement.dir = "rtl";
    document.body.dir = "rtl";
    const switcher = document.getElementById("languageSwitch");
    if(switcher) switcher.textContent = "🌐 کوردی / English";
  }
}

function setLanguage(lang){
  currentLang = lang === "en" ? "en" : "ckb";
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
  const notAvailable = currentLang === "en" ? "Not available" : "بەردەست نییە";

  if(v === null || v === undefined || v === "") return notAvailable;
  if(v === true) return currentLang === "en" ? "Yes" : "بەڵێ";
  if(v === false) return currentLang === "en" ? "No" : "نەخێر";

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
  if(!v) return currentLang === "en" ? "Not available" : "بەردەست نییە";
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
  if(v === null || v === undefined || v === "") return currentLang === "en" ? "Not available" : "بەردەست نییە";
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

async function خەمڵاندنی_AI(d){
  const loading = دۆزینەوە("AI_بارکردن");
  const resultBox = دۆزینەوە("AI_ئەنجام");

  loading.style.display = "block";
  loading.textContent = currentLang === "en" ? "AI is estimating the vehicle value..." : "AI نرخی ئۆتۆمبێلەکە خەمڵێنێت...";
  resultBox.style.display = "none";

  try{
    const response = await fetch("/api/value",{
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
        colour:d.colour || null,
        latestOdometerMiles:d.signals?.latestOdometerMiles ?? null,
        typicalAnnualMileageMiles:d.signals?.typicalAnnualMileageMiles ?? d.signals?.typicalAnnualMileage ?? null,
        motPassRate:d.signals?.motPassRate ?? null,
        totalMotTests:d.signals?.totalMotTests ?? null,
        totalMotFailures:d.signals?.totalMotFailures ?? null,
        totalAdvisoryCount:d.signals?.totalAdvisoryCount ?? d.signals?.totalAdvisories ?? null,
        latestAdvisoryCount:d.signals?.latestAdvisoryCount ?? d.signals?.latestMotAdvisoryCount ?? null,
        odometerTrend:d.signals?.odometerTrend ?? null,
        vehicleRiskLevel:d.summary?.vehicleRiskLevel ?? null,
        motRiskLevel:d.summary?.motRiskLevel ?? null,
        conditionBand:d.summary?.conditionBand ?? null,
        maintenanceBand:d.summary?.maintenanceBand ?? null,
        mileageAnomalyRisk:d.summary?.mileageAnomalyRisk ?? null,
        buyRecommendation:d.summary?.buyRecommendation ?? null,
        language:currentLang
      })
    });

    const result = await response.json();
    if(!response.ok || !result.ok){
      throw new Error(result.error || "AI valuation failed");
    }

    const v = result.valuation || {};
    const range = (a,b) => {
      if(a === null || a === undefined || b === null || b === undefined) return "—";
      return پۆند(a) + " – " + پۆند(b);
    };

    دۆزینەوە("AI_نرخی_تایبەت").textContent = range(v.privateSaleLowGbp, v.privateSaleHighGbp);
دۆزینەوە("AI_هۆکار").textContent = v.reasonSorani || (currentLang === "en" ? "AI produced an approximate selling-price estimate." : "AI خەمڵاندنێکی نزیکەیی بۆ نرخەکە کردووە.");

    loading.style.display = "none";
    resultBox.style.display = "block";
  }catch(error){
    loading.textContent = "خەمڵاندنی AI سەرکەوتوو نەبوو: " + (error?.message || "هەڵەی نەناسراو");
  }
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
    دۆزینەوە("سەردێڕ").textContent = [d.make,d.model].filter(Boolean).join(" ") || "ڕاپۆرتی ئۆتۆمبێل";
    دۆزینەوە("کورتەی_ئۆتۆمبێل").textContent =
      [d.fuelType,d.engineCapacityCc ? (d.engineCapacityCc+" cc") : null,d.colour,d.yearOfManufacture].filter(Boolean).join(" · ") || "—";

    دانان("مارکە",d.make);
    دانان("مۆدێل",d.model);
    دانان("ڕەنگ",d.colour);
    دانان("سووتەمەنی",d.fuelType);

    دۆزینەوە("ئەنجن").textContent =
      d.engineCapacityCc !== null && d.engineCapacityCc !== undefined
      ? Number(d.engineCapacityCc).toLocaleString("en-GB")+" cc"
      : "بەردەست نییە";

    دانان("ساڵ",d.yearOfManufacture);
    دۆزینەوە("تەمەن").textContent =
      d.vehicleAgeYears !== null && d.vehicleAgeYears !== undefined
      ? d.vehicleAgeYears + (currentLang === "en" ? " years" : " ساڵ") : (currentLang === "en" ? "Not available" : "بەردەست نییە");
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
      ? Math.round(Number(s.motPassRate)*100)+"%" : "بەردەست نییە";

    دۆزینەوە("مایلیج").textContent =
      s.latestOdometerMiles !== null && s.latestOdometerMiles !== undefined
      ? Number(s.latestOdometerMiles).toLocaleString("en-GB") + (currentLang === "en" ? " miles" : " مایل") : (currentLang === "en" ? "Not available" : "بەردەست نییە");

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
    دۆزینەوە("CO2").textContent = co2 !== null && co2 !== undefined ? بەها(co2)+" g/km" : "بەردەست نییە";
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
    دۆزینەوە("NCAP").textContent = ncap !== null && ncap !== undefined ? بەها(ncap)+" ⭐" : "بەردەست نییە";

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
          (mileageVal !== null ? Number(mileageVal).toLocaleString("en-GB") + (currentLang === "en" ? " miles" : " مایل") : (currentLang === "en" ? "Not available" : "بەردەست نییە"))+
          '</span></div>'+notesHtml+'</div>';
      }).join("");
    }else{
      دۆزینەوە("مێژووی_MOT").innerHTML =
        '<div class="muted">'+(currentLang === "en" ? "The data source did not return a full test-by-test MOT history for this vehicle." : "سەرچاوەی داتا مێژووی تەواوی هەر MOT بە جیاوازی بۆ ئەم ئۆتۆمبێلە نەگەڕاندووەتەوە.")+'</div>';
    }

    خەمڵاندنی_AI(d);

    دۆزینەوە("پەیام").style.display = "none";
    دۆزینەوە("ڕاپۆرت").style.display = "block";
    دۆزینەوە("ڕاپۆرت").scrollIntoView({behavior:"smooth",block:"start"});

  }catch(error){
    دۆزینەوە("پەیام").className = "message error";
    دۆزینەوە("پەیام").textContent = error.message;
  }finally{
    دۆزینەوە("دوگمە").disabled = false;
    دۆزینەوە("دوگمە").textContent = currentLang === "en" ? "Check vehicle" : "پشکنینی ئۆتۆمبێل";
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


app.post("/api/value", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      ok:false,
      error:"GEMINI_API_KEY لە Render دانەنراوە."
    });
  }

  const car = req.body || {};

  const prompt = `
Estimate the value of this used vehicle in the United Kingdom.

Rules:
- This is an approximate AI estimate only, not a professional valuation.
- Do not claim access to live Auto Trader, CAP, Glass's, auction or dealer sales data.
- Use the supplied vehicle details plus general UK used-car market knowledge.
- Be conservative.
- If trim/spec/service history is missing, use a wider range.
- Return GBP amounts as whole-number integers.
- Estimate only the likely private-sale price range.
- If vehicle details contain "language":"en", write the explanation in English. Otherwise write it in Kurdish Sorani.
- Return ONLY valid JSON in exactly this structure:

{
  "privateSaleLowGbp": 0,
  "privateSaleHighGbp": 0,
  "confidence": "low|medium|high",
  "reasonSorani": "..."
}

Vehicle details:
${JSON.stringify(car, null, 2)}
`;

  const models = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];
  let lastError = "هەڵەی نەناسراو";

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
            contents:[{
              role:"user",
              parts:[{text:prompt}]
            }],
            generationConfig:{
              responseMimeType:"application/json",
              maxOutputTokens:700
            }
          })
        }
      );

      const raw = await response.text();

      let data = null;
      try{
        data = JSON.parse(raw);
      }catch{}

      if(!response.ok){
        const googleMessage =
          data?.error?.message ||
          data?.message ||
          raw ||
          `HTTP ${response.status}`;

        lastError = `${model}: ${googleMessage}`;
        console.error("Gemini API error:", lastError);
        continue;
      }

      const modelText =
        data?.candidates?.[0]?.content?.parts
          ?.map(p => p?.text || "")
          .join("")
          .trim();

      if(!modelText){
        lastError = `${model}: Gemini وەڵامێکی بەتاڵی گەڕاندەوە`;
        continue;
      }

      let valuation;
      try{
        valuation = JSON.parse(modelText);
      }catch{
        const cleaned = modelText
          .replace(/^```json\s*/i,"")
          .replace(/^```\s*/,"")
          .replace(/```$/,"")
          .trim();

        valuation = JSON.parse(cleaned);
      }

      const fields = [
      "privateSaleLowGbp",
      "privateSaleHighGbp"
    ];

      for(const field of fields){
        const n = Number(valuation[field]);
        valuation[field] =
          Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
      }

      return res.json({
        ok:true,
        modelUsed:model,
        valuation
      });

    } catch (error) {
      lastError = `${model}: ${error?.message || String(error)}`;
      console.error("Gemini valuation error:", lastError);
    }
  }

  return res.status(502).json({
    ok:false,
    error:`Gemini هەڵەی دا: ${lastError}`
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Akar's Car Check لە پۆرتی ${PORT} کار دەکات`);
});
