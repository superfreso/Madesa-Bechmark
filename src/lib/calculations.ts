export interface PriceStats {
  avg: number;
  median: number;
  min: number;
  max: number;
  count: number;
  prices: number[];
}

export function calculateStats(prices: number[]): PriceStats {
  if (prices.length === 0) {
    return { avg: 0, median: 0, min: 0, max: 0, count: 0, prices: [] };
  }
  const sorted = [...prices].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, p) => acc + p, 0);
  const avg = sum / sorted.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    avg,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: sorted.length,
    prices: sorted,
  };
}

export function percentileDiff(madesa: number, market: number): number {
  if (market === 0) return 0;
  return ((madesa - market) / market) * 100;
}
