# Contributing to AGFM

AGFM is built from observed practice. Contributions are welcome from anyone who governs AI systems in production — risk, audit, quality, model risk, data governance, and AI programme roles in particular.

You do not need to be a specialist, and you do not need to write a full entry. A one-sentence description of something you have watched go wrong is a useful contribution.

## Four ways to contribute

### 1. Propose a failure mode

Describe a governance failure you have observed. The bar is that it is a **process or organizational** failure — how the machinery for governing AI broke down — rather than a model failure, a vulnerability, or an attack. Those belong in ATLAS, OWASP, or the AI Incident Database.

**Generalize before you submit.** See the de-identification rules below.

### 2. Complete an open entry

Sixty-seven of the 87 enumerated failure modes carry only a name, a severity, and a plain-language example. They need indicators, root causes, mitigations, and role-scoped mappings.

Indicators are the most valuable field and the hardest to write from desk research. If you know what this failure actually looks like in a report, a queue, or a log, that is worth more than any amount of framework reading.

### 3. Challenge a mapping

Wrong article, wrong role scope, superseded instrument, missing jurisdiction. **Mapping corrections are the highest-priority contribution class.** They ship on the next minor version with a named correction notice in the changelog.

v0.3 corrected four published mapping errors found this way. That process working is more important than the catalog looking finished.

### 4. Sharpen a plain-language example

If an example reads as jargon, misses the situation you actually recognize, or would confuse someone new to governance work, say so. Clarity contributions are treated as substantive, not cosmetic — the plain-language layer is the part that makes the catalog usable by the people who have just inherited this work.

## De-identification — read before submitting

**No submission may make an organization or individual identifiable.** This is not negotiable and it is the most common reason a submission is not published.

That means no organization name, no individual name, no product name, and no combination of sector, size, timing and circumstance that would let a reader work out who you are describing.

Plain-language examples are **composites**: written to be recognizable to many organizations and traceable to none. If you find yourself writing a detail because it is what actually happened rather than because it is what generally happens, take it out.

If a submission cannot be safely generalized, it is not published. We will tell you why rather than editing it into something you did not intend.

## Rules for published entries

1. **Plain language first.** Every entry opens with one concrete situation in ordinary language. No acronyms, no framework references. If a failure mode cannot be described that way, the entry is not finished.
2. **Every mapping carries a role scope.** Naming who the obligation falls on is mandatory. Most organizations using AGFM are deployers; a large share of EU AI Act obligations fall on providers. A mapping without a role scope does not publish, and the build will reject it.
3. **No commercial products.** Mitigations are described as capabilities and controls, never as named tools. This applies to sponsors on identical terms.
4. **Non-blame-assigning.** Root causes describe structure, not people. Almost every failure in this catalog is the predictable output of a reasonable process under load.
5. **Secondary sources are not sufficient for a mapping.** Law-firm briefings and standards summaries are a starting point. A published mapping is verified against the primary text — the regulation, the standard, the supervisory letter.
6. **Blank beats invented.** If there is no public incident reference, leave `ref` empty. A fabricated citation damages every other entry alongside it.

## Making the change

The catalog lives in the `STAGES` array in `index.html`. The data files in `data/` are generated from it — do not edit those directly.

```bash
git checkout -b failure-mode/short-description
# edit index.html
npm run build:data          # regenerates data files, runs integrity checks
git add -A && git commit -m "Add AGF-Fxxx: short description"
```

The build fails on a duplicate identifier, a malformed identifier, a missing plain-language example, a mapping with no role scope, an unknown status value, or a `related` reference pointing at an identifier that does not exist. Fix anything it reports before opening the pull request.

See the README for the entry format.

## Identifiers

**Do not assign your own identifier.** Use `AGF-FXXX` as a placeholder in your pull request and a maintainer will assign the real one on merge. Identifiers are permanent and never reused, so they are allocated centrally to avoid collisions.

## Editorial process

1. **Triage** — scope fit, de-identification, and duplication against existing entries.
2. **Drafting** — written to the standard schema, including the plain-language example and role-scoped mappings.
3. **Review** — entries touching regulatory mapping receive a second review against primary sources before publication.
4. **Release** — published on the next scheduled version with a changelog entry. Corrections to previously published mappings are recorded explicitly rather than edited silently.

Minor versions ship quarterly, major versions annually. Material changes to a cited instrument trigger an out-of-cycle correction notice rather than waiting for the next scheduled release.

## Attribution

**Anonymous contribution is the default.** Contributors are credited by name or organization only where they explicitly request it. Say so in your submission if you want to be named.

## Licensing your contribution

By contributing you agree that your contribution is licensed under CC BY 4.0 (catalog content) or Apache 2.0 (code), matching the rest of the project. Do not submit material you are not free to license this way — in particular, do not paste text from a client deliverable, an internal policy, or a paywalled standard.
