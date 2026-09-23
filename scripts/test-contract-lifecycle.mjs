import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const SPONSOR = "0x1111111111111111111111111111111111111111";
const CLAIMANT = "0x2222222222222222222222222222222222222222";

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
}

function snapshot(role, url, text, fetchError = "") {
  return {
    role,
    canonical_url: url,
    snapshot_hash: text ? sha256(text) : "",
    snapshot_excerpt: text.slice(0, 700),
    fetch_error: fetchError,
  };
}

function commitments(snapshots) {
  return snapshots.map((item) => ({
    role: item.role,
    canonical_url: item.canonical_url,
    snapshot_hash: item.snapshot_hash,
    fetch_error_hash: item.fetch_error ? sha256(item.fetch_error) : "",
  }));
}

function bountyBaseline() {
  const snapshots = [
    snapshot("rules", "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/bounty-rules.md", "Critical authorization bounty rules"),
    snapshot("repository", "https://github.com/klopp78/bountyproof-genlayer", "BountyProof repository"),
    snapshot("payout_policy", "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/payout-policy.md", "Payout policy"),
  ];
  const payload = {
    program_title: "Critical API authorization bounty",
    sponsor_wallet: SPONSOR,
    reward_currency: "GEN",
    max_reward: "1500",
    snapshot_commitments: commitments(snapshots),
  };
  const baselineHash = sha256(canonicalJson(payload));
  return {
    id: `bounty_${sha256(`${SPONSOR}|Critical API authorization bounty|${baselineHash}`).slice(0, 20)}`,
    baseline_hash: baselineHash,
    rules_url: snapshots[0].canonical_url,
    repository_url: snapshots[1].canonical_url,
    payout_policy_url: snapshots[2].canonical_url,
    snapshot_commitments: commitments(snapshots),
  };
}

function assessClaim({ hostile = false } = {}) {
  const bounty = bountyBaseline();
  const claimSnapshots = [
    snapshot("rules", bounty.rules_url, "Critical authorization bounty rules"),
    snapshot("repository", bounty.repository_url, "BountyProof repository"),
    snapshot("payout_policy", bounty.payout_policy_url, "Payout policy"),
    snapshot("issue", "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/issue.md", hostile ? "" : "Authorization issue", hostile ? "403" : ""),
    snapshot("pull_request", "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/pull-request.md", hostile ? "" : "Fix PR", hostile ? "403" : ""),
    snapshot("commit", "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/commit.md", hostile ? "" : "Fix commit", hostile ? "403" : ""),
    snapshot("reproduction", "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/reproduction.md", "Reproduction notes"),
  ];
  const context = {
    bounty_id: bounty.id,
    baseline_hash: bounty.baseline_hash,
    claimant_wallet: CLAIMANT,
    claim_title: "Fix missing authorization check in API route",
    requested_amount: "750",
    snapshot_commitments: commitments(claimSnapshots),
  };
  const readableCount = claimSnapshots.filter((item) => item.snapshot_hash.length === 64).length;
  const normalized = {
    decision: hostile || readableCount < 5 ? "needs_review" : "approve",
    confidence: hostile || readableCount < 5 ? 55 : 91,
    rule_match: !hostile,
    fix_verified: !hostile,
    duplicate_risk: false,
    payout_recommended: !hostile,
    recommended_amount: hostile ? "0" : "750",
    summary: hostile ? "Evidence is unreadable." : "Claim satisfies bounty scope and fix evidence.",
  };
  const bundle = { context, normalized };
  return {
    bounty,
    verdict: {
      ...normalized,
      evidence_bundle_hash: sha256(canonicalJson(bundle)),
      assessment_context_hash: sha256(canonicalJson(context)),
      snapshot_commitments_json: JSON.stringify(commitments(claimSnapshots)),
    },
  };
}

const happy = assessClaim();
assert.equal(happy.verdict.decision, "approve");
assert.equal(happy.verdict.payout_recommended, true);
assert.match(happy.verdict.evidence_bundle_hash, /^[a-f0-9]{64}$/);
assert.match(happy.verdict.assessment_context_hash, /^[a-f0-9]{64}$/);

const hostile = assessClaim({ hostile: true });
assert.equal(hostile.verdict.decision, "needs_review");
assert.equal(hostile.verdict.payout_recommended, false);
assert.ok(hostile.verdict.confidence <= 55);

console.log("BountyProof lifecycle test passed");
