import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si la route contient un tenantId
  const tenantMatch = pathname.match(/^\/([^/]+)/);
  const tenantId = tenantMatch ? tenantMatch[1] : null;

  // Si c'est une route API avec tenantId, valider qu'il existe
  if (pathname.startsWith("/api/") && tenantId) {
    // TODO: Vérifier que le tenant existe en base de données
    // Pour l'instant, on accepte tous les tenantIds
    // const tenant = await tenantRepository.findBySlug(tenantId);
    // if (!tenant) {
    //   return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/:tenantId/:path*",
  ],
};
