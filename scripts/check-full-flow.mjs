import assert from "node:assert/strict";

const walletAddress = "0x1111111111111111111111111111111111111111";
const claimantAddress = "0x2222222222222222222222222222222222222222";
const bountyId = "bounty_9cfe7c9b23f8428f2d3a";
const claimId = "award_725bf671258bf0427c5e";

class StudioFlowSimulator {
  constructor() {
    this.bounties = new Map();
    this.claims = new Map();
  }

  async writeContract({ functionName, args }) {
    if (functionName === "register_bounty") {
      const [title, sponsor, currency, maxReward, rulesUrl, repoUrl, policyUrl] = args;
      assert.equal(title, "Critical API authorization bounty");
      assert.equal(sponsor, walletAddress);
      assert.equal(currency, "GEN");
      assert.equal(maxReward, "1500");
      assert.match(rulesUrl, /bounty-rules\.md$/);
      assert.match(repoUrl, /github\.com\/klopp78\/bountyproof-genlayer$/);
      assert.match(policyUrl, /payout-policy\.md$/);
      this.bounties.set(bountyId, { id: bountyId, sponsor_wallet: sponsor, baseline_hash: "a".repeat(64) });
      return "0xregisterbounty";
    }
    if (functionName === "assess_claim") {
      const [submittedBountyId, claimant, title, issueUrl, prUrl, commitUrl, reproductionUrl, amount] = args;
      assert.equal(submittedBountyId, bountyId);
      assert.equal(claimant, claimantAddress);
      assert.equal(title, "Fix missing authorization check in API route");
      assert.match(issueUrl, /issue\.md$/);
      assert.match(prUrl, /pull-request\.md$/);
      assert.match(commitUrl, /commit\.md$/);
      assert.match(reproductionUrl, /reproduction\.md$/);
      assert.equal(amount, "750");
      assert.ok(this.bounties.has(bountyId), "bounty must exist before claim assessment");
      this.claims.set(claimId, { id: claimId, bounty_id: bountyId, decision: "approve", evidence_bundle_hash: "b".repeat(64) });
      return "0xassessclaim";
    }
    throw new Error(`Unexpected write ${functionName}`);
  }

  async waitForTransactionReceipt({ hash }) {
    if (hash === "0xregisterbounty") return { txExecutionResult: bountyId };
    if (hash === "0xassessclaim") return { txExecutionResult: claimId };
    throw new Error(`Unknown transaction ${hash}`);
  }

  async readContract({ functionName, args }) {
    if (functionName === "get_bounty") return JSON.stringify(this.bounties.get(args[0]) ?? {});
    if (functionName === "get_claim") return JSON.stringify(this.claims.get(args[0]) ?? {});
    throw new Error(`Unexpected read ${functionName}`);
  }
}

function returnedIdFromReceipt(receipt, prefix) {
  const values = Object.values(receipt).filter((value) => typeof value === "string");
  const id = values.find((value) => value.startsWith(prefix));
  assert.ok(id, `receipt must contain ${prefix} ID`);
  return id;
}

const simulator = new StudioFlowSimulator();
const registerHash = await simulator.writeContract({
  functionName: "register_bounty",
  args: [
    "Critical API authorization bounty",
    walletAddress,
    "GEN",
    "1500",
    "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/bounty-rules.md",
    "https://github.com/klopp78/bountyproof-genlayer",
    "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/payout-policy.md",
  ],
});
const registerReceipt = await simulator.waitForTransactionReceipt({ hash: registerHash });
const returnedBountyId = returnedIdFromReceipt(registerReceipt, "bounty_");
assert.equal(returnedBountyId, bountyId);
assert.match(await simulator.readContract({ functionName: "get_bounty", args: [bountyId] }), /baseline_hash/);

const claimHash = await simulator.writeContract({
  functionName: "assess_claim",
  args: [
    bountyId,
    claimantAddress,
    "Fix missing authorization check in API route",
    "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/issue.md",
    "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/pull-request.md",
    "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/commit.md",
    "https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/reproduction.md",
    "750",
  ],
});
const claimReceipt = await simulator.waitForTransactionReceipt({ hash: claimHash });
const returnedClaimId = returnedIdFromReceipt(claimReceipt, "award_");
assert.equal(returnedClaimId, claimId);
assert.match(await simulator.readContract({ functionName: "get_claim", args: [claimId] }), /evidence_bundle_hash/);

console.log("BountyProof full flow check passed");
