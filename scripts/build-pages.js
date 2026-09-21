#!/usr/bin/env node
/* Remaining page generators. Required by build.js. */
const fs = require('fs');
const path = require('path');
const B = require('./build.js');
const {
  layout, esc, cellHtml, mappingHtml, write, OUT, ALL, BY_ID, FULL, OPEN,
  STAGES, META, MAPPING_COUNT, STATUSLABEL, sevClass, FILTER_JS, sets, SITE,
} = B;

const ROOT = path.join(__dirname, '..');
const A = sets.assessment;
const STARTERS = sets.starterSets;
const TIERS = sets.automationTiers;
const TIER_LABEL2 = { systematic: 'Systematic', partial: 'Partial', judgment: 'Judgment-required' };
const TIER_CLASS = { systematic: 'tier-sys', partial: 'tier-par', judgment: 'tier-jdg' };
const TAGGED = FULL.filter((m) => m.automationPotential);

/* =================== SELF-ASSESSMENT =================== */
const qData = A.questions.map((q) => {
  const m = BY_ID[q.mode];
  return {
    id: q.id, text: q.text, mode: q.mode, name: m.name, sev: m.severity, lay: m.plainTerms,
    stage: m.stageId, stageName: m.stageName,
    tier: m.automationPotential || null, tierNote: m.automationNote || null,
  };
});

write('assess.html', layout({
  title: 'Self-assessment — AGFM',
  desc: 'Twenty-eight questions identifying which AI governance failure modes are likely present in your programme. Runs entirely in your browser; nothing is transmitted or stored.',
  current: '/assess',
  body: `<header class="masthead"><div class="wrap narrow">
  <span class="eyebrow">About fifteen minutes · ${qData.length} questions</span>
  <h1>Self-assessment</h1>
  <p class="deck">${esc(A.description)}</p>
</div></header>

<section style="padding-top:36px"><div class="wrap narrow">
  <div class="callout">
    <p><b>How to answer.</b> ${esc(A.instructions)}</p>
    <p style="margin-bottom:0"><b>Privacy.</b> ${esc(A.privacy)} There is no account, no email capture, and no analytics on your answers.</p>
  </div>
</div></section>

<div class="stickybar"><div class="wrap narrow">
  <div class="progressbar"><i id="pbar"></i></div>
  <div class="row">
    <span id="progress">0 of ${qData.length} answered</span>
    <button class="btn" id="showResults" disabled>See results</button>
    <button class="btn ghost" id="clearAll">Clear</button>
    <span style="margin-left:auto">Nothing leaves your browser</span>
  </div>
</div></div>

<section style="padding-top:0"><div class="wrap narrow">
  <div id="questions"></div>
  <div class="results" id="results" hidden></div>
</div></section>

<script>
var Q=${JSON.stringify(qData)};
var STAGES=${JSON.stringify(STAGES.map((s) => ({ id: s.id, name: s.name })))};
var TIER_LABEL={systematic:'Systematic',partial:'Partial',judgment:'Judgment-required'};
var TIER_CLASS={systematic:'tier-sys',partial:'tier-par',judgment:'tier-jdg'};
var answers={};
var qEl=document.getElementById('questions');

Q.forEach(function(q,i){
  var d=document.createElement('div');
  d.className='q'; d.id='q-'+q.id;
  d.innerHTML='<span class="qnum">Question '+(i+1)+' of '+Q.length+' · '+q.stage+'</span>'+
    '<p class="qtext">'+q.text+'</p>'+
    '<div class="opts" role="group">'+
    ['yes','unsure','no'].map(function(v){
      var label=v==='yes'?'Yes':v==='no'?'No':'Unsure';
      return '<button class="opt" data-q="'+q.id+'" data-v="'+v+'" aria-pressed="false">'+label+'</button>';
    }).join('')+'</div>';
  qEl.appendChild(d);
});

qEl.addEventListener('click',function(e){
  var b=e.target.closest('.opt'); if(!b) return;
  var qid=b.dataset.q;
  answers[qid]=b.dataset.v;
  document.querySelectorAll('.opt[data-q="'+qid+'"]').forEach(function(o){
    o.setAttribute('aria-pressed',String(o===b));
  });
  document.getElementById('q-'+qid).classList.add('answered');
  updateProgress();
});

function updateProgress(){
  var n=Object.keys(answers).length;
  document.getElementById('progress').textContent=n+' of '+Q.length+' answered';
  document.getElementById('pbar').style.width=(n/Q.length*100)+'%';
  document.getElementById('showResults').disabled=n===0;
}

document.getElementById('clearAll').addEventListener('click',function(){
  answers={};
  document.querySelectorAll('.opt').forEach(function(o){o.setAttribute('aria-pressed','false');});
  document.querySelectorAll('.q').forEach(function(q){q.classList.remove('answered');});
  document.getElementById('results').hidden=true;
  updateProgress();
});

document.getElementById('showResults').addEventListener('click',render);

function render(){
  var yes=0,no=0,unsure=0,gaps=[];
  Q.forEach(function(q){
    var a=answers[q.id];
    if(a==='yes') yes++;
    else if(a==='no'){no++;gaps.push(Object.assign({},q,{level:'likely'}));}
    else if(a==='unsure'){unsure++;gaps.push(Object.assign({},q,{level:'possible'}));}
  });
  var answered=yes+no+unsure;
  var order={Critical:0,High:1,Moderate:2};
  gaps.sort(function(a,b){
    if(a.level!==b.level) return a.level==='likely'?-1:1;
    return order[a.sev]-order[b.sev];
  });

  var byStage={};
  gaps.forEach(function(g){ (byStage[g.stage]=byStage[g.stage]||[]).push(g); });

  var h='<h2>Results</h2>';
  h+='<div class="scorebar" role="img" aria-label="'+yes+' controls operating, '+unsure+' unsure, '+no+' likely gaps">';
  if(yes) h+='<i class="sy" style="width:'+(yes/answered*100)+'%"></i>';
  if(unsure) h+='<i class="su" style="width:'+(unsure/answered*100)+'%"></i>';
  if(no) h+='<i class="sn" style="width:'+(no/answered*100)+'%"></i>';
  h+='</div>';
  h+='<p class="mono" style="font-size:11.5px;color:var(--ink-3)">'+yes+' operating · '+unsure+' unsure · '+no+' likely gap · '+answered+' of '+Q.length+' answered</p>';

  if(!gaps.length){
    h+='<div class="callout"><p style="margin-bottom:0">No gaps identified from the questions you answered. That is an unusual result. Before treating it as a clean bill of health, check whether each Yes could actually be evidenced to an examiner — the most common reason for a result like this is answering from policy rather than from practice.</p></div>';
  } else {
    var tierCounts={systematic:0,partial:0,judgment:0,untagged:0};
    gaps.forEach(function(g){ tierCounts[g.tier||'untagged']++; });
    h+='<div class="callout"><p><b>'+gaps.length+' failure mode'+(gaps.length===1?'':'s')+' likely present.</b> Answers of Unsure are included, because an undemonstrable control and an absent control produce the same finding at audit.</p>'+
       '<p style="margin-bottom:0">Of those, <b>'+tierCounts.systematic+'</b> can likely be closed with a systematic control, <b>'+tierCounts.partial+'</b> need automation plus a human decision point, and <b>'+tierCounts.judgment+'</b> are judgment calls no tooling replaces. Start with systematic — it is usually the fastest ground to cover — then work the <a href="/patterns">cross-cutting patterns</a> rather than this list in identifier order.</p></div>';
    STAGES.forEach(function(s){
      var items=byStage[s.id]; if(!items) return;
      h+='<div class="rstage"><h3>'+s.id+' · '+s.name+'</h3>';
      h+='<div class="rmeta">'+items.length+' likely present</div><ul class="rlist">';
      items.forEach(function(g){
        var tierTag=g.tier?' <span class="tag '+TIER_CLASS[g.tier]+'">'+TIER_LABEL[g.tier]+'</span>':'';
        h+='<li data-sev="'+g.sev+'"><span class="rid">'+g.mode+' · '+g.sev+' · '+(g.level==='likely'?'answered No':'answered Unsure')+tierTag+'</span>'+
           '<a class="rname" href="/entries/'+g.mode+'">'+g.name+'</a>'+
           '<span class="rlay">'+g.lay+(g.tierNote?' <span style="color:var(--ink-3)">— '+g.tierNote+'</span>':'')+'</span></li>';
      });
      h+='</ul></div>';
    });
    h+='<p style="margin-top:10px"><a href="/automate">See the full automation breakdown →</a></p>';
  }

  h+='<div class="rstage"><h3>Take this with you</h3>'+
     '<p style="font-size:14.5px">Export saves a JSON file to your machine. Nothing is uploaded. Print produces a clean document you can bring to a meeting.</p>'+
     '<div class="opts"><button class="btn" id="exportBtn">Export JSON</button>'+
     '<button class="btn ghost" id="printBtn">Print / save as PDF</button>'+
     '<a class="btn ghost" href="/coverage" style="border-bottom:1px solid var(--rule)">Open coverage map</a></div></div>';

  var r=document.getElementById('results');
  r.innerHTML=h; r.hidden=false;
  r.scrollIntoView({behavior:'smooth',block:'start'});

  document.getElementById('printBtn').addEventListener('click',function(){window.print();});
  document.getElementById('exportBtn').addEventListener('click',function(){
    var payload={framework:'AGFM',version:'${META.version}',generated:new Date().toISOString(),
      summary:{answered:answered,operating:yes,unsure:unsure,likelyGap:no},
      gaps:gaps.map(function(g){return {id:g.mode,name:g.name,severity:g.sev,stage:g.stage,level:g.level,automationPotential:g.tier||null};}),
      answers:answers};
    var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='agfm-assessment-'+new Date().toISOString().slice(0,10)+'.json';
    a.click(); URL.revokeObjectURL(a.href);
  });
}
updateProgress();
</script>`,
}));

