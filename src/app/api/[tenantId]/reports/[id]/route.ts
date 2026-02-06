import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/PrismaClient";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  try {
    const { tenantId, id } = await params;
    
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report || report.tenantId !== tenantId) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report.data);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
