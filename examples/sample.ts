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

/**
 * Represents an x-foo as a Custom Element class.
 * This is a multi-line comment.
 */
export class XFoo extends HTMLElement {
  private privateNumberInternal: number;
  protected protectedStringInternal: string;

  readonly complexObject = {test: 1, check: 'foo'};

  /**
   * The z prop.
   */
  readonly z = 100;

  /**
   * Static function.
   */
  static staticFunction() {
    console.log('static function');
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  /**
   * Gets you the private number.
   */
  get privateNumber() {
    return this.privateNumberInternal;
  }

  /**
   * Sets the private number.
   */
  set privateNumber(privateNumber: number) {
    this.privateNumber = privateNumber;
  }

  /**
   * Sets the protected string.
   */
  set protectedString(protectedString: string) {
    this.protectedStringInternal = protectedString;
  }

  /**
   * Gets the protected string.
   * This is a multi-line comment.
   */
  get protectedString() {
    return this.protectedStringInternal;
  }

  /**
   * logs x.
   * @param x A number for x.
   */
  logX(x: number) {
    console.log(x);
  }

  /**
   * Logs out qux.
   * @param y A number for y.
   */
  private logY(y: string) {
    console.log(y);
  }
}

customElements.define('x-foo', XFoo);
