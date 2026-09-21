#!/usr/bin/env node
/**
 * AGFM site generator.
 *
 * data/catalog.json is the source of truth. Everything else in the published site
 * is generated from it, so the site, the dataset and the exports cannot disagree.
 *
 *   node scripts/build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'site');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));
const sets = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sets.json'), 'utf8'));

const META = catalog.meta;
const STAGES = catalog.stages;
const ALL = STAGES.flatMap((s) => s.failureModes.map((m) => ({ ...m, stageId: s.id, stageName: s.name })));
const BY_ID = Object.fromEntries(ALL.map((m) => [m.id, m]));
const FULL = ALL.filter((m) => m.entryStatus === 'full');
const OPEN = ALL.filter((m) => m.entryStatus === 'open');
const MAPPING_COUNT = ALL.reduce((n, m) => n + m.mapping.length, 0);

const SITE = 'REPLACE-WITH-YOUR-DOMAIN';
const STATUSLABEL = { live: 'In force', future: 'Future date', stayed: 'Voluntary / standard' };

/* ---------------- helpers ---------------- */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sevClass = (s) => (s === 'Critical' ? 'crit' : s === 'High' ? 'high' : 'sev');

const NAV = [
  ['/', 'Matrix'],
  ['/crosswalk', 'Crosswalk'],
  ['/automate', 'Where to automate'],
  ['/assess', 'Self-assessment'],
  ['/coverage', 'Coverage map'],
  ['/core', 'Core set'],
  ['/patterns', 'Patterns'],
  ['/sectors', 'Starter sets'],
  ['/about', 'About'],
];

const TIER_LABEL = { systematic: 'Systematic', partial: 'Partial', judgment: 'Judgment-required' };
const TIER_TAGCLASS = { systematic: 'tier-sys', partial: 'tier-par', judgment: 'tier-jdg' };

