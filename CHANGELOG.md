# Changelog

All notable changes to the AGFM catalog. Identifiers are permanent: entries are never
renumbered, and deprecated entries stay published with a pointer to their successor.

Corrections to previously published mappings are recorded here explicitly rather than
edited silently.

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
