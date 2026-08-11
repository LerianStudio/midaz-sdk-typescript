import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'yaml';

const SPEC_PATH = join(__dirname, '..', '..', 'spec', 'ledger-v1.openapi.yaml');
const MODEL_PATH = join(__dirname, '..', '..', 'src', 'models', 'balance.ts');

interface SpecDocument {
  components?: {
    schemas?: Record<string, { properties?: Record<string, unknown>; required?: string[] }>;
  };
}

interface DeclaredMember {
  type: string;
  optional: boolean;
}

const spec = parse(readFileSync(SPEC_PATH, 'utf8')) as SpecDocument;
const specSchema = spec.components?.schemas?.Balance ?? {};
const specProperties = specSchema.properties ?? {};
const specRequired = specSchema.required ?? [];

const source = readFileSync(MODEL_PATH, 'utf8');

function interfaceBody(name: string): string {
  const start = source.indexOf(`export interface ${name} {`);
  const end = source.indexOf('\n}', start);

  return source.slice(start, end);
}

function declaredMembers(body: string): Map<string, DeclaredMember> {
  const members = new Map<string, DeclaredMember>();

  for (const match of body.matchAll(/^ {2}(\w+)(\??):\s*([^;]+);/gm)) {
    members.set(match[1], { type: match[3].trim(), optional: match[2] === '?' });
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
    expect(members.get('available')?.type).toBe('string');
  });

  it('declares onHold as the string the ledger sends', () => {
    expect(specProperties.onHold).toMatchObject({ type: 'string' });
    expect(members.get('onHold')?.type).toBe('string');
  });

  it('declares no member the ledger does not send', () => {
    const invented = [...members.keys()].filter((name) => !(name in specProperties));

    expect(invented).toEqual([]);
  });

  it('declares every member the ledger does send', () => {
    const missing = Object.keys(specProperties).filter((name) => !members.has(name));

    expect(missing).toEqual([]);
  });

  it('leaves no member the ledger marks required optional', () => {
    const wronglyOptional = specRequired.filter((name) => members.get(name)?.optional !== false);

    expect(wronglyOptional).toEqual([]);
  });

  it('marks every member the ledger may omit optional', () => {
    const optionalInSpec = Object.keys(specProperties).filter(
      (name) => !specRequired.includes(name)
    );
    const wronglyRequired = optionalInSpec.filter((name) => members.get(name)?.optional !== true);

    expect(wronglyRequired).toEqual([]);
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
