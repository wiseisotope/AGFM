# Changelog

All notable changes to the AGFM catalog. Identifiers are permanent: entries are never
renumbered, and deprecated entries stay published with a pointer to their successor.

Corrections to previously published mappings are recorded here explicitly rather than
edited silently.

## v1.1 — 18 September 2026

Automation-potential tagging, and a reframing pass so the catalog reads as a speed
argument as much as a rigor argument.

### Added

- **Automation-potential tags** on all 32 complete entries: `Systematic` (can run as a
  rule, gate or check with no person in the loop), `Partial` (the mechanics can be
  automated, a decision point still needs a person), or `Judgment-required` (the
  failure mode is about human accountability and automating it away recreates the
  problem rather than fixing it). 16 systematic, 13 partial, 3 judgment-required.
- **New page `/automate`** — every tagged failure mode grouped by tier, with the
  reasoning for each tag and a link back to the throughput argument on `/patterns`.
- **Self-assessment results now show automation tier** per identified gap, plus a
  summary line ("6 systematic, 2 partial, 1 judgment-required") so results translate
  directly into what to build versus what to decide.
- Automation tier now visible on the core set matrix and on every tagged entry page.

### Changed

- **Crosswalk promoted** to the primary entry point on the homepage and in navigation,
  with a new framing paragraph at the top explaining why it's the fastest way in:
  knowing precisely which obligation is yours (and whether it's a provider's or a
  deployer's) is what lets you stop over-applying caution everywhere else.
- **Homepage reframed** to read for two audiences explicitly rather than defaulting to
  one: a risk/compliance reading (what to watch for) and an operations reading (what no
  longer needs to be slow), without treating either as more correct than the other.
- `/about` gained a short section on automation potential, and the version note on
  NIST subcategory-level mapping moved its target from v1.1 to v1.2.

## v1.0 — 18 September 2026

First release with per-entry pages, working tools, and a defined core set.

### Added

- **Per-entry pages.** Every failure mode now has its own URL at `/entries/AGF-Fxxx`, with its
  own title, meta description, canonical URL and structured data. Identifiers are now linkable,
  citable and indexable rather than buried in a script array — which is what makes them behave
  like MITRE technique IDs rather than strings in a page.
- **Self-assessment** — 28 questions covering the highest-consequence failure modes across all
  eleven stages. Produces a ranked list of failure modes likely present, grouped by stage, with
  JSON export and print. Runs entirely client-side: nothing is transmitted, no email capture,
  no analytics on results.
- **Coverage map** — mark each of the 89 failure modes present, addressed or not applicable.
  Persists in local storage, exports and re-imports as JSON so a colleague can pick it up.
- **Starter sets** — a first-ten entry point plus curated sector sets for banking, biopharma,
  insurance and manufacturing.
- **Filterable crosswalk** covering all 161 mappings by instrument, role scope and status.
- **Backlog page** making the 57 incomplete entries visible and contributable rather than
  scattered through the matrix.
- **Printable primer** — a two-page introduction for circulation.
- **Search and filtering with URL state**, so a filtered view can be shared.
- Two failure modes in Findings & Remediation: `AGF-F107` no challenge or rework path, and
  `AGF-F108` remediation closed by its own owner.
- Ten entries upgraded from enumerated to complete: `AGF-F003`, `AGF-F015`, `AGF-F016`,
  `AGF-F033`, `AGF-F042`, `AGF-F051`, `AGF-F071`, `AGF-F082`, `AGF-F101`, `AGF-F103`.
  The core set is now 32, and every lifecycle stage has at least one complete entry.

### Changed

- **Architecture inverted.** `data/catalog.json` is now the single source of truth and the site
  is generated from it. Previously the catalog lived inside the HTML and the data files were
  extracted from it, which meant every new feature had to be built twice and the two could drift.
- Integrity checks extended: an entry marked complete must carry indicators, mitigations and
  mappings; role and status values are validated against a closed list.
- Stewardship named: The Governance Commons.

## v0.3 — 18 September 2026

### Corrected

These errors were published in v0.1 and v0.2. Anyone who built on those versions should
correct accordingly.

- **EU AI Act post-market monitoring is Article 72, not Article 61.** Serious incident
  reporting is Article 73. Article 61 concerns informed consent for testing in real-world
  conditions and has nothing to do with monitoring. Affected entries: `AGF-F031`,
  `AGF-F080`, `AGF-F100`.
- **NIST AI RMF structure was misstated.** Earlier versions described "GOVERN 6 categories
  / 19 subcategories". The correct structure is 4 functions, 19 categories, and 72
  subcategories in total.
- **Colorado mappings were materially wrong.** Earlier versions cited Colorado for
  anti-discrimination duties. SB 26-189 removed the algorithmic-discrimination duty and
  the annual impact-assessment mandate when it repealed SB 24-205 — which itself never
  took effect. Colorado now maps to pre-use notice, adverse-outcome explanation within 30
  days, meaningful human review on request, correction rights, and three-year records.
  Bias-audit mappings now anchor on NYC Local Law 144 alone. Affected entries: `AGF-F065`,
  `AGF-F023`, `AGF-F040`, `AGF-F090`.
- **SR 26-2 supersedes SR 21-8 as well as SR 11-7**, and its generative and agentic
  carve-out sits specifically at footnote 3 to § II. Affected entry: `AGF-F066`.

### Added

- **Role scoping on every mapping.** Each mapping now names whether the obligation falls
  on a provider, a deployer, the organization generally, a banking organization, or an
  employer. This was the largest structural defect in earlier versions: citing a provider
  obligation to a deployer produces a compliance plan for a duty they do not hold.
- **Status on every mapping** — in force, future date, or voluntary/stayed.
- Provisions previously missing: EU AI Act Art. 4 (AI literacy, in force since 2 Feb
  2025), Art. 17 (quality management system, with EN 18286:2026), Art. 25 (a deployer who
  substantially modifies purpose may itself become a provider), Art. 26(2), 26(5) and
  26(6) (deployer oversight, monitoring, and log retention), Art. 49 and Art. 71 (EU
  database registration), and paragraph-level Art. 50 detail.
- EU Digital Omnibus recorded as Reg. (EU) 2026/1744, including the deferral of Annex III
  standalone high-risk obligations to 2 Dec 2027 and Annex I embedded to 2 Aug 2028, and
  the two new Art. 5 prohibitions effective 2 Dec 2026.
- Colorado HB 26-1263 (Chatbot Safety Act) added to the crosswalk.
- A published corrections notice in the crosswalk section of the site.
- A "How to read a mapping" section explaining role scope, status, and precision.

### Changed

- NIST AI RMF is now explicitly mapped at **function and category level**, with
  subcategory-level mapping declared a v1.0 target. Approximate precision stated honestly
  is more useful than false precision stated confidently.
- Two entries (`AGF-F018`, `AGF-F037`) now carry an explicit "No direct obligation" row.
  Not every governance failure has a statutory hook, and pretending otherwise discredits
  the mappings that do.

## v0.2

### Added

- **New lifecycle stage `AGF-TA11` — Findings & Remediation**, with seven entries
  (`AGF-F100`–`AGF-F106`). Organizations that run competent reviews frequently have no
  working process for what happens after a review identifies a problem.
- Twenty-three failure modes across existing stages.
- **Plain-language examples on all 87 entries**, plus a plain-language toggle on the matrix.
- Cross-cutting patterns section covering the five relationships that explain why fixing
  failure modes one at a time underperforms.
- Full entries expanded from twelve to twenty.

## v0.1

- Initial public draft. Ten lifecycle stages, 64 failure modes, twelve full entries.
