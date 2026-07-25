# feat/githits-cli Lessons Learned

| Lesson | Disposition | Durable owner |
| --- | --- | --- |
| Shared agent tooling should invoke a workspace-locked CLI instead of downloading a moving `latest` release. | Applied | Root `githits` dev dependency; `githits-code` skill |
| An upstream skills lock can overwrite repository-specific skill customization. | Applied | Repository-owned skill; no upstream `skills-lock.json` entry |
| Modified copied skill content must retain its upstream license and carry modification notices. | Applied | `.agents/skills/githits-code/LICENSE` and skill notices |
| Tooling-only advisories still require explicit reachability review and human acceptance. | Applied | Delivery review for PR #42 |
