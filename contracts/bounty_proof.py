# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import hashlib
import json
import typing


class BountyProof(gl.Contract):
    """Consensus bounty and grant milestone claim registry."""

    bounty_count: u64
    latest_bounty_id: str
    latest_claim_id: str
    bounty_ids: DynArray[str]
    claim_ids: DynArray[str]
    bounties: TreeMap[str, str]
    claims: TreeMap[str, str]

    def __init__(self):
        self.bounty_count = u64(0)
        self.latest_bounty_id = ""
        self.latest_claim_id = ""

    @gl.public.view
    def get_bounty_count(self) -> u64:
        return self.bounty_count

    @gl.public.view
    def get_latest_bounty_id(self) -> str:
        return self.latest_bounty_id

    @gl.public.view
    def get_latest_claim_id(self) -> str:
        return self.latest_claim_id

    @gl.public.view
    def get_bounty(self, bounty_id: str) -> str:
        return self.bounties.get(bounty_id, "")

    @gl.public.view
    def get_claim(self, claim_id: str) -> str:
        return self.claims.get(claim_id, "")

    @gl.public.view
    def list_bounty_ids(self) -> str:
        return json.dumps([bounty_id for bounty_id in self.bounty_ids], separators=(",", ":"))

    @gl.public.view
    def list_claim_ids(self) -> str:
        return json.dumps([claim_id for claim_id in self.claim_ids], separators=(",", ":"))

    @gl.public.write
    def register_bounty(
        self,
        program_title: str,
        sponsor_wallet: str,
        reward_currency: str,
        max_reward: str,
        rules_url: str,
        repository_url: str,
        payout_policy_url: str,
    ) -> str:
        title = _clean_text(program_title, 120, "program_title_required")
        sponsor = _canonical_wallet(sponsor_wallet)
        currency = _clean_text(reward_currency, 20, "currency_required").upper()
        budget = _clean_amount(max_reward, "max_reward_required")
        rules = _canonical_url(rules_url, "rules_url_required")
        repo = _canonical_url(repository_url, "repository_url_required")
        policy = _canonical_url(payout_policy_url, "payout_policy_url_required")

        sources = [_source("rules", rules), _source("repository", repo), _source("payout_policy", policy)]

        def leader_fn():
            snapshots = _render_sources(sources)
            return json.dumps(_baseline(title, sponsor, currency, budget, snapshots), separators=(",", ":"))

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                leader = json.loads(leader_result.value)
                local = _baseline(title, sponsor, currency, budget, _render_sources(sources))
                return _baseline_equal(leader, local)
            except Exception:
                return False

        baseline = json.loads(gl.vm.run_nondet_unsafe(leader_fn, validator_fn))
        bounty_id = _bounty_id(sponsor, title, baseline["baseline_hash"])
        if len(self.bounties.get(bounty_id, "")) > 0:
            raise Exception("bounty_already_registered")

        record = {
            "id": bounty_id,
            "program_title": title,
            "sponsor_wallet": sponsor,
            "reward_currency": currency,
            "max_reward": budget,
            "rules_url": rules,
            "repository_url": repo,
            "payout_policy_url": policy,
            "baseline_hash": baseline["baseline_hash"],
            "snapshot_commitments": baseline["snapshot_commitments"],
            "created_at": _now(),
        }
        self.bounties[bounty_id] = json.dumps(record, separators=(",", ":"))
        self.bounty_ids.append(bounty_id)
        self.latest_bounty_id = bounty_id
        self.bounty_count = u64(int(self.bounty_count) + 1)
        return bounty_id

    @gl.public.write
    def assess_claim(
        self,
        bounty_id: str,
        claimant_wallet: str,
        claim_title: str,
        issue_url: str,
        pull_request_url: str,
        commit_url: str,
        reproduction_url: str,
        requested_amount: str,
    ) -> str:
        normalized_bounty_id = _clean_id(bounty_id, "bounty_id_required")
        bounty_json = self.bounties.get(normalized_bounty_id, "")
        if len(bounty_json) == 0:
            raise Exception("unknown_bounty")
        bounty = json.loads(bounty_json)
        claimant = _canonical_wallet(claimant_wallet)
        title = _clean_text(claim_title, 140, "claim_title_required")
        issue = _canonical_url(issue_url, "issue_url_required")
        pr = _canonical_url(pull_request_url, "pull_request_url_required")
        commit = _canonical_url(commit_url, "commit_url_required")
        reproduction = _canonical_url(reproduction_url, "reproduction_url_required")
        amount = _clean_amount(requested_amount, "requested_amount_required")

        sources = [
            _source("rules", bounty["rules_url"]),
            _source("repository", bounty["repository_url"]),
            _source("payout_policy", bounty["payout_policy_url"]),
            _source("issue", issue),
            _source("pull_request", pr),
            _source("commit", commit),
            _source("reproduction", reproduction),
        ]

        def leader_fn():
            snapshots = _render_sources(sources)
            verdict = _judge_claim(bounty, claimant, title, amount, snapshots)
            return json.dumps(verdict, separators=(",", ":"))

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                leader = json.loads(leader_result.value)
                local = _judge_claim(bounty, claimant, title, amount, _render_sources(sources))
                return _verdict_equal(leader, local)
            except Exception:
                return False

        verdict = json.loads(gl.vm.run_nondet_unsafe(leader_fn, validator_fn))
        claim_id = _claim_id(normalized_bounty_id, claimant, title, verdict["evidence_bundle_hash"])
        if len(self.claims.get(claim_id, "")) > 0:
            raise Exception("claim_already_assessed")

        record = {
            "id": claim_id,
            "bounty_id": normalized_bounty_id,
            "claimant_wallet": claimant,
            "claim_title": title,
            "issue_url": issue,
            "pull_request_url": pr,
            "commit_url": commit,
            "reproduction_url": reproduction,
            "requested_amount": amount,
            "decision": verdict["decision"],
            "confidence": verdict["confidence"],
            "rule_match": verdict["rule_match"],
            "fix_verified": verdict["fix_verified"],
            "duplicate_risk": verdict["duplicate_risk"],
            "payout_recommended": verdict["payout_recommended"],
            "recommended_amount": verdict["recommended_amount"],
            "evidence_bundle_hash": verdict["evidence_bundle_hash"],
            "assessment_context_hash": verdict["assessment_context_hash"],
            "snapshot_commitments": json.loads(verdict["snapshot_commitments_json"]),
            "summary": verdict["summary"],
            "created_at": _now(),
        }
        self.claims[claim_id] = json.dumps(record, separators=(",", ":"))
        self.claim_ids.append(claim_id)
        self.latest_claim_id = claim_id
        return claim_id


