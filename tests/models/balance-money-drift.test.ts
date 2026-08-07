import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'yaml';

const SPEC_PATH = join(__dirname, '..', '..', 'spec', 'ledger-v1.openapi.yaml');
const MODEL_PATH = join(__dirname, '..', '..', 'src', 'models', 'balance.ts');

interface SpecDocument {
  components?: { schemas?: Record<string, { properties?: Record<string, unknown> }> };
}

const spec = parse(readFileSync(SPEC_PATH, 'utf8')) as SpecDocument;
const specProperties = spec.components?.schemas?.Balance?.properties ?? {};

const source = readFileSync(MODEL_PATH, 'utf8');

function interfaceBody(name: string): string {
  const start = source.indexOf(`export interface ${name} {`);
  const end = source.indexOf('\n}', start);

  return source.slice(start, end);
}

function declaredMembers(body: string): Map<string, string> {
  const members = new Map<string, string>();

  for (const match of body.matchAll(/^ {2}(\w+)\??:\s*([^;]+);/gm)) {
    members.set(match[1], match[2].trim());
  }

  return members;
}

function docExample(name: string): string {
  const anchor = source.indexOf(`export interface ${name} {`);
  const block = source.slice(0, anchor);

  return block.slice(block.lastIndexOf('/**'));
}

describe('Balance money fields against the ledger spec', () => {
  const members = declaredMembers(interfaceBody('Balance'));

  it('declares available as the string the ledger sends', () => {
    expect(specProperties.available).toMatchObject({ type: 'string' });
    expect(members.get('available')).toBe('string');
  });

  it('declares onHold as the string the ledger sends', () => {
    expect(specProperties.onHold).toMatchObject({ type: 'string' });
    expect(members.get('onHold')).toBe('string');
  });

  it('declares no member the ledger does not send', () => {
    const invented = [...members.keys()].filter((name) => !(name in specProperties));

    expect(invented).toEqual([]);
  });

  it('shows the money as strings in the documented example', () => {
    const example = docExample('Balance');

    expect(example).toMatch(/available: "[\d.]+"/);
    expect(example).toMatch(/onHold: "[\d.]+"/);
    expect(example).not.toMatch(/^\s*\*\s+scale:/m);
  });

  it('never teaches dividing the money by a scale', () => {
    expect(source).not.toMatch(/available\s*\/\s*\w*[Ss]cale/);
    expect(source).not.toMatch(/onHold\s*\/\s*\w*[Ss]cale/);
  });
});
