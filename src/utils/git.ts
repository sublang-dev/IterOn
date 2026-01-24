// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2025 SubLang International <https://www.sublang.xyz>

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * Find the root of the git repository by traversing up the directory tree.
 * @param startPath - Directory to start searching from (defaults to cwd)
 * @returns The git root path, or null if not in a git repository
 */
export function findGitRoot(startPath: string = process.cwd()): string | null {
  let currentPath = resolve(startPath);

  while (true) {
    const gitDir = join(currentPath, '.git');
    if (existsSync(gitDir)) {
      return currentPath;
    }

    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) {
      // Reached filesystem root
      break;
    }
    currentPath = parentPath;
  }

  return null;
}
