export interface OfflineMutation {
  id: string;
  endpoint: string;
  method: string;
  payload: Record<string, unknown>;
  description: string;
  timestamp: number;
}

const STORAGE_KEY = 'expenzzi_offline_mutations';
const EVENT_NAME = 'expenzzi-sync-queue-updated';

/**
 * Retrieves all pending offline mutations stored in localStorage.
 */
export function getPendingOfflineMutations(): OfflineMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineMutation[]) : [];
  } catch (err) {
    console.error('Error reading offline queue:', err);
    return [];
  }
}

/**
 * Enqueues a new mutation when offline or network fails.
 */
export function enqueueOfflineMutation(
  endpoint: string,
  method: string,
  payload: Record<string, unknown>,
  description = 'Operación en pendiente'
): OfflineMutation {
  const mutations = getPendingOfflineMutations();
  const newMutation: OfflineMutation = {
    id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    endpoint,
    method,
    payload,
    description,
    timestamp: Date.now(),
  };

  mutations.push(newMutation);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mutations));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { count: mutations.length } }));
  }

  return newMutation;
}

/**
 * Flushes and executes queued offline mutations against the Next.js server.
 */
export async function flushOfflineQueue(): Promise<{ successCount: number; remainingCount: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { successCount: 0, remainingCount: getPendingOfflineMutations().length };
  }

  const mutations = getPendingOfflineMutations();
  if (mutations.length === 0) {
    return { successCount: 0, remainingCount: 0 };
  }

  const remaining: OfflineMutation[] = [];
  let successCount = 0;

  for (const item of mutations) {
    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.payload),
      });

      if (response.ok) {
        successCount++;
      } else if (response.status >= 400 && response.status < 500) {
        // Validation/Client error: discard non-retryable item to prevent queue blockage
        console.warn(`[SyncQueue] Skipping invalid item ${item.id}: status ${response.status}`);
      } else {
        // Server error or network drop: keep for next retry
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { count: remaining.length } }));

  return { successCount, remainingCount: remaining.length };
}

/**
 * Subscribes to offline sync queue updates.
 */
export function subscribeToSyncQueue(callback: (count: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: Event) => {
    const customEvt = event as CustomEvent<{ count: number }>;
    callback(customEvt.detail?.count ?? getPendingOfflineMutations().length);
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
