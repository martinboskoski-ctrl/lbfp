
## Throwaway DB tests must not be able to touch the real DB (2026-10-30)
- Never derive a test DB name by string-replacing the URI and then `dropDatabase()` — if the
  replace misses, the real DB is dropped. Connect with `{ dbName: TEST_DB }`, assert
  `connection.name === TEST_DB` before running, and guard the drop with the same check.