/* =================== COVERAGE MAP =================== */
write('coverage.html', layout({
  title: 'Coverage map — AGFM',
  desc: 'Track which AI governance failure modes are present, addressed or not applicable across your programme. Saves locally in your browser; export and re-import as JSON.',
  current: '/coverage',
  body: `<header class="masthead"><div class="wrap">
  <span class="eyebrow">Your working state</span>
  <h1>Coverage map</h1>
  <p class="deck">Mark each failure mode as present, addressed, or not applicable. Click a cell to cycle its state. The map saves in your browser and can be exported as JSON and re-imported later, or by a colleague.</p>
</div></header>

<section style="padding-top:36px"><div class="wrap">
  <div class="callout">
    <p style="margin-bottom:0"><b>Your data stays on your machine.</b> State is held in this browser's local storage and in files you export yourself. Nothing is transmitted to any server, and clearing your browser data will clear the map — export if you want to keep it.</p>
  </div>
</div></section>

<div class="stickybar"><div class="wrap">
  <div class="row">
    <span id="covsummary">—</span>
    <button class="btn" id="exportBtn">Export</button>
    <label class="btn ghost" for="importFile" style="cursor:pointer">Import</label>
    <input id="importFile" type="file" accept="application/json" class="skip">
    <button class="btn ghost" id="printBtn">Print</button>
    <button class="btn ghost" id="resetBtn">Reset</button>
    <span style="margin-left:auto">Click a cell to cycle: unknown → present → addressed → not applicable</span>
  </div>
</div></div>

<section style="padding-top:0"><div class="wrap">
  <div class="covgrid" id="covgrid">
  ${STAGES.map((s) => `<div class="col">
    <div class="colhead"><span class="cid">${s.id}</span><span class="cname">${esc(s.name)}</span><span class="ccount" data-stagecount="${s.id}">—</span></div>
    ${s.failureModes.map((m) => `<button class="covcell" data-id="${m.id}" data-state="unknown" data-sev="${m.severity}">
      <span class="cvid">${m.id}</span><span class="cvname">${esc(m.name)}</span><span class="cvstate">Unknown</span>
    </button>`).join('\n')}
  </div>`).join('\n')}
  </div>
  <div class="legend">
    <span><i class="swatch" style="background:var(--crit)"></i> Present</span>
    <span><i class="swatch" style="background:var(--ok)"></i> Addressed</span>
    <span><i class="swatch" style="background:var(--rule)"></i> Not applicable</span>
    <span>Unmarked cells are Unknown</span>
  </div>
  <p style="margin-top:22px;font-size:14.5px;color:var(--ink-2)">Open any failure mode's full entry from <a href="/">the matrix</a> or the <a href="/core">core set</a>. If you have not assessed yet, the <a href="/assess">self-assessment</a> will populate a starting view faster than working through ${ALL.length} cells by hand.</p>
</div></section>

<script>
var KEY='agfm.coverage.v1';
var STATES=['unknown','present','addressed','notpresent'];
var LABELS={unknown:'Unknown',present:'Present',addressed:'Addressed',notpresent:'Not applicable'};
var state={};

function load(){
  try{ var raw=localStorage.getItem(KEY); if(raw) state=JSON.parse(raw)||{}; }catch(e){ state={}; }
}
function save(){
  try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){}
}
function paint(){
  document.querySelectorAll('.covcell').forEach(function(c){
    var s=state[c.dataset.id]||'unknown';
    c.dataset.state=s;
    c.querySelector('.cvstate').textContent=LABELS[s];
    c.setAttribute('aria-label',c.dataset.id+' — '+LABELS[s]);
  });
  var counts={unknown:0,present:0,addressed:0,notpresent:0};
  document.querySelectorAll('.covcell').forEach(function(c){counts[c.dataset.state]++;});
  document.getElementById('covsummary').textContent=
    counts.present+' present · '+counts.addressed+' addressed · '+counts.notpresent+' n/a · '+counts.unknown+' unknown';
  document.querySelectorAll('.col').forEach(function(col){
    var el=col.querySelector('[data-stagecount]'); if(!el) return;
    var cells=col.querySelectorAll('.covcell');
    var p=0,a=0;
    cells.forEach(function(c){ if(c.dataset.state==='present')p++; if(c.dataset.state==='addressed')a++; });
    el.textContent=p+' present · '+a+' addressed';
  });
}
document.getElementById('covgrid').addEventListener('click',function(e){
  var c=e.target.closest('.covcell'); if(!c) return;
  var cur=state[c.dataset.id]||'unknown';
  state[c.dataset.id]=STATES[(STATES.indexOf(cur)+1)%STATES.length];
  save(); paint();
});
document.getElementById('resetBtn').addEventListener('click',function(){
  if(!confirm('Clear the whole coverage map? Export first if you want to keep it.')) return;
  state={}; save(); paint();
});
document.getElementById('printBtn').addEventListener('click',function(){window.print();});
document.getElementById('exportBtn').addEventListener('click',function(){
  var payload={framework:'AGFM',version:'${META.version}',type:'coverage-map',
    generated:new Date().toISOString(),coverage:state};
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='agfm-coverage-'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); URL.revokeObjectURL(a.href);
});
document.getElementById('importFile').addEventListener('change',function(e){
  var f=e.target.files[0]; if(!f) return;
  var r=new FileReader();
  r.onload=function(){
    try{
      var d=JSON.parse(r.result);
      var inc=d.coverage||d;
      if(typeof inc!=='object') throw new Error('bad shape');
      state=inc; save(); paint();
    }catch(err){ alert('That file could not be read as an AGFM coverage export.'); }
  };
  r.readAsText(f);
  e.target.value='';
});
load(); paint();
</script>`,
}));

