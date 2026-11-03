// Deterministic exclusive lock fixture. No storage, HTTP, or payment behavior is mocked here.
let tail = Promise.resolve();
Object.defineProperty(navigator, "locks", {
  configurable: true,
  value: {
    request: (_key, callback) => {
      const result = tail.then(callback);
      tail = result.catch(() => {});
      return result;
    },
  },
});
