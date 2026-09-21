# AGFM — AI Governance Failure Mode framework

An open, community-maintained catalog of the ways enterprise AI **governance processes** fail.

Existing frameworks catalog attacks on AI systems (MITRE ATLAS), vulnerabilities in AI applications (OWASP Top 10 for LLM), and prescribed good practice (NIST AI RMF, ISO/IEC 42001). None of them catalog governance-process failure: the use case that reached production without approval, the human review that exists in policy but not in the system, the approval nobody revisited after the model changed, the action item that has been open for seven months.

**v1.1 · 11 lifecycle stages · 89 failure modes · 32 complete entries, each tagged systematic / partial / judgment-required · 161 role-scoped regulatory mappings · current to 18 September 2026**

---

## What's in here

```
data/catalog.json           THE SOURCE OF TRUTH. The whole catalog.
data/sets.json              Assessment questions and curated starter sets
data/agfm.json              Generated — full catalog, nested by stage
data/agfm.flat.json         Generated — flat array of all failure modes
data/agfm.csv               Generated — one row per failure mode
data/mappings.csv           Generated — one row per regulatory mapping
schema/agfm.schema.json     JSON Schema for the entry format
assets/agfm.css             Site stylesheet
scripts/build-data.js       Emits data files, runs integrity checks
scripts/build.js            Site generator (matrix, entries, core, backlog)
scripts/build-pages.js      Site generator (assess, coverage, crosswalk, etc.)
site/                       Generated output — not committed
archive/                    The pre-v1.0 single-file site, kept for reference
.github/ISSUE_TEMPLATE/     Contribution templates
```

`data/catalog.json` is the single source of truth. The site, the data distributions and the exports are all generated from it, so they cannot disagree with each other. Edit the catalog, then run `npm run build`.

**Pages generated:** the matrix, one page per failure mode (89), the core set, the backlog, the automation-potential breakdown (`/automate`), the self-assessment, the coverage map, the filterable crosswalk, the patterns essay, five starter sets, a printable primer, the changelog and the about page — 105 pages in total, plus sitemap and robots.

**Automation-potential tagging.** Every complete entry carries an `automationPotential` field — `systematic` (a rule or gate that runs with no person in the loop), `partial` (the mechanics can be automated, a decision point still needs a person), or `judgment` (automating the decision away recreates the failure mode rather than fixing it) — plus a one-line `automationNote` explaining why. This exists to keep the catalog from reading as a pure caution argument: most of what's here is an engineering fix, not a case for moving slower. Definitions live in `data/sets.json` under `automationTiers`; the tagging script is `scripts/content-v2.js`. `/automate` groups all 32 tagged entries by tier, and the self-assessment surfaces the tier on every identified gap.

---

## Deploying to Vercel

### Option A — import the GitHub repo (recommended)

1. Push this directory to a new GitHub repository.
2. In Vercel, **Add New → Project → Import Git Repository** and select it.
3. Vercel will detect `vercel.json`. Leave the framework preset as **Other**. Confirm:
   - Build Command: `npm run build`
   - Output Directory: `site`
   - Install Command: leave blank (there are no dependencies)
4. Deploy.

Every push to the default branch redeploys. Pull requests get preview URLs automatically, which is useful for reviewing a proposed failure mode before it merges.

