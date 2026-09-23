# Reproduction Notes

Before fix:
1. Register a bounty baseline.
2. Submit an award claim from an unrelated claimant wallet.
3. Attempt to treat the claim as payout-ready without matching the policy.

After fix:
1. Validators fetch the rules, repository, policy, issue, PR, commit, and
   reproduction sources.
2. The verdict is downgraded to `needs_review` when evidence is unreadable,
   duplicated, or not tied to the bounty rules.
