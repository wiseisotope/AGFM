#!/usr/bin/env node
/**
 * AGFM data build
 *
 * index.html is the single source of truth for the catalog. This script reads the
 * STAGES array out of it and emits the machine-readable distributions:
 *
 *   data/agfm.json      full catalog, nested by stage
 *   data/agfm.flat.json flat array of failure modes (easier for most tooling)
 *   data/agfm.csv       one row per failure mode, for spreadsheets
 *   data/mappings.csv   one row per regulatory mapping, for crosswalk work
 *
 * Run: npm run build:data
 *
 * Keeping one source of truth means the published dataset can never disagree with
 * the published site. If you edit the catalog, edit it in index.html and re-run this.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'data');

const VERSION = '0.3';
const CURRENT_TO = '2026-09-18';

function extractStages(html) {
  const start = html.indexOf('const STAGES=');
  if (start === -1) throw new Error('Could not find STAGES array in index.html');

  // Walk forward balancing brackets so we capture exactly the array literal.
  const arrStart = html.indexOf('[', start);
  let depth = 0;
  let inStr = null;
  let i = arrStart;

  for (; i < html.length; i++) {
    const c = html[i];
    const prev = html[i - 1];
    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) break; }
  }

  const literal = html.slice(arrStart, i + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`return ${literal};`)();
}

function normalise(stages) {
  const modes = [];
  for (const stage of stages) {
    for (const m of stage.modes) {
      const f = m.full || null;
      modes.push({
        id: m.id,
        name: m.name,
        stageId: stage.id,
        stageName: stage.name,
        severity: m.sev,
        plainTerms: m.lay,
        entryStatus: f ? 'full' : 'open',
        description: f ? f.desc : null,
        variants: f && f.variants ? f.variants : [],
        sectors: f ? f.sectors : null,
        indicators: f ? f.ind : [],
        rootCauses: f ? f.causes : [],
        mitigations: f ? f.mit : [],
        mapping: f
          ? f.map.map(([framework, provision, role, status]) => ({
              framework, provision, role, status,
            }))
          : [],
        related: f && f.rel ? f.rel.split(',').map((s) => s.trim()) : [],
        reference: f ? f.ref : null,
        tiers: f ? f.tiers : null,
      });
    }
  }
  return modes;
}

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = Array.isArray(v) ? v.join(' | ') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, columns) {
  const head = columns.join(',');
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

function main() {
  const html = fs.readFileSync(HTML, 'utf8');
  const stages = extractStages(html);
  const modes = normalise(stages);

  const meta = {
    framework: 'AI Governance Failure Mode framework',
    abbreviation: 'AGFM',
    version: VERSION,
    mappingsCurrentTo: CURRENT_TO,
    generated: new Date().toISOString().slice(0, 10),
    license: {
      content: 'CC-BY-4.0',
      code: 'Apache-2.0',
    },
    counts: {
      stages: stages.length,
      failureModes: modes.length,
      fullEntries: modes.filter((m) => m.entryStatus === 'full').length,
      openEntries: modes.filter((m) => m.entryStatus === 'open').length,
      mappings: modes.reduce((n, m) => n + m.mapping.length, 0),
    },
    notes: [
      'NIST AI RMF is mapped at function and category level. Subcategory-level mapping is a v1.0 target.',
      'Every mapping carries a role scope naming who the obligation falls on. Mappings without a role scope do not publish.',
      'Regulatory mappings are research aids and do not constitute legal advice or establish compliance.',
      'Plain-language examples are composites written for recognition, not descriptions of any specific organization.',
    ],
  };

  fs.mkdirSync(OUT, { recursive: true });

  fs.writeFileSync(
    path.join(OUT, 'agfm.json'),
    `${JSON.stringify({ meta, stages: stages.map((s) => ({
      id: s.id,
      name: s.name,
      failureModes: modes.filter((m) => m.stageId === s.id),
    })) }, null, 2)}\n`,
  );

  fs.writeFileSync(
    path.join(OUT, 'agfm.flat.json'),
    `${JSON.stringify({ meta, failureModes: modes }, null, 2)}\n`,
  );

  fs.writeFileSync(
    path.join(OUT, 'agfm.csv'),
    toCsv(modes, [
      'id', 'name', 'stageId', 'stageName', 'severity', 'entryStatus',
      'plainTerms', 'description', 'sectors', 'indicators', 'rootCauses',
      'mitigations', 'related', 'reference', 'tiers',
    ]),
  );

  const mappingRows = [];
  for (const m of modes) {
    for (const map of m.mapping) {
      mappingRows.push({
        failureModeId: m.id,
        failureModeName: m.name,
        stageId: m.stageId,
        framework: map.framework,
        provision: map.provision,
        role: map.role,
        status: map.status,
      });
    }
  }
  fs.writeFileSync(
    path.join(OUT, 'mappings.csv'),
    toCsv(mappingRows, [
      'failureModeId', 'failureModeName', 'stageId',
      'framework', 'provision', 'role', 'status',
    ]),
  );

  // Integrity checks. These are the invariants the framework promises publicly.
  const problems = [];
  const seen = new Set();
  for (const m of modes) {
    if (seen.has(m.id)) problems.push(`Duplicate identifier: ${m.id}`);
    seen.add(m.id);
    if (!m.plainTerms) problems.push(`${m.id} has no plain-language example`);
    if (!/^AGF-F\d{3}$/.test(m.id)) problems.push(`${m.id} does not match the AGF-Fxxx identifier format`);
    for (const map of m.mapping) {
      if (!map.role) problems.push(`${m.id} has a mapping with no role scope: ${map.framework}`);
      if (!['live', 'future', 'stayed'].includes(map.status)) {
        problems.push(`${m.id} has a mapping with an unknown status "${map.status}"`);
      }
    }
  }
  const ids = new Set(modes.map((m) => m.id));
  for (const m of modes) {
    for (const rel of m.related) {
      if (rel && !ids.has(rel)) problems.push(`${m.id} references unknown identifier ${rel}`);
    }
  }

  console.log(`AGFM v${VERSION}`);
  console.log(`  stages          ${meta.counts.stages}`);
  console.log(`  failure modes   ${meta.counts.failureModes}`);
  console.log(`  full entries    ${meta.counts.fullEntries}`);
  console.log(`  open entries    ${meta.counts.openEntries}`);
  console.log(`  mappings        ${meta.counts.mappings}`);
  console.log(`  wrote           data/agfm.json, data/agfm.flat.json, data/agfm.csv, data/mappings.csv`);

  if (problems.length) {
    console.error('\nIntegrity problems:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log('  integrity       all checks passed');
}

main();
