import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    const url = new URL(pathname.replace(/^\/api/, ''), 'http://127.0.0.1:3001');
    url.search = request.nextUrl.search;
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith('/wallpaper/')) {
    const url = new URL(pathname, 'http://127.0.0.1:3001');
    url.search = request.nextUrl.search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/wallpaper/:path*'],
};
