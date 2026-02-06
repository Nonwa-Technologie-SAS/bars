import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Déconnecté",
  });

  response.cookies.set("bars_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
