# Commit Evidence

Commit: `bountyproof-authz-fix`

Files touched:
- `contracts/bounty_proof.py`
- `scripts/test-contract-lifecycle.mjs`

Security effect:
- An award can be recommended only after the claim evidence is assessed against
  the registered bounty baseline.