function layout({ title, desc, current, body, jsonld, bodyClass = '', extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta name="robots" content="index,follow,max-snippet:-1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..800&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/agfm.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
${extraHead}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><div class="topbar-in">
  <a class="brand" href="/">AGFM · v${META.version}</a>
  <nav aria-label="Main">${NAV.map(([href, label]) =>
    `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
</div></div>
<main id="main">
${body}
</main>
<footer><div class="wrap">
  <div class="footlinks">
    <a href="/">Matrix</a><a href="/core">Core set</a><a href="/backlog">Backlog</a>
    <a href="/assess">Self-assessment</a><a href="/coverage">Coverage map</a>
    <a href="/crosswalk">Crosswalk</a><a href="/patterns">Patterns</a>
    <a href="/sectors">Starter sets</a><a href="/primer">Primer</a>
    <a href="/about">About</a><a href="/changelog">Changelog</a>
    <a href="/data/agfm.json">Data</a>
  </div>
  <p><b>AI Governance Failure Mode framework · v${META.version} · ${META.mappingsCurrentTo}</b> · stewarded by ${esc(META.steward)}</p>
  <p>Content licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Schema and tooling licensed Apache 2.0.</p>
  <p>Regulatory references are accurate as reported at the date of publication and are subject to change. Colorado enforcement is subject to an active federal stay and pending attorney-general rulemaking. NIST AI RMF mappings are stated at function and category level; subcategory-level mapping is a v1.2 target. Automation-potential tags describe the nature of the control, not a recommendation to deploy any specific tool, and remain subject to independent legal and risk judgment. Regulatory mappings are research aids and do not constitute legal advice or establish compliance with any obligation. Plain-language examples are composites written for recognition, not descriptions of any specific organization. AGFM is not affiliated with MITRE, OWASP, NIST, ISO, ISPE, or any regulatory authority.</p>
</div></footer>
</body>
</html>
`;
}

function cellHtml(m, { link = true, showTier = false } = {}) {
  const tags = `<span class="tag ${sevClass(m.severity)}">${m.severity}</span>` +
    (m.entryStatus === 'full' ? '<span class="tag full">Full</span>' : '<span class="tag open">Open</span>') +
    (showTier && m.automationPotential ? `<span class="tag ${TIER_TAGCLASS[m.automationPotential]}">${TIER_LABEL[m.automationPotential]}</span>` : '');
  const inner = `<span class="fid">${m.id}</span><span class="fname">${esc(m.name)}</span>` +
    `<span class="flay">${esc(m.plainTerms)}</span><span class="tagrow">${tags}</span>`;
  const attrs = `class="cell${m.entryStatus === 'full' ? ' hasfull' : ''}" data-sev="${m.severity}" ` +
    `data-full="${m.entryStatus === 'full' ? 1 : 0}" data-id="${m.id}" ` +
    `data-q="${esc((m.id + ' ' + m.name + ' ' + m.plainTerms).toLowerCase())}"`;
  return link ? `<a href="/entries/${m.id}" ${attrs}>${inner}</a>` : `<div ${attrs}>${inner}</div>`;
}

function mappingHtml(mapping) {
  return mapping.map((r) => `<div class="mapitem">
  <div class="map-top">
    <span class="map-fw">${esc(r.framework)}</span>
    <span class="map-role${/deployer/i.test(r.role) ? ' dep' : ''}">${esc(r.role)}</span>
    <span class="map-status ${r.status}">${STATUSLABEL[r.status] || r.status}</span>
  </div>
  <div class="map-prov">${esc(r.provision)}</div>
</div>`).join('');
}

function write(rel, html) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, html);
}

/* ---------------- matrix (home) ---------------- */
const matrixHtml = `<div class="matrix-scroll"><div class="matrix" id="matrix">
${STAGES.map((s) => `<div class="col" data-stage="${s.id}">
  <div class="colhead"><span class="cid">${s.id}</span><span class="cname">${esc(s.name)}</span><span class="ccount">${s.failureModes.length} failure modes</span></div>
  ${s.failureModes.map((m) => cellHtml({ ...m, stageId: s.id })).join('\n  ')}
</div>`).join('\n')}
</div></div>
<p class="emptymsg" id="emptymsg" hidden>No failure modes match those filters.</p>
<div class="legend">
  <span><i class="swatch" style="background:var(--crit)"></i> Critical</span>
  <span><i class="swatch" style="background:var(--high)"></i> High</span>
  <span><i class="swatch" style="background:var(--mod)"></i> Moderate</span>
  <span><span class="tag full">Full</span> complete entry</span>
  <span><span class="tag open">Open</span> enumerated, awaiting contribution</span>
</div>`;

const FILTER_JS = `
(function(){
  var body=document.body, matrix=document.getElementById('matrix');
  if(!matrix) return;
  var params=new URLSearchParams(location.search);
  var state={q:params.get('q')||'',sev:params.get('sev')||'',status:params.get('status')||'',plain:params.get('plain')==='1'};
  var search=document.getElementById('search');
  if(search) search.value=state.q;
  if(state.plain) body.classList.add('plainmode');
  function sync(){
    var p=new URLSearchParams();
    if(state.q) p.set('q',state.q);
    if(state.sev) p.set('sev',state.sev);
    if(state.status) p.set('status',state.status);
    if(state.plain) p.set('plain','1');
    var qs=p.toString();
    history.replaceState(null,'',qs?location.pathname+'?'+qs:location.pathname);
  }
  function apply(){
    var shown=0;
    matrix.querySelectorAll('.cell').forEach(function(c){
      var ok=true;
      if(state.sev && c.dataset.sev!==state.sev) ok=false;
      if(state.status==='full' && c.dataset.full!=='1') ok=false;
      if(state.status==='open' && c.dataset.full!=='0') ok=false;
      if(state.q && c.dataset.q.indexOf(state.q.toLowerCase())===-1) ok=false;
      c.classList.toggle('dim',!ok);
      if(ok) shown++;
    });
    matrix.querySelectorAll('.col').forEach(function(col){
      var any=col.querySelectorAll('.cell:not(.dim)').length;
      col.style.display=any?'':'none';
    });
    var em=document.getElementById('emptymsg');
    if(em) em.hidden=shown>0;
    document.querySelectorAll('[data-filter]').forEach(function(b){
      var f=b.dataset.filter;
      var on=(f==='plain'&&state.plain)||(f===state.sev)||(f===state.status);
      b.setAttribute('aria-pressed',String(!!on));
    });
    sync();
  }
  document.querySelectorAll('[data-filter]').forEach(function(b){
    b.addEventListener('click',function(){
      var f=b.dataset.filter;
      if(f==='reset'){state={q:'',sev:'',status:'',plain:state.plain};if(search)search.value='';}
      else if(f==='plain'){state.plain=!state.plain;body.classList.toggle('plainmode',state.plain);}
      else if(f==='Critical'||f==='High'||f==='Moderate'){state.sev=state.sev===f?'':f;}
      else if(f==='full'||f==='open'){state.status=state.status===f?'':f;}
      apply();
    });
  });
  if(search) search.addEventListener('input',function(){state.q=search.value;apply();});
  apply();
})();`;

write('index.html', layout({
  title: `AGFM — AI Governance Failure Mode framework`,
  desc: `An open catalog of ${ALL.length} ways enterprise AI governance processes fail, each explained in plain language and mapped to the regulations that address it. Not how models get attacked — how governance breaks down.`,
  current: '/',
  jsonld: {
    '@context': 'https://schema.org', '@type': 'DefinedTermSet',
    name: META.framework, alternateName: 'AGFM', version: META.version,
    description: 'An open, community-maintained catalog of the ways enterprise AI governance processes fail.',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    hasDefinedTerm: FULL.slice(0, 40).map((m) => ({
      '@type': 'DefinedTerm', termCode: m.id, name: m.name,
      description: m.plainTerms, url: `https://${SITE}/entries/${m.id}`,
    })),
  },
  body: `<header class="masthead"><div class="wrap">
  <span class="eyebrow">An open catalog · stewarded by ${esc(META.steward)}</span>
  <h1>How AI governance <em>actually fails</em></h1>
  <p class="deck">Existing frameworks catalog attacks on AI systems and vulnerabilities in AI applications. <strong>AGFM catalogs the failures of the governance process itself</strong> — the use case that reached production without approval, the human review that exists in policy but not in the system, the approval nobody revisited after the model changed, the action item that has been open for seven months. Most of that friction isn't necessary. Some of it has to stay. The catalog says which is which.</p>
  <dl class="statgrid">
    <div><dt>Version</dt><dd>v${META.version}</dd></div>
    <div><dt>Lifecycle stages</dt><dd>${STAGES.length}</dd></div>
    <div><dt>Failure modes</dt><dd>${ALL.length}</dd></div>
    <div><dt>Complete entries</dt><dd>${FULL.length}</dd></div>
    <div><dt>Mappings current to</dt><dd>${META.mappingsCurrentTo}</dd></div>
  </dl>
</div></header>

<section><div class="wrap">
  <div class="cards">
    <div class="card"><a class="cardlink" href="/crosswalk"><span class="ck">Start here</span><h3>Regulatory crosswalk</h3><p>What actually applies to you, and to whom. All ${MAPPING_COUNT} mappings in one filterable table — instrument, provision, whether the obligation falls on a provider or a deployer, and whether it's in force yet.</p></a></div>
    <div class="card"><a class="cardlink" href="/automate"><span class="ck">Speed vs. rigor</span><h3>Where to automate</h3><p>Every complete failure mode is tagged systematic, partial, or judgment-required. Most governance friction can be built away. Some of it is the point.</p></a></div>
    <div class="card"><a class="cardlink" href="/assess"><span class="ck">Fifteen minutes</span><h3>Self-assessment</h3><p>Twenty-eight questions. Tells you which failure modes are likely present, and which of those are quick systematic fixes versus genuine judgment calls. Runs entirely in your browser.</p></a></div>
    <div class="card"><a class="cardlink" href="/coverage"><span class="ck">Track it</span><h3>Coverage map</h3><p>Mark each failure mode as present, addressed or not applicable. Export the state and re-import it later. Your data stays on your machine.</p></a></div>
  </div>
</div></section>

<hr class="rule">

<section><div class="wrap">
  <div class="sechead"><span class="secnum">01</span><h2>The matrix</h2></div>
  <p>${STAGES.length} governance lifecycle stages, ${ALL.length} failure modes. ${FULL.length} carry the complete schema; the remaining ${OPEN.length} are enumerated with plain-language examples and <a href="/backlog">open for contribution</a>.</p>
  <p style="font-size:14.5px;color:var(--ink-2)">Turn on <b>Plain language</b> to read the whole matrix as everyday examples rather than governance terms — the fastest way to orient someone new to this work. Filters are reflected in the URL, so a filtered view can be shared.</p>
  <div class="controls">
    <label class="skip" for="search">Search failure modes</label>
    <input class="search" id="search" type="search" placeholder="Search failure modes…">
    <button class="chip accent" data-filter="plain" aria-pressed="false">Plain language</button>
    <button class="chip" data-filter="full" aria-pressed="false">Complete</button>
    <button class="chip" data-filter="open" aria-pressed="false">Open</button>
    <button class="chip" data-filter="Critical" aria-pressed="false">Critical</button>
    <button class="chip" data-filter="High" aria-pressed="false">High</button>
    <button class="chip ghost" data-filter="reset" aria-pressed="false" style="margin-left:auto">Reset</button>
  </div>
  ${matrixHtml}
</div></section>

<hr class="rule">

<section><div class="wrap">
  <div class="sechead"><span class="secnum">02</span><h2>What this is</h2></div>
  <p>AGFM is an open, community-maintained catalog of the ways enterprise AI <em>governance processes</em> fail. Each failure mode carries a permanent identifier, a plain-language example, the signals that indicate it is present, its root causes, the controls that address it, and a role-scoped, date-stamped mapping to the regulations it implicates.</p>
  <div class="plainbox">
    <span class="eyebrow">Why plain language is a design rule, not a courtesy</span>
    <p>AI governance is new work for most of the people now responsible for it — often a risk manager, a quality lead, or an operations director rather than a specialist. A catalog that only makes sense to people who already understand the problem cannot help the people who need it most. Every entry opens with <b>"In plain terms"</b>: one concrete situation, no acronyms, no framework references. If a failure mode cannot be described that way, the entry is not finished.</p>
  </div>
  <p>Read one way, this catalog is a list of what to watch for — useful to a risk or compliance reader deciding where a control still needs to hold. Read the other way, it's a map of what no longer needs to be slow — useful to an operations reader trying to move faster without guessing where that's safe. Neither reading is more correct than the other. Most of what shows up as governance friction turns out to be automatable once it's named precisely; a smaller set is a human decision that automation would only hide rather than remove, and the catalog tags every complete entry with which is which on the <a href="/automate">automation page</a>. The point isn't choosing a side between speed and rigor — it's being specific enough about each failure mode that the two stop trading off against each other.</p>
  <p><a href="/about">Scope, structure, stewardship and how to cite →</a></p>
</div></section>
<script>${FILTER_JS}</script>`,
}));

/* ---------------- entry pages ---------------- */
const ORDER = ALL.map((m) => m.id);
ALL.forEach((m, idx) => {
  const prev = idx > 0 ? BY_ID[ORDER[idx - 1]] : null;
  const next = idx < ORDER.length - 1 ? BY_ID[ORDER[idx + 1]] : null;
  const full = m.entryStatus === 'full';

  const fields = full ? `
  <div class="field"><h5>Description</h5><p>${esc(m.description)}</p></div>
  ${m.variants && m.variants.length ? `<div class="field"><h5>Failure variants</h5><ul>${m.variants.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>` : ''}
  <div class="field"><h5>Observed in</h5><p>${esc(m.sectors)}</p></div>
  ${m.automationPotential ? `<div class="field"><h5>Automation potential</h5><p><span class="tag ${TIER_TAGCLASS[m.automationPotential]}">${TIER_LABEL[m.automationPotential]}</span></p><p style="margin-top:10px">${esc(m.automationNote)}</p><p style="margin-top:10px;font-size:13px;color:var(--ink-3)">See <a href="/automate">where to automate</a> for how this tier is defined.</p></div>` : ''}
  <div class="field"><h5>Leading indicators</h5><ul>${m.indicators.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>
  <div class="field"><h5>Root causes</h5><ul>${m.rootCauses.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>
  <div class="field"><h5>Mitigations and controls</h5><ul>${m.mitigations.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>
  <div class="field"><h5>Regulatory mapping</h5>${mappingHtml(m.mapping)}
    <p style="margin-top:12px;font-size:12.5px;color:var(--ink-3)">Each mapping names the instrument, the role the obligation falls on, and its status. NIST AI RMF is mapped at function and category level. Research aid, not legal advice. Current to ${META.mappingsCurrentTo}. <a href="/crosswalk">How to read a mapping →</a></p>
  </div>
  <div class="field"><h5>Related failure modes</h5><div class="relgrid">${m.related.filter((r) => BY_ID[r]).map((r) => `<a href="/entries/${r}">${r} · ${esc(BY_ID[r].name)}</a>`).join('')}</div></div>
  <div class="field"><h5>Reference</h5><p>${esc(m.reference)}</p></div>
  <div class="field"><h5>Maturity tier relevance</h5><p>${esc(m.tiers)}</p></div>
  <div class="field"><h5>Cite this entry</h5><div class="cite">${esc(META.framework)}, ${m.id} "${esc(m.name)}", v${META.version} (2026).</div></div>`
    : `<div class="field"><h5>Entry status</h5><div class="stub">
    <b>Enumerated — full entry open for contribution.</b><br><br>
    This failure mode is part of the v${META.version} catalog, its identifier is permanent, and its plain-language example is complete. The remaining schema — indicators, root causes, mitigations, and role-scoped regulatory mappings — has not yet been written.<br><br>
    ${FULL.length} of the ${ALL.length} failure modes carry complete entries. Publishing the remainder as named-but-open is deliberate: an incomplete catalog that is honest about its gaps is more useful than one padded with unverified mappings. <a href="/backlog">See the full backlog →</a>
  </div></div>`;

  write(`entries/${m.id}.html`, layout({
    title: `${m.id} ${m.name} — AGFM`,
    desc: m.plainTerms.slice(0, 180),
    current: '/',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'DefinedTerm',
      termCode: m.id, name: m.name, description: m.plainTerms,
      url: `https://${SITE}/entries/${m.id}`,
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: META.framework, alternateName: 'AGFM', url: `https://${SITE}/` },
    },
    body: `<div class="wrap narrow">
  <div class="entry-head">
    <div class="crumb"><a href="/">Matrix</a> / <a href="/?q=${encodeURIComponent(m.stageId)}">${m.stageId} ${esc(m.stageName)}</a> / ${m.id}</div>
    <span class="entry-id">${m.id}</span>
    <h1 style="font-size:clamp(28px,4.4vw,46px);margin-top:6px">${esc(m.name)}</h1>
    <div class="entry-meta">
      <span class="tag ${sevClass(m.severity)}">${m.severity}</span>
      <span class="tag ${full ? 'full' : 'open'}">${full ? 'Complete entry' : 'Open'}</span>
      <span class="tag open">${m.stageId} ${esc(m.stageName)}</span>
    </div>
  </div>
  <div class="d-lay"><h5>In plain terms</h5><p>${esc(m.plainTerms)}</p></div>
  ${fields}
  <div class="prevnext">
    <span>${prev ? `<a href="/entries/${prev.id}">← ${prev.id}</a>` : ''}</span>
    <span><a href="/">All ${ALL.length} failure modes</a></span>
    <span>${next ? `<a href="/entries/${next.id}">${next.id} →</a>` : ''}</span>
  </div>
</div>`,
  }));
});