/* =================== CROSSWALK =================== */
const mapRows = [];
ALL.forEach((m) => m.mapping.forEach((r) => mapRows.push({ ...r, id: m.id, name: m.name, stage: m.stageId })));
const frameworks = [...new Set(mapRows.map((r) => r.framework))].sort();

write('crosswalk.html', layout({
  title: 'Regulatory crosswalk — AGFM',
  desc: `All ${MAPPING_COUNT} AGFM regulatory mappings, each naming the instrument, the provision, the role the obligation falls on, and whether it is currently in force.`,
  current: '/crosswalk',
  body: `<header class="masthead"><div class="wrap">
  <span class="eyebrow">${MAPPING_COUNT} mappings · current to ${META.mappingsCurrentTo}</span>
  <h1>Regulatory crosswalk</h1>
  <p class="deck">The most useful and the fastest-decaying part of this catalog. It is therefore governed by explicit conventions rather than presented as settled fact.</p>
</div></header>

<section style="padding-top:36px"><div class="wrap">
  <div class="callout">
    <p style="margin-bottom:0">This is usually the fastest way into the catalog: skip the taxonomy, find the provision you're actually worried about, and see which failure mode it maps to and who it applies to. Knowing precisely which obligation is yours — and which is a provider's, not a deployer's — is what lets you stop over-applying caution everywhere and move fast on the parts that were never actually in question. See <a href="/automate">where to automate</a> for the other half of that argument.</p>
  </div>
</div></section>

<section><div class="wrap">
  <div class="sechead"><span class="secnum">01</span><h2>How to read a mapping</h2></div>
  <p>Every mapping carries three things beyond the citation itself.</p>
  <div class="tablewrap"><table>
    <thead><tr><th style="min-width:120px">Element</th><th>What it tells you</th><th style="min-width:180px">Values</th></tr></thead>
    <tbody>
      <tr><td><b>Role scope</b></td><td><b>Who the obligation actually falls on.</b> This matters more than any other element and is the most common source of error in published crosswalks. Most organizations using AGFM are <em>deployers</em> — they buy and operate AI systems. A large share of EU AI Act obligations fall on <em>providers</em>, who develop a system and place it on the market. Citing a provider obligation to a deployer produces a compliance plan for a duty they do not hold, while missing the one they do.</td><td class="mono">Provider · Deployer · Organization · Banking organization · Regulated organization · Employer</td></tr>
      <tr><td><b>Status</b></td><td>Whether the obligation is currently enforceable, scheduled for a future date, or a voluntary standard. A deferred obligation is not an absent one, but it is a different planning problem.</td><td class="mono">In force · Future date · Voluntary</td></tr>
      <tr><td><b>Precision</b></td><td>EU AI Act provisions are cited at article and, where verified, paragraph level. ISO/IEC 42001 at clause and Annex A control level. NIST AI RMF at function and category level.</td><td class="mono">See note below</td></tr>
    </tbody>
  </table></div>
  <div class="callout">
    <h4 style="margin-top:0">On NIST subcategory precision</h4>
    <p style="margin-bottom:0">NIST AI RMF 1.0 contains 72 subcategories across 19 categories and 4 functions. AGFM maps at <b>function and category level</b> — <span class="mono">GOVERN-1</span> rather than <span class="mono">GOVERN-1.5</span>. Subcategory-level mapping is a v1.1 target and will be verified against the NIST AI RMF Playbook before publication. Approximate precision stated honestly is more useful than false precision stated confidently, and a subcategory reference that turns out to be wrong damages the credibility of every other mapping alongside it.</p>
  </div>
</div></section>

<hr class="rule">

<section><div class="wrap">
  <div class="sechead"><span class="secnum">02</span><h2>All mappings</h2></div>
  <div class="controls">
    <label class="skip" for="cwsearch">Search mappings</label>
    <input class="search" id="cwsearch" type="search" placeholder="Search provisions, entries…">
    <select class="search" id="cwfw"><option value="">All instruments</option>${frameworks.map((f) => `<option>${esc(f)}</option>`).join('')}</select>
    <select class="search" id="cwrole"><option value="">All roles</option><option>Deployer</option><option>Provider</option><option>Organization</option><option>Banking organization</option><option>Regulated organization</option></select>
    <select class="search" id="cwstatus"><option value="">All statuses</option><option value="live">In force</option><option value="future">Future date</option><option value="stayed">Voluntary</option></select>
    <button class="btn ghost" id="cwreset">Reset</button>
  </div>
  <p class="mono" style="font-size:11.5px;color:var(--ink-3)" id="cwcount"></p>
  <div class="tablewrap"><table id="cwtable">
    <thead><tr>
      <th style="min-width:90px">Entry</th><th style="min-width:120px">Instrument</th>
      <th>Provision</th><th style="min-width:110px">Falls on</th><th style="min-width:90px">Status</th>
    </tr></thead>
    <tbody>
    ${mapRows.map((r) => `<tr data-fw="${esc(r.framework)}" data-role="${esc(r.role)}" data-status="${r.status}" data-q="${esc((r.id + ' ' + r.name + ' ' + r.framework + ' ' + r.provision).toLowerCase())}">
      <td class="mono nowrap"><a href="/entries/${r.id}">${r.id}</a></td>
      <td class="mono">${esc(r.framework)}</td>
      <td>${esc(r.provision)}</td>
      <td class="mono">${esc(r.role)}</td>
      <td><span class="map-status ${r.status}">${STATUSLABEL[r.status]}</span></td>
    </tr>`).join('\n')}
    </tbody>
  </table></div>
  <p style="font-size:14px;color:var(--ink-3)">Also available as <a href="/data/mappings.csv">mappings.csv</a> — one row per mapping, for spreadsheet work.</p>
  <div class="callout">
    <p style="margin-bottom:0"><b>Mappings are research aids, not legal advice.</b> AGFM identifies which provisions a failure mode plausibly implicates. It does not interpret those provisions, determine applicability to any particular organization, or establish compliance. Consult qualified counsel for any of those questions.</p>
  </div>
</div></section>

<hr class="rule">

<section><div class="wrap">
  <div class="sechead"><span class="secnum">03</span><h2>Corrections</h2></div>
  <p>Published crosswalks propagate errors. AGFM records its own so that anyone who built on an earlier version can correct it. These were published in v0.1 and v0.2 and corrected in v0.3.</p>
  <ul>
    <li><b>EU AI Act post-market monitoring is Article 72, not Article 61.</b> Serious incident reporting is Article 73. Article 61 concerns informed consent for testing in real-world conditions. Affected: <span class="mono">AGF-F031</span>, <span class="mono">AGF-F080</span>, <span class="mono">AGF-F100</span>.</li>
    <li><b>NIST AI RMF structure was misstated.</b> Earlier versions described "GOVERN 6 categories / 19 subcategories". The correct structure is 4 functions, 19 categories, 72 subcategories.</li>
    <li><b>Colorado mappings were materially wrong.</b> Earlier versions cited Colorado for anti-discrimination duties. SB 26-189 removed the algorithmic-discrimination duty and the impact-assessment mandate when it repealed SB 24-205 — which itself never took effect. Colorado now maps to notice, explanation, human review and correction rights. Bias-audit mappings anchor on NYC Local Law 144.</li>
    <li><b>SR 26-2 supersedes SR 21-8 as well as SR 11-7</b>, and its generative and agentic carve-out sits at footnote 3 to § II.</li>
    <li><b>Role scoping was absent entirely</b> before v0.3. This was the largest structural defect in earlier versions.</li>
  </ul>
  <p><a href="/changelog">Full changelog →</a></p>
</div></section>

<script>
(function(){
  var rows=[].slice.call(document.querySelectorAll('#cwtable tbody tr'));
  var s=document.getElementById('cwsearch'),fw=document.getElementById('cwfw'),
      role=document.getElementById('cwrole'),st=document.getElementById('cwstatus'),
      count=document.getElementById('cwcount');
  function apply(){
    var q=s.value.toLowerCase(),n=0;
    rows.forEach(function(r){
      var ok=true;
      if(q && r.dataset.q.indexOf(q)===-1) ok=false;
      if(fw.value && r.dataset.fw!==fw.value) ok=false;
      if(role.value && r.dataset.role.indexOf(role.value)===-1) ok=false;
      if(st.value && r.dataset.status!==st.value) ok=false;
      r.style.display=ok?'':'none';
      if(ok) n++;
    });
    count.textContent='Showing '+n+' of '+rows.length+' mappings';
  }
  [s,fw,role,st].forEach(function(el){el.addEventListener('input',apply);});
  document.getElementById('cwreset').addEventListener('click',function(){
    s.value='';fw.value='';role.value='';st.value='';apply();
  });
  apply();
})();
</script>`,
}));

