# Pull Request: Enforce Sponsor Authorization

Changes:
- Adds sponsor-wallet verification before award execution.
- Rejects callers that are not the sponsor or delegated reviewer.
- Adds tests for unauthorized release attempts.

Review notes:
- The fix is scoped to the payout path.
- No unrelated behavior was changed.
