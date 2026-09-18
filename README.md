# AGFM — AI Governance Failure Mode framework

An open, community-maintained catalog of the ways enterprise AI **governance processes** fail.

Existing frameworks catalog attacks on AI systems (MITRE ATLAS), vulnerabilities in AI applications (OWASP Top 10 for LLM), and prescribed good practice (NIST AI RMF, ISO/IEC 42001). None of them catalog governance-process failure: the use case that reached production without approval, the human review that exists in policy but not in the system, the approval nobody revisited after the model changed, the action item that has been open for seven months.

**v0.3 · 11 lifecycle stages · 87 failure modes · 104 role-scoped regulatory mappings · mappings current to 18 September 2026**

---

## What's in here

```
index.html                  The framework site. Single source of truth for the catalog.
data/agfm.json              Full catalog, nested by lifecycle stage
data/agfm.flat.json         Flat array of all 87 failure modes
data/agfm.csv               One row per failure mode
data/mappings.csv           One row per regulatory mapping, with role scope and status
schema/agfm.schema.json     JSON Schema for the entry format
scripts/build-data.js       Extracts the data files from index.html, runs integrity checks
.github/ISSUE_TEMPLATE/     Contribution templates for submissions and mapping corrections
```

The catalog lives inside `index.html` and the data files are generated from it. That is deliberate: one source of truth means the published dataset can never disagree with the published site. Edit the catalog in `index.html`, then run `npm run build:data`.

---

## Deploying to Vercel

### Option A — import the GitHub repo (recommended)

1. Push this directory to a new GitHub repository.
2. In Vercel, **Add New → Project → Import Git Repository** and select it.
3. Vercel will detect `vercel.json`. Leave the framework preset as **Other**. Confirm:
   - Build Command: `npm run build:data`
   - Output Directory: `.`
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

- `robots.txt` — the `Sitemap:` line
- `sitemap.xml` — the `<loc>` value
- `schema/agfm.schema.json` — the `$id` value

Replace `REPLACE-WITH-YOUR-DOMAIN` with your real hostname and redeploy. The sitemap and schema `$id` matter more than usual here: this catalog is designed to be found and cited, and answer engines use both.

---

## Working on it locally

```bash
npm run dev          # serves on http://localhost:3000
npm run build:data   # regenerate data files and run integrity checks
```

There is no build step for the site itself and no dependencies to install. `index.html` is fully self-contained apart from Google Fonts.

### Integrity checks

`npm run build:data` fails the build if any of the framework's public promises are broken:

- a duplicate identifier
- an identifier that does not match `AGF-Fxxx`
- a failure mode with no plain-language example
- a regulatory mapping with no role scope
- a mapping with an unrecognized status
- a `related` reference pointing at an identifier that does not exist

These run on every Vercel build, so a broken catalog cannot reach production.

---

## Editing the catalog

The catalog is the `STAGES` array near the top of the `<script>` block in `index.html`.

A minimal entry — enumerated, awaiting full schema:

```js
{
  id: "AGF-F107",
  name: "Short neutral name",
  sev: "High",                       // Critical | High | Moderate
  lay: "One concrete situation in ordinary language. No acronyms."
}
```

A full entry adds a `full` object:

```js
{
  id: "AGF-F107",
  name: "Short neutral name",
  sev: "High",
  lay: "One concrete situation in ordinary language.",
  full: {
    desc: "What the failure is, generically.",
    variants: [".01 A materially distinct pathway"],   // optional
    sectors: "Cross-sector",
    ind: ["Observable signal", "Another observable signal"],
    causes: ["Structural reason", "Another structural reason"],
    mit: ["A control", "Another control"],
    map: [
      // [framework, provision, role, status]
      ["EU AI Act", "Art. 26 — deployer obligations", "Deployer", "future"],
      ["ISO/IEC 42001", "Clause 10.2 — corrective action", "Organization", "stayed"]
    ],
    rel: "AGF-F010, AGF-F037",
    ref: "Where this shows up in practice, or blank if there is no public reference.",
    tiers: "Tiers 2–4"
  }
}
```

**Mapping status values:** `live` (currently enforceable) · `future` (scheduled for a future date) · `stayed` (voluntary standard, or enforcement subject to a stay).

**Mapping role values:** `Provider` · `Deployer` · `Provider & deployer` · `Developer & deployer` · `Organization` · `Banking organization` · `Regulated organization` · `Employer / employment agency`.

Run `npm run build:data` after any edit.

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
AI Governance Failure Mode framework, AGF-F040 "Missing human-in-the-loop trigger", v0.3 (2026).
```

Always record the framework version alongside any mapping reproduced in a report or control document. Four of the instruments cited in v0.3 changed materially in the eighteen months to September 2026; a mapping quoted without its version cannot be checked against the instrument as it stood at the time.

---

## Sponsorship disclosure

AGFM was founded and is currently underwritten by AlignAI, which provides secretariat support. AlignAI holds a minority voice on the advisory board and receives no editorial privilege. Sponsorship does not confer influence over which failure modes are catalogued or how mitigations are described, and no AGFM entry references any commercial product, including the sponsor's.

We disclose this openly because a catalog of governance failures is worth exactly as much as its independence.

---

## Not legal advice

AGFM identifies which provisions a failure mode plausibly implicates. It does not interpret those provisions, determine applicability to any particular organization, or establish compliance with anything. Consult qualified counsel.

AGFM is not affiliated with MITRE, OWASP, NIST, ISO, ISPE, or any regulatory authority.
