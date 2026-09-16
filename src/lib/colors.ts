export const COMPETITOR_COLORS = [
  '#dc2626', // Madesa red
  '#2563eb', // blue
  '#059669', // green
  '#d97706', // amber
  '#7c3aed', // violet
  '#db2777', // pink
  '#0891b2', // cyan
  '#65a30d', // lime
  '#ea580c', // orange
  '#4f46e5', // indigo
];

export function getCompetitorColor(name: string, isMadesa: boolean, index: number): string {
  if (isMadesa) return COMPETITOR_COLORS[0];
  return COMPETITOR_COLORS[(index % (COMPETITOR_COLORS.length - 1)) + 1];
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
