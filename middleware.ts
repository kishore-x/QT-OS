/* ============================================================
   Vercel Routing Middleware — password gate for the whole site.

   If QT_PASSWORD is set in the Vercel project, every request
   (the app, its scripts, and the /api endpoints) must carry
   HTTP Basic auth with that password. The browser shows a native
   login box once, then remembers it for the session — the same
   behaviour as the local Node server.

   If QT_PASSWORD is NOT set, the site is open (nothing to gate).

   Username is ignored — any username works, only the password is
   checked. Share one password with the pilot users.
   ============================================================ */

export const config = {
  // gate everything except Vercel internals and the favicon
  matcher: '/((?!_vercel/|favicon.ico).*)',
};

export default function middleware(request: Request): Response | undefined {
  const password = process.env.QT_PASSWORD;
  if (!password) return; // no gate configured -> allow through

  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const pass = decoded.slice(decoded.indexOf(':') + 1);
      if (pass === password) return; // authorized -> continue
    } catch { /* fall through to 401 */ }
  }

  return new Response('Login required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Qualtech OS", charset="UTF-8"' },
  });
}
