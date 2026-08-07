/**
 * Shared indexing of OpenAPI path templates for the URL drift suites.
 */

export const PLACEHOLDER = '{}';

export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

export interface SpecPathIndex {
  /** Every distinct normalized template the spec serves. */
  templates: Set<string>;

  /** Verbs each template is served under, unioned across colliding spec paths. */
  verbs: Map<string, Set<string>>;

  /** Templates reached by more than one spec path, keyed to the paths that collide. */
  collisions: Map<string, string[]>;
}

export function normalizePath(path: string): string {
  return path
    .split('/')
    .map((segment) =>
      (segment.startsWith('{') && segment.endsWith('}')) || segment.startsWith('SENTINEL_')
        ? PLACEHOLDER
        : segment
    )
    .join('/');
}

export function buildSpecPathIndex(paths: Record<string, Record<string, unknown>>): SpecPathIndex {
  const specPaths = Object.keys(paths);

  const verbs = new Map<string, Set<string>>();
  const sources = new Map<string, string[]>();

  for (const path of specPaths) {
    const template = normalizePath(path);

    const served = verbs.get(template) ?? new Set<string>();
    for (const key of Object.keys(paths[path] ?? {})) {
      if (HTTP_METHODS.includes(key)) {
        served.add(key);
      }
    }
    verbs.set(template, served);

    sources.set(template, [...(sources.get(template) ?? []), path]);
  }

  const collisions = new Map<string, string[]>(
    [...sources.entries()].filter(([, group]) => group.length > 1)
  );

  return { templates: new Set(verbs.keys()), verbs, collisions };
}
