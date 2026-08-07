import { readFileSync } from 'fs';
import { join } from 'path';

const MODEL_PATH = join(__dirname, '..', '..', '..', 'src', 'models', 'transaction.ts');
const CLIENT_PATH = join(
  __dirname,
  '..',
  '..',
  '..',
  'src',
  'api',
  'http',
  'http-transaction-api-client.ts'
);

function unionMembers(source: string, name: string): string[] {
  const declaration = new RegExp(`export type ${name} =([^;]+);`).exec(source);

  if (!declaration) {
    throw new Error(`${name} is no longer declared as a union`);
  }

  return [...declaration[1].matchAll(/'([^']+)'/g)].map((match) => match[1]).sort();
}

describe('the transaction count statuses against their union', () => {
  const declared = unionMembers(readFileSync(MODEL_PATH, 'utf8'), 'TransactionCountStatus');
  const client = readFileSync(CLIENT_PATH, 'utf8');

  it('carries every status the union declares, and no other', () => {
    const runtime = [...client.matchAll(/^ {2}'?([A-Z]+)'?: true,$/gm)].map((match) => match[1]);

    expect(runtime.sort()).toEqual(declared);
  });

  // A `readonly TransactionCountStatus[]` annotation rejects an invalid member but does
  // not demand every member, so the array and the union could drift apart silently.
  it('derives the runtime list from an exhaustive key map, not a free-standing array', () => {
    expect(client).toMatch(/Record<TransactionCountStatus, true>/);
    expect(client).not.toMatch(/readonly TransactionCountStatus\[\] = \[/);
  });
});
