#!/usr/bin/env node
/**
 * Emits the machine-readable distributions from data/catalog.json, and runs the
 * integrity checks that enforce the framework's public promises.
 *
 *   data/agfm.json       full catalog, nested by stage
 *   data/agfm.flat.json  flat array of failure modes
 *   data/agfm.csv        one row per failure mode
 *   data/mappings.csv    one row per regulatory mapping
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'data');
const catalog = JSON.parse(fs.readFileSync(path.join(OUT, 'catalog.json'), 'utf8'));
const META = catalog.meta;

const modes = catalog.stages.flatMap((s) =>
  s.failureModes.map((m) => ({ ...m, stageId: s.id, stageName: s.name })));

const meta = {
  ...META,
  generated: new Date().toISOString().slice(0, 10),
  counts: {
    stages: catalog.stages.length,
    failureModes: modes.length,
    fullEntries: modes.filter((m) => m.entryStatus === 'full').length,
    openEntries: modes.filter((m) => m.entryStatus === 'open').length,
    mappings: modes.reduce((n, m) => n + m.mapping.length, 0),
  },
  notes: [
    'NIST AI RMF is mapped at function and category level. Subcategory-level mapping is a v1.1 target.',
    'Every mapping carries a role scope naming who the obligation falls on. Mappings without a role scope do not publish.',
    'Regulatory mappings are research aids and do not constitute legal advice or establish compliance.',
    'Plain-language examples are composites written for recognition, not descriptions of any specific organization.',
  ],
};

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = Array.isArray(v) ? v.join(' | ') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows, cols) =>
  `${cols.join(',')}\n${rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n')}\n`;

fs.writeFileSync(path.join(OUT, 'agfm.json'), `${JSON.stringify({ meta, stages: catalog.stages }, null, 2)}\n`);
fs.writeFileSync(path.join(OUT, 'agfm.flat.json'), `${JSON.stringify({ meta, failureModes: modes }, null, 2)}\n`);
fs.writeFileSync(path.join(OUT, 'agfm.csv'), toCsv(modes, [
  'id', 'name', 'stageId', 'stageName', 'severity', 'entryStatus', 'plainTerms',
  'description', 'sectors', 'indicators', 'rootCauses', 'mitigations', 'related', 'reference', 'tiers',
]));

const mappingRows = [];
modes.forEach((m) => m.mapping.forEach((x) => mappingRows.push({
  failureModeId: m.id, failureModeName: m.name, stageId: m.stageId,
  framework: x.framework, provision: x.provision, role: x.role, status: x.status,
})));
fs.writeFileSync(path.join(OUT, 'mappings.csv'), toCsv(mappingRows, [
  'failureModeId', 'failureModeName', 'stageId', 'framework', 'provision', 'role', 'status',
]));

/* ---- integrity: the promises the framework makes publicly ---- */
const ROLES = ['Provider', 'Deployer', 'Provider & deployer', 'Developer & deployer',
  'Organization', 'Banking organization', 'Regulated organization', 'Employer / employment agency'];
const problems = [];
const seen = new Set();
const ids = new Set(modes.map((m) => m.id));

for (const m of modes) {
  if (seen.has(m.id)) problems.push(`Duplicate identifier: ${m.id}`);
  seen.add(m.id);
  if (!/^AGF-F\d{3}$/.test(m.id)) problems.push(`${m.id} does not match the AGF-Fxxx format`);
  if (!m.plainTerms || m.plainTerms.length < 20) problems.push(`${m.id} has no usable plain-language example`);
  if (!['Critical', 'High', 'Moderate'].includes(m.severity)) problems.push(`${m.id} has invalid severity "${m.severity}"`);
  if (m.entryStatus === 'full') {
    if (!m.description) problems.push(`${m.id} is marked full but has no description`);
    if (!m.indicators.length) problems.push(`${m.id} is marked full but has no indicators`);
    if (!m.mitigations.length) problems.push(`${m.id} is marked full but has no mitigations`);
    if (!m.mapping.length) problems.push(`${m.id} is marked full but has no regulatory mapping`);
  }
  for (const x of m.mapping) {
    if (!x.role) problems.push(`${m.id} has a mapping with no role scope: ${x.framework}`);
    else if (!ROLES.includes(x.role)) problems.push(`${m.id} has an unrecognized role scope "${x.role}"`);
    if (!['live', 'future', 'stayed'].includes(x.status)) problems.push(`${m.id} has unknown mapping status "${x.status}"`);
  }
  for (const rel of m.related) {
    if (rel && !ids.has(rel)) problems.push(`${m.id} references unknown identifier ${rel}`);
  }
}

console.log(`AGFM v${META.version}`);
console.log(`  stages         ${meta.counts.stages}`);
console.log(`  failure modes  ${meta.counts.failureModes}`);
console.log(`  complete       ${meta.counts.fullEntries}`);
console.log(`  open           ${meta.counts.openEntries}`);
console.log(`  mappings       ${meta.counts.mappings}`);

if (problems.length) {
  console.error('\nIntegrity problems:');
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log('  integrity      all checks passed');