/* =================== WHERE TO AUTOMATE =================== */
const byTier = { systematic: [], partial: [], judgment: [] };
TAGGED.forEach((m) => byTier[m.automationPotential].push(m));

function tierSection(slug) {
  const t = TIERS.tiers.find((x) => x.slug === slug);
  const items = byTier[slug];
  return `<div class="tierhead ${slug}">
    <h2>${esc(t.label)} <span class="mono" style="font-size:13px;color:var(--ink-3);font-weight:400">— ${items.length} of ${TAGGED.length}</span></h2>
    <p class="tdef">${esc(t.definition)}</p>
  </div>
  <div class="tierlist">
  ${items.map((m) => `<a class="tieritem" href="/entries/${m.id}">
    <span class="tid">${m.id} · ${m.severity} · ${m.stageId}</span>
    <span class="tname">${esc(m.name)}</span>
    <span class="tnote">${esc(m.automationNote)}</span>
  </a>`).join('\n')}
  </div>`;
}

write('automate.html', layout({
  title: 'Where to automate, where to slow down — AGFM',
  desc: 'Every complete AGFM failure mode is tagged systematic, partial, or judgment-required — a precise answer to which governance controls can be built away and which are meant to stay a human decision.',
  current: '/automate',
  body: `<header class="masthead"><div class="wrap">
  <span class="eyebrow">Speed and rigor, named separately</span>
  <h1>Where to automate, where to slow down</h1>
  <p class="deck">${esc(TIERS.intro)}</p>
</div></header>

<section style="padding-top:36px"><div class="wrap">
  <div class="callout">
    <p style="margin-bottom:0"><b>The pattern behind this page:</b> uniform, heavyweight review applied to every AI request — regardless of actual risk — is what causes intake bypass and unsanctioned use, not what prevents it. Reviewer time spent on low-risk items is time not spent on the ones that need it, and the delay pushes people around the process rather than through it. See <a href="/patterns">"Friction causes evasion"</a> for the full argument. The fix isn't less rigor. It's being precise about which parts of rigor are mechanical and which parts are a decision — so the mechanical parts stop taking up a person's time, and the decisions get one.</p>
  </div>

  <div class="statgrid" style="margin-top:34px">
    <div><dt>Systematic</dt><dd>${byTier.systematic.length} failure modes</dd></div>
    <div><dt>Partial</dt><dd>${byTier.partial.length} failure modes</dd></div>
    <div><dt>Judgment-required</dt><dd>${byTier.judgment.length} failure modes</dd></div>
    <div><dt>Tagged of complete</dt><dd>${TAGGED.length} of ${FULL.length}</dd></div>
    <div><dt>Untagged</dt><dd>${OPEN.length} open entries</dd></div>
  </div>

  ${tierSection('systematic')}
  ${tierSection('partial')}
  ${tierSection('judgment')}

  <div class="callout" style="margin-top:40px">
    <p style="margin-bottom:0"><b>Only complete entries are tagged.</b> The ${OPEN.length} entries in the <a href="/backlog">backlog</a> don't yet carry an automation-potential tag, for the same reason they don't yet carry a regulatory mapping — tagging a failure mode you haven't fully specified would be a guess dressed as an answer. As entries move from open to complete, they get tagged here too.</p>
  </div>
  <p style="margin-top:26px"><a href="/assess">Take the self-assessment</a> to see which of these apply to your programme, ranked by severity and tagged with the same tier. <a href="/crosswalk">See the regulatory crosswalk</a> for what each one is actually required by.</p>
</div></section>`,
}));

