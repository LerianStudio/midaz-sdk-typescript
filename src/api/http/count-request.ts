/**
 * Shared reading of the ledger's count answer.
 *
 * Every `metrics/count` route answers HEAD only — GET on the same path is 405 —
 * with `204`, an empty body and the total in `X-Total-Count`, so the number never
 * reaches the body and each client has to read it off the response headers.
 */

import { ErrorCategory, ErrorCode, MidazError } from '../../util/error';

/**
 * Header the ledger carries every count in
 */
export const TOTAL_COUNT_HEADER = 'X-Total-Count';

/**
 * Reads a response header by name, ignoring case
 *
 * The lookup is case-insensitive even though the ledger sends `X-Total-Count`
 * verbatim, because fetch normalizes header casing and a plain record does not.
 *
 * @returns The header value, or undefined when the response does not carry it
 */
export function readHeader(
  headers: Headers | Record<string, string>,
  name: string
): string | undefined {
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name) ?? undefined;
  }

  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers as Record<string, string>)) {
    if (key.toLowerCase() === wanted) {
      return value;
    }
  }

  return undefined;
}

/**
 * Extracts the total a count response reports
 *
 * @returns The number of resources the ledger counted
 */
export function parseTotalCount(
  operationName: string,
  headers: Headers | Record<string, string>
): number {
  const raw = readHeader(headers, TOTAL_COUNT_HEADER);

  if (raw === undefined) {
    throw new MidazError({
      category: ErrorCategory.INTERNAL,
      code: ErrorCode.INTERNAL_ERROR,
      message: `${operationName} was answered without a ${TOTAL_COUNT_HEADER} header, so no count was reported.`,
      operation: operationName,
    });
  }

  const count = raw.trim() === '' ? Number.NaN : Number(raw);

  if (!Number.isInteger(count) || count < 0) {
    throw new MidazError({
      category: ErrorCategory.INTERNAL,
      code: ErrorCode.INTERNAL_ERROR,
      message: `${operationName} was answered with ${TOTAL_COUNT_HEADER}: '${raw}', which is not a count.`,
      operation: operationName,
    });
  }

  return count;
}
