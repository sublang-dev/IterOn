#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2025 SubLang International <https://www.sublang.ai>

import { Command } from 'commander';
import { scaffoldCommand } from './commands/scaffold.js';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';

const program = new Command();

program
  .name('iteron')
  .description('Delegate dev loops to Claude Code + Codex CLI. Iterates for hours. No API keys.')
  .version('0.1.2');

program
  .command('scaffold')
  .description('Create iteron specs directory structure and templates')
  .argument('[path]', 'target directory (defaults to git root or cwd)')
  .action(scaffoldCommand);

program
  .command('init')
  .description('Install Podman, pull image, create volume and config')
  .option('--image <url>', 'custom OCI image URL')
  .option('-y, --yes', 'skip confirmation prompts')
  .action(initCommand);

program
  .command('start')
  .description('Launch the sandbox container')
  .action(startCommand);

program
  .command('stop')
  .description('Stop and remove the sandbox container')
  .action(stopCommand);

program.parse();
