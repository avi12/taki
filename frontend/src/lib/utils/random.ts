export function randomFloat() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF;
}
