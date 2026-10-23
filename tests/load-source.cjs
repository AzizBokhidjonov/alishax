const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const nativeRequire = createRequire(path.join(root, "package.json"));

// Alohida kesh har bir testga mustaqil API javoblarini beradi.
function loadSource(entry, mocks = {}) {
  const cache = new Map();
  function load(filename) {
    const key = path.relative(root, filename).replaceAll("\\", "/");
    if (key in mocks) return mocks[key];
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = fs.readFileSync(filename, "utf8");
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText;
    function localRequire(name) {
      if (name in mocks) return mocks[name];
      if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
      const base = name.startsWith("@/")
        ? path.join(root, "src", name.slice(2))
        : path.resolve(path.dirname(filename), name);
      const file = [base + ".ts", base + ".tsx", path.join(base, "index.ts")].find((candidate) =>
        fs.existsSync(candidate),
      );
      if (!file) throw new Error("Cannot resolve " + name + " from " + filename);
      return load(file);
    }
    const wrapper = vm.runInThisContext("(function(require,module,exports){" + output + "\n})", {
      filename,
    });
    wrapper(localRequire, module, module.exports);
    return module.exports;
  }
  return load(path.resolve(root, entry));
}

function apiHarness(entry) {
  const calls = [];
  const replies = new Map();
  const api = Object.fromEntries(
    ["get", "post", "patch", "delete"].map((method) => [
      method,
      async (url, ...args) => {
        calls.push({ method, url, args });
        const key = method + " " + url;
        if (!replies.has(key)) throw new Error("No fixture for " + key);
        return structuredClone(replies.get(key));
      },
    ]),
  );
  return {
    calls,
    reply: (method, url, value) => replies.set(method + " " + url, value),
    endpoints: loadSource(entry, { "src/api/http.ts": { api } }),
  };
}

module.exports = { loadSource, apiHarness };
