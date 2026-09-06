import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ZYFY_API_KEY = process.env.ZYFY_API_KEY;

app.use(express.json());

function cleanReg(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Akar's Car Check</title>
<style>
:root{
  --ink:#101820;
  --yellow:#ffd400;
  --blue:#1769e0;
  --bg:#f4f6f8;
  --muted:#68717c;
  --green:#138a43;
  --red:#c92828;
}
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:#17202a}
header{background:var(--ink);color:#fff;padding:18px 20px}
.head{max-width:1100px;margin:auto;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:24px;font-weight:900}.logo span{color:var(--yellow)}
.hero{background:var(--ink);color:#fff;text-align:center;padding:52px 20px 88px}
.hero h1{margin:0 0 12px;font-size:43px}
.hero p{color:#ccd4db;margin:0 0 28px}
.search{max-width:720px;margin:auto;background:#fff;padding:18px;border-radius:14px;display:flex;gap:10px;box-shadow:0 12px 35px #0004}
.reg{flex:1;min-width:0;background:var(--yellow);border:3px solid #111;border-radius:7px;padding:15px;text-align:center;font-size:27px;font-weight:900;text-transform:uppercase;letter-spacing:3px}
button{border:0;border-radius:7px;background:var(--blue);color:#fff;padding:0 28px;font-size:16px;font-weight:800;cursor:pointer}
button:disabled{opacity:.6}
.wrap{max-width:1100px;margin:-42px auto 60px;padding:0 18px}
.msg{display:none;padding:15px;border-radius:10px;margin-bottom:16px;background:#fff}
.error{background:#fee2e2;color:#991b1b}
.report{display:none}
.summary,.card{background:#fff;border-radius:14px;box-shadow:0 4px 18px #00000012}
.summary{padding:24px;margin-bottom:18px}
.top{display:flex;justify-content:space-between;align-items:center;gap:14px}
.plate{background:var(--yellow);border:2px solid #111;border-radius:5px;padding:9px 16px;font-weight:900;font-size:23px;letter-spacing:2px}
.live{display:inline-block;background:#dcfce7;color:#166534;border-radius:99px;padding:4px 8px;font-size:11px;font-weight:900}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.card{padding:22px}.card h3{margin:0 0 14px}
.full{grid-column:1/-1}
.row{display:flex;justify-content:space-between;gap:18px;padding:10px 0;border-bottom:1px solid #eee}
.row:last-child{border:0}
.label{color:var(--muted)}
.value{text-align:right;font-weight:700;max-width:60%}
.good{color:var(--green)}.bad{color:var(--red)}.muted{color:var(--muted)}
.small{font-size:13px;color:var(--muted);margin-top:7px}
pre{background:#111827;color:#e5e7eb;padding:14px;border-radius:10px;overflow:auto;white-space:pre-wrap;font-size:12px}
footer{text-align:center;color:#77808a;font-size:13px;padding:30px 20px}
@media(max-width:720px){
  .hero h1{font-size:31px}
  .search{flex-direction:column}
  button{padding:16px}
  .grid{grid-template-columns:1fr}
  .full{grid-column:auto}
  .top{flex-direction:column;align-items:flex-start}
  .value{max-width:55%}
}
</style>
</head>
<body>

<header>
  <div class="head">
    <div class="logo">AKAR'S <span>CAR CHECK</span></div>
    <small>Live UK vehicle check</small>
  </div>
</header>

<section class="hero">
  <h1>Check Any UK Vehicle 🚘</h1>
  <p>Enter a registration to load live vehicle information.</p>
  <div class="search">
    <input id="reg" class="reg" maxlength="8" placeholder="AB12 CDE">
    <button id="btn" onclick="checkCar()">CHECK CAR</button>
  </div>
</section>

<main class="wrap">
  <div id="msg" class="msg"></div>

  <section id="report" class="report">
    <div class="summary">
      <div class="top">
        <div>
          <h2 id="title" style="margin:0">Vehicle Report</h2>
          <div class="small">Zyfy <span class="live">LIVE</span></div>
        </div>
        <div id="plate" class="plate">—</div>
      </div>
    </div>

    <div class="grid">

      <div class="card">
        <h3>🚗 Vehicle Details</h3>
        <div class="row"><span class="label">Make</span><span id="make" class="value">—</span></div>
        <div class="row"><span class="label">Model</span><span id="model" class="value">—</span></div>
        <div class="row"><span class="label">Colour</span><span id="colour" class="value">—</span></div>
        <div class="row"><span class="label">Fuel</span><span id="fuel" class="value">—</span></div>
        <div class="row"><span class="label">Engine</span><span id="engine" class="value">—</span></div>
        <div class="row"><span class="label">Year</span><span id="year" class="value">—</span></div>
        <div class="row"><span class="label">First registered</span><span id="firstreg" class="value">—</span></div>
      </div>

      <div class="card">
        <h3>🔧 MOT & Tax</h3>
        <div class="row"><span class="label">MOT status</span><span id="mot" class="value">—</span></div>
        <div class="row"><span class="label">MOT expiry</span><span id="motexp" class="value">—</span></div>
        <div class="row"><span class="label">Tax status</span><span id="tax" class="value">—</span></div>
        <div class="row"><span class="label">Tax due</span><span id="taxdue" class="value">—</span></div>
        <div class="row"><span class="label">Last MOT result</span><span id="lastmot" class="value">—</span></div>
        <div class="row"><span class="label">MOT pass rate</span><span id="passrate" class="value">—</span></div>
      </div>

      <div class="card">
        <h3>📈 Mileage</h3>
        <div class="row"><span class="label">Latest mileage</span><span id="mileage" class="value">—</span></div>
        <div class="row"><span class="label">Mileage trend</span><span id="trend" class="value">—</span></div>
        <div class="row"><span class="label">Mileage anomaly risk</span><span id="mileagerisk" class="value">—</span></div>
      </div>

      <div class="card">
        <h3>🌱 Emissions / ULEZ</h3>
        <div class="row"><span class="label">Euro standard</span><span id="euro" class="value">—</span></div>
        <div class="row"><span class="label">CO₂</span><span id="co2" class="value">—</span></div>
        <div class="row"><span class="label">ULEZ compliant</span><span id="ulez" class="value">—</span></div>
      </div>

      <div class="card">
        <h3>⭐ Buying Summary</h3>
        <div class="row"><span class="label">Recommendation</span><span id="buy" class="value">—</span></div>
        <div class="row"><span class="label">Vehicle risk</span><span id="risk" class="value">—</span></div>
        <div class="row"><span class="label">MOT risk</span><span id="motrisk" class="value">—</span></div>
      </div>

      <div class="card full">
        <h3>📚 Everything Returned by the API</h3>
        <pre id="raw">—</pre>
      </div>

    </div>
  </section>
</main>

<footer>© 2026 Akar's Car Check</footer>

<script>
const $ = id => document.getElementById(id);

function val(v){
  return (v === null || v === undefined || v === "") ? "Not available" : String(v);
}

function dateVal(v){
  if(!v) return "Not available";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleDateString("en-GB", {
    day:"numeric", month:"short", year:"numeric"
  });
}

async function checkCar(){
  const vrm = $("reg").value.toUpperCase().replace(/[^A-Z0-9]/g,"");

  if(vrm.length < 2){
    alert("Enter a registration number.");
    return;
  }

  $("btn").disabled = true;
  $("btn").textContent = "CHECKING...";
  $("msg").className = "msg";
  $("msg").style.display = "block";
  $("msg").textContent = "Loading live data…";
  $("report").style.display = "none";

  try{
    const response = await fetch("/api/check", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({registration:vrm})
    });

    const result = await response.json();

    if(!response.ok || !result.ok){
      throw new Error(result.error || "Vehicle lookup failed.");
    }

    const d = result.data || {};
    const s = d.signals || {};
    const summary = d.summary || {};

    $("plate").textContent = val(d.registration || d.registrationNumber || d.vrm || vrm);
    $("title").textContent = [d.make,d.model].filter(Boolean).join(" ") || "Vehicle Report";

    $("make").textContent = val(d.make);
    $("model").textContent = val(d.model);
    $("colour").textContent = val(d.colour);
    $("fuel").textContent = val(d.fuelType);
    $("engine").textContent = d.engineCapacityCc ? Number(d.engineCapacityCc).toLocaleString("en-GB") + " cc" : "Not available";
    $("year").textContent = val(d.yearOfManufacture);
    $("firstreg").textContent = val(d.monthOfFirstRegistration);

    $("mot").textContent = val(s.motStatus);
    $("motexp").textContent = dateVal(s.motExpiryDate);
    $("tax").textContent = val(s.taxStatus);
    $("taxdue").textContent = dateVal(s.taxDueDate);
    $("lastmot").textContent = val(s.lastMotResult);

    $("passrate").textContent =
      s.motPassRate !== null && s.motPassRate !== undefined
        ? Math.round(Number(s.motPassRate) * 100) + "%"
        : "Not available";

    $("mileage").textContent =
      s.latestOdometerMiles !== null && s.latestOdometerMiles !== undefined
        ? Number(s.latestOdometerMiles).toLocaleString("en-GB") + " miles"
        : "Not available";

    $("trend").textContent = val(s.odometerTrend);
    $("mileagerisk").textContent = val(summary.mileageAnomalyRisk);

    $("euro").textContent = val(s.euroEmissionStandard);
    $("co2").textContent =
      s.co2EmissionsGPerKm !== null && s.co2EmissionsGPerKm !== undefined
        ? s.co2EmissionsGPerKm + " g/km"
        : "Not available";

    $("ulez").textContent = val(s.ulezCompliant);
    $("buy").textContent = val(summary.buyRecommendation);
    $("risk").textContent = val(summary.vehicleRiskLevel);
    $("motrisk").textContent = val(summary.motRiskLevel);

    $("raw").textContent = JSON.stringify(d, null, 2);

    $("msg").style.display = "none";
    $("report").style.display = "block";
    $("report").scrollIntoView({behavior:"smooth"});

  }catch(error){
    $("msg").className = "msg error";
    $("msg").textContent = error.message;
  }finally{
    $("btn").disabled = false;
    $("btn").textContent = "CHECK CAR";
  }
}

$("reg").addEventListener("keydown", e => {
  if(e.key === "Enter") checkCar();
});
</script>

</body>
</html>`);
});

app.post("/api/check", async (req, res) => {
  const vrm = cleanReg(req.body?.registration);

  if (!vrm || vrm.length < 2 || vrm.length > 8) {
    return res.status(400).json({
      ok:false,
      error:"Enter a valid UK registration."
    });
  }

  if (!ZYFY_API_KEY) {
    return res.status(500).json({
      ok:false,
      error:"ZYFY_API_KEY is missing in Render environment variables."
    });
  }

  try {
    const url = `https://zyfy.uk/v1/vehicle/${encodeURIComponent(vrm)}`;

    const response = await fetch(url, {
      headers: {
        "X-Api-Key": ZYFY_API_KEY,
        "Accept": "application/json"
      }
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw:text };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        ok:false,
        error:data?.message || data?.error || data?.detail || `Zyfy error ${response.status}`
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
      error:"Could not contact Zyfy."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Akar's Car Check running on port ${PORT}`);
});
