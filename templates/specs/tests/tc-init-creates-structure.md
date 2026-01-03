<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
<!-- SPDX-FileCopyrightText: 2025 SubLang contributors <https://github.com/sublang-xyz> -->

# TC-INIT-001: Init Creates Structure

## Description

Verify that `iteron init` creates the expected directory structure and initial files.

## Preconditions

- iteron CLI is installed
- Target directory exists and is empty or has no specs/ folder

## Steps

1. Run `iteron init <target-dir>`
2. Verify directory structure is created
3. Verify initial files are copied

## Expected Results

### Directories Created

```
specs/
├── decisions/
├── iterations/
├── user/
├── dev/
└── tests/
```

### Files Created

- `specs/dev/rules.md`
- `specs/decisions/0001-initial-specs-structure.md`
- `specs/iterations/0000-license-headers.md`
- `specs/tests/tc-init-creates-structure.md`

## Verification Command

```bash
# Verify all expected paths exist
ls -la specs/decisions specs/iterations specs/user specs/dev specs/tests

# Verify initial files have SPDX headers
grep -l "SPDX-License-Identifier" specs/dev/rules.md specs/decisions/*.md specs/iterations/*.md specs/tests/*.md
```

## Regex Validation

To verify the init structure programmatically:

```bash
# Check that specs has all 5 subdirectories
find specs -maxdepth 1 -type d | grep -E "specs/(decisions|iterations|user|dev|tests)$" | wc -l
# Expected: 5

# Check that initial files exist with proper headers
grep -rE "^<!-- SPDX-License-Identifier: CC-BY-SA-4\.0 -->$" specs/ | wc -l
# Expected: >= 4
```
