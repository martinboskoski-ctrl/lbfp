
## Throwaway DB tests must not be able to touch the real DB (2026-10-30)
- Never derive a test DB name by string-replacing the URI and then `dropDatabase()` — if the
  replace misses, the real DB is dropped. Connect with `{ dbName: TEST_DB }`, assert
  `connection.name === TEST_DB` before running, and guard the drop with the same check.

## Per-user client state (2026-10-30)
- Mistake: the AI assistant chat was saved in sessionStorage under one fixed key, and the
  TanStack cache wasn't cleared on logout — a second top-management user on the same browser
  saw the first user's conversation.
- Rule: anything user-specific kept in the browser (storage keys, query keys) must include the
  user id, and logout/login must clear it. Remount user-bound components with `key={user._id}`.
