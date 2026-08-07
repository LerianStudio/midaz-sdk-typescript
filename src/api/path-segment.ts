/**
 * Refusal of caller input that would re-target a lookup path.
 *
 * The ledger never percent-decodes path parameters, so this SDK interpolates them raw:
 * encoding an alias makes the ledger look up the encoded form and 404. Safety therefore
 * has to come from refusing the characters that change what the path addresses, rather
 * than from escaping them. Nothing legitimate is lost — midaz constrains an alias to
 * `^[a-zA-Z0-9@:_-]+$`, and an asset code is narrower still.
 */

import { newValidationError } from '../util/error';

const FORBIDDEN_CHARACTERS: readonly string[] = ['/', '\\', '?', '#'];

const TRAVERSAL = '..';

/**
 * Refuses a lookup path parameter that would address something other than itself
 *
 * @throws MidazError when the value carries a path, query, fragment or traversal
 */
export function assertPathSegment(parameter: string, value: string): void {
  const offender = FORBIDDEN_CHARACTERS.find((character) => value.includes(character));

  if (offender !== undefined) {
    throw newValidationError(
      `${parameter} must not contain '${offender}': the ledger reads path parameters raw, ` +
        `so the character would re-target the request rather than be looked up. Got '${value}'.`
    );
  }

  if (value.split(/[/\\]/).includes(TRAVERSAL)) {
    throw newValidationError(
      `${parameter} must not be the traversal segment '${TRAVERSAL}': it would climb out of ` +
        `the route rather than address a resource. Got '${value}'.`
    );
  }
}
