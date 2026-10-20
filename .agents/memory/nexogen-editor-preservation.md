---
name: NexoGen editor preservation
description: Project-specific rule for redesigning NexoGen's editor without breaking existing work.
---

When changing NexoGen's editor UI, preserve existing editing workflows, features, and locally saved project data; extend the existing project format compatibly rather than replacing or resetting it.

**Why:** The user explicitly asked that the redesign not remove working features or data.

**How to apply:** Before broad UI changes, inspect existing editor behaviors and storage. Keep existing actions available, make new fields optional/backward-compatible, and verify existing saved projects still load.
