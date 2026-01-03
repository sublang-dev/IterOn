<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
<!-- SPDX-FileCopyrightText: 2025 SubLang contributors <https://github.com/sublang-xyz> -->

# ADR-0001: Initial Specs Structure

## Status

Accepted

## Context

Projects using iteron need a standardized directory structure for managing specifications, decisions, iterations, and tests. The structure should support both human collaboration and AI-assisted development workflows.

## Decision

The `iteron init` command creates the following structure:

```
specs/
├── decisions/    # Architecture Decision Records (ADRs)
├── iterations/   # Development iteration specs
├── user/         # User-facing specifications
├── dev/          # Internal development rules
└── tests/        # Test case specifications
```

### Folder Purposes

- **decisions/**: ADRs following the format `NNNN-<kebab-case-title>.md`
- **iterations/**: Iteration specs following the format `NNNN-<kebab-case-title>.md`
- **user/**: User requirements, stories, and acceptance criteria
- **dev/**: Internal rules (commit format, coding standards, CI/CD)
- **tests/**: Test cases organized by feature, not by iteration

### File Formats

All markdown files include SPDX headers:

```markdown
<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
<!-- SPDX-FileCopyrightText: 2025 SubLang contributors <https://github.com/sublang-xyz> -->
```

### Initial Files

The following files are created by default:

| Path | Purpose |
|------|---------|
| `dev/rules.md` | Commit message format, contribution rules |
| `decisions/0001-initial-specs-structure.md` | This ADR |
| `iterations/0000-license-headers.md` | First iteration spec |
| `tests/tc-init-creates-structure.md` | Test case for init command |

## Consequences

- Consistent structure across all iteron-managed projects
- Clear separation between user-facing and internal specs
- Test cases decoupled from iterations for better traceability
- SPDX headers ensure license clarity
