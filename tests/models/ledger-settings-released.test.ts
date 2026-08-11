import { LedgerSettings, UpdateLedgerSettingsInput } from '../../src/models/ledger';

/**
 * The whole document midaz v3.8.0 answers on GET .../settings, measured live against
 * `lerianstudio/midaz-ledger:3.8.0`. The tracer and overrides groups do not exist on
 * that release, and neither does accounting.requireHolder.
 */
const RELEASED_DOCUMENT: LedgerSettings = {
  accounting: { validateAccountType: false, validateRoutes: false },
};

describe('the settings document a released ledger answers', () => {
  it('is a whole settings document, not a partial one', () => {
    expect(RELEASED_DOCUMENT).toEqual({
      accounting: { validateAccountType: false, validateRoutes: false },
    });
  });

  it('leaves the groups a released ledger never sends absent rather than false', () => {
    expect(RELEASED_DOCUMENT.tracer).toBeUndefined();
    expect(RELEASED_DOCUMENT.overrides).toBeUndefined();
    expect(RELEASED_DOCUMENT.accounting.requireHolder).toBeUndefined();
  });

  it('keeps the accounting fields a released ledger does send required', () => {
    expect(RELEASED_DOCUMENT.accounting.validateAccountType).toBe(false);
    expect(RELEASED_DOCUMENT.accounting.validateRoutes).toBe(false);
  });

  it('still accepts every v4 group on a patch, so a v4 deployment keeps working', () => {
    const patch: UpdateLedgerSettingsInput = {
      accounting: { requireHolder: true },
      tracer: { mode: 'enforce', failPosture: 'closed', timeoutMs: 250 },
      overrides: { allowFeeSkip: true, allowTracerSkip: true, allowHolderSkip: true },
    };

    expect(patch.tracer?.mode).toBe('enforce');
    expect(patch.overrides?.allowFeeSkip).toBe(true);
    expect(patch.accounting?.requireHolder).toBe(true);
  });
});