def _baseline(title: str, sponsor: str, currency: str, budget: str, snapshots: typing.Sequence[dict]) -> dict:
    commitments = _commitments(snapshots)
    payload = {
        "program_title": title,
        "sponsor_wallet": sponsor,
        "reward_currency": currency,
        "max_reward": budget,
        "snapshot_commitments": commitments,
    }
    return {"baseline_hash": _sha256(_canonical_json(payload)), "snapshot_commitments": commitments}


def _judge_claim(bounty: dict, claimant: str, title: str, amount: str, snapshots: typing.Sequence[dict]) -> dict:
    commitments = _commitments(snapshots)
    context = {
        "bounty_id": bounty["id"],
        "baseline_hash": bounty["baseline_hash"],
        "claimant_wallet": claimant,
        "claim_title": title,
        "requested_amount": amount,
        "snapshot_commitments": commitments,
    }
    prompt = f"""
You are a GenLayer validator reviewing a bug bounty or grant milestone claim.

Decide whether the claim satisfies the bounty rules and payout policy. Consider
whether the issue, pull request, commit, and reproduction evidence are readable,
specific, tied to the repository, and sufficient for a payout recommendation.

Return only minified JSON with keys: decision, confidence, rule_match,
fix_verified, duplicate_risk, payout_recommended, recommended_amount, summary.
decision must be approve, partial, reject, or needs_review.

Bounty baseline:
{_canonical_json(bounty)}

Claim context:
{_canonical_json(context)}

Rendered evidence snapshots:
{_canonical_json(snapshots)}
"""
    data = json.loads(gl.nondet.exec_prompt(prompt))
    normalized = {
        "decision": _bounded_choice(str(data["decision"]).lower(), ["approve", "partial", "reject", "needs_review"]),
        "confidence": int(_bounded_u8(data["confidence"])),
        "rule_match": bool(data["rule_match"]),
        "fix_verified": bool(data["fix_verified"]),
        "duplicate_risk": bool(data["duplicate_risk"]),
        "payout_recommended": bool(data["payout_recommended"]),
        "recommended_amount": _clean_amount(str(data["recommended_amount"]), "recommended_amount_required"),
        "summary": _clean_text(str(data["summary"]), 220, "summary_required"),
    }
    readable_count = sum(1 for item in snapshots if len(item.get("snapshot_hash", "")) == 64)
    if readable_count < 5 or normalized["duplicate_risk"]:
        normalized["decision"] = "needs_review"
        normalized["payout_recommended"] = False
        normalized["confidence"] = min(int(normalized["confidence"]), 55)
    if normalized["decision"] in ["approve", "partial"] and not (normalized["rule_match"] and normalized["fix_verified"]):
        normalized["decision"] = "needs_review"
        normalized["payout_recommended"] = False
        normalized["confidence"] = min(int(normalized["confidence"]), 60)

    bundle = {"context": context, "normalized": normalized}
    normalized["evidence_bundle_hash"] = _sha256(_canonical_json(bundle))
    normalized["assessment_context_hash"] = _sha256(_canonical_json(context))
    normalized["snapshot_commitments_json"] = json.dumps(commitments, separators=(",", ":"))
    return normalized


