// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License

/* @fileoverview Extracts important structure from custom elements. */

import * as ts from 'typescript';

type SupportedDeclaration = ts.ModuleDeclaration|ts.ClassDeclaration|
                            ts.MethodDeclaration|ts.SetAccessorDeclaration|
                            ts.GetAccessorDeclaration|ts.PropertyDeclaration;

export const defaultOpts = {
  asJsonString: false,
  includeFilters: [] as Array<RegExp|string>
};

export type Options = typeof defaultOpts;

let program: ts.Program;
let checker: ts.TypeChecker;
let info = {};

export function extract(paths: string[], opts?: Partial<Options>) {
  opts = {...defaultOpts, ...opts};

  program = ts.createProgram(
      paths, {target: ts.ScriptTarget.ES2015, module: ts.ModuleKind.CommonJS});
  checker = program.getTypeChecker();
  info = {};

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) {
      continue;
    }

    ts.forEachChild(sourceFile, (node) => {
      visit(node, info, opts as Options);
    });
  }

  return opts.asJsonString ? JSON.stringify(info, null, 2) : info;
}

function isWritable(node: ts.Node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Readonly) === 0;
}

function isExported(node: ts.Node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) === 1;
}

function isPublic(node: ts.Node) {
  const flags = ts.getCombinedModifierFlags(node);
  return (
      (flags & ts.ModifierFlags.Private) === 0 &&
      (flags & ts.ModifierFlags.Protected) === 0);
}

function extractNodeInfo(node: SupportedDeclaration) {
  const symbol = checker.getSymbolAtLocation(node.name);
  if (!symbol) {
    return null;
  }

  return extractSymbolInfo(symbol);
}

function extractSymbolInfo(symbol: ts.Symbol) {
  const rawType =
      checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
  const name = symbol.getName();
  const type = checker.typeToString(rawType);
  const docs = symbol.getDocumentationComment(checker);

  return {name, docs, type, rawType};
}

function visit(node: ts.Node, target: {}, opts: Options) {
  if (ts.isModuleDeclaration(node) || ts.isClassDeclaration(node)) {
    if (!isExported(node)) {
      return;
    }

    const info = extractNodeInfo(node);
    const include = ts.isModuleDeclaration(node) ||
        opts.includeFilters.length === 0 ||
        opts.includeFilters.some((filter) => {
          if (typeof filter === 'string') {
            return filter === info.name;
          }

          return filter.test(info.name);
        });

    if (!include) {
      return;
    }

    target[info.name] = {docs: info.docs, members: {}};
    ts.forEachChild(node, (node) => {
      visit(node, target[info.name].members, opts);
    });
  } else if (ts.isMethodDeclaration(node)) {
    if (!isPublic(node)) {
      return;
    }

    const info = extractNodeInfo(node);
    if (!target['methods']) {
      target['methods'] = [];
    }

    const method = {
      signatures: info.rawType.getCallSignatures().map((s) => {
        return {
          name: info.name,
          returns: checker.typeToString(s.getReturnType()),
          params: s.parameters.map((p) => extractSymbolInfo(p)),
          docs: info.docs
        };
      })
    };
    target['methods'].push(method);
  } else if (
      ts.isPropertyDeclaration(node) || ts.isGetAccessor(node) ||
      ts.isSetAccessor(node)) {
    if (!isPublic(node)) {
      return;
    }

    if (!target['properties']) {
      target['properties'] = [];
    }

    const info = extractNodeInfo(node);
    const docs = info.docs.filter((d) => d.kind === 'text');
    const properties = target['properties'];

    let property = properties.find((prop) => prop.name === info.name);
    let doc = docs[1];

    if (!property) {
      properties.push(
          {name: info.name, type: info.type, docs: {set: [], get: []}});

      doc = docs[0];
      property = properties[properties.length - 1];
    }

    if (ts.isPropertyDeclaration(node) || ts.isSetAccessor(node)) {
      property.set = isWritable(node);
      if (doc) {
        property.docs.set.push(doc);
      }
    }

    if (ts.isPropertyDeclaration(node) || ts.isGetAccessor(node)) {
      property.get = true;
      if (doc) {
        property.docs.get.push(doc);
      }
    }
  }
}
