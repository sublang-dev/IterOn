// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2025 SubLang contributors <https://github.com/sublang-xyz>

import { basename } from 'node:path';
import { findGitRoot } from '../utils/git.js';
import { createSpecsStructure } from '../utils/fs.js';

/**
 * Initialize the iteron specs directory structure.
 *
 * Behavior:
 * - If inside a git repo: creates specs/ at the git root
 * - If not in a git repo: creates specs/ in current directory
 */
export async function initCommand(): Promise<void> {
  const cwd = process.cwd();

  // Determine base path
  const gitRoot = findGitRoot(cwd);
  const basePath = gitRoot ?? cwd;

  // Provide context to user
  if (gitRoot) {
    console.log(`Git repository detected at: ${gitRoot}`);
  } else {
    console.log('Not inside a git repository, using current directory');
  }

  console.log(`Initializing iteron specs in: ${basePath}`);

  try {
    const { specsDir, subDirs } = await createSpecsStructure(basePath);

    // Report results
    console.log('\nCreated directory structure:');
    console.log(`  ${specsDir}/`);

    for (const result of subDirs) {
      const status = result.created ? '(created)' : '(already exists)';
      const dirName = basename(result.path);
      console.log(`    ${dirName}/ ${status}`);
    }

    console.log('\nIteron initialized successfully!');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to initialize iteron: ${message}`);
    process.exit(1);
  }
}
