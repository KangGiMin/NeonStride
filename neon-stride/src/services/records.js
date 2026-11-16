import { DEFAULT_DIFFICULTY } from "../config/difficulties.js";

const recordKey = (difficulty) => `neon-stride-best:${difficulty}`;
export function createRecords(storage = () => globalThis.localStorage) {
  return {
    read(difficulty) {
      try {
        const value =
          storage().getItem(recordKey(difficulty)) ??
          (difficulty === DEFAULT_DIFFICULTY
            ? storage().getItem("neon-stride-best")
            : 0);
        return Math.max(0, Number(value) || 0);
      } catch {
        return 0;
      }
    },
    write(difficulty, score) {
      try {
        storage().setItem(recordKey(difficulty), String(score));
      } catch {}
    },
  };
}
