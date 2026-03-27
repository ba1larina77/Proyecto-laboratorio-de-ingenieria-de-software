/**
 * Formatea un valor numérico como moneda colombiana (COP).
 *
 * Ejemplos:
 *   formatCOP(50000)   → "$ 50.000"
 *   formatCOP(1234.5)  → "$ 1.235"
 *   formatCOP(99.99)   → "$ 100"
 */
export function formatCOP(valor: number | string): string {
  const n = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (isNaN(n)) return '$ 0';
  return '$ ' + Math.round(n).toLocaleString('es-CO');
}
