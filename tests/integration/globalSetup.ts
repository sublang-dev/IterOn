// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 SubLang International <https://sublang.ai>

/**
 * Vitest global setup for integration tests.
 * Runs once before all integration test files.
 * If ITERON_TEST_IMAGE is not set (local run), builds iteron-sandbox:dev.
 *
 * Env flags:
 *   ITERON_TEST_IMAGE  — override the image (CI sets this); skips build entirely
 *   ITERON_FORCE_BUILD — rebuild even if iteron-sandbox:dev already exists locally
 */

import { execFileSync } from 'node:child_process';

export async function setup(): Promise<void> {
  if (process.env.ITERON_TEST_IMAGE) return;

  // Integration tests call `podman` directly — fail early if it isn't functional.
  try {
    execFileSync('podman', ['info'], { stdio: 'ignore' });
  } catch {
    throw new Error(
      'Podman is not installed or not functional. ' +
      'Integration tests require Podman (Docker is not sufficient).',
    );
  }

  const IMAGE = 'iteron-sandbox:dev';
  const forceRebuild = ['1', 'true'].includes(
    (process.env.ITERON_FORCE_BUILD ?? '').toLowerCase(),
  );

  let imageExists = false;
  if (!forceRebuild) {
    try {
      execFileSync('podman', ['image', 'exists', IMAGE], { stdio: 'ignore' });
      imageExists = true;
    } catch {
      // image not found — will build
    }
  }

  if (!imageExists) {
    execFileSync('bash', ['scripts/build-image.sh'], {
      stdio: 'inherit',
      timeout: 600_000,
    });
  }

  process.env.ITERON_TEST_IMAGE = IMAGE;
}
