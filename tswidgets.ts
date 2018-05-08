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
// limitations under the License.

import {writeFileSync} from 'fs';
import {dirname, resolve} from 'path';
import * as yargs from 'yargs';

import {extract} from './extractor';
import {pack} from './packager';

const argv = yargs.usage('Usage: $0 <command> [options]')
                 .alias('output', 'o')
                 .default({
                   output: '',
                 })
                 .argv;


const paths = argv._;
if (paths.length < 1) {
  console.error('requires at least one file path.');
  process.exit(-1);
}
const info = extract(paths);
const output = pack(info);
let outDir = argv.output || __dirname;
if (outDir.includes('.')) {
  outDir = dirname(outDir);
}

for (const file of output) {
  const outPath = resolve(outDir, file.name);
  writeFileSync(outPath, file.content);
  console.log(`Written ${outPath}`);
}
