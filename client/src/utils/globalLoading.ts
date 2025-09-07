export type Listener = (count: number) => void;

let count = 0;
const listeners = new Set<Listener>();

export const globalLoading = {
  inc() {
    count += 1;
    listeners.forEach((fn) => fn(count));
  },
  dec() {
    count = Math.max(0, count - 1);
    listeners.forEach((fn) => fn(count));
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get count() {
    return count;
  },
};

