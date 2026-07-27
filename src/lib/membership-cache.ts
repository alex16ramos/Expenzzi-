import { prisma } from './db';
import { TRol } from '@prisma/client';

interface CachedMembership {
  role: TRol | 'Visualizador';
  expiresAt: number;
}

// In-memory Map cache with TTL (Time-To-Live)
const membershipCache = new Map<string, CachedMembership>();
const TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Validates user membership and role for an operational interface.
 * Uses an in-memory TTL cache (60s) to avoid hitting PostgreSQL on every request.
 */
export async function checkUserInterfaceMembership(
  userId: string,
  interfaceId: bigint
): Promise<{ hasAccess: boolean; role: TRol | 'Visualizador' }> {
  const cacheKey = `${userId}:${interfaceId.toString()}`;
  const now = Date.now();

  // 1. Check in-memory cache
  const cached = membershipCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { hasAccess: true, role: cached.role };
  }

  // 2. Query database using optimized composite index `idx_usuariointerfaz_idinterfaz_idusuario_fechasalida`
  const userInterfaz = await prisma.usuarioInterfaz.findFirst({
    where: {
      idinterfazoperacion: interfaceId,
      idusuario: userId,
      fechasalida: null,
    },
    select: {
      rol: true,
    },
  });

  if (!userInterfaz) {
    membershipCache.delete(cacheKey);
    return { hasAccess: false, role: 'Visualizador' };
  }

  const role = userInterfaz.rol || 'Visualizador';

  // 3. Save to TTL cache
  membershipCache.set(cacheKey, {
    role,
    expiresAt: now + TTL_MS,
  });

  return { hasAccess: true, role };
}

/**
 * Invalidates membership cache for a specific user and interface, or all entries.
 * Call this when a user leaves an interface, changes roles, or deletes an interface.
 */
export function invalidateMembershipCache(userId?: string, interfaceId?: bigint | string) {
  if (userId && interfaceId) {
    const cacheKey = `${userId}:${interfaceId.toString()}`;
    membershipCache.delete(cacheKey);
  } else if (userId) {
    for (const key of membershipCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        membershipCache.delete(key);
      }
    }
  } else if (interfaceId) {
    const targetSuffix = `:${interfaceId.toString()}`;
    for (const key of membershipCache.keys()) {
      if (key.endsWith(targetSuffix)) {
        membershipCache.delete(key);
      }
    }
  } else {
    membershipCache.clear();
  }
}