def _render_sources(sources: typing.Sequence[dict]) -> typing.Sequence[dict]:
    snapshots = []
    for source in sources:
        try:
            rendered_text = gl.nondet.web.render(source["canonical_url"], mode="text")[:6000]
            fetch_error = ""
        except Exception as error:
            rendered_text = ""
            fetch_error = str(error)[:240]
        snapshots.append(
            {
                "role": source["role"],
                "canonical_url": source["canonical_url"],
                "snapshot_hash": _sha256(rendered_text) if len(rendered_text) > 0 else "",
                "snapshot_excerpt": rendered_text[:700],
                "fetch_error": fetch_error,
            }
        )
    return snapshots


def _commitments(snapshots: typing.Sequence[dict]) -> typing.Sequence[dict]:
    return [
        {
            "role": item["role"],
            "canonical_url": item["canonical_url"],
            "snapshot_hash": item.get("snapshot_hash", ""),
            "fetch_error_hash": _sha256(item.get("fetch_error", "")) if item.get("fetch_error", "") else "",
        }
        for item in snapshots
    ]


def _baseline_equal(a: dict, b: dict) -> bool:
    return a["baseline_hash"] == b["baseline_hash"] and _canonical_json(a["snapshot_commitments"]) == _canonical_json(b["snapshot_commitments"])


def _verdict_equal(a: dict, b: dict) -> bool:
    keys = [
        "decision",
        "confidence",
        "rule_match",
        "fix_verified",
        "duplicate_risk",
        "payout_recommended",
        "recommended_amount",
        "evidence_bundle_hash",
        "assessment_context_hash",
        "snapshot_commitments_json",
    ]
    return all(a[key] == b[key] for key in keys)


def _source(role: str, url: str) -> dict:
    return {"role": role, "canonical_url": _canonical_url(url, f"{role}_url_required")}


def _bounty_id(sponsor: str, title: str, baseline_hash: str) -> str:
    return "bounty_" + _sha256(sponsor + "|" + title + "|" + baseline_hash)[:20]


def _claim_id(bounty_id: str, claimant: str, title: str, bundle_hash: str) -> str:
    return "award_" + _sha256(bounty_id + "|" + claimant + "|" + title + "|" + bundle_hash)[:20]


def _canonical_wallet(value: str) -> str:
    clean = str(value).strip()
    if len(clean) != 42 or not clean.startswith("0x"):
        raise Exception("invalid_wallet")
    int(clean[2:], 16)
    return clean.lower()


def _canonical_url(value: str, error: str) -> str:
    clean = str(value).strip()
    if not (clean.startswith("https://") and len(clean) <= 260):
        raise Exception(error)
    return clean


def _clean_id(value: str, error: str) -> str:
    clean = str(value).strip()
    if len(clean) < 8 or len(clean) > 80:
        raise Exception(error)
    return clean


def _clean_text(value: str, max_length: int, error: str) -> str:
    clean = " ".join(str(value).strip().split())
    if len(clean) == 0 or len(clean) > max_length:
        raise Exception(error)
    return clean


def _clean_amount(value: str, error: str) -> str:
    clean = str(value).strip()
    if len(clean) == 0 or len(clean) > 32:
        raise Exception(error)
    amount = float(clean)
    if amount < 0:
        raise Exception(error)
    return clean


def _bounded_choice(value: str, choices: typing.Sequence[str]) -> str:
    if value not in choices:
        return "needs_review"
    return value


def _bounded_u8(value) -> u8:
    integer = int(value)
    if integer < 0:
        integer = 0
    if integer > 100:
        integer = 100
    return u8(integer)


def _canonical_json(value) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _now() -> int:
    return int(gl.block.timestamp)
