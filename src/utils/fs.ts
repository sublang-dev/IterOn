// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2025 SubLang contributors <https://github.com/sublang-xyz>

import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface CreateDirResult {
  path: string;
  created: boolean;
}

/**
 * Create a directory if it doesn't exist.
 */
async function ensureDir(dirPath: string): Promise<CreateDirResult> {
  if (existsSync(dirPath)) {
    return { path: dirPath, created: false };
  }
  await mkdir(dirPath, { recursive: true });
  return { path: dirPath, created: true };
}

/**
 * Create the iteron specs directory structure.
 */
export async function createSpecsStructure(basePath: string): Promise<{
  specsDir: string;
  subDirs: CreateDirResult[];
}> {
  const specsDir = join(basePath, 'specs');
  const subfolders = ['decisions', 'iterations', 'user', 'dev', 'tests'];

  // Create specs directory first
  await ensureDir(specsDir);

  // Create all subdirectories
  const subDirs = await Promise.all(
    subfolders.map(folder => ensureDir(join(specsDir, folder)))
  );

  return { specsDir, subDirs };
}
