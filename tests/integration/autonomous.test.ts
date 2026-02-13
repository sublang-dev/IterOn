// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 SubLang International <https://www.sublang.ai>

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rm, mkdir } from 'node:fs/promises';
import { spawnSync, execFileSync } from 'node:child_process';

// Requires the real sandbox image (agents must be installed).
const TEST_IMAGE = process.env.ITERON_TEST_IMAGE ?? '';
const HAS_SANDBOX_IMAGE = !!TEST_IMAGE;
const TEST_CONTAINER = 'iteron-test-sandbox';

const SETUP_FIXTURE = join(import.meta.dirname, '..', 'setup-fixture.sh');

/** Regex patterns that indicate an agent paused for permission approval. */
const PERMISSION_PATTERNS = /\[Y\/n\]|\bAllow\b|\bapprove\b|permission to |Do you want to|trust this/i;

let configDir: string;

function podmanAvailable(): boolean {
  try {
    execFileSync('podman', ['info'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const HAS_PODMAN = podmanAvailable();

function podmanExecSync(args: string[], options?: { timeout?: number }): string {
  return execFileSync('podman', args, {
    encoding: 'utf-8',
    timeout: options?.timeout,
  }).trim();
}

function containerExec(cmd: string[], options?: { timeout?: number }): string {
  return podmanExecSync(['exec', TEST_CONTAINER, ...cmd], options);
}

/**
 * Run an agent command inside the container, capturing combined stdout+stderr.
 * Returns { exitCode, log }.
 */
function runAgent(
  workspace: string,
  agentCmd: string,
  timeout = 120_000,
): { exitCode: number; log: string } {
  const result = spawnSync(
    'podman',
    ['exec', TEST_CONTAINER, 'bash', '-c', `cd /home/iteron/${workspace} && ${agentCmd}`],
    { encoding: 'utf-8', timeout },
  );
  return {
    exitCode: result.status ?? 1,
    log: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  };
}

/** Create the buggy test fixture in a container workspace. */
function setupFixture(workspace: string): void {
  execFileSync('bash', [SETUP_FIXTURE, TEST_CONTAINER, workspace], {
    encoding: 'utf-8',
    timeout: 30_000,
  });
}

/** Verify npm test passes after an agent fix. */
function verifyNpmTest(workspace: string): { exitCode: number; output: string } {
  try {
    const stdout = containerExec(
      ['bash', '-c', `cd /home/iteron/${workspace} && npm test`],
      { timeout: 30_000 },
    );
    return { exitCode: 0, output: stdout };
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: e.status ?? 1,
      output: `${e.stdout ?? ''}\n${e.stderr ?? ''}`,
    };
  }
}

async function cleanup(): Promise<void> {
  try { execFileSync('podman', ['stop', '-t', '0', TEST_CONTAINER], { stdio: 'ignore' }); } catch {}
  try { execFileSync('podman', ['rm', '-f', TEST_CONTAINER], { stdio: 'ignore' }); } catch {}
}

// Skip entirely when no sandbox image or no Podman — these tests need real agents.
describe.skipIf(!HAS_PODMAN || !HAS_SANDBOX_IMAGE)(
  'IR-006 autonomous execution (integration)',
  { timeout: 300_000, sequential: true },
  () => {
    beforeAll(async () => {
      await cleanup();

      configDir = mkdtempSync(join(tmpdir(), 'iteron-autonomous-test-'));
      process.env.ITERON_CONFIG_DIR = configDir;

      await mkdir(configDir, { recursive: true });

      const configToml = `[container]
name = "${TEST_CONTAINER}"
image = "${TEST_IMAGE}"
memory = "2g"

[agents.claude-code]
binary = "claude"

[agents.codex-cli]
binary = "codex"

[agents.gemini-cli]
binary = "gemini"

[agents.opencode]
binary = "opencode"
`;
      writeFileSync(join(configDir, 'config.toml'), configToml, 'utf-8');

      // .env must supply valid auth tokens; tests rely on IR-005 headless auth.
      // The real .env is expected at ~/.iteron/.env — copy it for the test.
      const realEnv = join(process.env.HOME ?? '', '.iteron', '.env');
      try {
        const envContent = execFileSync('cat', [realEnv], { encoding: 'utf-8' });
        writeFileSync(join(configDir, '.env'), envContent, 'utf-8');
      } catch {
        // Fall back to empty .env; individual tests will fail with auth errors.
        writeFileSync(join(configDir, '.env'), '# no auth tokens available\n', 'utf-8');
      }

      // Remove stale volume so image autonomy configs propagate to a fresh one.
      try { execFileSync('podman', ['volume', 'rm', '-f', 'iteron-data'], { stdio: 'ignore' }); } catch {}
      try { execFileSync('podman', ['volume', 'create', 'iteron-data'], { stdio: 'ignore' }); } catch {}

      const { startCommand } = await import('../../src/commands/start.js');
      await startCommand();
    });

    afterAll(async () => {
      await cleanup();
      try { execFileSync('podman', ['volume', 'rm', '-f', 'iteron-data'], { stdio: 'ignore' }); } catch {}
      delete process.env.ITERON_CONFIG_DIR;
      if (configDir) await rm(configDir, { recursive: true, force: true });
    });

    // ── Verification #1: fixture pre-check ──────────────────────────────

    it('fixture npm test fails before fix', () => {
      setupFixture('test-precheck');

      const result = verifyNpmTest('test-precheck');
      expect(result.exitCode).not.toBe(0);
      expect(result.output).toMatch(/AssertionError|AssertionError/i);

      // Cleanup
      try { containerExec(['rm', '-rf', '/home/iteron/test-precheck']); } catch {}
    });

    // ── Verification #2–3: Claude Code ──────────────────────────────────

    let ccLog = '';

    it('Claude Code autonomously fixes the bug', () => {
      setupFixture('test-cc');

      const agent = runAgent(
        'test-cc',
        'claude -p "Fix the bug in src/calc.js so that npm test passes. Do not modify tests/test_calc.js." --output-format json',
      );
      ccLog = agent.log;
      expect(agent.exitCode).toBe(0);

      const result = verifyNpmTest('test-cc');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('PASS');
    });

    it('Claude Code log has no permission prompts', () => {
      expect(ccLog).not.toMatch(PERMISSION_PATTERNS);
    });

    // ── Verification #4–5: Codex CLI ────────────────────────────────────

    let codexLog = '';

    it('Codex CLI autonomously fixes the bug', () => {
      setupFixture('test-codex');

      const agent = runAgent(
        'test-codex',
        'codex exec "Fix the bug in src/calc.js so that npm test passes. Do not modify tests/test_calc.js."',
      );
      codexLog = agent.log;
      expect(agent.exitCode).toBe(0);

      const result = verifyNpmTest('test-codex');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('PASS');
    });

    it('Codex CLI log has no permission prompts', () => {
      expect(codexLog).not.toMatch(PERMISSION_PATTERNS);
    });

    // ── Verification #6–7: Gemini CLI ───────────────────────────────────

    let geminiLog = '';

    it('Gemini CLI autonomously fixes the bug', () => {
      setupFixture('test-gemini');

      const agent = runAgent(
        'test-gemini',
        'gemini -p "Fix the bug in src/calc.js so that npm test passes. Do not modify tests/test_calc.js."',
      );
      geminiLog = agent.log;
      expect(agent.exitCode).toBe(0);

      const result = verifyNpmTest('test-gemini');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('PASS');
    });

    it('Gemini CLI log has no permission prompts', () => {
      expect(geminiLog).not.toMatch(PERMISSION_PATTERNS);
    });

    // ── Verification #8–9: OpenCode ─────────────────────────────────────

    let opencodeLog = '';

    it('OpenCode autonomously fixes the bug', () => {
      setupFixture('test-opencode');

      const agent = runAgent(
        'test-opencode',
        'opencode run "Fix the bug in src/calc.js so that npm test passes. Do not modify tests/test_calc.js."',
      );
      opencodeLog = agent.log;
      expect(agent.exitCode).toBe(0);

      const result = verifyNpmTest('test-opencode');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('PASS');
    });

    it('OpenCode log has no permission prompts', () => {
      expect(opencodeLog).not.toMatch(PERMISSION_PATTERNS);
    });

    // ── Verification #10: all four agents sequentially ──────────────────

    it('all four agents fix the bug sequentially', () => {
      const agents = [
        { workspace: 'test-seq-cc', cmd: 'claude -p "Fix the bug in src/calc.js so that npm test passes. Do not modify tests/test_calc.js." --output-format json' },
        { workspace: 'test-seq-codex', cmd: 'codex exec "Fix the bug in src/calc.js so that npm test passes. Do not modify tests/test_calc.js."' },
        { workspace: 'test-seq-gemini', cmd: 'gemini -p "Fix the bug in src/calc.js so that npm test passes. Do not modify tests/test_calc.js."' },
        { workspace: 'test-seq-opencode', cmd: 'opencode run "Fix the bug in src/calc.js so that npm test passes. Do not modify tests/test_calc.js."' },
      ];

      for (const { workspace, cmd } of agents) {
        setupFixture(workspace);
        const agent = runAgent(workspace, cmd);
        expect(agent.exitCode).toBe(0);

        const result = verifyNpmTest(workspace);
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('PASS');
      }
    });
  },
);
