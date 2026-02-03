# Specification

## Summary
**Goal:** Add Kid Profiles tied to Internet Identity users and enable a kid-mode UI context that restricts access to kid-allowed content.

**Planned changes:**
- Add a backend Kid Profile model persisted in stable storage and associated to the authenticated Internet Identity principal, supporting multiple Kid Profiles per principal and keeping kid data separate from internal staff data.
- Add backend APIs to list available Kid Profiles for the caller, select an active Kid Profile for the session context, and fetch the effective active context (kid vs internal) and active Kid Profile details.
- Enforce backend authorization boundaries so kid context can only access assigned Programs and their attachments, and is denied from internal CRUD/admin/logs features.
- Add a frontend post-login Kid Mode entry flow: detect available Kid Profiles, allow selecting a profile when multiple, auto-enter kid mode when exactly one, and show an English empty-state when none.
- Implement a kid-mode UI shell with a clearly distinct layout/navigation from the internal ops dashboard, showing only kid-allowed sections (Assigned Programs and Program attachments/documents) and blocking internal pages even via direct navigation.

**User-visible outcome:** After logging in with Internet Identity, a caretaker can choose (or be auto-placed into) a kid profile to enter a kid-friendly mode that only shows the kid’s assigned programs and attachments, while internal operations pages are hidden and inaccessible.
