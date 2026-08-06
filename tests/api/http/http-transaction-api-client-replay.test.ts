/**
 * @file Refusal of the transactions the ledger replays as fresh successes
 *
 * Verified live against midaz main @33cb93f: the idempotency slot is keyed on a hash of
 * the request body alone. The endpoint path is not in the key and the label the endpoint
 * applies is passed to the writer separately, so `/json`, block, unblock and annotation
 * send byte-identical bodies and collapse into one write for 300 seconds. Calling
 * `unblockFunds` with the input that blocked returned the BLOCK transaction under
 * `201 CREATED` while the funds stayed blocked. `/revert` hashes the mirrored body, which
 * carries no parent id, so two look-alike transactions reverted in that window both got
 * the FIRST reversal and the second was never reverted.
 */
import { HttpTransactionApiClient } from '../../../src/api/http/http-transaction-api-client';
import { UrlBuilder } from '../../../src/api/url-builder';
import { StatusCode } from '../../../src/models/common';
import {
  BlockFundsInput,
  CreateAnnotationInput,
  CreateInflowInput,
  CreateOutflowInput,
  Operation,
  Transaction,
  UnblockFundsInput,
} from '../../../src/models/transaction';
import { ErrorCategory, ErrorCode, MidazError } from '../../../src/util/error/error-types';
import { HttpClient } from '../../../src/util/network/http-client';
import { Observability, Span } from '../../../src/util/observability/observability';