/* =================== STARTER SETS =================== */
write('sectors.html', layout({
  title: 'Starter sets — AGFM',
  desc: 'Curated entry points into the AGFM catalog: the first ten failure modes to look at, plus sector-specific sets for banking, biopharma, insurance and manufacturing.',
  current: '/sectors',
  body: `<header class="masthead"><div class="wrap">
  <span class="eyebrow">Curated entry points</span>
  <h1>Starter sets</h1>
  <p class="deck">${ALL.length} failure modes is a lot to meet at once. These are curated subsets — same catalog, smaller doors. Each one is a view, not a separate framework.</p>
</div></header>
<section><div class="wrap">
  <div class="cards">
  ${STARTERS.map((s) => `<div class="card"><a class="cardlink" href="/sectors/${s.slug}">
    <span class="ck">${s.modes.length} failure modes</span>
    <h3>${esc(s.title)}</h3>
    <p>${esc(s.blurb)}</p>
  </a></div>`).join('')}
  </div>
  <div class="callout" style="margin-top:34px">
    <p style="margin-bottom:0">Sector sets are editorial judgements about where attention is usually best spent first, not claims about what any particular organization must address. A failure mode absent from your sector's set may still be your most urgent problem — the <a href="/assess">self-assessment</a> is a better guide to that than any curated list.</p>
  </div>
</div></section>`,
}));

STARTERS.forEach((s) => {
  const modes = s.modes.map((id) => BY_ID[id]).filter(Boolean);
  const byStage = {};
  modes.forEach((m) => { (byStage[m.stageId] = byStage[m.stageId] || []).push(m); });
  write(`sectors/${s.slug}.html`, layout({
    title: `${s.title} — AGFM starter set`,
    desc: s.blurb.slice(0, 180),
    current: '/sectors',
    body: `<header class="masthead"><div class="wrap">
  <div class="crumb"><a href="/sectors">Starter sets</a> / ${esc(s.title)}</div>
  <span class="eyebrow">${modes.length} failure modes</span>
  <h1 style="font-size:clamp(30px,4.6vw,52px)">${esc(s.title)}</h1>
  <p class="deck">${esc(s.blurb)}</p>
</div></header>
<section><div class="wrap">
  <div class="controls">
    <button class="chip accent" data-filter="plain" aria-pressed="false">Plain language</button>
    <button class="chip" data-filter="Critical" aria-pressed="false">Critical</button>
    <button class="chip ghost" data-filter="reset" aria-pressed="false" style="margin-left:auto">Reset</button>
  </div>
  <div class="matrix-scroll"><div class="matrix" id="matrix">
  ${STAGES.filter((st) => byStage[st.id]).map((st) => `<div class="col">
    <div class="colhead"><span class="cid">${st.id}</span><span class="cname">${esc(st.name)}</span><span class="ccount">${byStage[st.id].length} in this set</span></div>
    ${byStage[st.id].map((m) => cellHtml(m)).join('\n')}
  </div>`).join('')}
  </div></div>
  <p class="emptymsg" id="emptymsg" hidden>No entries match those filters.</p>
  <p style="margin-top:26px"><a href="/">See all ${ALL.length} failure modes →</a> · <a href="/assess">Take the self-assessment →</a></p>
</div></section>
<script>${FILTER_JS}</script>`,
  }));
});

/* =================== PATTERNS =================== */
const P = (id) => `<a class="mono" href="/entries/${id}">${id}</a>`;
write('patterns.html', layout({
  title: 'Cross-cutting patterns — AGFM',
  desc: 'Five relationships between AGFM failure modes that explain why fixing governance problems one at a time usually underperforms.',
  current: '/patterns',
  body: `<header class="masthead"><div class="wrap narrow">
  <span class="eyebrow">How the failure modes relate</span>
  <h1>Cross-cutting patterns</h1>
  <p class="deck">Individual failure modes are useful. The relationships between them are more useful, because they explain why fixing one thing in isolation usually fails.</p>
</div></header>
<section><div class="wrap narrow">
  <h3>1. Friction causes evasion</h3>
  <p>The most reliable cause of ungoverned AI is governance that is too slow to use. When every request receives the same heavyweight review regardless of risk ${P('AGF-F027')}, when no turnaround commitment exists ${P('AGF-F037')}, and when the same question is re-litigated from scratch every time ${P('AGF-F038')}, teams stop submitting. The observable result is intake bypass ${P('AGF-F010')} and unsanctioned use ${P('AGF-F011')} — almost always treated as discipline problems when they are throughput problems. <b>Enforcement without a fast path makes the measured problem worse while making the real problem invisible.</b></p>

  <h3>2. Reviews without remediation are theatre</h3>
  <p>A review that produces findings nobody tracks ${P('AGF-F100')}, with no owner or due date ${P('AGF-F101')}, no escalation when they age ${P('AGF-F102')}, no evidence required to close ${P('AGF-F103')}, and no independent party confirming closure ${P('AGF-F108')}, generates the appearance of governance and none of the effect. Organizations in this state often have excellent review documentation and no record of anything having been fixed. This is the most common gap between programmes that look mature and programmes that are.</p>

  <h3>3. Gate order determines whether gates work</h3>
  <p>When a review stage requires artifacts that a later stage produces ${P('AGF-F039')}, every item routes through it, fails, and returns — permanently and structurally, and visibly to everyone involved. Teams normalize the loop rather than reordering the gates. The symptom presents as slowness; the cause is sequencing, and no amount of additional resourcing fixes it.</p>

  <h3>4. Approvals are states, not events</h3>
  <p>Treating approval as a one-time decision rather than a time-boxed state produces stale approvals ${P('AGF-F031')}, silent scope expansion ${P('AGF-F032')}, unverified conditions ${P('AGF-F033')}, and systems running on authority granted against a model that no longer exists ${P('AGF-F071')}. All are invisible in a register that records only that approval occurred.</p>

  <h3>5. Governance records are themselves a system that can fail</h3>
  <p>The catalog's audit stage covers a category most organizations never anticipate: the governance record is an asset with its own integrity risk. Reorganizations rewrite historical attribution ${P('AGF-F096')}. Rigid data models cannot record what actually happened ${P('AGF-F097')}. Corrections must be made by hand across hundreds of records ${P('AGF-F098')}. Configuration differs between environments so records quietly lose fields ${P('AGF-F075')}. An organization can operate every control correctly and still be unable to demonstrate it, because the evidence layer degraded underneath.</p>

  <div class="callout">
    <p style="margin-bottom:0"><b>Practical implication.</b> A remediation plan that addresses failure modes one at a time, in identifier order, will underperform. The patterns above are the intended unit of work: fix the throughput problem before enforcing the bypass problem, build the remediation loop before adding review depth, and reorder gates before adding reviewers.</p>
  </div>
  <p><a href="/assess">Take the self-assessment →</a></p>
</div></section>`,
}));

