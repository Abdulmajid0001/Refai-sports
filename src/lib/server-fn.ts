// Server function utilities for TanStack Start or similar frameworks
// This provides a stub for server functions that would be implemented on the backend

export function useServerFn<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}
