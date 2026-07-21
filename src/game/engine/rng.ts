// Deterministic, seedable PRNG (Mulberry32). Using a seeded generator keeps
// galaxy generation reproducible and makes the engine unit-testable.
export class Rng {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }

  /** Random element of an array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)]
  }

  /** True with the given probability (0..1). */
  chance(p: number): boolean {
    return this.next() < p
  }

  /** Random sign-symmetric variance: value in [-v, v]. */
  variance(v: number): number {
    return this.int(-v, v)
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}
