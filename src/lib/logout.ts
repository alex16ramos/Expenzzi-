import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

/**
 * Performs a full sign-out:
 * 1. Calls Neon authClient.signOut()
 * 2. Calls server-side /api/auth/logout to erase all httpOnly cookies
 * 3. Clears browser document.cookie, localStorage and sessionStorage
 * 4. Redirects immediately to home '/'
 */
export async function performSignOut() {
  try {
    await authClient.signOut().catch(() => {});
  } catch {
    // Ignore
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
    }).catch(() => {});
  } catch {
    // Ignore
  }

  if (typeof document !== 'undefined') {
    try {
      const knownNames = [
        '__Secure-neon-auth.session_token',
        '__Secure-neon-auth.local.session_data',
        '__Secure-neon-auth.session_challange',
        'neon-auth.session_token',
        'neon-auth.local.session_data',
        'better-auth.session_token',
        '__Secure-better-auth.session_token',
        '__Host-better-auth.session_token',
        'better-auth.session_data',
        '__Secure-better-auth.session_data',
        'neon_auth_session',
        '__Secure-neon_auth_session',
      ];

      const cookies = document.cookie.split(';');
      for (const c of cookies) {
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
        if (name && !knownNames.includes(name)) {
          knownNames.push(name);
        }
      }

      for (const name of knownNames) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;Secure;SameSite=Lax`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;Secure;SameSite=None`;
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore
    }
  }

  toast.success('Sesión cerrada correctamente');
  window.location.href = '/?logged_out=1';
}
