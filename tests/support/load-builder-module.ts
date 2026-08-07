/**
 * Reloads src/client-config-builder in isolation so each test observes the
 * environment variables it set rather than the values read at first import.
 */

export type ClientConfigBuilderModule = typeof import('../../src/client-config-builder');

export const loadBuilderModule = (): ClientConfigBuilderModule => {
  let loaded: ClientConfigBuilderModule | undefined;
  jest.isolateModules(() => {
    loaded = require('../../src/client-config-builder');
  });
  return loaded as ClientConfigBuilderModule;
};
