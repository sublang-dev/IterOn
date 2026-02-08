// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 SubLang International <https://www.sublang.ai>

import {
  isContainerRunning,
  containerExists,
  podmanExec,
  podmanErrorMessage,
} from '../utils/podman.js';
import { readConfig } from '../utils/config.js';

export async function stopCommand(): Promise<void> {
  try {
    const config = await readConfig();
    const { name } = config.container;

    if (!(await isContainerRunning(name))) {
      console.log(`Container "${name}" is not running.`);
      return;
    }

    console.log(`Stopping container "${name}" (30s grace period)...`);
    await podmanExec(['stop', '-t', '30', name]);

    if (await containerExists(name)) {
      await podmanExec(['rm', name]);
    }

    console.log(`Container "${name}" stopped and removed.`);
  } catch (error) {
    console.error(`Error: ${podmanErrorMessage(error)}`);
    process.exit(1);
  }
}
