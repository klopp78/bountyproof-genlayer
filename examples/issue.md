# Issue: Missing Authorization Check

The `/api/award/release` path accepted a release request without checking that
the caller was the bounty sponsor or an approved steward.

Impact:
- A malicious caller could attempt to trigger a payout recommendation for a
  claim they do not control.
- The vulnerable path affects the bounty payout workflow.

Expected behavior:
- Only the sponsor or a delegated reviewer can request an award release.
