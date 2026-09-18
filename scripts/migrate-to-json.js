#!/usr/bin/env node
/**
 * ONE-TIME migration: pull the catalog out of the old single-file site and write
 * data/catalog.json, which becomes the source of truth from here on.
 *
 * After this runs, the site is generated FROM the JSON, not the other way round.
 */
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
const OUT = path.join(__dirname, '..', 'data', 'catalog.json');

function extractStages(html) {
  const start = html.indexOf('const STAGES=');
  const arrStart = html.indexOf('[', start);
  let depth = 0, inStr = null, i = arrStart;
  for (; i < html.length; i++) {
    const c = html[i], prev = html[i - 1];
    if (inStr) { if (c === inStr && prev !== '\\') inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) break; }
  }
  return new Function(`return ${html.slice(arrStart, i + 1)};`)();
}

const stages = extractStages(fs.readFileSync(SRC, 'utf8'));

const catalog = {
  meta: {
    framework: 'AI Governance Failure Mode framework',
    abbreviation: 'AGFM',
    version: '1.0',
    steward: 'The Governance Commons',
    mappingsCurrentTo: '2026-09-18',
    license: { content: 'CC-BY-4.0', code: 'Apache-2.0' },
  },
  stages: stages.map((s) => ({
    id: s.id,
    name: s.name,
    failureModes: s.modes.map((m) => {
      const f = m.full || null;
      return {
        id: m.id,
        name: m.name,
        severity: m.sev,
        plainTerms: m.lay,
        entryStatus: f ? 'full' : 'open',
        description: f ? f.desc : null,
        variants: (f && f.variants) || [],
        sectors: f ? f.sectors : null,
        indicators: (f && f.ind) || [],
        rootCauses: (f && f.causes) || [],
        mitigations: (f && f.mit) || [],
        mapping: f ? f.map.map(([framework, provision, role, status]) => ({ framework, provision, role, status })) : [],
        related: f && f.rel ? f.rel.split(',').map((x) => x.trim()).filter(Boolean) : [],
        reference: f ? f.ref : null,
        tiers: f ? f.tiers : null,
      };
    }),
  })),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${OUT}`);
console.log(`  stages ${catalog.stages.length}`);
console.log(`  modes  ${catalog.stages.reduce((n, s) => n + s.failureModes.length, 0)}`);
