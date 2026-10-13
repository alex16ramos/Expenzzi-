import { auth } from '@/lib/auth';

export const proxy = auth.middleware({
  loginUrl: '/',
});

export default proxy;

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/interface/:path*',
  ],
};
