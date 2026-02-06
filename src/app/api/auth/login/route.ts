import { prisma } from "@/infrastructure/database/PrismaClient";
import { useAuthStore } from "@/stores/useAuthStore";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body?.email || "").toString().trim().toLowerCase();
    const password = (body?.password || "").toString();
    const remember = Boolean(body?.remember);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email },
    });


    if (!user) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // renseigner le user dans le store 
    console.log("🚀 ~ POST ~ user:", user)
    useAuthStore.setState({ user: user });
    useAuthStore.setState({ isAuthenticated: true });
    useAuthStore.setState({ isLoading: false });
    useAuthStore.setState({ error: null });
    console.log("🚀 ~ POST ~ useAuthStore:", useAuthStore.getState())
    
    const redirect = `/${user.tenantId}/dashboard`;
    const response = NextResponse.json({
      success: true,
      data: { redirect },
      message: "Connexion réussie",
    });

    response.cookies.set("bars_session", JSON.stringify({
      uid: user.id,
      tid: user.tenantId,
      role: user.role,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 2,
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Erreur de serveur" },
      { status: 500 }
    );
  }
}
