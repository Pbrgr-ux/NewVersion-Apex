import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (icons, images)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
