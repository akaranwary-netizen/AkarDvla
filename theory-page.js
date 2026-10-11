export function theoryPage(){ return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#070809"><title>Akar's Theory Learning</title>
<style>
:root{--bg:#070809;--card:#111419;--card2:#171b21;--gold:#d7b36a;--gold2:#f1d394;--text:#f7f7f8;--muted:#aeb5bf;--line:#2a3038;--ok:#48c98b;--bad:#ef6666}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#18140c,#08090b 34%,#070809);color:var(--text);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:100vh}
button,a,select{font:inherit}.top{position:sticky;top:0;z-index:30;background:#070809ee;backdrop-filter:blur(15px);border-bottom:1px solid #242930}
.topin{max-width:900px;margin:auto;padding:13px 14px;display:flex;align-items:center;gap:9px}.brand{font-weight:950;letter-spacing:.4px}.brand span{color:var(--gold)}
.iconbtn,.lang{border:1px solid #343a43;background:#13161b;color:#fff;border-radius:11px;padding:9px 11px;text-decoration:none}.lang{margin-left:auto}
.wrap{max-width:780px;margin:auto;padding:22px 14px 95px}.hero{text-align:center;padding:12px 4px 22px}.hero h1{margin:7px 0;font-size:31px}.hero h1 span{color:var(--gold2)}.hero p{color:var(--muted);line-height:1.55;margin:8px auto;max-width:620px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px}.tile{border:1px solid var(--line);background:linear-gradient(160deg,#171b20,#101216);border-radius:18px;padding:18px;text-align:left;color:#fff;min-height:112px;box-shadow:0 16px 45px #0003}
.tile strong{display:block;font-size:17px;margin:7px 0 4px}.tile small{color:var(--muted);line-height:1.35}.tile .emoji{font-size:27px}.tile.gold{border-color:#6e5a32;background:linear-gradient(160deg,#211b10,#111316)}
.title{font-size:25px;margin:5px 0}.sub{color:var(--muted);margin:0 0 18px;line-height:1.5}.sectionlist{display:grid;gap:9px}.section{width:100%;border:1px solid var(--line);background:#13171c;color:#fff;border-radius:14px;padding:15px;text-align:left;display:flex;gap:12px;align-items:center}.section b{flex:1}.section span{font-size:22px}
.card{background:linear-gradient(180deg,#15181d,#0f1115);border:1px solid var(--line);border-radius:20px;overflow:hidden}.qbody{padding:19px}.meta{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:11px}.pill{font-size:12px;color:#d8dce2;border:1px solid #3a414a;border-radius:99px;padding:5px 9px}
.en{font-size:20px;font-weight:850;line-height:1.4}.tr{font-size:17px;line-height:1.65;color:#f0d99f;margin-top:7px}.rtl{direction:rtl;text-align:right}
.answers{display:grid;gap:10px;margin-top:17px}.answer{width:100%;border:1px solid #353c45;background:#181c22;color:#fff;border-radius:14px;padding:13px;text-align:left}.answer .enA{display:block;line-height:1.45}.answer .trA{display:block;color:#e8cf96;margin-top:6px;line-height:1.55}.answer.correct{border-color:var(--ok);background:#48c98b18}.answer.wrong{border-color:var(--bad);background:#ef666618}
.explain{display:none;margin-top:14px;padding:14px;border:1px solid #303741;background:#0b0d10;border-radius:13px;line-height:1.55}.explain.show{display:block}.next{display:none;width:100%;margin-top:12px;border:0;border-radius:13px;padding:14px;background:linear-gradient(135deg,#b99047,#e5c77d);font-weight:900;color:#111}.next.show{display:block}
.progress{height:7px;background:#252a31}.progress div{height:100%;background:linear-gradient(90deg,#a47f3f,#f0d18d)}
.bottom{position:fixed;bottom:0;left:0;right:0;z-index:40;background:#090a0df2;border-top:1px solid #292f37;padding:9px max(12px,env(safe-area-inset-left)) calc(9px + env(safe-area-inset-bottom));display:flex;justify-content:center;gap:9px}.bottom button,.bottom a{width:min(220px,46%);text-align:center;border:1px solid #383f48;background:#15181d;color:#fff;border-radius:13px;padding:12px;text-decoration:none;font-weight:800}
.hidden{display:none!important}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 16px}.stat{text-align:center;background:#111419;border:1px solid var(--line);border-radius:13px;padding:11px 4px}.stat b{display:block;color:var(--gold2);font-size:19px}.stat small{font-size:11px;color:var(--muted)}
.notice{border:1px solid #5d4d2d;background:#19150d;border-radius:13px;padding:12px;color:#e7d6ae;line-height:1.5;margin-bottom:14px}
@media(max-width:560px){.grid{grid-template-columns:1fr}.tile{min-height:92px}.hero h1{font-size:27px}.en{font-size:19px}.wrap{padding-top:17px}}
</style></head><body>
<header class="top"><div class="topin"><a class="iconbtn" href="/">🚗 Car Check</a><div class="brand">AKAR'S <span>THEORY</span></div><button class="lang" id="langBtn">🌐 English</button></div></header>
<main class="wrap">
<section id="home">
 <div class="hero"><div>🇬🇧 UK Driving Theory Learning</div><h1>Learn. Practise. <span>Pass.</span></h1><p>English always stays visible. Choose another language for learning help underneath the real English wording.</p></div>
 <div class="grid">
  <button class="tile gold" onclick="showSections()"><div class="emoji">📚</div><strong>Learn & Practice</strong><small>Choose one of the 14 DVSA-style learning sections</small></button>
  <button class="tile" onclick="startMode('quick')"><div class="emoji">⚡</div><strong>Test Yourself</strong><small>10 mixed practice questions</small></button>
  <button class="tile" onclick="startMode('mock')"><div class="emoji">📝</div><strong>Mock Test</strong><small>50 mixed questions</small></button>
  <button class="tile" onclick="showSigns()"><div class="emoji">🚦</div><strong>Road Signs</strong><small>Learn road and traffic signs</small></button>
  <button class="tile" onclick="showWrong()"><div class="emoji">❌</div><strong>Wrong Answers</strong><small>Practise questions you got wrong</small></button>
  <button class="tile" onclick="showProgress()"><div class="emoji">📊</div><strong>My Progress</strong><small>Answered, correct and accuracy</small></button>
 </div>
</section>
<section id="sections" class="hidden"><h2 class="title">Select a section</h2><p class="sub">Choose what you want to learn and practise.</p><div id="sectionList" class="sectionlist"></div></section>
<section id="signs" class="hidden"><h2 class="title">🚦 Road Signs</h2><p class="sub">Learn road and traffic signs, then practise the Road and traffic signs section.</p><div class="notice">Road signs learning is organised separately so learners can recognise the sign and learn its English meaning before answering questions.</div><button class="section" onclick="startCategory('Road signs')"><span>⛔</span><b>Start Road & Traffic Signs Questions</b><span>›</span></button></section>
<section id="progressPage" class="hidden"><h2 class="title">📊 My Progress</h2><div class="stats"><div class="stat"><b id="pAnswered">0</b><small>Answered</small></div><div class="stat"><b id="pCorrect">0</b><small>Correct</small></div><div class="stat"><b id="pAccuracy">0%</b><small>Accuracy</small></div></div></section>
<section id="quiz" class="hidden">
 <div class="stats"><div class="stat"><b id="answered">0</b><small>Answered</small></div><div class="stat"><b id="correct">0</b><small>Correct</small></div><div class="stat"><b id="accuracy">0%</b><small>Accuracy</small></div></div>
 <div class="card"><div class="progress"><div id="bar"></div></div><div class="qbody"><div class="meta"><span class="pill" id="qnum"></span><span class="pill" id="cat"></span></div><div class="en" id="question">Loading…</div><div class="tr rtl" id="questionTr"></div><div class="answers" id="answers"></div><div class="explain" id="explain"></div><button class="next" id="next">Next question →</button></div></div>
</section>
</main>
<nav class="bottom"><button id="backBtn" onclick="goBack()">← Back</button><button onclick="theoryHome()">🏠 Theory Home</button></nav>
<script>
const categories=[
['Attitude','🤝'],['Alertness','👀'],['Safety and your vehicle','🔧'],['Safety margins','↔️'],['Hazard awareness','⚠️'],['Vulnerable road users','🚲'],['Other types of vehicle','🚛'],['Vehicle handling','🚗'],['Motorway rules','🛣️'],['Rules of the road','🚦'],['Road signs','⛔'],['Essential documents','📄'],['Incidents and emergencies','🚑'],['Vehicle loading','📦']
];
let bank=[],session=[],idx=0,lang='en',historyStack=['home'],translationCache={},answered=Number(localStorage.theoryAnswered||0),correct=Number(localStorage.theoryCorrect||0);
const $=x=>document.getElementById(x); const pages=['home','sections','signs','progressPage','quiz'];
function showPage(id,push=true){pages.forEach(p=>$(p).classList.toggle('hidden',p!==id));if(push&&historyStack.at(-1)!==id)historyStack.push(id);window.scrollTo(0,0)}
function theoryHome(){historyStack=['home'];showPage('home',false)} function goBack(){if(historyStack.length>1){historyStack.pop();showPage(historyStack.at(-1),false)}else location.href='/'}
function showSections(){showPage('sections')} function showSigns(){showPage('signs')} function showProgress(){updateStats();showPage('progressPage')}
function updateStats(){$('answered').textContent=answered;$('correct').textContent=correct;$('accuracy').textContent=answered?Math.round(correct/answered*100)+'%':'0%';$('pAnswered').textContent=answered;$('pCorrect').textContent=correct;$('pAccuracy').textContent=answered?Math.round(correct/answered*100)+'%':'0%'}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
async function load(){try{bank=await (await fetch('/api/theory/questions')).json()}catch(e){alert('Could not load questions.');return} const list=$('sectionList');categories.forEach(([c,ic])=>{const b=document.createElement('button');b.className='section';b.innerHTML='<span>'+ic+'</span><b>'+c+'</b><span>›</span>';b.onclick=()=>startCategory(c);list.appendChild(b)});updateStats()}
function startCategory(c){let pool=bank.filter(q=>q.category===c || (c==='Road signs'&&q.category==='Road and traffic signs'));session=shuffle(pool);if(!session.length){alert('No questions found in this section yet.');return}idx=0;showPage('quiz');render()}
function startMode(m){session=shuffle(bank).slice(0,m==='mock'?50:10);idx=0;showPage('quiz');render()}
function showWrong(){const ids=JSON.parse(localStorage.theoryWrong||'[]');const pool=bank.filter(q=>ids.includes(q.id));if(!pool.length){alert('You do not have any saved wrong answers yet.');return}session=shuffle(pool);idx=0;showPage('quiz');render()}
async function translated(q){if(lang==='en')return null;const key=lang+'-'+q.id;if(translationCache[key])return translationCache[key];const texts=[q.question,...q.options,q.explanation,q.category];try{const r=await fetch('/api/language-pack',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:lang,texts})});const d=await r.json();if(d.ok){const a=texts.map(x=>d.translations[x]||x);return translationCache[key]={question:a[0],options:a.slice(1,5),explanation:a[5],category:a[6]}}}catch(e){}return null}
async function render(){const q=session[idx];if(!q)return;$('bar').style.width=(idx/session.length*100)+'%';$('qnum').textContent='Question '+(idx+1)+' of '+session.length;$('cat').textContent=q.category;$('question').textContent=q.question;$('questionTr').textContent='';$('answers').innerHTML='';$('explain').className='explain';$('next').className='next';q.options.forEach((a,i)=>{const b=document.createElement('button');b.className='answer';b.innerHTML='<span class="enA">'+String.fromCharCode(65+i)+'. '+a+'</span><span class="trA rtl" id="tr'+i+'"></span>';b.onclick=()=>choose(i);$('answers').appendChild(b)});if(lang!=='en'){const t=await translated(q);if(t&&session[idx]?.id===q.id){$('questionTr').textContent=t.question;t.options.forEach((x,i)=>{const e=$('tr'+i);if(e)e.textContent=x})}}}
async function choose(i){const q=session[idx],bs=[...$('answers').children];bs.forEach(b=>b.disabled=true);bs[q.correct].classList.add('correct');if(i!==q.correct)bs[i].classList.add('wrong');answered++;if(i===q.correct)correct++;else{let w=JSON.parse(localStorage.theoryWrong||'[]');if(!w.includes(q.id))w.push(q.id);localStorage.theoryWrong=JSON.stringify(w)}localStorage.theoryAnswered=answered;localStorage.theoryCorrect=correct;updateStats();let tr=null;if(lang!=='en')tr=await translated(q);$('explain').innerHTML='<strong>'+(i===q.correct?'✓ Correct':'✕ Not quite')+'</strong><br><span>'+q.explanation+'</span>'+(tr?'<div class="tr rtl">'+tr.explanation+'</div>':'');$('explain').className='explain show';$('next').className='next show';$('bar').style.width=((idx+1)/session.length*100)+'%'}
$('next').onclick=()=>{idx++;if(idx>=session.length){alert('Session complete.');theoryHome()}else render()};
const langs=[['en','English'],['ckb','کوردی سۆرانی'],['ar','العربية'],['fa','فارسی'],['tr','Türkçe'],['fr','Français'],['de','Deutsch'],['es','Español'],['ro','Română'],['pl','Polski'],['ur','اردو'],['ps','پښتو']];
$('langBtn').onclick=()=>{let n=(langs.findIndex(x=>x[0]===lang)+1)%langs.length;lang=langs[n][0];$('langBtn').textContent='🌐 '+langs[n][1];if(!$('quiz').classList.contains('hidden'))render()};
load();
</script></body></html>` }