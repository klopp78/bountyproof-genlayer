import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = resolve("contracts/bounty_proof.py");
const source = readFileSync(contractPath, "utf8");
const firstLine = source.split(/\r?\n/, 1)[0];
const expectedRuntime = "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(firstLine.includes(expectedRuntime), `missing pinned runtime dependency: ${expectedRuntime}`);
assert(/class\s+BountyProof\s*\(\s*gl\.Contract\s*\)\s*:/.test(source), "BountyProof must inherit gl.Contract");
assert(!/gl\.get_webpage|gl\.exec_prompt|gl\.json_loads|gl\.json_dumps|gl\.msg/.test(source), "unsupported legacy gl APIs remain");

for (const method of ["register_bounty", "assess_claim", "get_bounty", "get_claim", "list_bounty_ids", "list_claim_ids"]) {
  assert(new RegExp(`def\\s+${method}\\s*\\(`).test(source), `missing method: ${method}`);
}

for (const method of ["register_bounty", "assess_claim"]) {
  assert(new RegExp(`@gl\\.public\\.write\\s+def\\s+${method}\\s*\\(`, "s").test(source), `${method} must be public.write`);
}

for (const method of ["get_bounty", "get_claim", "list_bounty_ids", "list_claim_ids"]) {
  assert(new RegExp(`@gl\\.public\\.view\\s+def\\s+${method}\\s*\\(`, "s").test(source), `${method} must be public.view`);
}

assert(/gl\.vm\.run_nondet_unsafe/.test(source), "missing GenLayer consensus gate");
assert(/gl\.nondet\.web\.render/.test(source), "missing source snapshot rendering");
assert(/gl\.nondet\.exec_prompt/.test(source), "missing validator prompt adjudication");
assert(/hashlib\.sha256/.test(source), "must use collision-resistant SHA-256");
assert(/baseline_hash/.test(source), "must persist bounty baseline commitment");
assert(/snapshot_commitments/.test(source), "must persist snapshot commitments");
assert(/evidence_bundle_hash/.test(source), "must persist evidence bundle hash");
assert(/assessment_context_hash/.test(source), "must persist assessment context hash");
assert(/duplicate_risk/.test(source), "must evaluate duplicate risk");
assert(/readable_count < 5/.test(source), "unreadable evidence must be downgraded");
assert(/_verdict_equal/.test(source), "validators must compare consequential verdict fields");

console.log("BountyProof contract check passed");
