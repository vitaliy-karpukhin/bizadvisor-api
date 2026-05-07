const store = new Map();
const TTL = 60_000; // 1 minute

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { store.delete(key); return null; }
  return entry.data;
}

export function cacheSet(key, data) {
  store.set(key, { data, ts: Date.now() });
}

export function cacheInvalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
