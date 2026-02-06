import { prisma } from "@/infrastructure/database/PrismaClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Récupérer le cookie de session
    const sessionCookie = request.cookies.get("bars_session");
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { authenticated: false, user: null, tenant: null },
        { status: 200 }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { authenticated: false, user: null, tenant: null },
        { status: 200 }
      );
    }

    const { uid, tid } = session;

    if (!uid || !tid) {
      return NextResponse.json(
        { authenticated: false, user: null, tenant: null },
        { status: 200 }
      );
    }

    // Récupérer l'utilisateur (sans les champs optionnels qui peuvent ne pas exister)
    const user = await prisma.user.findFirst({
      where: { id: uid, tenantId: tid },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null, tenant: null },
        { status: 200 }
      );
    }

    // Exclure le mot de passe de la réponse
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    // Récupérer le tenant avec ses stats
    const tenant = await prisma.tenant.findUnique({
      where: { id: tid },
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            tables: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { authenticated: false, user: null, tenant: null },
        { status: 200 }
      );
    }

    // Construire la réponse tenant avec stats
    const { _count, ...tenantData } = tenant;

    return NextResponse.json({
      authenticated: true,
      user: {
        ...userWithoutPassword,
        // Valeurs par défaut pour les champs qui peuvent ne pas exister
        phone: (user as Record<string, unknown>).phone || null,
        bio: (user as Record<string, unknown>).bio || null,
        avatarUrl: (user as Record<string, unknown>).avatarUrl || null,
      },
      tenant: {
        ...tenantData,
        // Valeurs par défaut pour les champs qui peuvent ne pas exister
        address: (tenant as Record<string, unknown>).address || null,
        phone: (tenant as Record<string, unknown>).phone || null,
        email: (tenant as Record<string, unknown>).email || null,
        website: (tenant as Record<string, unknown>).website || null,
        description: (tenant as Record<string, unknown>).description || null,
        stats: _count,
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(
      { authenticated: false, user: null, tenant: null, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