/* ---------------- core set ---------------- */
write('core.html', layout({
  title: `The core set — ${FULL.length} complete entries — AGFM`,
  desc: `The ${FULL.length} AGFM failure modes carrying the complete schema: indicators, root causes, mitigations, and role-scoped regulatory mappings.`,
  current: '/core',
  body: `<header class="masthead"><div class="wrap">
  <span class="eyebrow">Complete entries</span>
  <h1>The core set</h1>
  <p class="deck">${FULL.length} failure modes carrying the full schema — leading indicators, root causes, mitigations, and role-scoped regulatory mappings verified against primary sources. Every lifecycle stage is represented.</p>
</div></header>
<section><div class="wrap">
  <p>The remaining ${OPEN.length} failure modes are enumerated with plain-language examples and permanent identifiers, and are <a href="/backlog">open for contribution</a>. We publish them named-but-incomplete rather than padding them with unverified content.</p>
  <div class="controls">
    <label class="skip" for="search">Search</label>
    <input class="search" id="search" type="search" placeholder="Search the core set…">
    <button class="chip accent" data-filter="plain" aria-pressed="false">Plain language</button>
    <button class="chip" data-filter="Critical" aria-pressed="false">Critical</button>
    <button class="chip" data-filter="High" aria-pressed="false">High</button>
    <button class="chip ghost" data-filter="reset" aria-pressed="false" style="margin-left:auto">Reset</button>
  </div>
  <div class="matrix-scroll"><div class="matrix" id="matrix">
  ${STAGES.map((s) => {
    const f = s.failureModes.filter((m) => m.entryStatus === 'full');
    if (!f.length) return '';
    return `<div class="col" data-stage="${s.id}">
      <div class="colhead"><span class="cid">${s.id}</span><span class="cname">${esc(s.name)}</span><span class="ccount">${f.length} complete</span></div>
      ${f.map((m) => cellHtml(m, { showTier: true })).join('\n')}
    </div>`;
  }).join('')}
  </div></div>
  <p class="emptymsg" id="emptymsg" hidden>No entries match those filters.</p>
  <p style="margin-top:22px;font-size:14.5px;color:var(--ink-2)">The colored tag on each entry shows its <a href="/automate">automation potential</a> — systematic, partial, or judgment-required.</p>
</div></section>
<script>${FILTER_JS}</script>`,
}));

