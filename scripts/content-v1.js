#!/usr/bin/env node
/**
 * v1.0 content pass.
 *
 * Adds two failure modes to TA11 and upgrades ten enumerated entries to the full
 * schema, taking the core set to thirty and giving every lifecycle stage at least
 * two complete entries.
 *
 * Idempotent: running twice is safe.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const M = (framework, provision, role, status) => ({ framework, provision, role, status });

/* ---------- upgrades: enumerated -> full ---------- */
const UPGRADES = {
  'AGF-F003': {
    desc: 'No agreed scheme exists for classifying AI use cases by risk, so every use case is implicitly treated as equivalent. Without tiers there is nothing to route on, nothing to scale review depth against, and no defensible basis for treating two use cases differently.',
    sectors: 'Cross-sector; foundational across all industries',
    ind: ['No documented tier definitions or classification criteria', 'Review depth identical across materially different use cases', 'Reviewers unable to state which tier a given use case sits in', 'Risk language in policy that maps to no operational routing decision'],
    causes: ['Policy written before any volume of use cases existed to classify', 'Disagreement between functions about what counts as high risk, resolved by omitting the question', 'Concern that publishing tiers invites teams to argue their way into a lower one'],
    mit: ['Define a small number of tiers with written classification criteria', 'Tie each tier to a concrete routing consequence, not just a label', 'Classify the existing portfolio retrospectively, not only new intake', 'Publish the criteria so classification can be challenged and is repeatable'],
    map: [
      M('EU AI Act', 'Art. 6 and Annex III — high-risk classification. An organization with no internal tiering cannot determine which of its systems fall inside the regime.', 'Provider & deployer', 'future'),
      M('SR 26-2', 'Materiality-based scoping — the 2026 guidance expects tailoring to model risk profile, which presupposes a classification scheme', 'Banking organization', 'live'),
      M('NIST AI RMF', 'MAP-1 — context and categorization', 'Organization', 'stayed'),
      M('ISO/IEC 42001', 'Clause 6.1 risk planning; A.5 assessing impacts of AI systems', 'Organization', 'stayed'),
    ],
    rel: ['AGF-F020', 'AGF-F022', 'AGF-F027'],
    ref: 'Precedes most other assessment failures. An organization without tiering cannot exhibit proportionate review, because there is nothing to be proportionate to.',
    tiers: 'Tiers 1–2',
  },

  'AGF-F015': {
    desc: 'AI capability arrives inside software the organization already owns — a vendor adds a feature, enables a model, or ships an assistant in an update. The system remains registered under its original non-AI category, so no AI governance control ever attaches to it.',
    sectors: 'Cross-sector; heaviest exposure where core operational platforms are vendor-supplied',
    ind: ['Vendor release notes describing AI capability with no corresponding governance event', 'Software categorized by original function rather than current capability', 'Contract renewals with AI terms for systems absent from the AI register', 'AI features enabled by default in existing tools with no configuration decision recorded'],
    causes: ['Inventory built once at procurement and never revisited as capability changed', 'No process watching vendor roadmaps or release notes for AI additions', 'Vendor management and AI governance operate as separate functions with no trigger between them', 'AI features enabled by default, so adoption requires no decision anyone records'],
    mit: ['Add AI capability disclosure and change notification to vendor contract terms', 'Review vendor release notes against the register on a defined cadence', 'Re-screen the existing software estate for AI features rather than only assessing new purchases', 'Treat a vendor enabling AI capability as a governance event requiring re-intake', 'Require vendors to notify before enabling new AI capability, not after'],
    map: [
      M('EU AI Act', 'Art. 26 — deployer obligations attach regardless of whether the organization realises the system is in scope', 'Deployer', 'future'),
      M('EU AI Act', 'Art. 50 — transparency duties attach by system function, including where the function arrived in a vendor update', 'Deployer', 'live'),
      M('NIST AI RMF', 'MAP-1 inventory and context; MANAGE-3 third-party risk', 'Organization', 'stayed'),
      M('ISO/IEC 42001', 'A.10 — third-party and customer relationships; Clause 8.1 operational control', 'Organization', 'stayed'),
      M('SR 26-2', 'Vendor and third-party model inventory', 'Banking organization', 'live'),
    ],
    rel: ['AGF-F010', 'AGF-F071', 'AGF-F016'],
    ref: 'The dominant route by which regulated organizations acquire ungoverned AI. Distinct from unsanctioned use in that the organization bought the software deliberately; only the AI capability is unnoticed.',
    tiers: 'Tiers 1–3',
  },

  'AGF-F016': {
    desc: 'Systems that can take actions — call tools, write to records, send communications, invoke other systems — are registered and governed as though they only produce text for a human to read. The risk profile of an agent differs fundamentally from that of a model, and the register cannot tell them apart.',
    sectors: 'Cross-sector; consequence rises sharply in banking and anywhere systems hold write access',
    ind: ['Register entries describing capability in generic terms such as assistant or copilot', 'No field recording autonomy level, tool access, or write permissions', 'Systems with production write access whose governance record shows read-only assessment', 'No inventory of what actions a given deployment is permitted to take'],
    causes: ['Register schema designed before agentic deployment was common', 'Agentic capability added incrementally to a system already approved as a model', 'Vendor terminology obscures the distinction, and the register inherits it', 'No one has defined what autonomy levels the organization recognizes'],
    mit: ['Record autonomy level, tool access, and write scope as mandatory register fields', 'Maintain an agent registry distinct from the model inventory', 'Require re-assessment when a system gains the ability to act rather than only to advise', 'Define recognized autonomy levels so the field has consistent meaning', 'Inventory permissions held by agent service accounts as part of assessment'],
    map: [
      M('SR 26-2', 'Footnote 3 to § II excludes agentic AI from model risk management scope, so no supervisory template exists and institutions must self-determine controls', 'Banking organization', 'live'),
      M('EU AI Act', 'Art. 6 and Annex III classification — an agent taking consequential action may fall in scope where an advisory model does not', 'Provider & deployer', 'future'),
      M('NIST AI RMF', 'MAP-1 context and capability; MANAGE-1 risk treatment', 'Organization', 'stayed'),
      M('ISO/IEC 42001', 'A.6 AI system life cycle; A.9 responsible use', 'Organization', 'stayed'),
    ],
    rel: ['AGF-F066', 'AGF-F015', 'AGF-F032'],
    ref: 'A classification gap created by rapid capability change rather than by process failure. The register is usually accurate as of the date it was designed.',
    tiers: 'Tiers 2–4',
  },

  'AGF-F033': {
    desc: 'Approval is granted subject to conditions — add human review, implement logging, complete testing before launch. The conditions are recorded in the approval and then never checked. The system operates as though fully approved while the basis of that approval was never satisfied.',
    sectors: 'Cross-sector; most consequential in banking, insurance and biopharma',
    ind: ['Approvals containing conditions with no corresponding verification record', 'No field distinguishing conditional approval from unconditional', 'Conditions expressed as prose in a comment rather than as tracked items', 'No owner or due date attached to any condition', 'Systems in production whose approval conditions remain open'],
    causes: ['Conditions captured as narrative text rather than as tracked obligations', 'No mechanism links a condition to a verification event', 'Conditional approval treated as approval, because operationally it releases the same permissions', 'The reviewer who set the condition has no visibility after the decision'],
    mit: ['Record each condition as a tracked item with an owner and a due date', 'Distinguish conditional from unconditional approval in the record and in reporting', 'Require positive verification evidence before a condition is closed', 'Escalate overdue conditions on the same basis as overdue findings', 'Report open conditions on deployed systems as a standing metric'],
    map: [
      M('ISO/IEC 42001', 'Clause 10.2 — corrective action, including verification of effectiveness', 'Organization', 'stayed'),
      M('EU AI Act', 'Art. 9 — risk management measures must be implemented, not only identified', 'Provider', 'future'),
      M('GxP', 'CAPA effectiveness verification; conditional release controls', 'Regulated organization', 'stayed'),
      M('SR 26-2', 'Issue management and validation findings closure', 'Banking organization', 'live'),
      M('NIST AI RMF', 'MANAGE-1, MANAGE-4 — risk treatment and its documentation', 'Organization', 'stayed'),
    ],
    rel: ['AGF-F100', 'AGF-F103', 'AGF-F067'],
    ref: 'Structurally identical to the findings-and-remediation failures in TA11, but occurring at the approval gate rather than after review. Organizations frequently fix one and not the other.',
    tiers: 'Tiers 3–5',
  },

  'AGF-F042': {
    desc: 'A deployed system has no current owner. The person who built or sponsored it has left, changed role, or moved team, and ownership was never reassigned. The system continues to operate, make decisions, and consume data with nobody accountable for it.',
    sectors: 'Cross-sector; prevalence rises with organizational change frequency',
    ind: ['Register entries whose named owner no longer appears in the directory', 'Owner fields populated with a team name rather than a person', 'Systems with no governance activity for an extended period', 'Review requests returning undeliverable', 'No reassignment step in the leaver or internal-transfer process'],
    causes: ['Ownership captured at intake and never revisited', 'Offboarding processes cover access and equipment but not governance ownership', 'Reassignment has no trigger, so it depends on someone noticing', 'Ownership recorded as an individual with no defined successor or accountable role'],
    mit: ['Trigger ownership reassignment from the leaver and internal-transfer processes', 'Record an accountable role alongside the named individual', 'Run periodic ownership attestation across the register', 'Report unowned systems as a standing exception', 'Block approval renewal on a system with no current owner'],
    map: [
      M('EU AI Act', 'Art. 26(2) — the deployer must assign human oversight to identified natural persons with the necessary competence and authority', 'Deployer', 'future'),
      M('NIST AI RMF', 'GOVERN-2 — accountability structures and defined roles', 'Organization', 'stayed'),
      M('ISO/IEC 42001', 'Clause 5.3 — roles, responsibilities and authorities', 'Organization', 'stayed'),
      M('SR 26-2', 'Model ownership and accountability expectations', 'Banking organization', 'live'),
    ],
    rel: ['AGF-F096', 'AGF-F044', 'AGF-F094'],
    ref: 'Frequently discovered during an audit or an incident, when someone needs to reach the owner and finds there is not one.',
    tiers: 'Tiers 2–4',
  },

  'AGF-F051': {
    desc: 'Data is used to train, tune, or prompt an AI system without anyone verifying that the organization holds the rights to use it that way. Collection for one purpose does not establish permission for another, and the check is frequently never made.',
    sectors: 'Cross-sector; acute wherever personal, customer, or licensed third-party data is involved',
    ind: ['No recorded rights determination against any training or retrieval dataset', 'Privacy notices that do not contemplate AI use of the data they describe', 'Third-party data used in AI contexts with no licence review', 'Datasets whose collection basis nobody can state', 'Assessment forms with no data-rights question'],
    causes: ['Rights assessed at the point of collection and never re-assessed for new purposes', 'Data governance and AI governance operate as separate processes with no handoff', 'Assumption that internally held data is internally usable for any purpose', 'Licence terms for third-party data not reviewed for AI use specifically'],
    mit: ['Require a recorded data-rights determination before any AI use of a dataset', 'Review privacy notices and consent bases against actual AI use', 'Check third-party data licences for AI, training, and derivative-work terms', 'Maintain a data-rights register linked to use cases', 'Make the rights question a blocking field on intake'],
    map: [
      M('EU AI Act', 'Art. 10 — data and data governance, including examination of suitability and provenance of datasets', 'Provider', 'future'),
      M('NIST AI RMF', 'MAP-4 — risks from third-party data and software; GOVERN-6 third-party policy', 'Organization', 'stayed'),
      M('ISO/IEC 42001', 'A.7 — data for AI systems, including provenance and quality', 'Organization', 'stayed'),
      M('GxP', 'Data provenance and integrity for data supporting regulated decisions', 'Regulated organization', 'stayed'),
      M('SR 26-2', 'Data quality and appropriateness for model use', 'Banking organization', 'live'),
    ],
    rel: ['AGF-F050', 'AGF-F054', 'AGF-F055'],
    ref: 'Among the most difficult failure modes to remediate after the fact, because retraining or rebuilding may be the only available correction.',
    tiers: 'Tiers 2–4',
  },

  'AGF-F071': {
    desc: 'A vendor changes the model underneath a deployed system without advance notice. Behaviour shifts, output quality moves, and the organization discovers it from downstream effects rather than from the vendor. Nothing in the governance record marks the change.',
    sectors: 'Cross-sector; universal wherever AI capability is consumed as a service',
    ind: ['Output quality or behaviour shifting with no corresponding internal change', 'Vendor release notes that postdate the behaviour change', 'No contractual notice requirement for model changes', 'No monitoring baseline against which a change would be visible', 'Model version absent from the governance record'],
    causes: ['Model updates treated by the vendor as routine service maintenance', 'No contractual notice requirement negotiated at procurement', 'No performance baseline, so change is invisible rather than merely unannounced', 'Model version not captured in the record, so there is nothing to compare against'],
    mit: ['Negotiate advance notice of model changes into vendor contracts', 'Record the specific model version in the governance record and monitor for drift from it', 'Maintain a performance baseline sensitive enough to detect behavioural change', 'Pin model versions where the vendor supports it', 'Treat a detected vendor change as a re-review trigger'],
    map: [
      M('EU AI Act', 'Art. 25 — a substantial modification may shift provider obligations onto the party making or adopting it', 'Provider & deployer', 'future'),
      M('EU AI Act', 'Art. 72 — post-market monitoring must detect changes in real-world performance', 'Provider', 'future'),
      M('NIST AI RMF', 'MANAGE-3 third-party risk; MEASURE-2 ongoing evaluation', 'Organization', 'stayed'),
      M('ISO/IEC 42001', 'A.10 third-party relationships; Clause 8.1 change control', 'Organization', 'stayed'),
      M('GAMP 5', 'Change control and revalidation triggers for supplier-initiated change', 'Regulated organization', 'stayed'),
      M('SR 26-2', 'Ongoing monitoring and vendor model risk', 'Banking organization', 'live'),
    ],
    rel: ['AGF-F031', 'AGF-F070', 'AGF-F081'],
    ref: 'The clearest case in the catalog of a governance failure originating outside the organization. The failure is not the vendor change; it is the absence of any mechanism that would notice one.',
    tiers: 'Tiers 3–5',
  },

  'AGF-F082': {
    desc: 'The organization has no working definition of what constitutes an AI incident and no channel for reporting one. Events that would trigger regulatory reporting obligations elsewhere are handled as ordinary defects, and the reporting clock runs without anyone knowing it has started.',
    sectors: 'Cross-sector; regulatory consequence highest for EU-facing high-risk deployments',
    ind: ['No written definition of an AI incident', 'AI failures resolved through the standard defect process with no governance visibility', 'No named recipient for an AI incident report', 'Staff unable to say who they would tell', 'No log of AI incidents, which is usually read as an absence of incidents'],
    causes: ['Incident processes designed for security and availability, not for AI behaviour', 'No agreed threshold distinguishing a defect from an incident', 'Reporting obligations not mapped to internal triggers', 'Fear that logging incidents creates exposure, so they are logged as defects'],
    mit: ['Publish a written definition of an AI incident with worked examples', 'Route AI incidents through a channel with governance visibility, not only engineering', 'Map external reporting obligations and deadlines to internal detection triggers', 'Capture near-misses alongside incidents', 'Rehearse the reporting path before it is needed'],
    map: [
      M('EU AI Act', 'Art. 73 — serious incident reporting to market surveillance authorities: 15 days by default, 2 days for widespread or severe incidents, 10 days where death is involved', 'Provider', 'future'),
      M('EU AI Act', 'Art. 26(5) — deployers must inform the provider and relevant authorities where a risk is identified', 'Deployer', 'future'),
      M('EU AI Act', 'Art. 72 — post-market monitoring as the system expected to surface such events', 'Provider', 'future'),
      M('NIST AI RMF', 'MANAGE-4 — incident response and communication', 'Organization', 'stayed'),
      M('ISO/IEC 42001', 'Clause 10.2 nonconformity and corrective action', 'Organization', 'stayed'),
      M('GxP', 'Deviation management and reportable-event determination', 'Regulated organization', 'stayed'),
    ],
    rel: ['AGF-F083', 'AGF-F085', 'AGF-F100'],
    ref: 'The reporting deadlines under Art. 73 are measured in days. An organization without a detection and escalation path will generally exhaust them before the obligation is recognized.',
    tiers: 'Tiers 3–5',
  },

  'AGF-F101': {
    desc: 'A finding is recorded without a named owner or a date by which it must be resolved. It belongs to everyone and therefore to nobody, cannot be chased, cannot age, and cannot appear on any credible overdue report.',
    sectors: 'Cross-sector',
    ind: ['Findings with empty owner or due-date fields', 'Owners recorded as a team or function rather than a person', 'No overdue report, because nothing can be overdue', 'Findings resolved only when someone remembers them', 'Age of open findings unknown or uncalculated'],
    causes: ['Owner and due date optional rather than required at creation', 'Reviewers reluctant to assign work to people outside their reporting line', 'No agreed convention for setting due dates by severity', 'Findings created in a document that has no concept of ownership'],
    mit: ['Make owner and due date mandatory at finding creation', 'Record a named individual, with the accountable role alongside', 'Set default due dates by severity so the date requires a decision to extend, not to set', 'Report unowned and undated findings as an exception class', 'Reassign automatically when an owner leaves or changes role'],
    map: [
      M('ISO/IEC 42001', 'Clause 10.2 — corrective action requires determining what will be done, by whom, and by when', 'Organization', 'stayed'),
      M('GxP', 'CAPA ownership and due-date assignment', 'Regulated organization', 'stayed'),
      M('NIST AI RMF', 'GOVERN-2 accountability; MANAGE-4 risk treatment documentation', 'Organization', 'stayed'),
      M('SR 26-2', 'Issue management, ownership and tracking to closure', 'Banking organization', 'live'),
    ],
    rel: ['AGF-F100', 'AGF-F102', 'AGF-F042'],
    ref: 'The single cheapest failure mode in this stage to fix, and the one that unlocks escalation, ageing, and reporting.',
    tiers: 'Tiers 3–5',
  },

  'AGF-F103': {
    desc: 'A finding is marked complete with no artifact, link, or description of what was done. The record shows resolution; nothing demonstrates it. At audit the closure is indistinguishable from an unresolved finding that someone clicked closed.',
    sectors: 'Banking, biopharma, insurance — anywhere closure is examined externally',
    ind: ['Closed findings with no attachment or linked artifact', 'Closure comments consisting of a single word', 'Closure rates rising sharply before reporting cycles', 'No field requiring evidence at closure', 'Closures performed by the assignee with no second party involved'],
    causes: ['Evidence optional rather than required at closure', 'Closure treated as a status change rather than as an assertion requiring proof', 'No independent verification step, so nothing tests the assertion', 'Pressure to reduce open-finding counts before a reporting date'],
    mit: ['Require an evidence artifact or link before a finding can move to closed', 'Separate the assignee from the reviewer who confirms closure', 'Capture who confirmed closure and when, as part of the record', 'Sample closed findings for verification on a defined basis', 'Report closure-without-evidence as a control failure in its own right'],
    map: [
      M('ISO/IEC 42001', 'Clause 10.2 — corrective action including review of effectiveness; Clause 7.5 documented information', 'Organization', 'stayed'),
      M('GxP', 'CAPA effectiveness verification and closure documentation; ALCOA+ attributable and accurate', 'Regulated organization', 'stayed'),
      M('EU AI Act', 'Art. 12 logging; Art. 18 documentation retention', 'Provider', 'future'),
      M('SR 26-2', 'Issue closure evidence and validation of remediation', 'Banking organization', 'live'),
      M('NIST AI RMF', 'MANAGE-4 — documentation of risk treatment outcomes', 'Organization', 'stayed'),
    ],
    rel: ['AGF-F090', 'AGF-F100', 'AGF-F108'],
    ref: 'Closure without evidence is a common finding in regulated examinations precisely because it is invisible in internal metrics — the dashboard shows the item closed.',
    tiers: 'Tiers 3–5',
  },
};

