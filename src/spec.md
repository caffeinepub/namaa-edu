# Specification

## Summary
**Goal:** Improve the internal dashboard and activity visibility in Phase 2.1 by adding a “My focus today” block, making ownership clearer, enabling a mine-only filter, standardizing save/update trust signals, improving timeline wording, and preventing broken attachment download experiences (without implementing full attachment downloads).

**Planned changes:**
- Add a new top-of-page “My focus today” section above existing content on the Programs page, leaving all current blocks below in the same order.
- Populate “My focus today” with two read-only lists: “My open activities” (current user’s non-archived activities) and “Upcoming events” (soonest events from the existing upcoming events query), including clear empty states.
- Display activity owner labels (resolved to profile name when available, otherwise a safe fallback) on Activities page cards and Sprint Board cards.
- Add a “Mine only” filter control on the Activities page to filter activities to those owned by the current user, without changing default behavior when off.
- Standardize trust signals for key mutations by adding consistent disabled/loading button states and English success/error toasts for Activity (create/update/status change) and Documentation (create/update) flows.
- Replace mechanical timeline event type formatting on the Operational Visibility page with human-readable English labels for known event types, with safe fallback for unknown types.
- Add UI guardrails anywhere attachments currently offer downloads so users don’t hit broken download flows; hide/disable download actions and/or show an English message indicating downloads are not available yet.

**User-visible outcome:** The Programs page shows a new “My focus today” section with the user’s open activities and upcoming events; activities clearly show ownership, can be filtered to “Mine only,” save/update actions provide consistent loading and toast feedback, operational visibility timeline entries read naturally in English, and attachment download actions no longer lead to broken behavior and instead communicate that downloads aren’t available yet.