/* ---------------- backlog ---------------- */
write('backlog.html', layout({
  title: `Backlog — ${OPEN.length} entries open for contribution — AGFM`,
  desc: `${OPEN.length} AGFM failure modes are enumerated with permanent identifiers and plain-language examples, awaiting indicators, root causes, mitigations and regulatory mappings.`,
  current: '/core',
  body: `<header class="masthead"><div class="wrap">
  <span class="eyebrow">Open for contribution</span>
  <h1>The backlog</h1>
  <p class="deck">${OPEN.length} failure modes are enumerated with permanent identifiers and plain-language examples, but do not yet carry indicators, root causes, mitigations or regulatory mappings.</p>
</div></header>
<section><div class="wrap">
  <div class="callout">
    <p><b>Why publish incomplete entries at all?</b></p>
    <p>Two reasons. Identifiers are permanent, so assigning them early means citations made now will not break later. And a catalog that is honest about its gaps is more useful than one padded with content nobody verified — the alternative to an open entry is not a better entry, it is an invented one.</p>
    <p style="margin-bottom:0">Indicators and mitigations from practitioners are worth more here than any amount of desk research. If you know what one of these actually looks like in a report, a queue, or a log, that is the contribution we most need.</p>
  </div>
  <div class="controls">
    <label class="skip" for="search">Search</label>
    <input class="search" id="search" type="search" placeholder="Search the backlog…">
    <button class="chip accent" data-filter="plain" aria-pressed="false">Plain language</button>
    <button class="chip" data-filter="Critical" aria-pressed="false">Critical</button>
    <button class="chip ghost" data-filter="reset" aria-pressed="false" style="margin-left:auto">Reset</button>
  </div>
  <div class="matrix-scroll"><div class="matrix" id="matrix">
  ${STAGES.map((s) => {
    const o = s.failureModes.filter((m) => m.entryStatus === 'open');
    if (!o.length) return '';
    return `<div class="col" data-stage="${s.id}">
      <div class="colhead"><span class="cid">${s.id}</span><span class="cname">${esc(s.name)}</span><span class="ccount">${o.length} open</span></div>
      ${o.map((m) => cellHtml(m)).join('\n')}
    </div>`;
  }).join('')}
  </div></div>
  <p class="emptymsg" id="emptymsg" hidden>No entries match those filters.</p>
</div></section>
<script>${FILTER_JS}</script>`,
}));

module.exports = { catalog, sets, layout, esc, cellHtml, mappingHtml, write, OUT, ALL, BY_ID, FULL, OPEN, STAGES, META, MAPPING_COUNT, STATUSLABEL, sevClass, FILTER_JS, SITE };

if (require.main === module) {
  require('./build-pages.js');
  console.log(`AGFM v${META.version} site generated in site/`);
  console.log(`  ${STAGES.length} stages · ${ALL.length} modes · ${FULL.length} complete · ${OPEN.length} open · ${MAPPING_COUNT} mappings`);
}
