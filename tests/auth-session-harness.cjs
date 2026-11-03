const { React, mount } = require("./dom.cjs");
const { loadSource } = require("./load-source.cjs");

const me = (id) => ({
  user: { id, fullName: id },
  branchIds: [],
  roles: [],
  permissions: { "attendance:checkin": "branch", "payment:create": "branch" },
  permissionsVersion: 1,
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};

async function harness(options = {}) {
  const Context = React.createContext(null);
  const token = loadSource("src/api/token-store.ts");
  const timing = loadSource("src/api/session-refresh.ts", { "src/api/token-store.ts": token });
  let value, expired;
  const calls = { session: [], refresh: [], queue: [], payments: [], clears: 0 };
  const api = {
    login: async () => {},
    logout: async () => {},
    session: async () => me("A"),
    ...options.api,
  };
  let refresh = options.refresh ?? (async () => false);
  const { AuthProvider } = loadSource("src/auth/AuthProvider.tsx", {
    "src/auth/auth-context.ts": { AuthContext: Context },
    "@tanstack/react-query": { useQueryClient: () => client },
    "src/api/index.ts": {
      authApi: {
        ...api,
        session: (signal) => {
          calls.session.push(signal);
          return api.session(signal);
        },
      },
    },
    "src/api/http.ts": {
      refreshAccessToken: (signal) => {
        calls.refresh.push(signal);
        return refresh(signal);
      },
      setUnauthenticatedHandler: (f) => {
        expired = f;
      },
    },
    "src/api/token-store.ts": token,
    "src/api/session-refresh.ts": { ...timing, SESSION_TIMEOUT_MS: options.timeout ?? 10000 },
    "src/features/attendance/checkin-queue.ts": {
      setCheckInQueueScope: (...args) => calls.queue.push(args),
    },
    "src/features/finance/payment-recovery-store.ts": {
      setPaymentRecoveryScope: (...args) => calls.payments.push(args),
    },
  });
  const client = { clear: () => calls.clears++ };
  function Probe() {
    value = React.useContext(Context);
    return React.createElement("output", null, value.status);
  }
  const view = await mount(() =>
    React.createElement(AuthProvider, null, React.createElement(Probe)),
  );
  return {
    view,
    calls,
    token,
    api,
    value: () => value,
    expire: () => expired(),
    refresh: (f) => {
      refresh = f;
    },
  };
}

module.exports = { me, deferred, harness };
