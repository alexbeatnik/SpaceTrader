/** Format an integer with thin-space thousands separators. */
export function fmt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function fmtCr(n: number): string {
  return `${fmt(n)} cr`
}
