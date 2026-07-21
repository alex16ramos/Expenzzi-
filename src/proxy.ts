import { auth } from '@/lib/auth';

export default auth.middleware({
  loginUrl: '/',
});

export const config = {
  matcher: [
    // Protect dashboard and operational interface pages
    '/dashboard/:path*',
    '/interface/:path*',
  ],
};