/* ---------- new failure modes ---------- */
const ADDITIONS = {
  'AGF-TA11': [
    {
      id: 'AGF-F107',
      name: 'No challenge or rework path on remediation',
      severity: 'Moderate',
      plainTerms: "The reviewer thinks the work isn't good enough, but the only buttons are approve and close. So they either accept something substandard or email the person and hope — and either way the record shows a clean approval.",
      entryStatus: 'full',
      description: 'The remediation workflow allows a reviewer to accept work but not to return it with a reason. Inadequate remediation is either accepted or handled informally outside the system, and in both cases the record shows an unqualified closure that nothing distinguishes from good work.',
      sectors: 'Cross-sector',
      indicators: ['No rejected or returned state in the workflow', 'Rework negotiated over email or chat rather than in the record', 'No record of any finding ever being sent back', 'Reviewers approving work they describe informally as incomplete', 'No count of rework cycles per finding'],
      rootCauses: ['Workflow modelled as a linear path to closed, with no return edge', 'Reluctance to formally reject a colleague\'s work, in the absence of a neutral mechanism', 'Rejection assumed to be rare and therefore not designed for', 'Metrics reward closure rate, which a return path reduces'],
      mitigations: ['Provide an explicit challenge state that returns the item to the assignee with a recorded reason', 'Capture rework cycles as a quality signal rather than as a failure', 'Distinguish first-pass acceptance from accepted-after-rework in reporting', 'Make the reason for return a required field so the record explains itself'],
      mapping: [
        M('ISO/IEC 42001', 'Clause 10.2 — corrective action including review of whether the action was effective', 'Organization', 'stayed'),
        M('GxP', 'CAPA effectiveness review and rejection handling', 'Regulated organization', 'stayed'),
        M('SR 26-2', 'Effective challenge — a core expectation of model risk governance, which requires a mechanism for challenge to be expressed and recorded', 'Banking organization', 'live'),
        M('NIST AI RMF', 'GOVERN-4 — organizational practices supporting critical examination', 'Organization', 'stayed'),
      ],
      related: ['AGF-F103', 'AGF-F108', 'AGF-F035'],
      reference: 'Effective challenge is explicit supervisory language in US model risk guidance. A workflow with no return path cannot evidence it.',
      tiers: 'Tiers 3–5',
    },
    {
      id: 'AGF-F108',
      name: 'Remediation closed by its own owner',
      severity: 'High',
      plainTerms: 'The person who was asked to fix the problem is also the person who decides it was fixed. Nobody else looks. The record shows a completed action item and an approval that is really the same signature twice.',
      entryStatus: 'full',
      description: 'The assignee of a finding is also the party who closes it, with no independent confirmation. Self-certified closure is structurally the same weakness as self-validation at AGF-F060, occurring at the remediation stage instead of the validation stage.',
      sectors: 'Banking, biopharma, insurance — anywhere independence is an explicit expectation',
      indicators: ['Closure recorded by the same identity as the assignment', 'No reviewer field distinct from the owner field', 'No record of who confirmed completion', 'Closure timestamps identical to completion timestamps', 'Independence assumed from organizational distance rather than recorded'],
      rootCauses: ['Workflow provides a single actor role rather than separate assignee and reviewer', 'Reviewer capacity treated as overhead and removed under load', 'Assumption that the owner is best placed to judge completion, which is true of the work and not of the assurance', 'No policy stating who may close what'],
      mitigations: ['Separate assignee and reviewer as distinct required roles in the workflow', 'Prevent the assignee from performing the closing action on their own item', 'Record reviewer identity and timestamp as part of the closure', 'Scale independence to severity — critical findings reviewed outside the owning function', 'Sample self-closed historical items where the separation was introduced late'],
      mapping: [
        M('SR 26-2', 'Independent review and effective challenge, applied proportionately to materiality', 'Banking organization', 'live'),
        M('ISO/IEC 42001', 'Clause 9.2 internal audit independence; Clause 10.2 corrective action review', 'Organization', 'stayed'),
        M('GxP', 'CAPA review and approval by a party independent of the person performing the action; ALCOA+ attributable', 'Regulated organization', 'stayed'),
        M('EU AI Act', 'Art. 9 — risk management measures and their verification', 'Provider', 'future'),
        M('NIST AI RMF', 'GOVERN-3, GOVERN-4 — workforce accountability and critical examination', 'Organization', 'stayed'),
      ],
      related: ['AGF-F060', 'AGF-F103', 'AGF-F107'],
      reference: 'Independence of review is one of the oldest expectations in regulated assurance. Its absence in AI remediation workflows is usually a tooling limitation rather than a policy decision.',
      tiers: 'Tiers 3–5',
    },
  ],
};

