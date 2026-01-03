// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2025 SubLang contributors <https://github.com/sublang-xyz>

import { mkdir, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

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

export interface CopyResult {
  path: string;
  copied: boolean;
}

/**
 * Get the templates directory path.
 */
function getTemplatesDir(): string {
  // __dirname is dist/utils, go up to package root
  const distDir = dirname(__dirname);
  return join(dirname(distDir), 'templates');
}

/**
 * Recursively copy template files to destination.
 * Only copies files that don't already exist.
 */
async function copyTemplateDir(
  srcDir: string,
  destDir: string,
  results: CopyResult[]
): Promise<void> {
  const entries = await readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);

    if (entry.isDirectory()) {
      await ensureDir(destPath);
      await copyTemplateDir(srcPath, destPath, results);
    } else {
      if (existsSync(destPath)) {
        results.push({ path: destPath, copied: false });
      } else {
        await ensureDir(dirname(destPath));
        await copyFile(srcPath, destPath);
        results.push({ path: destPath, copied: true });
      }
    }
  }
}

/**
 * Copy template files to the specs directory.
 */
export async function copyTemplates(specsDir: string): Promise<CopyResult[]> {
  const templatesDir = getTemplatesDir();
  const templateSpecsDir = join(templatesDir, 'specs');
  const results: CopyResult[] = [];

  if (existsSync(templateSpecsDir)) {
    await copyTemplateDir(templateSpecsDir, specsDir, results);
  }

  return results;
}
