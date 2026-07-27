import { EventEmitter } from 'events';

// Global singleton EventEmitter across Next.js reloads
const globalForEvents = global as unknown as { realtimeEmitter?: EventEmitter };

export const realtimeEmitter =
  globalForEvents.realtimeEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.realtimeEmitter = realtimeEmitter;
}

// Increase listener limit to prevent memory leak warnings with active clients
realtimeEmitter.setMaxListeners(100);

export interface RealtimeEventPayload {
  type: 'MUTATION' | 'NOTIFICATION';
  entity?: 'gasto' | 'ingreso' | 'ahorro' | 'categoria' | 'submetodo';
  action?: 'create' | 'update' | 'delete';
  interfaceId?: string | number;
  timestamp: string;
}

export function emitRealtimeEvent(interfaceId: string | number, payload: Omit<RealtimeEventPayload, 'timestamp' | 'interfaceId'>) {
  const fullPayload: RealtimeEventPayload = {
    ...payload,
    interfaceId,
    timestamp: new Date().toISOString(),
  };
  realtimeEmitter.emit(`realtime:${interfaceId}`, fullPayload);
  realtimeEmitter.emit(`realtime:global`, fullPayload);
}
