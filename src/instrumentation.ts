export async function register() {
  // Node.js 22+ exposes a global `localStorage` that is NOT Web Storage API compatible.
  // It lacks getItem/setItem/removeItem methods, which causes Supabase and other
  // browser-oriented libraries to crash during SSR.
  // Fix: remove it so libraries fall back to their non-browser code paths.
  if (typeof window === "undefined" && typeof globalThis.localStorage !== "undefined") {
    const ls = globalThis.localStorage as unknown as Record<string, unknown>;
    if (typeof ls.getItem !== "function") {
      delete (globalThis as Record<string, unknown>).localStorage;
    }
  }
}
