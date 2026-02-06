import { NextRequest, NextResponse } from "next/server";
import { CreateUser } from "@/core/use-cases/users/CreateUser";
import { GetUsers } from "@/core/use-cases/users/GetUsers";
import { PrismaUserRepository } from "@/infrastructure/repositories/PrismaUserRepository";
import { UserRole } from "@/core/entities/User";

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

    const users = await getUsers.execute(tenantId, { query, role });

    if (!users) {
      return NextResponse.json(
        { error: "Users not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();
    
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
      tenantId,
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
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
