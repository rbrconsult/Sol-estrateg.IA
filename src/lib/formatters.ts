// Utilitários de formatação para todo o dashboard

/**
 * Formata valor monetário abreviado (R$ 249K, R$ 1.8M)
 * Arredonda para baixo a cada R$ 500
 */
export function formatCurrencyAbbrev(value: number): string {
  if (value >= 1_000_000) {
    const millions = Math.floor(value / 100_000) / 10;
    return `R$ ${millions.toLocaleString('pt-BR', { minimumFractionDigits: millions % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1_000) {
    const thousands = Math.floor(value / 500) * 0.5;
    return `R$ ${thousands.toLocaleString('pt-BR', { minimumFractionDigits: thousands % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })}K`;
  }
  return `R$ ${Math.floor(value).toLocaleString('pt-BR')}`;
}

/**
 * Formata valor monetário completo (R$ 1.234,56)
 */
export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata percentual (45.5%)
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
