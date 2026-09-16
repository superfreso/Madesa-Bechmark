export function formatCOP(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-CO').format(value);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDimension(cm: number | null | undefined): string {
  if (cm === null || cm === undefined) return '—';
  return `${cm} cm`;
}
