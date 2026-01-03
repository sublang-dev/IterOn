<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
<!-- SPDX-FileCopyrightText: 2025 SubLang contributors <https://github.com/sublang-xyz> -->

# ITER-0000: License Headers

## Goal

Ensure all source files have proper SPDX license headers based on the project's license configuration.

## Deliverables

- [ ] Identify project license from LICENSE file or package.json
- [ ] Add SPDX headers to all source files missing them
- [ ] Document license header format in dev/rules.md

## Tasks

1. **Detect project license**
   - Check for LICENSE file at project root
   - Parse package.json `license` field as fallback
   - Map to SPDX identifier (e.g., Apache-2.0, MIT, GPL-3.0)

2. **Scan source files**
   - Find all `.ts`, `.js`, `.tsx`, `.jsx` files in src/
   - Find all `.md` files in specs/
   - Exclude node_modules, dist, and other build artifacts

3. **Apply headers**
   - Use appropriate comment syntax per file type
   - Preserve shebang lines (place header after `#!/usr/bin/env node`)
   - Skip files that already have SPDX headers

4. **Update rules**
   - Add SPDX header templates to dev/rules.md
   - Document dual licensing if applicable (code vs content)

## Test Cases

- TC-INIT-001: Verify init creates structure (see specs/tests/)

## Acceptance Criteria

- All source files have valid SPDX-License-Identifier header
- All source files have valid SPDX-FileCopyrightText header
- Headers match project's LICENSE file
- Running the check twice produces no changes (idempotent)
