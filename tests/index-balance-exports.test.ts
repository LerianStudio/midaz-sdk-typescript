/**
 * @file The balance types a consumer has to be able to name
 *
 * `package.json` exposes one entry point and no subpath, so a type absent from
 * `src/index.ts` cannot be imported at all: the four balance methods on
 * `client.entities.balances` would have argument and return types no caller can
 * write down. Types are erased at runtime, so this reads the export list off the
 * source instead of importing it.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

const SRC = path.resolve(__dirname, '../src');

const BALANCE_TYPES = [
  'AccountBalanceListOptions',
  'AccountBalancePage',
  'BalanceDirection',
  'BalanceHistory',
  'BalanceScope',
  'BalanceSettingsInput',
  'CreateBalanceInput',
];

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
}

function reExportedFrom(entryPoint: string, moduleSpecifier: string): string[] {
  const names: string[] = [];

  parse(entryPoint).forEachChild((node) => {
    if (!ts.isExportDeclaration(node) || !node.moduleSpecifier) {
      return;
    }

    if (
      !ts.isStringLiteral(node.moduleSpecifier) ||
      node.moduleSpecifier.text !== moduleSpecifier
    ) {
      return;
    }

    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      node.exportClause.elements.forEach((element) => names.push(element.name.text));
    }
  });

  return names;
}

function declaredExports(file: string): string[] {
  const names: string[] = [];

  parse(file).forEachChild((node) => {
    const exported = ts
      .getCombinedModifierFlags(node as ts.Declaration)
      .valueOf() as ts.ModifierFlags;

    if (!(exported & ts.ModifierFlags.Export)) {
      return;
    }

    if (
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isFunctionDeclaration(node)
    ) {
      if (node.name) {
        names.push(node.name.text);
      }
    }
  });

  return names;
}

describe('the package entry point', () => {
  const entryPoint = path.join(SRC, 'index.ts');
  const exportedFromIndex = reExportedFrom(entryPoint, './models/balance');
  const exportedFromModel = declaredExports(path.join(SRC, 'models/balance.ts'));

  it.each(BALANCE_TYPES)('re-exports %s', (name) => {
    expect(exportedFromIndex).toContain(name);
  });

  it.each(BALANCE_TYPES)('names %s under the name the model declares', (name) => {
    expect(exportedFromModel).toContain(name);
  });
});
