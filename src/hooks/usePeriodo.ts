import { useState, useMemo } from 'react';

export function usePeriodo() {
  const [periodo, setPeriodo] = useState('30d');

  const range = useMemo(() => {
    if (periodo === 'all') return undefined;
    const days = parseInt(periodo);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return { from, to };
  }, [periodo]);

  return { periodo, setPeriodo, range };
}