describe('HttpTransactionApiClient replay refusals', () => {
  const orgId = 'org-123';
  const ledgerId = 'ledger-456';
  const replayedId = 'tx-first-write';

  const fullInput: BlockFundsInput = {
    description: 'Block 100',
    send: {
      asset: 'BRL',
      value: '100',
      source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
      distribute: { to: [{ account: 'acc-b', amount: { asset: 'BRL', value: '100' } }] },
    },
  };

  const inflowInput: CreateInflowInput = {
    description: 'Fund 100',
    send: {
      asset: 'BRL',
      value: '100',
      distribute: { to: [{ account: 'acc-b', amount: { asset: 'BRL', value: '100' } }] },
    },
  };

  const outflowInput: CreateOutflowInput = {
    description: 'Withdraw 100',
    send: {
      asset: 'BRL',
      value: '100',
      source: { from: [{ account: 'acc-a', amount: { asset: 'BRL', value: '100' } }] },
    },
  };

  function operation(type: Operation['type'], balanceAffected: boolean): Operation {
    return {
      id: `op-${type}`,
      transactionId: replayedId,
      accountId: 'acc-a',
      type,
      amount: { asset: 'BRL', value: balanceAffected ? '100' : '0' },
      balanceAffected,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Operation;
  }

  /**
   * The transaction a live block on an overdraft-enabled source answers with.
   *
   * Captured from midaz main @33cb93f: `POST /transactions/block` moving 50 BRL out of a
   * balance carrying `settings.allowOverdraft` returned three operations — two labelled
   * BLOCK and one OVERDRAFT companion row on the `overdraft` balance key. The block
   * succeeded and the funds moved.
   */
  const blockWithOverdraftCompanion = () => [
    operation('BLOCK', true),
    operation('BLOCK', true),
    operation('OVERDRAFT', true),
  ];

  /**
   * The transaction a replayed annotation answers with.
   *
   * Captured from midaz main @33cb93f: posting a body to `/transactions/annotation` and
   * then the same body to `/json`, `/inflow` or `/outflow` inside the 300-second slot
   * returned this under `201 CREATED` with `X-Idempotency-Replayed: true`, and the money
   * never moved.
   */
  const replayedAnnotation = () =>
    answer({
      status: { code: 'NOTED', timestamp: new Date().toISOString() },
      operations: [operation('DEBIT', false), operation('CREDIT', false)],
    });

  function answer(overrides: Partial<Transaction>): Transaction {
    return {
      id: replayedId,
      amount: '100',
      assetCode: 'BRL',
      status: { code: StatusCode.ACTIVE, timestamp: new Date().toISOString() },
      ledgerId,
      organizationId: orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  let mockHttpClient: jest.Mocked<HttpClient>;
  let client: HttpTransactionApiClient;

  beforeEach(() => {
    const mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Span>;

    const mockObservability = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn(),
    } as unknown as jest.Mocked<Observability>;

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    const mockUrlBuilder = {
      buildTransactionUrl: jest
        .fn()
        .mockImplementation(
          (
            org: string,
            ledger: string,
            txId?: string,
            variant?: boolean | string,
            action?: string
          ) =>
            `/v1/organizations/${org}/ledgers/${ledger}/transactions/${
              action ?? (variant === true ? 'json' : variant)
            }`
        ),
      getApiVersion: jest.fn().mockReturnValue('v1'),
    } as unknown as jest.Mocked<UrlBuilder>;

    client = new HttpTransactionApiClient(mockHttpClient, mockUrlBuilder, mockObservability);
  });

  async function rejection(promise: Promise<Transaction>): Promise<MidazError> {
    const caught = await promise.then(
      () => undefined,
      (error) => error
    );

    expect(caught).toBeInstanceOf(MidazError);
    return caught as MidazError;
  }

  describe('a label the endpoint never produces', () => {
    it('refuses an unblock answered with the block it replayed', async () => {
      mockHttpClient.post.mockResolvedValue(answer({ operations: [operation('BLOCK', true)] }));

      const error = await rejection(
        client.unblockFunds(orgId, ledgerId, fullInput as UnblockFundsInput)
      );

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.category).toBe(ErrorCategory.CONFLICT);
      expect(error.resourceId).toBe(replayedId);
      expect(error.message).toContain(replayedId);
      expect(error.message).toContain('BLOCK');
      expect(error.message).toContain('UNBLOCK');
      expect(error.message).toContain('idempotencyKey');
    });

    it('refuses a block answered with an unblock', async () => {
      mockHttpClient.post.mockResolvedValue(answer({ operations: [operation('UNBLOCK', true)] }));

      const error = await rejection(client.blockFunds(orgId, ledgerId, fullInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.message).toContain('BLOCK');
    });

    it('refuses a block answered with the plain transfer it replayed', async () => {
      mockHttpClient.post.mockResolvedValue(
        answer({ operations: [operation('DEBIT', true), operation('CREDIT', true)] })
      );

      const error = await rejection(client.blockFunds(orgId, ledgerId, fullInput));

      expect(error.message).toContain('DEBIT');
      expect(error.message).toContain('BLOCK');
    });

    it('refuses a plain create answered with a labelled transaction', async () => {
      mockHttpClient.post.mockResolvedValue(answer({ operations: [operation('BLOCK', true)] }));

      const error = await rejection(client.createTransaction(orgId, ledgerId, fullInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.message).toContain('BLOCK');
      expect(error.message).toContain(replayedId);
    });

    it('refuses an annotation whose operations moved a balance', async () => {
      mockHttpClient.post.mockResolvedValue(
        answer({ operations: [operation('DEBIT', false), operation('CREDIT', true)] })
      );

      const error = await rejection(
        client.createAnnotation(orgId, ledgerId, fullInput as CreateAnnotationInput)
      );

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.message).toContain('balanceAffected');
      expect(error.message).toContain(replayedId);
    });
  });

  describe('the labelling the caller asked for', () => {
    it('returns a block labelled BLOCK', async () => {
      const blocked = answer({ operations: [operation('BLOCK', true), operation('BLOCK', true)] });
      mockHttpClient.post.mockResolvedValue(blocked);

      await expect(client.blockFunds(orgId, ledgerId, fullInput)).resolves.toBe(blocked);
    });

    it('returns an unblock labelled UNBLOCK', async () => {
      const unblocked = answer({ operations: [operation('UNBLOCK', true)] });
      mockHttpClient.post.mockResolvedValue(unblocked);

      await expect(
        client.unblockFunds(orgId, ledgerId, fullInput as UnblockFundsInput)
      ).resolves.toBe(unblocked);
    });

    it('returns an annotation whose operations moved nothing', async () => {
      const noted = answer({ operations: [operation('DEBIT', false), operation('CREDIT', false)] });
      mockHttpClient.post.mockResolvedValue(noted);

      await expect(
        client.createAnnotation(orgId, ledgerId, fullInput as CreateAnnotationInput)
      ).resolves.toBe(noted);
    });

    it('returns a plain create carrying ordinary DEBIT/CREDIT operations', async () => {
      const transfer = answer({
        operations: [operation('DEBIT', true), operation('CREDIT', true)],
      });
      mockHttpClient.post.mockResolvedValue(transfer);

      await expect(client.createTransaction(orgId, ledgerId, fullInput)).resolves.toBe(transfer);
    });

    it('passes through a response the ledger sent without operations', async () => {
      // Operations are the only place the label survives — status is CREATED for block,
      // unblock and /json alike — so an answer without them is not evidence of a replay.
      const bare = answer({});
      mockHttpClient.post.mockResolvedValue(bare);

      await expect(client.blockFunds(orgId, ledgerId, fullInput)).resolves.toBe(bare);
      await expect(
        client.createAnnotation(orgId, ledgerId, fullInput as CreateAnnotationInput)
      ).resolves.toBe(bare);
    });
  });

  describe('a system companion row alongside the label the caller asked for', () => {
    it('returns a block whose overdraft companion row is not labelled BLOCK', async () => {
      const blocked = answer({ operations: blockWithOverdraftCompanion() });
      mockHttpClient.post.mockResolvedValue(blocked);

      await expect(client.blockFunds(orgId, ledgerId, fullInput)).resolves.toBe(blocked);
    });

    it('returns an unblock whose overdraft companion row is not labelled UNBLOCK', async () => {
      const unblocked = answer({
        operations: [operation('UNBLOCK', true), operation('OVERDRAFT', true)],
      });
      mockHttpClient.post.mockResolvedValue(unblocked);

      await expect(
        client.unblockFunds(orgId, ledgerId, fullInput as UnblockFundsInput)
      ).resolves.toBe(unblocked);
    });

    it('refuses a block carrying only companion rows and no BLOCK label at all', async () => {
      mockHttpClient.post.mockResolvedValue(
        answer({ operations: [operation('OVERDRAFT', true), operation('OVERDRAFT', true)] })
      );

      const error = await rejection(client.blockFunds(orgId, ledgerId, fullInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.message).toContain('BLOCK');
      expect(error.message).toContain(replayedId);
    });

    it('refuses a block carrying a hold, which the block endpoint never produces', async () => {
      mockHttpClient.post.mockResolvedValue(
        answer({ operations: [operation('BLOCK', true), operation('ON_HOLD', true)] })
      );

      const error = await rejection(client.blockFunds(orgId, ledgerId, fullInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.message).toContain('ON_HOLD');
    });

    it('refuses a block carrying a release, which the block endpoint never produces', async () => {
      mockHttpClient.post.mockResolvedValue(
        answer({ operations: [operation('BLOCK', true), operation('RELEASE', true)] })
      );

      const error = await rejection(client.blockFunds(orgId, ledgerId, fullInput));

      expect(error.message).toContain('RELEASE');
    });
  });

  describe('a replayed annotation answering an endpoint that moves money', () => {
    it('refuses a plain create answered with the annotation it replayed', async () => {
      mockHttpClient.post.mockResolvedValue(replayedAnnotation());

      const error = await rejection(client.createTransaction(orgId, ledgerId, fullInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.category).toBe(ErrorCategory.CONFLICT);
      expect(error.resourceId).toBe(replayedId);
      expect(error.message).toContain('NOTED');
      expect(error.message).toContain('no money moved');
    });

    it('refuses an inflow answered with the annotation it replayed', async () => {
      mockHttpClient.post.mockResolvedValue(replayedAnnotation());

      const error = await rejection(client.createInflow(orgId, ledgerId, inflowInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.resourceId).toBe(replayedId);
      expect(error.message).toContain('NOTED');
    });

    it('refuses an outflow answered with the annotation it replayed', async () => {
      mockHttpClient.post.mockResolvedValue(replayedAnnotation());

      const error = await rejection(client.createOutflow(orgId, ledgerId, outflowInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.resourceId).toBe(replayedId);
      expect(error.message).toContain('NOTED');
    });

    it('refuses a NOTED answer carrying no operations at all', async () => {
      mockHttpClient.post.mockResolvedValue(
        answer({ status: { code: 'NOTED', timestamp: new Date().toISOString() } })
      );

      const error = await rejection(client.createTransaction(orgId, ledgerId, fullInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.message).toContain('NOTED');
    });

    it('refuses a create whose operations all moved nothing, whatever the status says', async () => {
      mockHttpClient.post.mockResolvedValue(
        answer({ operations: [operation('DEBIT', false), operation('CREDIT', false)] })
      );

      const error = await rejection(client.createTransaction(orgId, ledgerId, fullInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.message).toContain('balanceAffected');
      expect(error.message).toContain('no money moved');
    });

    it('refuses an inflow answered with a block', async () => {
      mockHttpClient.post.mockResolvedValue(answer({ operations: [operation('BLOCK', true)] }));

      const error = await rejection(client.createInflow(orgId, ledgerId, inflowInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.message).toContain('BLOCK');
      expect(error.message).not.toContain('UNBLOCK');
    });

    it('refuses an outflow answered with an unblock', async () => {
      mockHttpClient.post.mockResolvedValue(answer({ operations: [operation('UNBLOCK', true)] }));

      const error = await rejection(client.createOutflow(orgId, ledgerId, outflowInput));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.message).toContain('UNBLOCK');
      expect(error.message).not.toMatch(/(?<!UN)BLOCK/);
    });

    it('never tells the caller to retry the call the ledger already answered', async () => {
      mockHttpClient.post.mockResolvedValue(replayedAnnotation());

      const error = await rejection(client.createTransaction(orgId, ledgerId, fullInput));

      expect(error.message).not.toMatch(/\bretry\b/i);
      expect(error.message).toContain('idempotencyKey');
    });

    it('returns an inflow the ledger really wrote', async () => {
      const funded = answer({ operations: [operation('DEBIT', true), operation('CREDIT', true)] });
      mockHttpClient.post.mockResolvedValue(funded);

      await expect(client.createInflow(orgId, ledgerId, inflowInput)).resolves.toBe(funded);
    });

    it('returns an outflow the ledger really wrote', async () => {
      const withdrawn = answer({
        operations: [operation('DEBIT', true), operation('CREDIT', true)],
      });
      mockHttpClient.post.mockResolvedValue(withdrawn);

      await expect(client.createOutflow(orgId, ledgerId, outflowInput)).resolves.toBe(withdrawn);
    });

    it('returns a pending create, whose hold is not an annotation', async () => {
      const held = answer({
        status: { code: 'PENDING', timestamp: new Date().toISOString() },
        operations: [operation('DEBIT', true), operation('ON_HOLD', true)],
      });
      mockHttpClient.post.mockResolvedValue(held);

      await expect(
        client.createTransaction(orgId, ledgerId, { ...fullInput, pending: true })
      ).resolves.toBe(held);
    });
  });

  describe('a reversal belonging to another transaction', () => {
    const transactionId = 'tx-to-revert';

    it("refuses a reversal whose parent is someone else's transaction", async () => {
      mockHttpClient.post.mockResolvedValue(
        answer({ id: 'reverse-of-another', parentTransactionId: 'tx-other' })
      );

      const error = await rejection(client.revertTransaction(orgId, ledgerId, transactionId));

      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(error.category).toBe(ErrorCategory.CONFLICT);
      expect(error.resourceId).toBe(transactionId);
      expect(error.message).toContain('reverse-of-another');
      expect(error.message).toContain('tx-other');
      expect(error.message).toContain('NOT reverted');
    });

    it('returns a reversal that names the transaction it was asked to revert', async () => {
      const reversal = answer({ id: 'reverse-1', parentTransactionId: transactionId });
      mockHttpClient.post.mockResolvedValue(reversal);

      await expect(client.revertTransaction(orgId, ledgerId, transactionId)).resolves.toBe(
        reversal
      );
    });

    it('passes through a reversal the ledger sent without a parent id', async () => {
      // A ledger that omits the field is not evidence of a replay, and refusing it would
      // fail every revert on a deployment that does not populate it.
      const reversal = answer({ id: 'reverse-2' });
      mockHttpClient.post.mockResolvedValue(reversal);

      await expect(client.revertTransaction(orgId, ledgerId, transactionId)).resolves.toBe(
        reversal
      );
    });
  });
});