/* ---------- apply ---------- */
let upgraded = 0;
let added = 0;

for (const stage of catalog.stages) {
  for (const mode of stage.failureModes) {
    const up = UPGRADES[mode.id];
    if (up && mode.entryStatus !== 'full') {
      mode.entryStatus = 'full';
      mode.description = up.desc;
      mode.variants = up.variants || [];
      mode.sectors = up.sectors;
      mode.indicators = up.ind;
      mode.rootCauses = up.causes;
      mode.mitigations = up.mit;
      mode.mapping = up.map;
      mode.related = up.rel;
      mode.reference = up.ref;
      mode.tiers = up.tiers;
      upgraded++;
    }
  }
  const adds = ADDITIONS[stage.id];
  if (adds) {
    for (const a of adds) {
      if (!stage.failureModes.some((m) => m.id === a.id)) {
        stage.failureModes.push(a);
        added++;
      }
    }
  }
}

catalog.meta.version = '1.0';
catalog.meta.steward = 'The Governance Commons';

fs.writeFileSync(FILE, `${JSON.stringify(catalog, null, 2)}\n`);

const all = catalog.stages.flatMap((s) => s.failureModes);
console.log(`Upgraded ${upgraded} entries to full, added ${added} new failure modes.`);
console.log(`Catalog now: ${catalog.stages.length} stages, ${all.length} modes, ${all.filter((m) => m.entryStatus === 'full').length} full.`);
for (const s of catalog.stages) {
  const f = s.failureModes.filter((m) => m.entryStatus === 'full').length;
  console.log(`  ${s.id}  ${String(f).padStart(2)} full / ${String(s.failureModes.length).padStart(2)} total`);
}
