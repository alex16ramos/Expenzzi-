import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

/**
 * Performs a full sign-out:
 * 1. Calls Neon authClient.signOut()
 * 2. Calls server-side /api/auth/logout to erase all httpOnly cookies
 * 3. Clears browser document.cookie
 * 4. Redirects immediately to home '/'
 */
export async function performSignOut() {
  try {
    await authClient.signOut().catch(() => {});
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach((c) => {
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
        if (name) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    }

    toast.success('Sesión cerrada correctamente');
  } catch {
    // Ignore
  } finally {
    window.location.href = '/';
  }
}
