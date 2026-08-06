/**
 * The drift suite reduces every spec path to a parameter-blind template. Two distinct
 * spec paths can reduce to the same template, so the index has to union their verbs
 * rather than let one overwrite the other, and it has to report the collapse.
 */

import { buildSpecPathIndex, normalizePath } from '../support/spec-templates';

describe('spec path index', () => {
  it('reduces every path parameter to the same placeholder', () => {
    expect(normalizePath('/organizations/{organization_id}/ledgers/{ledger_id}')).toBe(
      '/organizations/{}/ledgers/{}'
    );
  });

  it('unions the verbs of every path that collapses onto one template', () => {
    const index = buildSpecPathIndex({
      '/organizations/{id}': { get: {}, delete: {} },
      '/organizations/{organization_id}': { patch: {} },
    });

    expect([...(index.verbs.get('/organizations/{}') ?? [])].sort()).toEqual([
      'delete',
      'get',
      'patch',
    ]);
  });

  it('keeps the verbs of a template reached by a single path', () => {
    const index = buildSpecPathIndex({
      '/organizations': { get: {}, post: {} },
    });

    expect([...(index.verbs.get('/organizations') ?? [])].sort()).toEqual(['get', 'post']);
  });

  it('ignores keys that are not HTTP methods', () => {
    const index = buildSpecPathIndex({
      '/organizations': { get: {}, parameters: [], summary: 'x' },
    });

    expect([...(index.verbs.get('/organizations') ?? [])]).toEqual(['get']);
  });

  it('names the paths that collapse onto one template', () => {
    const index = buildSpecPathIndex({
      '/organizations/{id}': { get: {} },
      '/organizations/{organization_id}': { patch: {} },
    });

    expect([...index.collisions.entries()]).toEqual([
      ['/organizations/{}', ['/organizations/{id}', '/organizations/{organization_id}']],
    ]);
  });

  it('reports no collision for paths that stay distinct', () => {
    const index = buildSpecPathIndex({
      '/organizations/{id}': { get: {} },
      '/ledgers/{id}': { get: {} },
    });

    expect([...index.collisions.keys()]).toEqual([]);
  });
});