/* =================== ABOUT =================== */
write('about.html', layout({
  title: 'About AGFM — scope, structure, stewardship',
  desc: 'What the AI Governance Failure Mode framework is and is not, how it relates to MITRE ATLAS, OWASP and NIST, how it is structured, who stewards it, and how to cite it.',
  current: '/about',
  body: `<header class="masthead"><div class="wrap narrow">
  <span class="eyebrow">Scope · structure · stewardship</span>
  <h1>About AGFM</h1>
  <p class="deck">An open, community-maintained catalog of the ways enterprise AI governance processes fail. ${STAGES.length} lifecycle stages, ${ALL.length} failure modes, ${MAPPING_COUNT} role-scoped regulatory mappings.</p>
</div></header>

<section><div class="wrap">
  <div class="sechead"><span class="secnum">01</span><h2>What it is, and is not</h2></div>
  <ul>
    <li><b>A shared vocabulary.</b> <span class="mono">AGF-F040</span> is something a risk officer can put in a finding, a ticket, or an audit response. "The human oversight problem" is not.</li>
    <li><b>A detection aid.</b> Every complete entry leads with observable indicators, so a team can determine whether a failure mode is present without hiring anyone to tell them.</li>
    <li><b>A crosswalk that states its own limits.</b> Every mapping names who the obligation falls on, when it applies, and how precisely it has been verified.</li>
  </ul>
  <p>It is <b>not</b> a maturity score — there is no AGFM rating or grade. Not a certification. Not software. Not legal advice. And not a blame framework: almost every failure catalogued here is the predictable output of a reasonable process under load, not of anyone behaving badly.</p>
</div></section>

<hr class="rule">

<section><div class="wrap">
  <div class="sechead"><span class="secnum">02</span><h2>How it relates to existing frameworks</h2></div>
  <p>AGFM is deliberately complementary. It occupies the layer none of the established frameworks address: organizational and process failure, with no attacker present.</p>
  <div class="tablewrap"><table>
    <thead><tr><th style="min-width:180px">Framework</th><th>What it catalogs</th><th style="min-width:120px">Structure</th><th style="min-width:110px">Process failure?</th></tr></thead>
    <tbody>
      <tr><td><b>MITRE ATT&amp;CK</b><br><span class="mono" style="font-size:11px;color:var(--ink-3)">Enterprise v18, Oct 2025</span></td><td>Adversary behaviour in cyber intrusions. The structural model AGFM borrows from.</td><td class="mono">14 tactics · 216 techniques</td><td class="no">Out of scope</td></tr>
      <tr><td><b>MITRE ATLAS</b><br><span class="mono" style="font-size:11px;color:var(--ink-3)">v5.4.0, Feb 2026</span></td><td>Adversarial attacks on AI — poisoning, evasion, prompt injection, model extraction.</td><td class="mono">~16 tactics · 80+ techniques</td><td class="no">Adversarial only</td></tr>
      <tr><td><b>OWASP Top 10 for LLM</b><br><span class="mono" style="font-size:11px;color:var(--ink-3)">2025</span></td><td>Application vulnerabilities — prompt injection, sensitive-information disclosure, excessive agency.</td><td class="mono">Ranked top-10</td><td class="no">Developer-facing</td></tr>
      <tr><td><b>NIST AI RMF 1.0</b><br><span class="mono" style="font-size:11px;color:var(--ink-3)">AI 100-1, Jan 2023</span></td><td>Prescribed governance outcomes. Voluntary, non-certifiable.</td><td class="mono">4 functions · 19 categories · 72 subcategories</td><td class="no">Prescribes good practice</td></tr>
      <tr><td><b>ISO/IEC 42001:2023</b></td><td>Certifiable management-system requirements, including an AI impact assessment with no ISO 27001 equivalent.</td><td class="mono">Clauses 4–10 · 38 Annex A controls</td><td class="no">Requirements, not failures</td></tr>
      <tr><td><b>AI Incident Database</b></td><td>Real-world AI incidents and harms after the fact.</td><td class="mono">Incident records</td><td class="no">Outcomes, not causes</td></tr>
      <tr style="background:var(--indigo-tint)"><td><b>AGFM</b></td><td><b>Governance-process failure modes</b> — how the machinery for governing AI breaks down.</td><td class="mono">${STAGES.length} stages · ${ALL.length} modes</td><td class="yes">This is the scope</td></tr>
    </tbody>
  </table></div>
  <div class="callout"><p style="margin-bottom:0">Existing frameworks answer <em>"how does the model fail?"</em> and <em>"how does the attacker get in?"</em> AGFM answers <em>"how did this reach production without anyone approving it, and why can't we demonstrate otherwise?"</em></p></div>
</div></section>

<hr class="rule">

<section><div class="wrap">
  <div class="sechead"><span class="secnum">03</span><h2>Automation potential</h2></div>
  <p>Every complete entry is tagged with one of three tiers, answering a question the catalog gets asked constantly: is fixing this about slowing down, or is it about building something once? ${esc(TIERS.tiers.map((t) => `<b>${t.label}</b> — ${t.short.toLowerCase()}`).join('; '))}.</p>
  <p>The distinction matters because organizations under pressure to move fast tend to read any governance catalog as an argument for more caution. Most of what's in this catalog isn't that. A structural gate, once built, removes the need for anyone to slow down and check — it's an engineering fix, not a policy of caution. The minority tagged judgment-required are the ones where the catalog is making a different argument: not that things should move slower everywhere, but that this specific decision should stay a person's to make. See the full breakdown on <a href="/automate">where to automate</a>.</p>
</div></section>

<hr class="rule">

<section><div class="wrap">
  <div class="sechead"><span class="secnum">04</span><h2>Structure and identifiers</h2></div>
  <div class="tablewrap"><table>
    <thead><tr><th>Level</th><th>AGFM element</th><th>ATT&amp;CK equivalent</th><th class="mono">Format</th></tr></thead>
    <tbody>
      <tr><td class="mono">1</td><td>Governance lifecycle stage</td><td>Tactic</td><td class="mono">AGF-TAxx</td></tr>
      <tr><td class="mono">2</td><td>Failure mode</td><td>Technique</td><td class="mono">AGF-Fxxx</td></tr>
      <tr><td class="mono">3</td><td>Failure variant</td><td>Sub-technique</td><td class="mono">AGF-Fxxx.xx</td></tr>
    </tbody>
  </table></div>
  <p><b>Identifiers are permanent.</b> Once assigned, an <span class="mono">AGF-F</span> number is never reused and never renumbered, even if the failure mode is later deprecated or merged. Deprecated entries remain published with a pointer to their successor, so citations in audit records and tooling do not break.</p>
  <h3>Why lifecycle stages organize the matrix</h3>
  <p>Regulation was rejected as the organizing axis because it moves too quickly. In the eighteen months to September 2026 alone: Colorado repealed its own AI Act before it took effect, the EU deferred its high-risk regime by sixteen months while leaving transparency duties in force, and US banking's model risk guidance was superseded after fifteen years. Roles were rejected because ownership of AI governance differs wildly between a regional bank, a cell-therapy manufacturer, and an industrial processor. The governance lifecycle is the stable axis; regulatory mappings live as fields on each entry, versioned independently.</p>
  <div class="tablewrap"><table>
    <thead><tr><th class="mono" style="min-width:90px">Stage</th><th>Name</th><th style="min-width:150px">Failure modes</th></tr></thead>
    <tbody>${STAGES.map((s) => {
      const f = s.failureModes.filter((m) => m.entryStatus === 'full').length;
      return `<tr><td class="mono">${s.id}</td><td>${esc(s.name)}</td><td class="mono">${s.failureModes.length} · ${f} complete</td></tr>`;
    }).join('')}</tbody>
  </table></div>
</div></section>

<hr class="rule">

<section><div class="wrap">
  <div class="sechead"><span class="secnum">05</span><h2>Stewardship and licensing</h2></div>
  <div class="tablewrap"><table>
    <thead><tr><th style="min-width:150px">Element</th><th>Position</th></tr></thead>
    <tbody>
      <tr><td><b>Steward</b></td><td>${esc(META.steward)}, an independent initiative maintaining the catalog, the editorial standard, and the release cadence.</td></tr>
      <tr><td><b>Content licence</b></td><td><b>CC BY 4.0.</b> Reuse, adapt and redistribute freely, including commercially, with attribution. Vendors and consultancies may build on this without permission.</td></tr>
      <tr><td><b>Tooling licence</b></td><td><b>Apache 2.0</b> for the schema, dataset converters, site generator and viewer.</td></tr>
      <tr><td><b>Advisory board</b></td><td>Practitioners recruited by role — model risk, computer systems validation and quality, actuarial and insurance risk, industrial AI programmes, academic research, former regulatory supervision, external audit, incident-reporting and standards work, ethics and civil society.</td></tr>
      <tr><td><b>Vendor neutrality</b></td><td>No entry names, recommends or excludes a commercial product. Mitigations are described as capabilities and controls, never as tools. Enforced editorially and applied to sponsors on identical terms.</td></tr>
      <tr><td><b>Sustainability</b></td><td>Designed to outlive any single sponsor. The stewardship model provides for transfer to an independent foundation or established standards body, and the permissive licence ensures the catalog remains usable regardless.</td></tr>
    </tbody>
  </table></div>
  <div class="callout">
    <h4 style="margin-top:0">Sponsorship disclosure</h4>
    <p style="margin-bottom:0">AGFM was founded and is currently underwritten by AlignAI, which provides secretariat support. AlignAI holds a minority voice on the advisory board and receives no editorial privilege. Sponsorship does not confer influence over which failure modes are catalogued or how mitigations are described, and no AGFM entry references any commercial product, including the sponsor's. We disclose this openly because a catalog of governance failures is worth exactly as much as its independence.</p>
  </div>
</div></section>

<hr class="rule">

<section><div class="wrap">
  <div class="sechead"><span class="secnum">06</span><h2>Citing AGFM</h2></div>
  <div class="cite">
    <b style="color:var(--ink)">Entry</b><br>
    ${esc(META.framework)}, AGF-F040 "Missing human-in-the-loop trigger", v${META.version} (2026).<br><br>
    <b style="color:var(--ink)">Framework</b><br>
    ${esc(META.framework)} (AGFM), v${META.version}. Licensed CC BY 4.0.<br><br>
    <b style="color:var(--ink)">In tooling</b><br>
    Reference the identifier alone — <span style="color:var(--indigo)">AGF-F040</span> — with the framework version recorded once at the tool or report level.
  </div>
  <div class="callout warn" style="margin-top:22px">
    <p style="margin-bottom:0"><b>Always record the version with any mapping.</b> Four of the instruments cited here changed materially in the eighteen months to September 2026. A mapping quoted without its framework version cannot be checked against the instrument as it stood at the time.</p>
  </div>
  <h3>Machine-readable</h3>
  <p><a href="/data/agfm.json">agfm.json</a> · <a href="/data/agfm.flat.json">agfm.flat.json</a> · <a href="/data/agfm.csv">agfm.csv</a> · <a href="/data/mappings.csv">mappings.csv</a> · <a href="/schema/agfm.schema.json">JSON Schema</a></p>
</div></section>`,
}));

