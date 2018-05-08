# TsWidgets: A tool to convert from TypeScript custom element class to UI Widget classes in other languages.

Takes a class like this:

```javascript
export class HelloWorld extends HTMLElement {
  sayHi() {
    console.log('Hello, World');
  }
}

customElements.define('hello-world', HelloWorld)
```

And converts it to Python that looks like this:

```python
"""HelloWorld Proxy."""

class HelloWorld(html.Element):
  def __init__(self):
    super(HelloWorld, self).__init__('hello-world')

  def say_hi(self):
    """sayHi method."""
    self._call('sayHi')

```

**Notes:**

1. The TypeScript compiler will resolve imports automatically, so any imported
classes will also be exported as Python.
2. The HTMLElement name is derived from the class's name, such that capitalized
letters are converted to hyphens, i.e. XFoo becomes x-foo. (Note that we ignore
the first letter.) If a class has no capitalized letters beyond the first one,
e.g. Foo, the derived name will be prepended with 'x-', i.e. 'x-foo'.


## Running

The tool requires [Node.js 6+](https://nodejs.org/en/).

1. Clone the repo.
2. Install the TypeScript Compiler: `npm install -g typescript`.
3. Run `npm install`.
4. Compile: `tsc --target es6 tswidgets.ts`.
5. Run against the TypeScript code: `node tswidgets.js /path/to/your/class.ts`.
6. Python files will be written to the current working directory for any TypeScript classes found.
