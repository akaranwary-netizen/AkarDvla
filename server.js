import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ZYFY_API_KEY = process.env.ZYFY_API_KEY;

app.use(express.json());

function پاککردنەوەی_ژمارە(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="ckb" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Akar's Car Check</title>

<style>
:root{
  --ڕەش:#101820;
  --زەرد:#ffd400;
  --شین:#1769e0;
  --پاشبنەما:#f4f6f8;
  --خاکستەری:#68717c;
  --سەوز:#138a43;
  --پرتەقاڵی:#c97800;
  --سوور:#c92828;
}
*{box-sizing:border-box}
body{
  margin:0;
  font-family:Arial,Tahoma,sans-serif;
  background:var(--پاشبنەما);
  color:#17202a;
}
header{
  background:var(--ڕەش);
  color:#fff;
  padding:18px 20px;
}
.سەرەوە{
  max-width:1120px;
  margin:auto;
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.ناونیشان{
  font-size:24px;
  font-weight:900;
  direction:ltr;
}
.ناونیشان span{color:var(--زەرد)}

.بەشی_سەرەکی{
  background:var(--ڕەش);
  color:#fff;
  text-align:center;
  padding:52px 20px 88px;
}
.بەشی_سەرەکی h1{
  margin:0 0 12px;
  font-size:43px;
}
.بەشی_سەرەکی p{
  color:#ccd4db;
  margin:0 0 28px;
}
.گەڕان{
  max-width:720px;
  margin:auto;
  background:#fff;
  padding:18px;
  border-radius:14px;
  display:flex;
  gap:10px;
  box-shadow:0 12px 35px #0004;
  direction:ltr;
}
.ژمارە{
  flex:1;
  min-width:0;
  background:var(--زەرد);
  border:3px solid #111;
  border-radius:7px;
  padding:15px;
  text-align:center;
  font-size:27px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:3px;
}
button{
  border:0;
  border-radius:7px;
  background:var(--شین);
  color:#fff;
  padding:0 28px;
  font-size:16px;
  font-weight:800;
  cursor:pointer;
}
button:disabled{opacity:.6}
.دوگمەی_بیمە{
  display:block;
  max-width:720px;
  margin:14px auto 0;
  background:#138a43;
  color:#fff;
  text-decoration:none;
  padding:16px 20px;
  border-radius:10px;
  font-size:17px;
  font-weight:800;
  text-align:center;
}
.دوگمەی_بیمە:hover{opacity:.92}
.تێبینی_بیمە{
  max-width:720px;
  margin:8px auto 0;
  color:#ccd4db;
  font-size:12px;
  line-height:1.6;
}

.ناوەڕۆک{
  max-width:1120px;
  margin:-42px auto 60px;
  padding:0 18px;
}
.پەیام{
  display:none;
  padding:15px;
  border-radius:10px;
  margin-bottom:16px;
  background:#fff;
}
.هەڵە{
  background:#fee2e2;
  color:#991b1b;
}
.ڕاپۆرت{display:none}

.کورتە,.کارت{
  background:#fff;
  border-radius:14px;
  box-shadow:0 4px 18px #00000012;
}
.کورتە{
  padding:24px;
  margin-bottom:18px;
}
.ڕیزی_سەرەوە{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:14px;
}
.تابلۆ{
  background:var(--زەرد);
  border:2px solid #111;
  border-radius:5px;
  padding:9px 16px;
  font-weight:900;
  font-size:23px;
  letter-spacing:2px;
  direction:ltr;
}
.ڕاستەوخۆ{
  display:inline-block;
  background:#dcfce7;
  color:#166534;
  border-radius:99px;
  padding:4px 8px;
  font-size:11px;
  font-weight:900;
}
.تۆڕ{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:16px;
}
.کارت{padding:22px}
.کارت h3{margin:0 0 14px}
.تەواو{grid-column:1/-1}
.ڕیز{
  display:flex;
  justify-content:space-between;
  gap:18px;
  padding:10px 0;
  border-bottom:1px solid #eee;
}
.ڕیز:last-child{border:0}
.ناوی_خانە{color:var(--خاکستەری)}
.بەها{
  text-align:left;
  font-weight:700;
  max-width:60%;
  direction:ltr;
}
.سەوز{color:var(--سەوز)}
.سوور{color:var(--سوور)}
.پرتەقاڵی{color:var(--پرتەقاڵی)}
.خاکستەری{color:var(--خاکستەری)}
.بچووک{
  font-size:13px;
  color:var(--خاکستەری);
  margin-top:7px;
}
.تێبینی{
  margin-top:14px;
  background:#fff7dd;
  border-right:5px solid #e0a000;
  padding:13px;
  border-radius:5px;
  line-height:1.6;
}
.تاقیکردنەوە{
  padding:13px 0;
  border-bottom:1px solid #eee;
}
.تاقیکردنەوە:last-child{border:0}
footer{
  text-align:center;
  color:#77808a;
  font-size:13px;
  padding:30px 20px;
}

@media(max-width:720px){
  .بەشی_سەرەکی h1{font-size:31px}
  .گەڕان{flex-direction:column}
  button{padding:16px}
  .تۆڕ{grid-template-columns:1fr}
  .تەواو{grid-column:auto}
  .ڕیزی_سەرەوە{flex-direction:column;align-items:flex-start}
  .بەها{max-width:55%}
}
</style>
</head>

<body>

<header>
  <div class="سەرەوە">
    <div class="ناونیشان">AKAR'S <span>CAR CHECK</span></div>
    <small>پشکنینی ئۆتۆمبێلی بەریتانیا</small>
  </div>
</header>

<section class="بەشی_سەرەکی">
  <h1>پێش کڕین، ئۆتۆمبێلەکە بپشکنە 🚘</h1>
  <p>ژمارەی تۆماری ئۆتۆمبێل بنووسە بۆ بینینی زانیاری ڕاستەوخۆ.</p>

  <div class="گەڕان">
    <input id="ژمارە" class="ژمارە" maxlength="8" placeholder="AB12 CDE">
    <button id="دوگمە" onclick="پشکنین()">پشکنینی ئۆتۆمبێل</button>
  </div>

  <a
    class="دوگمەی_بیمە"
    href="https://enquiry.navigate.mib.org.uk/checkyourvehicle"
    target="_blank"
    rel="noopener noreferrer"
  >
    🛡️ پشکنینی بیمەی ئۆتۆمبێل
  </a>

  <div class="تێبینی_بیمە">
    بۆ پشکنینی بیمەی ئۆتۆمبێلی خۆت یان ئۆتۆمبێلێک کە مافی یاسایی شۆفێرکردنی هەیە.
  </div>
</section>

<main class="ناوەڕۆک">

<div id="پەیام" class="پەیام"></div>

<section id="ڕاپۆرت" class="ڕاپۆرت">

  <div class="کورتە">
    <div class="ڕیزی_سەرەوە">
      <div>
        <h2 id="سەردێڕ" style="margin:0">ڕاپۆرتی ئۆتۆمبێل</h2>
        <div class="بچووک">
          زانیاری ڕاستەوخۆ <span class="ڕاستەوخۆ">ڕاستەوخۆ</span>
        </div>
      </div>
      <div id="تابلۆ" class="تابلۆ">—</div>
    </div>
  </div>

  <div class="تۆڕ">

    <div class="کارت">
      <h3>🚗 زانیاری سەرەکیی ئۆتۆمبێل</h3>

      <div class="ڕیز"><span class="ناوی_خانە">مارکە</span><span id="مارکە" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">مۆدێل</span><span id="مۆدێل" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">ڕەنگ</span><span id="ڕەنگ" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">جۆری سووتەمەنی</span><span id="سووتەمەنی" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">قەبارەی ئەنجن</span><span id="ئەنجن" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">ساڵی دروستکردن</span><span id="ساڵ" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">تەمەنی ئۆتۆمبێل</span><span id="تەمەن" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">یەکەم جار تۆمارکراوە</span><span id="یەکەم_تۆمار" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">دوا بەرواری V5C</span><span id="V5C" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">بۆ هەناردە نیشان کراوە؟</span><span id="هەناردە" class="بەها">—</span></div>
    </div>

    <div class="کارت">
      <h3>🔧 پشکنینی ساڵانەی MOT و باج</h3>

      <div class="ڕیز"><span class="ناوی_خانە">دۆخی MOT</span><span id="MOT" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">بەرواری بەسەرچوونی MOT</span><span id="MOT_بەسەرچوون" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">چەند ڕۆژ ماوە تا MOT</span><span id="MOT_ڕۆژ" class="بەها">—</span></div>

      <div class="ڕیز"><span class="ناوی_خانە">دۆخی باجی ڕێگا</span><span id="باج" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">بەرواری باجی داهاتوو</span><span id="باج_بەروار" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">چەند ڕۆژ ماوە تا باج</span><span id="باج_ڕۆژ" class="بەها">—</span></div>

      <div class="ڕیز"><span class="ناوی_خانە">بەرواری دوا MOT</span><span id="دوا_MOT_بەروار" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">ئەنجامی دوا MOT</span><span id="دوا_MOT_ئەنجام" class="بەها">—</span></div>

      <div class="ڕیز"><span class="ناوی_خانە">کۆی هەموو تاقیکردنەوەکانی MOT</span><span id="کۆی_MOT" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">کۆی شکستهێنانەکان</span><span id="شکست" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">کۆی تێبینییەکان</span><span id="تێبینی_کۆ" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">تێبینی لە دوا MOT</span><span id="تێبینی_دوا" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">ڕێژەی سەرکەوتنی MOT</span><span id="ڕێژەی_MOT" class="بەها">—</span></div>
    </div>

    <div class="کارت">
      <h3>📈 زانیاری مایلیج</h3>

      <div class="ڕیز"><span class="ناوی_خانە">دوا مایلیج</span><span id="مایلیج" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">مایلیجی ئاسایی لە ساڵێکدا</span><span id="مایلیج_ساڵانە" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">ڕەوتی مایلیج</span><span id="ڕەوتی_مایلیج" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">مەترسی دەستکاریکردنی مایلیج</span><span id="مەترسی_مایلیج" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">بەراورد بە ناوەندی ئۆتۆمبێلە هاوشێوەکان</span><span id="بەراوردی_مایلیج" class="بەها">—</span></div>
    </div>

    <div class="کارت">
      <h3>🌱 ژینگە، دەرچوونی گاز و ULEZ</h3>

      <div class="ڕیز"><span class="ناوی_خانە">ستانداردی Euro</span><span id="Euro" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">دەرچوونی CO₂</span><span id="CO2" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">گونجاوە بۆ ULEZ؟</span><span id="ULEZ" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">دەرچوونی گاز لە شۆفێری ڕاستەقینەدا</span><span id="RDE" class="بەها">—</span></div>
    </div>

    <div class="کارت">
      <h3>⚠️ هەڵسەنگاندنی مەترسی</h3>

      <div class="ڕیز"><span class="ناوی_خانە">ئاستی مەترسی گشتی ئۆتۆمبێل</span><span id="مەترسی_گشتی" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">ئاستی مەترسی MOT</span><span id="مەترسی_MOT" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">مەترسی نائاساییبوونی مایلیج</span><span id="مەترسی_نائاسایی" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">نیشانەی گۆڕینی ڕەنگ هەیە؟</span><span id="گۆڕینی_ڕەنگ" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">بانگهێشتی چاککردنەوەی کارگەیی هەیە؟</span><span id="Recall" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">هەڵسەنگاندنی پاراستنی NCAP</span><span id="NCAP" class="بەها">—</span></div>
    </div>

    <div class="کارت">
      <h3>⭐ کورتەی پێشنیاری کڕین</h3>

      <div class="ڕیز"><span class="ناوی_خانە">پێشنیاری کڕین</span><span id="پێشنیار" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">دۆخی گشتی ئۆتۆمبێل</span><span id="دۆخ" class="بەها">—</span></div>
      <div class="ڕیز"><span class="ناوی_خانە">مەترسی خزمەتگوزاری و چاککردنەوە</span><span id="چاککردنەوە" class="بەها">—</span></div>

      <div class="تێبینی">
        ئەم ڕاپۆرتە تەنها ئەو زانیاریانە پیشان دەدات کە سەرچاوەی داتا بۆ ئەم ئۆتۆمبێلە دەیانگەڕێنێتەوە.
        ئەگەر زانیارییەک بەردەست نەبێت، «بەردەست نییە» پیشان دەدرێت.
      </div>
    </div>

    <div class="کارت تەواو">
      <h3>🛠️ کێشە و شکستهێنانە دووبارەبووەکانی MOT</h3>
      <div id="کێشە_دووبارە"></div>
    </div>

    <div class="کارت تەواو">
      <h3>📋 وردەکاری مێژووی MOT</h3>
      <div id="مێژووی_MOT"></div>
    </div>

  </div>
</section>
</main>

<footer>© 2026 Akar's Car Check</footer>

<script>
const دۆزینەوە = id => document.getElementById(id);

function بەها(v){
  if(v === null || v === undefined || v === "") return "بەردەست نییە";
  if(v === true) return "بەڵێ";
  if(v === false) return "نەخێر";
  return String(v);
}

function بەروار(v){
  if(!v) return "بەردەست نییە";
  const d = new Date(v);
  if(isNaN(d)) return String(v);
  return d.toLocaleDateString("en-GB", {
    day:"numeric",
    month:"short",
    year:"numeric"
  });
}

function وەرگرتن(obj, paths){
  for(const path of paths){
    const parts = path.split(".");
    let cur = obj;
    for(const p of parts){
      if(cur === null || cur === undefined || !(p in cur)){
        cur = undefined;
        break;
      }
      cur = cur[p];
    }
    if(cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return null;
}

function دانان(id, v){
  دۆزینەوە(id).textContent = بەها(v);
}

function دانانی_بەروار(id, v){
  دۆزینەوە(id).textContent = بەروار(v);
}

function ژمارە_لەگەڵ_یەکە(v, unit){
  if(v === null || v === undefined || v === "") return "بەردەست نییە";
  const n = Number(v);
  if(Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-GB") + unit;
}

function پاراستنی_دەق(text){
  return String(text)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function پشکنین(){
  const vrm = دۆزینەوە("ژمارە").value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g,"");

  if(vrm.length < 2){
    alert("تکایە ژمارەی تۆماری دروست بنووسە.");
    return;
  }

  دۆزینەوە("دوگمە").disabled = true;
  دۆزینەوە("دوگمە").textContent = "لە پشکنین دایە...";

  دۆزینەوە("پەیام").className = "پەیام";
  دۆزینەوە("پەیام").style.display = "block";
  دۆزینەوە("پەیام").textContent = "زانیاری ڕاستەوخۆ وەردەگیرێت...";

  دۆزینەوە("ڕاپۆرت").style.display = "none";

  try{
    const response = await fetch("/api/check", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({registration:vrm})
    });

    const result = await response.json();

    if(!response.ok || !result.ok){
      throw new Error(result.error || "پشکنینی ئۆتۆمبێل سەرکەوتوو نەبوو.");
    }

    const d = result.data || {};
    const s = d.signals || {};
    const summary = d.summary || {};

    دۆزینەوە("تابلۆ").textContent =
      بەها(d.registration || d.registrationNumber || d.vrm || vrm);

    دۆزینەوە("سەردێڕ").textContent =
      [d.make,d.model].filter(Boolean).join(" ") || "ڕاپۆرتی ئۆتۆمبێل";

    دانان("مارکە", d.make);
    دانان("مۆدێل", d.model);
    دانان("ڕەنگ", d.colour);
    دانان("سووتەمەنی", d.fuelType);

    دۆزینەوە("ئەنجن").textContent =
      d.engineCapacityCc !== null && d.engineCapacityCc !== undefined
        ? Number(d.engineCapacityCc).toLocaleString("en-GB") + " cc"
        : "بەردەست نییە";

    دانان("ساڵ", d.yearOfManufacture);

    دۆزینەوە("تەمەن").textContent =
      d.vehicleAgeYears !== null && d.vehicleAgeYears !== undefined
        ? d.vehicleAgeYears + " ساڵ"
        : "بەردەست نییە";

    دانان("یەکەم_تۆمار", d.monthOfFirstRegistration);

    دانانی_بەروار("V5C", وەرگرتن(d, [
      "signals.latestV5CIssuedDate",
      "signals.lastV5CIssuedDate",
      "latestV5CIssuedDate",
      "dateOfLastV5CIssued"
    ]));

    دانان("هەناردە", وەرگرتن(d, [
      "signals.markedForExport",
      "markedForExport"
    ]));

    دانان("MOT", s.motStatus);
    دانانی_بەروار("MOT_بەسەرچوون", s.motExpiryDate);
    دانان("MOT_ڕۆژ", وەرگرتن(d, ["signals.motDaysRemaining","signals.daysToMotExpiry"]));

    دانان("باج", s.taxStatus);
    دانانی_بەروار("باج_بەروار", s.taxDueDate);
    دانان("باج_ڕۆژ", وەرگرتن(d, ["signals.taxDaysRemaining","signals.daysToTaxDue"]));

    دانانی_بەروار("دوا_MOT_بەروار", s.lastMotDate);
    دانان("دوا_MOT_ئەنجام", s.lastMotResult);
    دانان("کۆی_MOT", s.totalMotTests);
    دانان("شکست", s.totalMotFailures);

    دانان("تێبینی_کۆ", وەرگرتن(d, [
      "signals.totalMotAdvisories",
      "signals.totalAdvisories",
      "summary.totalMotAdvisories"
    ]));

    دانان("تێبینی_دوا", وەرگرتن(d, [
      "signals.latestMotAdvisoryCount",
      "signals.latestAdvisoryCount"
    ]));

    دۆزینەوە("ڕێژەی_MOT").textContent =
      s.motPassRate !== null && s.motPassRate !== undefined
        ? Math.round(Number(s.motPassRate) * 100) + "%"
        : "بەردەست نییە";

    دۆزینەوە("مایلیج").textContent =
      s.latestOdometerMiles !== null && s.latestOdometerMiles !== undefined
        ? Number(s.latestOdometerMiles).toLocaleString("en-GB") + " مایل"
        : "بەردەست نییە";

    دۆزینەوە("مایلیج_ساڵانە").textContent =
      ژمارە_لەگەڵ_یەکە(
        وەرگرتن(d, [
          "signals.typicalAnnualMileage",
          "signals.annualMileage",
          "summary.typicalAnnualMileage"
        ]),
        " مایل لە ساڵێکدا"
      );

    دانان("ڕەوتی_مایلیج", s.odometerTrend);
    دانان("مەترسی_مایلیج", summary.mileageAnomalyRisk);
    دانان("بەراوردی_مایلیج", وەرگرتن(d, [
      "signals.mileageVsFleetAverage",
      "summary.mileageVsFleetAverage"
    ]));

    دانان("Euro", s.euroEmissionStandard);

    const co2 = وەرگرتن(d, [
      "signals.co2EmissionsGPerKm",
      "signals.co2Emissions",
      "co2EmissionsGPerKm",
      "co2Emissions"
    ]);

    دۆزینەوە("CO2").textContent =
      co2 !== null && co2 !== undefined
        ? بەها(co2) + " گرام/کیلۆمەتر"
        : "بەردەست نییە";

    دانان("ULEZ", s.ulezCompliant);

    دانان("RDE", وەرگرتن(d, [
      "signals.realDrivingEmissions",
      "realDrivingEmissions"
    ]));

    دانان("مەترسی_گشتی", summary.vehicleRiskLevel);
    دانان("مەترسی_MOT", summary.motRiskLevel);
    دانان("مەترسی_نائاسایی", summary.mileageAnomalyRisk);
    دانان("گۆڕینی_ڕەنگ", summary.colourChangeIndicated);

    دانان("Recall", وەرگرتن(d, [
      "signals.hasOutstandingRecall",
      "signals.outstandingRecall",
      "summary.outstandingRecall"
    ]));

    const ncap = وەرگرتن(d, [
      "signals.ncapSafetyRating.overallStars",
      "signals.ncapSafetyRating.stars",
      "signals.ncapRating",
      "ncapSafetyRating.overallStars"
    ]);

    دۆزینەوە("NCAP").textContent =
      ncap !== null && ncap !== undefined
        ? بەها(ncap) + " ئەستێرە ⭐"
        : "بەردەست نییە";

    دانان("پێشنیار", summary.buyRecommendation);
    دانان("دۆخ", وەرگرتن(d, [
      "summary.condition",
      "summary.vehicleCondition",
      "signals.condition"
    ]));

    دانان("چاککردنەوە", وەرگرتن(d, [
      "summary.maintenanceRisk",
      "signals.maintenanceRisk",
      "summary.maintenanceCondition"
    ]));

    const clusters = وەرگرتن(d, [
      "signals.failureClusters",
      "summary.failureClusters"
    ]);

    if(Array.isArray(clusters) && clusters.length){
      دۆزینەوە("کێشە_دووبارە").innerHTML =
        clusters.map(item => {
          if(typeof item === "string"){
            return '<div class="ڕیز"><span class="ناوی_خانە">جۆری کێشە</span><span class="بەها">'+پاراستنی_دەق(item)+'</span></div>';
          }

          const name =
            item.category ||
            item.name ||
            item.type ||
            "کێشە";

          const count =
            item.count ??
            item.total ??
            item.occurrences ??
            "—";

          return '<div class="ڕیز"><span class="ناوی_خانە">'+پاراستنی_دەق(name)+'</span><span class="بەها">'+پاراستنی_دەق(count)+'</span></div>';
        }).join("");
    }else{
      دۆزینەوە("کێشە_دووبارە").innerHTML =
        '<div class="خاکستەری">هیچ زانیارییەکی زیاتر بۆ کێشە دووبارەبووەکان بەردەست نییە.</div>';
    }

    const motDetails = وەرگرتن(d, [
      "motHistory",
      "mot_history",
      "signals.motHistory",
      "motTests"
    ]);

    if(Array.isArray(motDetails) && motDetails.length){
      دۆزینەوە("مێژووی_MOT").innerHTML = motDetails.map(test => {
        const testDate =
          test.testDate ||
          test.test_date ||
          test.date ||
          "—";

        const resultText =
          test.result ||
          test.testResult ||
          "—";

        const mileageVal =
          test.odometerMiles ??
          test.odometer ??
          test.mileage ??
          null;

        const notes =
          test.advisories ||
          test.defects ||
          test.rfrAndComments ||
          [];

        const notesHtml = Array.isArray(notes)
          ? notes.map(a => {
              const text = typeof a === "string"
                ? a
                : (a.text || a.comment || a.description || JSON.stringify(a));
              return '<div class="بچووک">• '+پاراستنی_دەق(text)+'</div>';
            }).join("")
          : "";

        return '<div class="تاقیکردنەوە">' +
          '<div class="ڕیز">' +
            '<span class="ناوی_خانە">بەرواری تاقیکردنەوە</span>' +
            '<span class="بەها">'+پاراستنی_دەق(بەروار(testDate))+'</span>' +
          '</div>' +
          '<div class="ڕیز">' +
            '<span class="ناوی_خانە">ئەنجام</span>' +
            '<span class="بەها">'+پاراستنی_دەق(resultText)+'</span>' +
          '</div>' +
          '<div class="ڕیز">' +
            '<span class="ناوی_خانە">مایلیج</span>' +
            '<span class="بەها">'+
              (mileageVal !== null
                ? Number(mileageVal).toLocaleString("en-GB") + " مایل"
                : "بەردەست نییە")+
            '</span>' +
          '</div>' +
          notesHtml +
        '</div>';
      }).join("");
    }else{
      دۆزینەوە("مێژووی_MOT").innerHTML =
        '<div class="خاکستەری">سەرچاوەی داتا بۆ ئەم ئۆتۆمبێلە وردەکاری هەر تاقیکردنەوەی MOT بە جیاوازی نەگەڕاندووەتەوە.</div>';
    }

    دۆزینەوە("پەیام").style.display = "none";
    دۆزینەوە("ڕاپۆرت").style.display = "block";

    دۆزینەوە("ڕاپۆرت").scrollIntoView({
      behavior:"smooth",
      block:"start"
    });

  }catch(error){
    دۆزینەوە("پەیام").className = "پەیام هەڵە";
    دۆزینەوە("پەیام").textContent = error.message;
  }finally{
    دۆزینەوە("دوگمە").disabled = false;
    دۆزینەوە("دوگمە").textContent = "پشکنینی ئۆتۆمبێل";
  }
}

دۆزینەوە("ژمارە").addEventListener("keydown", event => {
  if(event.key === "Enter"){
    پشکنین();
  }
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Akar's Car Check لە پۆرتی ${PORT} کار دەکات`);
});