/* =================== PRIMER (print) =================== */
write('primer.html', layout({
  title: 'AGFM primer — two pages',
  desc: 'A two-page introduction to the AI Governance Failure Mode framework, formatted for printing or saving as PDF.',
  current: '/about',
  body: `<div class="wrap narrow">
<section style="padding-top:40px">
  <p class="eyebrow">AGFM v${META.version} · ${META.mappingsCurrentTo} · CC BY 4.0</p>
  <h1 style="font-size:clamp(30px,4.6vw,50px)">The AI Governance<br>Failure Mode framework</h1>
  <p class="deck">An open catalog of ${ALL.length} ways enterprise AI governance processes fail — and what to do about each one.</p>
  <p style="margin-top:20px"><button class="btn" onclick="window.print()">Print or save as PDF</button></p>

  <h3>The problem it solves</h3>
  <p>Organizations adopting AI in regulated industries have frameworks telling them what good looks like — NIST AI RMF prescribes outcomes, ISO/IEC 42001 sets certifiable requirements, MITRE ATLAS catalogs attacks, OWASP catalogs application vulnerabilities. None of them catalogs what actually goes wrong in the governance process itself.</p>
  <p>That gap matters because the failures are consistent and recognizable: a use case reaches production without approval; a human review exists in policy but not in the system; an approval is never revisited after the vendor swaps the model; a review produces eleven findings that live in a spreadsheet nobody reads. These are not model failures or security failures. They are process failures, and until now there has been no shared name for any of them.</p>

  <h3>What AGFM provides</h3>
  <ul>
    <li><b>A shared vocabulary.</b> ${ALL.length} failure modes with permanent identifiers, across ${STAGES.length} governance lifecycle stages. <span class="mono">AGF-F040</span> is citable in a finding, a ticket, or an audit response.</li>
    <li><b>Plain-language examples.</b> Every entry opens with one concrete situation, no acronyms — so the risk manager who just inherited AI governance can use it on day one.</li>
    <li><b>Detection signals.</b> Complete entries lead with observable indicators, so a team can determine what is present without engaging anyone.</li>
    <li><b>${MAPPING_COUNT} role-scoped regulatory mappings.</b> Each names the instrument, the provision, <em>who the obligation falls on</em>, and whether it is in force. Role scope is the element most published crosswalks omit and the one most likely to send an organization down the wrong path.</li>
    <li><b>Automation-potential tags.</b> Every complete entry is marked systematic, partial, or judgment-required — a direct answer to which failures can be engineered away and which are meant to stay a human decision.</li>
    <li><b>A self-assessment.</b> ${A.questions.length} questions, fifteen minutes, entirely in the browser — nothing transmitted or stored.</li>
  </ul>

  <h3>The five patterns that matter most</h3>
  <ol>
    <li><b>Friction causes evasion.</b> Slow, undifferentiated review is the most reliable cause of ungoverned AI. Enforcement without a fast path makes the measured problem worse while hiding the real one.</li>
    <li><b>Reviews without remediation are theatre.</b> Findings with no owner, no escalation, and no evidence at closure produce the appearance of governance and none of the effect.</li>
    <li><b>Gate order determines whether gates work.</b> A stage requiring artifacts a later stage produces creates a permanent loop no amount of resourcing fixes.</li>
    <li><b>Approvals are states, not events.</b> One-time approval produces stale authority, silent scope creep, and unverified conditions.</li>
    <li><b>Governance records are a system that can fail.</b> Reorganizations rewrite attribution; rigid data models cannot record reality. An organization can do everything right and still be unable to demonstrate it.</li>
  </ol>
</section>

<section class="page-break">
  <h3>How it is structured</h3>
  <div class="tablewrap"><table>
    <thead><tr><th class="mono">Stage</th><th>Name</th><th class="mono">Modes</th></tr></thead>
    <tbody>${STAGES.map((s) => `<tr><td class="mono">${s.id}</td><td>${esc(s.name)}</td><td class="mono">${s.failureModes.length}</td></tr>`).join('')}</tbody>
  </table></div>

  <h3>Ten failure modes to look at first</h3>
  <div class="tablewrap"><table>
    <thead><tr><th class="mono" style="min-width:80px">ID</th><th style="min-width:160px">Failure mode</th><th>In plain terms</th></tr></thead>
    <tbody>${STARTERS[0].modes.map((id) => {
      const m = BY_ID[id];
      return `<tr><td class="mono">${m.id}</td><td>${esc(m.name)}</td><td>${esc(m.plainTerms)}</td></tr>`;
    }).join('')}</tbody>
  </table></div>

  <h3>How to use it</h3>
  <ol>
    <li><b>Take the self-assessment</b> — ${A.questions.length} questions, about fifteen minutes. Produces a list of failure modes likely present, ranked by severity.</li>
    <li><b>Work the patterns, not the list.</b> Addressing failure modes in identifier order underperforms. Fix throughput before enforcing bypass; build the remediation loop before adding review depth.</li>
    <li><b>Use the coverage map</b> to record what is present, addressed, and not applicable. Export it; re-import it next quarter and compare.</li>
    <li><b>Use the crosswalk</b> to answer which obligations attach — checking role scope before building any plan around a provision.</li>
  </ol>

  <h3>Governance of the framework itself</h3>
  <p>Content is licensed <b>CC BY 4.0</b> and tooling <b>Apache 2.0</b>: reuse, adapt and redistribute freely, including commercially. Identifiers are permanent and never reused. Corrections to published mappings are recorded openly rather than edited silently — v0.3 published five of its own errors. Minor versions ship quarterly; material regulatory change triggers an out-of-cycle correction.</p>
  <p>${esc(META.steward)} stewards the catalog. AGFM was founded and is underwritten by AlignAI, which holds a minority voice on the advisory board and receives no editorial privilege. No entry references any commercial product, including the sponsor's.</p>

  <div class="callout">
    <p style="margin-bottom:0"><b>Not legal advice.</b> AGFM identifies which provisions a failure mode plausibly implicates. It does not interpret them, determine applicability, or establish compliance. Regulatory references are accurate as reported at publication and are subject to change.</p>
  </div>

  <p class="mono" style="font-size:11.5px;color:var(--ink-3);margin-top:30px">
    ${esc(META.framework)} · v${META.version} · ${META.mappingsCurrentTo}<br>
    ${STAGES.length} stages · ${ALL.length} failure modes · ${FULL.length} complete entries · ${MAPPING_COUNT} mappings<br>
    Licensed CC BY 4.0 · https://${SITE}/
  </p>
</section>
</div>`,
}));

