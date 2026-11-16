export const CYAN = "#55e5ee";
export const seeded = (n) => {
  const a = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return a - Math.floor(a);
};
