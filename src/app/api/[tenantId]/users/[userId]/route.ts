import { NextRequest, NextResponse } from "next/server";
import { GetUser } from "@/core/use-cases/users/GetUser";
import { UpdateUser } from "@/core/use-cases/users/UpdateUser";
import { DeleteUser } from "@/core/use-cases/users/DeleteUser";
import { PrismaUserRepository } from "@/infrastructure/repositories/PrismaUserRepository";

// Initialize repository
const userRepository = new PrismaUserRepository();
const getUser = new GetUser(userRepository);
const updateUser = new UpdateUser(userRepository);
const deleteUser = new DeleteUser(userRepository);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
  try {
    const { tenantId, userId } = await params;
    const user = await getUser.execute(userId, tenantId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: user, 
      message: "User retrieved successfully", 
      success: true
    });
  } catch (error: unknown) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
  try {
    const { tenantId, userId } = await params;
    const body = await request.json();

    const user = await updateUser.execute(userId, tenantId, body);
    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
  try {
    const { tenantId, userId } = await params;
    const body = await request.json();

    // Validate that only allowed fields are updated
    const allowedFields = ['name', 'email', 'phone', 'bio', 'avatarUrl'];
    const updateData: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ valide à mettre à jour" },
        { status: 400 }
      );
    }

    const user = await updateUser.execute(userId, tenantId, updateData);
    return NextResponse.json({ user, success: true });
  } catch (error: unknown) {
    console.error("Error patching user:", error);
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
  try {
    const { tenantId, userId } = await params;

    const user = await getUser.execute(userId, tenantId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found", success: false },
        { status: 404 }
      );
    }

    await deleteUser.execute(userId, tenantId);
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}