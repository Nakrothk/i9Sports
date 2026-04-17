import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const publicRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)

  const cookie = request.cookies.get('session')?.value
  const session = await decrypt(cookie)

  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
