const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Runs the actual TS modules with explicitly injected I/O. No real credentials.
exports.loader = function loader(overrides = {}, env = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const exp = {}; cache.set(file, exp);
    const box = { exports: exp, process: { env }, console, Buffer, Response, Request, URL, AbortSignal,
      setTimeout, clearTimeout, ...globals,
      require(name) {
        if (name in overrides) return overrides[name];
        if (name === 'server-only') return {};
        if (name.startsWith('@/') || name.startsWith('.')) {
          const target = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(file), name);
          return load(fs.existsSync(target) && fs.statSync(target).isFile() ? target : `${target}.ts`);
        }
        return require(name);
      },
    };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, box, { filename: file });
    return exp;
  }
  return load;
};
