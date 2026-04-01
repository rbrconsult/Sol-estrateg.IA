/**
 * COMPAT SHIM — useSolActions wraps useSolActionsV2 for backward compatibility.
 * TODO: Migrate pages to useSolActionsV2 directly and delete this file.
 */
import { useSolActionsV2 } from '@/hooks/useSolActionsV2';

export function useSolActions() {
  return useSolActionsV2();
}
