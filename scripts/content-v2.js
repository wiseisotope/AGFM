#!/usr/bin/env node
/**
 * v1.1 content pass — automation-potential tagging.
 *
 * Adds `automationPotential` and `automationNote` to every complete entry, using
 * the three-tier definitions in data/sets.json (automationTiers). This is the data
 * layer behind the "where to automate, where to slow down" page and the
 * self-assessment's automation-aware results.
 *
 * Idempotent: running twice is safe.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// tier: 'systematic' | 'partial' | 'judgment'
const TAGS = {
  'AGF-F003': ['systematic', 'Once tiers and routing rules are defined, classification and routing run as a rule engine. The judgment is in setting the tiers once, not in applying them case by case.'],
  'AGF-F010': ['systematic', 'Tying intake to a structural gate — funding release, access provisioning — removes the need for anyone to remember or choose to submit.'],
  'AGF-F011': ['partial', 'Detecting unsanctioned use is systematic (telemetry, tool discovery). Deciding how to respond to a given instance — block, redirect, allow with conditions — needs judgment.'],
  'AGF-F015': ['partial', 'Scanning vendor release notes and contract terms for new AI capability can be automated. Determining the resulting risk tier and required controls needs a person.'],
  'AGF-F016': ['partial', 'Flagging systems with tool-access or write permissions can be automated. Classifying the resulting risk still needs judgment.'],
  'AGF-F018': ['systematic', 'Routing criteria, once defined, apply as rules. No one needs to decide case by case which queue a submission belongs in.'],
  'AGF-F023': ['partial', 'A rule can flag customer-facing or EU-touching use cases automatically. Confirming the specific disclosure requirement and implementing it needs a person.'],
  'AGF-F027': ['systematic', 'The core fix here is structural: tiered routing by risk score removes the need for a person to decide review depth every time.'],
  'AGF-F031': ['systematic', 'Expiry dates and change-triggered re-review can run as automatic triggers. No one needs to remember to check.'],
  'AGF-F032': ['partial', 'Monitoring usage against a declared boundary can be automated as a flag. Deciding whether a deviation is acceptable needs judgment.'],
  'AGF-F033': ['partial', 'Tracking whether a condition has an attached evidence artifact can be automated. Judging whether the evidence actually satisfies the condition needs a person.'],
  'AGF-F037': ['systematic', 'SLA timers and escalation triggers are exactly the kind of thing a system should run without anyone watching a clock.'],
  'AGF-F038': ['partial', 'Surfacing similar past decisions to a reviewer can be automated as search and retrieval. Applying or distinguishing the precedent needs judgment.'],
  'AGF-F039': ['systematic', 'This is a one-time process-design fix — reordering gates or adding a prerequisite-artifact stage — not a recurring judgment call.'],
  'AGF-F040': ['judgment', 'The clearest case in this catalog. The checkpoint that enforces review can and should be automated — but the review itself is specifically the decision that must stay human. Automating the human step away is the failure mode, not the fix.'],
  'AGF-F042': ['partial', 'Detecting an ownership gap — owner absent from the directory, a leaver event — can be automated. Reassigning ownership needs a person to accept accountability.'],
  'AGF-F044': ['judgment', 'Naming a single accountable owner and defining authority is an organizational decision. No system can make it for you.'],
  'AGF-F051': ['partial', 'Checking a dataset against a rights register can be automated. The initial rights determination itself needs legal judgment.'],
  'AGF-F065': ['partial', 'Scheduling tests and retaining evidence can be automated. Interpreting the results and deciding on remediation needs a person.'],
  'AGF-F066': ['judgment', 'There is no rule to automate yet. What a fit-for-purpose control framework for generative and agentic systems should look like is itself an open judgment call.'],
  'AGF-F067': ['systematic', 'A defined readiness checklist — rollback plan exists, monitoring configured, oversight assigned — can be enforced as an automatic gate before deployment.'],
  'AGF-F071': ['partial', 'Detecting a vendor version change can be automated through monitoring or contractual notice triggers. Deciding whether the change requires re-review needs judgment.'],
  'AGF-F080': ['partial', 'Scheduling reviews and flagging missed ones can be automated. Interpreting whether observed drift is acceptable needs a person.'],
  'AGF-F082': ['systematic', 'Once a definition and a reporting channel are agreed — a one-time decision — routing and deadline tracking against statutory day-counts can run automatically.'],
  'AGF-F090': ['systematic', 'Capturing evidence automatically at the moment a control operates removes the need for anyone to remember to document it after the fact.'],
  'AGF-F095': ['systematic', 'Aggregating register data into a standing dashboard is exactly the kind of reporting a system should generate without manual compilation.'],
  'AGF-F096': ['systematic', 'Snapshotting records at completion is a one-time architectural decision, not a recurring judgment.'],
  'AGF-F100': ['systematic', 'This is fundamentally a tooling gap. Recording findings as tracked objects in the system of record is a structural fix, not a per-finding decision.'],
  'AGF-F101': ['systematic', 'Making owner and due date mandatory fields is a structural constraint a system enforces, not something that needs judgment each time.'],
  'AGF-F103': ['partial', 'Requiring an evidence attachment before closure can be enforced automatically. Judging whether the evidence is actually adequate needs a person.'],
  'AGF-F107': ['systematic', 'Adding a return-with-reason state to a workflow is a structural feature. It does not require judgment to exist — only to use.'],
  'AGF-F108': ['systematic', 'Separating assignee and reviewer roles, and blocking self-closure, is an access-control rule a system enforces automatically.'],
};

let tagged = 0;
for (const stage of catalog.stages) {
  for (const mode of stage.failureModes) {
    if (mode.entryStatus === 'full' && TAGS[mode.id]) {
      const [tier, note] = TAGS[mode.id];
      mode.automationPotential = tier;
      mode.automationNote = note;
      tagged++;
    }
  }
}

const all = catalog.stages.flatMap((s) => s.failureModes);
const full = all.filter((m) => m.entryStatus === 'full');
const untagged = full.filter((m) => !m.automationPotential);
if (untagged.length) {
  console.error('Full entries left untagged:', untagged.map((m) => m.id).join(', '));
  process.exit(1);
}

catalog.meta.version = '1.1';

fs.writeFileSync(FILE, `${JSON.stringify(catalog, null, 2)}\n`);

const counts = { systematic: 0, partial: 0, judgment: 0 };
full.forEach((m) => counts[m.automationPotential]++);
console.log(`Tagged ${tagged} complete entries.`);
console.log(`  systematic  ${counts.systematic}`);
console.log(`  partial     ${counts.partial}`);
console.log(`  judgment    ${counts.judgment}`);
