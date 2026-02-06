import { NextRequest, NextResponse } from "next/server";
import { CreateUser } from "@/core/use-cases/users/CreateUser";
import { GetUsers } from "@/core/use-cases/users/GetUsers";
import { PrismaUserRepository } from "@/infrastructure/repositories/PrismaUserRepository";
import { UserRole } from "@/core/entities/User";
import { prisma } from "@/infrastructure/database/PrismaClient";

// Initialize repository
const userRepository = new PrismaUserRepository();
const createUser = new CreateUser(userRepository);
const getUsers = new GetUsers(userRepository);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || undefined;
    const role = searchParams.get("role") || undefined;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    // Resolve tenant by id or slug
    const tenant = await prisma.tenant.findFirst({
      where: { OR: [{ id: tenantId }, { slug: tenantId }] },
    });
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant introuvable" },
        { status: 404 }
      );
    }

    const users = await getUsers.execute(tenant.id, { query, role });

    if (!users) {
      return NextResponse.json(
        { error: "Users not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();

    // Verify tenant exists (by id or slug)
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: tenantId }, { slug: tenantId }],
      },
    });
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant introuvable. Vérifiez que l'établissement existe." },
        { status: 404 }
      );
    }
    const resolvedTenantId = tenant.id;

    // Basic validation
    if (!body.email || !body.role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(body.role)) {
       return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser.execute({
      tenantId: resolvedTenantId,
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role,
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: "User created successfully",
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
