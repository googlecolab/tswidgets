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

/* @fileoverview packs and renders an extracted structure to a new lang. */

type Doc = {
  text: string; kind: string;
};

declare global {
  interface String {
    repeat(amount: number): string;
  }
}

import {readFileSync} from 'fs';
import {render} from 'mustache';
import {resolve} from 'path';

let tmplPath;
export function pack(json: {}|string, tmpls = 'templates/colab') {
  let info = json;
  tmplPath = tmpls;

  try {
    if (typeof json === 'string') {
      info = JSON.parse(json);
    }
  } catch (e) {
    console.error('Unable to parse JSON.');
    process.exit(-1);
  }

  return Object.keys(info).map((item) => {
    return {name: `${item}.py`, content: template(item, info[item])};
  });
}

function toSnakeCase(name: string, render: Function) {
  const renderedName = render(name);
  let snakeName = '';
  for (const letter of renderedName) {
    if (letter === letter.toUpperCase()) {
      snakeName += '_' + letter.toLowerCase();
    } else {
      snakeName += letter;
    }
  }

  return snakeName;
}

function toTagName(name: string, render: Function) {
  const className = render(name);
  let tagName = className.charAt(0).toLowerCase();
  for (let c = 1; c < className.length; c++) {
    const letter = className[c];
    if (letter === letter.toUpperCase()) {
      tagName += '-';
    }
    tagName += letter.toLowerCase();
  }

  if (tagName.indexOf('-') === -1) {
    tagName = 'x-' + tagName;
  }

  return tagName;
}

function toParamsList() {
  if (this.params.length === 0) {
    return '';
  }

  return ', ' + this.params.map((p) => p.name).join(', ');
}

function toDocStr() {
  const indentText = (str, indent = 5) => {
    const spaces = ' '.repeat(indent);
    return str.split('\n').join('\n' + spaces).trim();
  };

  if (!this.docs) {
    const indentedStr = indentText(this.text, 7);
    if (!indentedStr) {
      console.log(this);
    }
    return indentedStr ? indentedStr : `${this.name}.`;
  }

  const flattenedStr = this.docs.map((doc) => doc.text).join(',');
  const indentedStr = indentText(flattenedStr);
  return indentedStr ? indentedStr : `${this.name} method.`;
}

function getTemplates() {
  const path = resolve(__dirname, tmplPath);
  return {
    classTmpl: readFileSync(`${path}/class.mustache`, 'utf8'),
    methodTmpl: readFileSync(`${path}/method.mustache`, 'utf8'),
    propertyTmpl: readFileSync(`${path}/property.mustache`, 'utf8'),
  };
}

function template(className, details) {
  const {classTmpl, methodTmpl, propertyTmpl} = getTemplates();
  const fileDocStr = `${className} proxy.`;
  const {docs, members} = details;

  return render(
      classTmpl, {
        className,
        fileDocStr,
        details,
        docs,
        members,
        tagName: () => toTagName,
        snakeCase: () => toSnakeCase,
        paramList: toParamsList,
        docStr: toDocStr
      },
      {method: methodTmpl, property: propertyTmpl});
}
