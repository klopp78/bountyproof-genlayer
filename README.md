# BountyProof for GenLayer

BountyProof is a GenLayer-native review layer for bug bounty and grant milestone
claims. A sponsor registers immutable bounty rules, repository scope, and payout
policy. A claimant then submits issue, pull request, commit, and reproduction
evidence. GenLayer validators fetch those sources, compare the claim against the
registered rules, and store a persistent `award_*` verdict receipt.

## Not the same as prior submissions

BountyProof is intentionally scoped to bounty and grant award adjudication. It is
not a release provenance checker, escrow release gate, model-risk monitor,
data-consent tool, or policy-change workflow. The contract has its own two-sided
record model:

- `bounty_*` records are sponsor-created program baselines with reward rules,
  repository scope, and payout policy commitments;
- `award_*` records are claimant-created award decisions that bind issue, pull
  request, commit, and reproduction snapshots to a payout recommendation;
- validators compare the live claimant evidence against the stored bounty
  baseline before writing approve, partial, reject, or needs_review receipts.

## Why it exists

Bounty and grant programs often rely on private spreadsheets, Discord messages,
or subjective after-the-fact scoring. BountyProof turns that process into an
auditable workflow:

- bounty rules, repository scope, and payout policy are fetched and committed at
  registration time;
- issue, pull request, commit, and reproduction evidence are fetched during
  claim assessment;
- validators recompute source commitments and compare consequential verdict
  fields;
- unreadable, duplicate, or weak evidence is downgraded to `needs_review`;
- the final award recommendation is tied to an evidence bundle hash and a
  stable assessment context hash.

## Contract

`contracts/bounty_proof.py`

Important methods:

- `register_bounty(...)` stores the sponsor, reward policy, and source
  commitments for a bounty program.
- `assess_claim(...)` reviews issue/PR/commit/reproduction evidence and stores
  an `award_*` verdict.
- `get_bounty(...)`, `get_claim(...)`, `list_bounty_ids()`, and
  `list_claim_ids()` read the stored records.

## Application

The web app has three user flows:

- `/bounty` registers the bounty baseline and reads the accepted `bounty_*`
  record.
- `/claim` submits claim evidence and reads the accepted `award_*` verdict.
- `/records` reads either record type from the deployed GenLayer contract.

The frontend uses `genlayer-js` against Studionet and does not present local
mock calculations as consensus results.

## Example evidence

The `examples/` directory contains public default URLs for bounty rules, payout
policy, issue notes, pull request notes, commit evidence, and reproduction
steps. They are intentionally simple so stewards can follow the complete flow
after deployment.

## Checks

```bash
npm run contract:check
npm run contract:test
npm run flow:check
npm run build
```

`contract:check` verifies the expected BountyProof contract shape.
`contract:test` executes a simulated register-and-assess lifecycle, including a
hostile duplicate or unreadable evidence case. `flow:check` simulates the app
write/read path and verifies receipt IDs are returned from accepted writes.