/* =================== CHANGELOG =================== */
const changelogMd = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
function miniMd(md) {
  return md.split('\n').map((l) => {
    if (/^## /.test(l)) return `<h2 style="margin-top:34px;font-size:24px">${esc(l.slice(3))}</h2>`;
    if (/^### /.test(l)) return `<h3>${esc(l.slice(4))}</h3>`;
    if (/^# /.test(l)) return '';
    if (/^- /.test(l)) return `<li>${inline(l.slice(2))}</li>`;
    if (/^\s+/.test(l) && l.trim()) return ` ${inline(l.trim())}`;
    if (!l.trim()) return '';
    return `<p>${inline(l)}</p>`;
  }).join('\n').replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
}
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<span class="mono">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(AGF-F\d{3})/g, '<a href="/entries/$1">$1</a>');
}
write('changelog.html', layout({
  title: 'Changelog — AGFM',
  desc: 'Version history for the AI Governance Failure Mode framework, including published corrections to previously released regulatory mappings.',
  current: '/about',
  body: `<header class="masthead"><div class="wrap narrow">
  <span class="eyebrow">Version history</span>
  <h1>Changelog</h1>
  <p class="deck">Identifiers are permanent. Corrections to previously published mappings are recorded here explicitly rather than edited silently — a catalog that hides its own errors has no standing to catalog anyone else's.</p>
</div></header>
<section><div class="wrap narrow">
${miniMd(changelogMd.split('\n## ').slice(1).map((s) => `## ${s}`).join('\n'))}
</div></section>`,
}));

/* =================== data, robots, sitemap =================== */
fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
['agfm.json', 'agfm.flat.json', 'agfm.csv', 'mappings.csv', 'catalog.json', 'sets.json'].forEach((f) => {
  const src = path.join(ROOT, 'data', f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, 'data', f));
});
fs.mkdirSync(path.join(OUT, 'schema'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'schema', 'agfm.schema.json'), path.join(OUT, 'schema', 'agfm.schema.json'));
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'assets', 'agfm.css'), path.join(OUT, 'assets', 'agfm.css'));

const urls = ['/', '/core', '/backlog', '/assess', '/coverage', '/crosswalk', '/patterns', '/sectors', '/about', '/primer', '/changelog']
  .concat(STARTERS.map((s) => `/sectors/${s.slug}`))
  .concat(ALL.map((m) => `/entries/${m.id}`));

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>https://${SITE}${u}</loc><lastmod>${META.mappingsCurrentTo}</lastmod><changefreq>monthly</changefreq><priority>${u === '/' ? '1.0' : u.startsWith('/entries/') ? '0.7' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`);

write('robots.txt', `# AGFM is published to be read, indexed, cited and reused under CC BY 4.0.
# That includes AI answer engines. Citation is the point.

User-agent: *
Allow: /

Sitemap: https://${SITE}/sitemap.xml
`);

console.log(`  pages: ${urls.length} (${ALL.length} entry pages)`);
