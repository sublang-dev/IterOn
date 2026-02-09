// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 SubLang International <https://www.sublang.ai>

export const SESSION_DELIMITER = '@';
export const HOME_LOCATION = '~';

export function buildSessionName(commandName: string, location: string): string {
  return `${commandName}${SESSION_DELIMITER}${location}`;
}

export function parseSessionName(sessionName: string): { command: string; location: string } {
  const atIdx = sessionName.lastIndexOf(SESSION_DELIMITER);
  if (atIdx <= 0 || atIdx === sessionName.length - 1) {
    return { command: sessionName, location: HOME_LOCATION };
  }
  return {
    command: sessionName.slice(0, atIdx),
    location: sessionName.slice(atIdx + 1),
  };
}

export function validateSessionToken(
  value: string,
  label: string,
): string | null {
  if (value.includes(SESSION_DELIMITER)) {
    return `${label} must not contain "${SESSION_DELIMITER}" (reserved as session delimiter).`;
  }
  return null;
}