### Option B — deploy from your machine

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production deploy
```

### After the first deploy

Three files contain a placeholder domain that needs replacing:

- `scripts/build.js` — the `SITE` constant near the top (this feeds robots.txt, sitemap.xml and all structured data)
- `schema/agfm.schema.json` — the `$id` value
- `.github/ISSUE_TEMPLATE/config.yml` — the CONTRIBUTING link

Replace `REPLACE-WITH-YOUR-DOMAIN` with your real hostname and redeploy. The sitemap and schema `$id` matter more than usual here: this catalog is designed to be found and cited, and answer engines use both.

---

## Working on it locally

```bash
npm run dev          # build, then serve on http://localhost:3000
npm run build        # data + site
npm run check        # integrity checks only
```

No dependencies to install. The generator is plain Node; the site is static HTML, one stylesheet, and small inline scripts. The self-assessment and coverage map run entirely client-side — no backend, no analytics on results, no data leaves the visitor's browser. That is a deliberate constraint, not a limitation: a neutral catalog that captures leads from its own diagnostic stops being neutral.

### Integrity checks

`npm run build:data` fails the build if any of the framework's public promises are broken: a duplicate or malformed identifier, a missing plain-language example, an entry marked complete without indicators, mitigations or mappings, a mapping with no role scope, an unrecognized role or status value, or a dangling `related` reference.

These run on every Vercel build and on every pull request, so a catalog that violates its own stated rules cannot reach production.

---

## Editing the catalog

The catalog is `data/catalog.json`.

A minimal entry — enumerated, awaiting full schema:

```json
{
  "id": "AGF-F109",
  "name": "Short neutral name",
  "severity": "High",
  "plainTerms": "One concrete situation in ordinary language. No acronyms.",
  "entryStatus": "open"
}
```

A complete entry sets `entryStatus` to `full` and fills the rest:

```json
{
  "id": "AGF-F109",
  "name": "Short neutral name",
  "severity": "High",
  "plainTerms": "One concrete situation in ordinary language.",
  "entryStatus": "full",
  "description": "What the failure is, generically.",
  "variants": [".01 A materially distinct pathway"],
  "sectors": "Cross-sector",
  "indicators": ["Observable signal", "Another observable signal"],
  "rootCauses": ["Structural reason", "Another structural reason"],
  "mitigations": ["A control", "Another control"],
  "mapping": [
    { "framework": "EU AI Act", "provision": "Art. 26 — deployer obligations",
      "role": "Deployer", "status": "future" },
    { "framework": "ISO/IEC 42001", "provision": "Clause 10.2 — corrective action",
      "role": "Organization", "status": "stayed" }
  ],
  "related": ["AGF-F010", "AGF-F037"],
  "reference": "Where this shows up in practice, or null if there is no public reference.",
  "tiers": "Tiers 2–4"
}
```

**Mapping status values:** `live` (currently enforceable) · `future` (scheduled for a future date) · `stayed` (voluntary standard, or enforcement subject to a stay).

**Mapping role values:** `Provider` · `Deployer` · `Provider & deployer` · `Developer & deployer` · `Organization` · `Banking organization` · `Regulated organization` · `Employer / employment agency`.

Run `npm run build` after any edit. The integrity checks will reject a duplicate or malformed identifier, a missing plain-language example, a complete entry with no indicators or mappings, a mapping with no role scope, an unrecognized role or status, or a `related` reference pointing at an entry that does not exist.

---

## Rules that are not negotiable

These are the constraints that make the catalog worth citing. They are enforced editorially, and several are enforced by the build.

1. **Every entry opens with a plain-language example.** If a failure mode cannot be described in one concrete situation without acronyms, the entry is not finished.
2. **Every mapping carries a role scope.** Most organizations using AGFM are deployers; a large share of EU AI Act obligations fall on providers. Citing a provider obligation to a deployer produces a compliance plan for a duty they do not hold.
3. **No entry names a commercial product.** Mitigations are described as capabilities and controls, never as tools. This applies to sponsors on identical terms.
4. **Nothing identifies a contributor.** No organization name, individual name, or combination of sector, size and circumstance that makes a contributor recognizable. Plain-language examples are composites.
5. **Identifiers are permanent.** Never reused, never renumbered. Deprecated entries stay published with a pointer to their successor, so citations in audit records and tooling do not break.
6. **Corrections are published, not edited silently.** When a previously published mapping turns out to be wrong, it is recorded in the corrections notice and the changelog. A catalog that hides its own errors has no standing to catalog anyone else's.
7. **Secondary sources are not sufficient for a mapping.** Law-firm briefings and standards summaries are a starting point. A published mapping is verified against the primary text.

---

## Licensing

| What | Licence |
|---|---|
| Catalog content, plain-language examples, crosswalk | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Schema, build scripts, site code | [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) |

Reuse, adapt and redistribute freely, including commercially, with attribution. Vendors and consultancies may build on this without permission.

---

## Citing

```
AI Governance Failure Mode framework, AGF-F040 "Missing human-in-the-loop trigger", v1.0 (2026).
```

Every failure mode has its own permanent URL at `/entries/AGF-Fxxx`.

Always record the framework version alongside any mapping reproduced in a report or control document. Four of the instruments cited in v1.0 changed materially in the eighteen months to September 2026; a mapping quoted without its version cannot be checked against the instrument as it stood at the time.

---

## Sponsorship disclosure

AGFM was founded and is currently underwritten by AlignAI, which provides secretariat support. AlignAI holds a minority voice on the advisory board and receives no editorial privilege. Sponsorship does not confer influence over which failure modes are catalogued or how mitigations are described, and no AGFM entry references any commercial product, including the sponsor's.

We disclose this openly because a catalog of governance failures is worth exactly as much as its independence.

---

## Not legal advice

AGFM identifies which provisions a failure mode plausibly implicates. It does not interpret those provisions, determine applicability to any particular organization, or establish compliance with anything. Consult qualified counsel.

AGFM is not affiliated with MITRE, OWASP, NIST, ISO, ISPE, or any regulatory authority.
