/**
 * Withholding of caller identifiers from the observability surface.
 *
 * An account alias is chosen by the caller and routinely carries a person or a team —
 * `ana.pires@lerian.studio`, `team@lerian:ops` — so repeating it in a span attribute
 * or a metric tag copies an identifier into whatever backend collects traces. The
 * routes that address an account by alias carry it in the path, so the URL those spans
 * record has to be rewritten rather than simply omitted.
 */

/**
 * Stands in for a value withheld from a span or a metric
 */
export const REDACTED = '[redacted]';

const ALIAS_SEGMENT = /(\/accounts\/alias\/)[^/?#]+/g;

/**
 * Replaces the alias an account lookup addresses with the redaction marker
 *
 * @returns The URL with the alias segment withheld, unchanged when it carries none
 */
export function redactAliasInUrl(url: string): string {
  return url.replace(ALIAS_SEGMENT, `$1${REDACTED}`);
}
